mod circuit;
mod sudoku;
#[cfg(test)]
mod tests;
mod utils;

use circuit::SudokuCircuit;
use sudoku::{convert_flat_to_grid, is_valid_sudoku, solve_backtrack};
use utils::set_panic_hook;
use wasm_bindgen::prelude::*;

use ark_bls12_381::Bls12_381;
use ark_bls12_381::Fr;
use ark_crypto_primitives::snark::SNARK;
use ark_groth16::{Groth16, PreparedVerifyingKey, Proof, ProvingKey, VerifyingKey};
use ark_serialize::{CanonicalDeserialize, CanonicalSerialize};
use ark_std::rand::rngs::StdRng;
use ark_std::rand::{RngCore, SeedableRng};
use js_sys::Uint8Array;
use std::sync::{Mutex, OnceLock};
use web_sys::console;

// 정적 변수로 키 저장
static PROVING_KEY: OnceLock<ProvingKey<Bls12_381>> = OnceLock::new();
static VERIFYING_KEY: OnceLock<Mutex<PreparedVerifyingKey<Bls12_381>>> = OnceLock::new();

#[wasm_bindgen(start)]
pub fn start() {
    set_panic_hook();
}

/// JavaScript에서 호출하여 사전 생성된 CRS 파일을 설정하는 함수
#[wasm_bindgen]
pub fn init_keys(pk_bytes: &[u8], vk_bytes: &[u8]) -> Result<(), JsValue> {
    // 이미 초기화되었는지 확인
    if PROVING_KEY.get().is_some() {
        console::log_1(&"Keys already initialized.".into());
        return Ok(());
    }
    console::log_1(&"Initializing keys from provided bytes...".into());

    // PK 역직렬화 및 저장
    let pk = ProvingKey::<Bls12_381>::deserialize_compressed(pk_bytes)
        .map_err(|e| JsValue::from_str(&format!("PK Deserialization error: {:?}", e)))?;
    PROVING_KEY
        .set(pk)
        .map_err(|_| JsValue::from_str("Failed to store PK"))?;
    console::log_1(&"Proving Key initialized and stored.".into());

    // VK 역직렬화, PreparedVK 생성 및 저장
    let vk = VerifyingKey::<Bls12_381>::deserialize_compressed(vk_bytes)
        .map_err(|e| JsValue::from_str(&format!("VK Deserialization error: {:?}", e)))?;

    // VerifyingKey를 PreparedVerifyingKey로 변환
    let pvk = Groth16::<Bls12_381>::process_vk(&vk)
        .map_err(|e| JsValue::from_str(&format!("VK processing error: {:?}", e)))?;

    VERIFYING_KEY
        .set(Mutex::new(pvk))
        .map_err(|_| JsValue::from_str("Failed to store Prepared VK"))?;
    console::log_1(&"Prepared Verification Key initialized and stored.".into());

    Ok(())
}

/// ZK-SNARK 파라미터 설정 (DEPRECATED: 대신 init_keys 사용)
/// 이전 버전과의 호환성을 위해 유지됨
#[wasm_bindgen]
pub fn setup() -> Result<String, JsValue> {
    console::log_1(&"WARNING: setup() is deprecated. Use init_keys() instead.".into());
    let rng = &mut StdRng::seed_from_u64(0);
    let circuit = sample_circuit();

    let (pk, vk) = Groth16::<Bls12_381>::circuit_specific_setup(circuit, rng)
        .map_err(|e| JsValue::from_str(&format!("Setup error: {:?}", e)))?;

    let mut pk_bytes = Vec::new();
    pk.serialize_compressed(&mut pk_bytes)
        .map_err(|e| JsValue::from_str(&format!("Serialization error: {:?}", e)))?;

    // 정적 변수에 초기화 (deprecated 메소드지만 여전히 상태 저장)
    if PROVING_KEY.get().is_none() {
        PROVING_KEY
            .set(pk.clone())
            .map_err(|_| JsValue::from_str("Failed to store PK in static variable"))?;

        let pvk = Groth16::<Bls12_381>::process_vk(&vk)
            .map_err(|e| JsValue::from_str(&format!("VK processing error: {:?}", e)))?;

        VERIFYING_KEY
            .set(Mutex::new(pvk))
            .map_err(|_| JsValue::from_str("Failed to store Prepared VK in static variable"))?;
    }

    Ok(base64::encode(&pk_bytes))
}

/// 증명 생성
#[wasm_bindgen]
pub fn prove(puzzle_data: &[u8], solution_data: &[u8]) -> Result<String, JsValue> {
    let puzzle = convert_flat_to_grid(puzzle_data);
    let solution = convert_flat_to_grid(solution_data);

    // 유효성 검사
    if !is_valid_sudoku(&solution, true) {
        return Err(JsValue::from_str("Invalid Sudoku solution"));
    }

    // 이전에 설정한 퍼즐과 솔루션이 일치하는지 확인
    for i in 0..9 {
        for j in 0..9 {
            if let Some(puzzle_val) = puzzle[i][j] {
                if solution[i][j] != Some(puzzle_val) {
                    return Err(JsValue::from_str("Solution does not match the puzzle"));
                }
            }
        }
    }

    let circuit = SudokuCircuit { puzzle, solution };

    // 정적 변수에서 ProvingKey 가져오기
    let pk = PROVING_KEY
        .get()
        .ok_or_else(|| JsValue::from_str("ProvingKey not initialized. Call init_keys() first."))?;

    let rng = &mut StdRng::seed_from_u64(1);

    let proof = Groth16::<Bls12_381>::prove(pk, circuit, rng)
        .map_err(|e| JsValue::from_str(&format!("Proving error: {:?}", e)))?;

    let mut proof_bytes = Vec::new();
    proof
        .serialize_compressed(&mut proof_bytes)
        .map_err(|e| JsValue::from_str(&format!("Serialization error: {:?}", e)))?;

    Ok(base64::encode(&proof_bytes))
}

/// 증명 검증
#[wasm_bindgen]
pub fn verify(puzzle_data: &[u8], proof_str: &str) -> Result<bool, JsValue> {
    // PreparedVerifyingKey 가져오기
    let pvk_mutex = VERIFYING_KEY.get().ok_or_else(|| {
        JsValue::from_str("VerifyingKey not initialized. Call init_keys() first.")
    })?;

    let pvk = pvk_mutex
        .lock()
        .map_err(|_| JsValue::from_str("Failed to lock VerifyingKey mutex"))?;

    let proof_bytes = base64::decode(proof_str)
        .map_err(|e| JsValue::from_str(&format!("Base64 decode error: {:?}", e)))?;

    let proof = Proof::<Bls12_381>::deserialize_compressed(&proof_bytes[..])
        .map_err(|e| JsValue::from_str(&format!("Proof deserialization error: {:?}", e)))?;

    let puzzle = convert_flat_to_grid(puzzle_data);

    // 퍼즐을 이용하여 공개 입력 생성
    let mut public_inputs = Vec::new();
    for i in 0..9 {
        for j in 0..9 {
            if let Some(val) = puzzle[i][j] {
                public_inputs.push(Fr::from(val as u64));
            }
        }
    }

    let result = Groth16::<Bls12_381>::verify_with_processed_vk(&pvk, &public_inputs, &proof)
        .map_err(|e| JsValue::from_str(&format!("Verification error: {:?}", e)))?;

    Ok(result)
}

/// 스도쿠 퍼즐 풀기
#[wasm_bindgen]
pub fn solve_sudoku(grid_data: &[u8]) -> Uint8Array {
    let mut grid = convert_flat_to_grid(grid_data);

    // 결과를 저장할 배열 초기화
    let result = Uint8Array::new_with_length(81);

    if solve_backtrack(&mut grid) {
        let mut solution = Vec::with_capacity(81);
        for row in grid {
            for cell in row {
                solution.push(cell.unwrap_or(0));
            }
        }

        result.copy_from(solution.as_slice());
    } else {
        // 해결책을 찾을 수 없는 경우 빈(0) 배열 반환
        // JavaScript 쪽에서 빈 배열인지 확인하여 처리
        console::log_1(&"No solution found for the Sudoku puzzle".into());
        // 배열은 이미 0으로 초기화되어 있으므로 아무것도 안 해도 됨
    }

    result
}

/// 스도쿠 유효성 검사
#[wasm_bindgen]
pub fn validate_sudoku(grid_data: &[u8], check_complete: bool) -> bool {
    // 함수 시작 즉시 배열 길이 검증
    let len = grid_data.len();
    if len != 81 {
        // 콘솔에 명확한 에러 로그 출력 (Rust 측)
        console::error_1(
            &format!(
                "Rust validate_sudoku: 잘못된 그리드 데이터 길이: 예상 81, 실제 {}",
                len
            )
            .into(),
        );
        return false; // 잘못된 길이 시 즉시 false 반환
    }

    // --- 추가 검증: 값이 0~9 범위 내인지 확인 ---
    // 혹시라도 잘못된 데이터가 넘어오는 경우를 방지
    if grid_data.iter().any(|&val| val > 9) {
        console::error_1(&"Rust validate_sudoku: 그리드에 잘못된 값(9 초과) 포함됨.".into());
        return false;
    }

    // 완성된 퍼즐 검증 시 0(빈 칸)이 있는지 확인
    if check_complete && grid_data.iter().any(|&val| val == 0) {
        console::error_1(&"Rust validate_sudoku: 완성 퍼즐 검증 실패 - 빈 칸(0) 포함됨.".into());
        return false;
    }
    // --- 추가 검증 끝 ---

    // 2차원 배열로 변환 (내부적으로 길이 검사를 하지만, 위에서 먼저 하는 것이 효율적)
    let grid = convert_flat_to_grid(grid_data);

    // 핵심 유효성 검사 로직 호출
    let is_valid = is_valid_sudoku(&grid, check_complete);

    // Rust 측 최종 결과 로깅
    console::log_1(&format!("Rust validate_sudoku: 최종 검증 결과: {}", is_valid).into());

    is_valid // 최종 결과 반환
}

/// 스도쿠 퍼즐 생성
#[wasm_bindgen]
pub fn generate_sudoku(difficulty: u8) -> Uint8Array {
    let mut rng = StdRng::seed_from_u64(js_sys::Date::now() as u64);

    // 빈 그리드 생성
    let mut grid = vec![vec![None; 9]; 9];

    // 퍼즐 완성
    solve_backtrack(&mut grid);

    // 난이도에 따라 셀 삭제 (높을수록 어려움)
    let remove_count = match difficulty {
        1 => 30, // 쉬움
        2 => 40, // 중간
        3 => 50, // 어려움
        _ => 45, // 기본
    };

    // 랜덤하게 셀 삭제
    let mut positions: Vec<(usize, usize)> = Vec::new();
    for i in 0..9 {
        for j in 0..9 {
            positions.push((i, j));
        }
    }

    // positions 벡터를 랜덤하게 섞기
    for i in (1..positions.len()).rev() {
        let j = (rng.next_u32() as usize) % (i + 1);
        positions.swap(i, j);
    }

    // 셀 삭제
    for k in 0..remove_count {
        if k < positions.len() {
            let (i, j) = positions[k];
            grid[i][j] = None;
        }
    }

    // 플랫 형식으로 변환
    let mut puzzle_flat = Vec::with_capacity(81);
    for row in grid {
        for cell in row {
            puzzle_flat.push(cell.unwrap_or(0));
        }
    }

    let result = Uint8Array::new_with_length(81);
    result.copy_from(puzzle_flat.as_slice());
    result
}

/// 스도쿠 퍼즐의 솔루션 여부 확인
#[wasm_bindgen]
pub fn has_solution(grid_data: &[u8]) -> bool {
    let mut grid = convert_flat_to_grid(grid_data);
    solve_backtrack(&mut grid)
}

fn sample_circuit() -> SudokuCircuit {
    let puzzle = vec![
        vec![
            Some(5),
            Some(3),
            None,
            None,
            Some(7),
            None,
            None,
            None,
            None,
        ],
        vec![
            Some(6),
            None,
            None,
            Some(1),
            Some(9),
            Some(5),
            None,
            None,
            None,
        ],
        vec![
            None,
            Some(9),
            Some(8),
            None,
            None,
            None,
            None,
            Some(6),
            None,
        ],
        vec![
            Some(8),
            None,
            None,
            None,
            Some(6),
            None,
            None,
            None,
            Some(3),
        ],
        vec![
            Some(4),
            None,
            None,
            Some(8),
            None,
            Some(3),
            None,
            None,
            Some(1),
        ],
        vec![
            Some(7),
            None,
            None,
            None,
            Some(2),
            None,
            None,
            None,
            Some(6),
        ],
        vec![
            None,
            Some(6),
            None,
            None,
            None,
            None,
            Some(2),
            Some(8),
            None,
        ],
        vec![
            None,
            None,
            None,
            Some(4),
            Some(1),
            Some(9),
            None,
            None,
            Some(5),
        ],
        vec![
            None,
            None,
            None,
            None,
            Some(8),
            None,
            None,
            Some(7),
            Some(9),
        ],
    ];

    let solution = vec![
        vec![
            Some(5),
            Some(3),
            Some(4),
            Some(6),
            Some(7),
            Some(8),
            Some(9),
            Some(1),
            Some(2),
        ],
        vec![
            Some(6),
            Some(7),
            Some(2),
            Some(1),
            Some(9),
            Some(5),
            Some(3),
            Some(4),
            Some(8),
        ],
        vec![
            Some(1),
            Some(9),
            Some(8),
            Some(3),
            Some(4),
            Some(2),
            Some(5),
            Some(6),
            Some(7),
        ],
        vec![
            Some(8),
            Some(5),
            Some(9),
            Some(7),
            Some(6),
            Some(1),
            Some(4),
            Some(2),
            Some(3),
        ],
        vec![
            Some(4),
            Some(2),
            Some(6),
            Some(8),
            Some(5),
            Some(3),
            Some(7),
            Some(9),
            Some(1),
        ],
        vec![
            Some(7),
            Some(1),
            Some(3),
            Some(9),
            Some(2),
            Some(4),
            Some(8),
            Some(5),
            Some(6),
        ],
        vec![
            Some(9),
            Some(6),
            Some(1),
            Some(5),
            Some(3),
            Some(7),
            Some(2),
            Some(8),
            Some(4),
        ],
        vec![
            Some(2),
            Some(8),
            Some(7),
            Some(4),
            Some(1),
            Some(9),
            Some(6),
            Some(3),
            Some(5),
        ],
        vec![
            Some(3),
            Some(4),
            Some(5),
            Some(2),
            Some(8),
            Some(6),
            Some(1),
            Some(7),
            Some(9),
        ],
    ];

    SudokuCircuit { puzzle, solution }
}
