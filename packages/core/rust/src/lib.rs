mod sudoku;
mod circuit;
mod utils;

use wasm_bindgen::prelude::*;
use circuit::SudokuCircuit;
use sudoku::{convert_flat_to_grid, solve_backtrack, is_safe, is_valid_sudoku};
use utils::set_panic_hook;

use ark_bls12_381::Bls12_381;
use ark_groth16::{
    create_random_proof, generate_random_parameters, prepare_verifying_key, verify_proof, Proof,
};
use ark_std::rand::rngs::StdRng;
use ark_std::rand::SeedableRng;
use ark_std::One;
use ark_serialize::{CanonicalDeserialize, CanonicalSerialize};
use std::cell::RefCell;
use ark_ff::Field;
use ark_bls12_381::Fr;
use js_sys::Uint8Array;

thread_local! {
    static PARAMS: RefCell<Option<Vec<u8>>> = RefCell::new(None);
}

#[wasm_bindgen(start)]
pub fn start() {
    set_panic_hook();
}

/// ZK-SNARK 파라미터 설정
#[wasm_bindgen]
pub fn setup() -> Result<String, JsValue> {
    let rng = &mut StdRng::seed_from_u64(0);
    let circuit = sample_circuit();
    
    let params = generate_random_parameters::<Bls12_381, _, _>(circuit, rng)
        .map_err(|e| JsValue::from_str(&format!("Setup error: {:?}", e)))?;
        
    let mut params_bytes = Vec::new();
    params.serialize(&mut params_bytes)
        .map_err(|e| JsValue::from_str(&format!("Serialization error: {:?}", e)))?;
    
    PARAMS.with(|p| {
        *p.borrow_mut() = Some(params_bytes.clone());
    });
    
    Ok(base64::encode(&params_bytes))
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
    
    let circuit = SudokuCircuit {
        puzzle,
        solution,
    };
    
    let params_bytes = PARAMS.with(|p| p.borrow().clone())
        .ok_or_else(|| JsValue::from_str("Parameters not initialized. Call setup() first."))?;
    
    let params = ark_groth16::Parameters::<Bls12_381>::deserialize(&params_bytes[..])
        .map_err(|e| JsValue::from_str(&format!("Deserialization error: {:?}", e)))?;
    
    let rng = &mut StdRng::seed_from_u64(1);
    let proof = create_random_proof(circuit, &params, rng)
        .map_err(|e| JsValue::from_str(&format!("Proving error: {:?}", e)))?;
    
    let mut proof_bytes = Vec::new();
    proof.serialize(&mut proof_bytes)
        .map_err(|e| JsValue::from_str(&format!("Serialization error: {:?}", e)))?;
    
    Ok(base64::encode(&proof_bytes))
}

/// 증명 검증
#[wasm_bindgen]
pub fn verify(puzzle_data: &[u8], proof_str: &str) -> Result<bool, JsValue> {
    let params_bytes = PARAMS.with(|p| p.borrow().clone())
        .ok_or_else(|| JsValue::from_str("Parameters not initialized. Call setup() first."))?;
    
    let params = ark_groth16::Parameters::<Bls12_381>::deserialize(&params_bytes[..])
        .map_err(|e| JsValue::from_str(&format!("Deserialization error: {:?}", e)))?;
    
    let proof_bytes = base64::decode(proof_str)
        .map_err(|e| JsValue::from_str(&format!("Base64 decode error: {:?}", e)))?;
    
    let proof = Proof::<Bls12_381>::deserialize(&proof_bytes[..])
        .map_err(|e| JsValue::from_str(&format!("Proof deserialization error: {:?}", e)))?;
    
    let pvk = prepare_verifying_key(&params.vk);
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
    
    let result = verify_proof(&pvk, &proof, &public_inputs)
        .map_err(|e| JsValue::from_str(&format!("Verification error: {:?}", e)))?;
    
    Ok(result)
}

/// 스도쿠 퍼즐 풀기
#[wasm_bindgen]
pub fn solve_sudoku(grid_data: &[u8]) -> Result<Uint8Array, JsValue> {
    let mut grid = convert_flat_to_grid(grid_data);
    
    if solve_backtrack(&mut grid) {
        let mut solution = Vec::with_capacity(81);
        for row in grid {
            for cell in row {
                solution.push(cell.unwrap_or(0));
            }
        }
        
        let result = Uint8Array::new_with_length(81);
        result.copy_from(solution.as_slice());
        Ok(result)
    } else {
        Err(JsValue::from_str("No solution exists for this Sudoku puzzle"))
    }
}

/// 스도쿠 유효성 검사
#[wasm_bindgen]
pub fn validate_sudoku(grid_data: &[u8], check_complete: bool) -> bool {
    let grid = convert_flat_to_grid(grid_data);
    is_valid_sudoku(&grid, check_complete)
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

fn sample_circuit() -> SudokuCircuit {
    let puzzle = vec![
        vec![Some(5), Some(3), None, None, Some(7), None, None, None, None],
        vec![Some(6), None, None, Some(1), Some(9), Some(5), None, None, None],
        vec![None, Some(9), Some(8), None, None, None, None, Some(6), None],
        vec![Some(8), None, None, None, Some(6), None, None, None, Some(3)],
        vec![Some(4), None, None, Some(8), None, Some(3), None, None, Some(1)],
        vec![Some(7), None, None, None, Some(2), None, None, None, Some(6)],
        vec![None, Some(6), None, None, None, None, Some(2), Some(8), None],
        vec![None, None, None, Some(4), Some(1), Some(9), None, None, Some(5)],
        vec![None, None, None, None, Some(8), None, None, Some(7), Some(9)],
    ];
    
    let solution = vec![
        vec![Some(5), Some(3), Some(4), Some(6), Some(7), Some(8), Some(9), Some(1), Some(2)],
        vec![Some(6), Some(7), Some(2), Some(1), Some(9), Some(5), Some(3), Some(4), Some(8)],
        vec![Some(1), Some(9), Some(8), Some(3), Some(4), Some(2), Some(5), Some(6), Some(7)],
        vec![Some(8), Some(5), Some(9), Some(7), Some(6), Some(1), Some(4), Some(2), Some(3)],
        vec![Some(4), Some(2), Some(6), Some(8), Some(5), Some(3), Some(7), Some(9), Some(1)],
        vec![Some(7), Some(1), Some(3), Some(9), Some(2), Some(4), Some(8), Some(5), Some(6)],
        vec![Some(9), Some(6), Some(1), Some(5), Some(3), Some(7), Some(2), Some(8), Some(4)],
        vec![Some(2), Some(8), Some(7), Some(4), Some(1), Some(9), Some(6), Some(3), Some(5)],
        vec![Some(3), Some(4), Some(5), Some(2), Some(8), Some(6), Some(1), Some(7), Some(9)],
    ];
    
    SudokuCircuit { puzzle, solution }
}
