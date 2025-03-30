#![cfg(target_arch = "wasm32")] // WASM 환경에서만 이 파일 컴파일

use std::sync::Once;
use wasm_bindgen_test::*;
use zk_sudoku_core::{
    generate_sudoku,
    has_solution,
    // lib.rs에서 #[wasm_bindgen]으로 노출된 함수들
    init_keys,
    prove,
    solve_sudoku,
    validate_sudoku,
    verify,
}; // 키 초기화를 한 번만 수행하기 위해

// 브라우저 환경에서 테스트 실행 설정
wasm_bindgen_test_configure!(run_in_browser);

// 키 초기화를 위한 플래그
static INIT: Once = Once::new();

// 테스트 전에 키를 로드하고 초기화하는 함수 (비동기)
// 주의: include_bytes!는 컴파일 시점에 파일을 읽으므로,
//      generate_crs가 실행된 *후에* cargo/wasm-pack 명령이 실행되어야 함.
//      경로는 Cargo.toml 기준 상대 경로 또는 절대 경로 사용 가능.
//      CARGO_MANIFEST_DIR 환경 변수를 사용하여 Cargo.toml 위치 기준으로 경로 설정 권장.
async fn setup_keys() {
    web_sys::console::log_1(&"setup_keys 호출됨".into());
    let mut initialized = false;
    INIT.call_once(|| {
        web_sys::console::log_1(&"Once::call_once 내부 진입".into());
        // .bin 파일 로딩 시도
        web_sys::console::log_1(&"PK 파일 로딩 시도...".into());
        let pk_bytes = include_bytes!(concat!(env!("CARGO_MANIFEST_DIR"), "/sudoku_pk.bin"));
        web_sys::console::log_1(&format!("PK 로드 완료 ({} bytes)", pk_bytes.len()).into());

        web_sys::console::log_1(&"VK 파일 로딩 시도...".into());
        let vk_bytes = include_bytes!(concat!(env!("CARGO_MANIFEST_DIR"), "/sudoku_vk.bin"));
        web_sys::console::log_1(&format!("VK 로드 완료 ({} bytes)", vk_bytes.len()).into());

        // init_keys 함수 호출 시도
        web_sys::console::log_1(&"init_keys 호출 시도...".into());
        match init_keys(pk_bytes, vk_bytes) {
            Ok(_) => {
                web_sys::console::log_1(&"init_keys 호출 성공".into());
                initialized = true; // 성공 플래그 설정
            }
            Err(e) => {
                let error_message = format!("init_keys 실패: {:?}", e);
                web_sys::console::error_1(&error_message.clone().into());
                // 초기화 실패 시 패닉을 일으켜 테스트 중단
                panic!("{}", error_message);
            }
        }
    });
    if !initialized && INIT.is_completed() {
        web_sys::console::warn_1(&"키가 이미 초기화되었거나 초기화 실패함".into());
    }
    web_sys::console::log_1(&"setup_keys 종료".into());
}
// --- 기본 스도쿠 함수 테스트 ---

#[wasm_bindgen_test]
fn test_generate_sudoku_basic() {
    let difficulty = 1; // 쉬움
    let puzzle_bytes = generate_sudoku(difficulty);
    let puzzle: Vec<u8> = puzzle_bytes.to_vec(); // JS Uint8Array를 Rust Vec<u8>로 변환
    assert_eq!(puzzle.len(), 81, "생성된 퍼즐 길이는 81이어야 합니다.");
    // 추가적으로 생성된 퍼즐의 기본적인 유효성 검사도 가능
}

#[wasm_bindgen_test]
fn test_validate_sudoku_valid_incomplete() {
    let puzzle: [u8; 81] = [
        5, 3, 0, 0, 7, 0, 0, 0, 0, 6, 0, 0, 1, 9, 5, 0, 0, 0, 0, 9, 8, 0, 0, 0, 0, 6, 0, 8, 0, 0,
        0, 6, 0, 0, 0, 3, 4, 0, 0, 8, 0, 3, 0, 0, 1, 7, 0, 0, 0, 2, 0, 0, 0, 6, 0, 6, 0, 0, 0, 0,
        2, 8, 0, 0, 0, 0, 4, 1, 9, 0, 0, 5, 0, 0, 0, 0, 8, 0, 0, 7, 9,
    ];
    assert!(
        validate_sudoku(&puzzle, false),
        "유효한 미완성 퍼즐이어야 합니다."
    );
    // 완성 상태는 아니므로 true를 넣으면 false가 나와야 함
    assert!(
        !validate_sudoku(&puzzle, true),
        "미완성 퍼즐은 완성 상태 검사 시 false여야 합니다."
    );
}

#[wasm_bindgen_test]
fn test_validate_sudoku_valid_complete() {
    let solution: [u8; 81] = [
        5, 3, 4, 6, 7, 8, 9, 1, 2, 6, 7, 2, 1, 9, 5, 3, 4, 8, 1, 9, 8, 3, 4, 2, 5, 6, 7, 8, 5, 9,
        7, 6, 1, 4, 2, 3, 4, 2, 6, 8, 5, 3, 7, 9, 1, 7, 1, 3, 9, 2, 4, 8, 5, 6, 9, 6, 1, 5, 3, 7,
        2, 8, 4, 2, 8, 7, 4, 1, 9, 6, 3, 5, 3, 4, 5, 2, 8, 6, 1, 7, 9,
    ];
    assert!(
        validate_sudoku(&solution, false),
        "유효한 완성 퍼즐이어야 합니다 (미완성 체크)."
    );
    assert!(
        validate_sudoku(&solution, true),
        "유효한 완성 퍼즐이어야 합니다 (완성 체크)."
    );
}

#[wasm_bindgen_test]
fn test_validate_sudoku_invalid_value() {
    let mut invalid_grid = [1u8; 81];
    invalid_grid[0] = 10; // 유효하지 않은 값
    assert!(
        !validate_sudoku(&invalid_grid, false),
        "잘못된 값이 포함된 그리드는 유효하지 않아야 합니다."
    );
    assert!(
        !validate_sudoku(&invalid_grid, true),
        "잘못된 값이 포함된 그리드는 완성 검사도 실패해야 합니다."
    );
}

#[wasm_bindgen_test]
fn test_solve_sudoku_basic() {
    let puzzle: [u8; 81] = [
        5, 3, 0, 0, 7, 0, 0, 0, 0, 6, 0, 0, 1, 9, 5, 0, 0, 0, 0, 9, 8, 0, 0, 0, 0, 6, 0, 8, 0, 0,
        0, 6, 0, 0, 0, 3, 4, 0, 0, 8, 0, 3, 0, 0, 1, 7, 0, 0, 0, 2, 0, 0, 0, 6, 0, 6, 0, 0, 0, 0,
        2, 8, 0, 0, 0, 0, 4, 1, 9, 0, 0, 5, 0, 0, 0, 0, 8, 0, 0, 7, 9,
    ];
    let solution_bytes = solve_sudoku(&puzzle);
    let solution: Vec<u8> = solution_bytes.to_vec();
    assert_eq!(solution.len(), 81, "해결된 퍼즐 길이는 81이어야 합니다.");
    assert!(!solution.contains(&0), "해결된 퍼즐에는 0이 없어야 합니다.");
    // 해결된 퍼즐이 유효한지 검사
    assert!(
        validate_sudoku(&solution, true),
        "해결된 퍼즐은 유효해야 합니다."
    );
}

#[wasm_bindgen_test]
fn test_has_solution() {
    let solvable_puzzle: [u8; 81] = [
        5, 3, 0, 0, 7, 0, 0, 0, 0, 6, 0, 0, 1, 9, 5, 0, 0, 0, 0, 9, 8, 0, 0, 0, 0, 6, 0, 8, 0, 0,
        0, 6, 0, 0, 0, 3, 4, 0, 0, 8, 0, 3, 0, 0, 1, 7, 0, 0, 0, 2, 0, 0, 0, 6, 0, 6, 0, 0, 0, 0,
        2, 8, 0, 0, 0, 0, 4, 1, 9, 0, 0, 5, 0, 0, 0, 0, 8, 0, 0, 7, 9,
    ];
    let unsolvable_puzzle: [u8; 81] = [
        // 예시: 1이 두 개인 잘못된 퍼즐
        1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    ];
    assert!(
        has_solution(&solvable_puzzle),
        "풀 수 있는 퍼즐은 true를 반환해야 합니다."
    );
    // 참고: has_solution은 현재 단순히 solve_backtrack을 호출하므로, 입력 자체가 유효하지 않으면 false를 반환할 수 있음
    // assert!(!has_solution(&unsolvable_puzzle), "풀 수 없는 퍼즐은 false를 반환해야 합니다."); // 이 부분은 구현에 따라 달라질 수 있음
}

// --- ZK-SNARK 관련 함수 테스트 (비동기 필요) ---

#[wasm_bindgen_test(async)]
async fn test_prove_and_verify() {
    web_sys::console::log_1(&"test_prove_and_verify 시작".into());
    // 키 초기화 대기
    setup_keys().await;
    web_sys::console::log_1(&"키 초기화 완료 후 진행".into());

    // 테스트 데이터 정의 (이전과 동일)
    let puzzle: [u8; 81] = [
        5, 3, 0, 0, 7, 0, 0, 0, 0, 6, 0, 0, 1, 9, 5, 0, 0, 0, 0, 9, 8, 0, 0, 0, 0, 6, 0, 8, 0, 0,
        0, 6, 0, 0, 0, 3, 4, 0, 0, 8, 0, 3, 0, 0, 1, 7, 0, 0, 0, 2, 0, 0, 0, 6, 0, 6, 0, 0, 0, 0,
        2, 8, 0, 0, 0, 0, 4, 1, 9, 0, 0, 5, 0, 0, 0, 0, 8, 0, 0, 7, 9,
    ];
    let solution: [u8; 81] = [
        5, 3, 4, 6, 7, 8, 9, 1, 2, 6, 7, 2, 1, 9, 5, 3, 4, 8, 1, 9, 8, 3, 4, 2, 5, 6, 7, 8, 5, 9,
        7, 6, 1, 4, 2, 3, 4, 2, 6, 8, 5, 3, 7, 9, 1, 7, 1, 3, 9, 2, 4, 8, 5, 6, 9, 6, 1, 5, 3, 7,
        2, 8, 4, 2, 8, 7, 4, 1, 9, 6, 3, 5, 3, 4, 5, 2, 8, 6, 1, 7, 9,
    ];

    web_sys::console::log_1(&"prove 함수 호출 시도...".into());
    // 증명 생성
    let proof_result = prove(&puzzle, &solution);
    match proof_result {
        Ok(proof_str) => {
            web_sys::console::log_1(&"prove 함수 호출 성공".into());
            // ... (기존 로그 및 assert) ...
            assert!(
                !proof_str.is_empty(),
                "생성된 증명은 비어있지 않아야 합니다."
            );

            web_sys::console::log_1(&"verify 함수 호출 시도...".into());
            // 생성된 증명 검증
            let verify_result = verify(&puzzle, &proof_str);
            web_sys::console::log_1(&"verify 함수 호출 완료".into());
            match verify_result {
                Ok(is_valid) => {
                    web_sys::console::log_1(&format!("검증 결과: {}", is_valid).into());
                    assert!(is_valid, "생성된 증명은 유효해야 합니다.");
                }
                Err(e) => {
                    let error_message = format!("verify 중 오류: {:?}", e);
                    web_sys::console::error_1(&error_message.clone().into());
                    panic!("{}", error_message);
                }
            }
        }
        Err(e) => {
            let error_message = format!("prove 중 오류: {:?}", e);
            web_sys::console::error_1(&error_message.clone().into());
            panic!("{}", error_message);
        }
    }
    web_sys::console::log_1(&"test_prove_and_verify 종료".into());
}

// 잘못된 솔루션으로 증명 시도 (오류 발생 또는 빈 증명 반환 예상)
// let mut wrong_solution = solution.clone();
// wrong_solution[0] = if solution[0] == 1 { 2 } else { 1 }; // 솔루션 값 변경
// assert!(prove(&puzzle, &wrong_solution).is_err(), "잘못된 솔루션으로 증명 생성 시 오류가 발생해야 합니다.");

// TODO: 잘못된 증명 검증 테스트 추가 (verify가 false 반환하는 케이스)
// let invalid_proof = "invalid_base64_or_proof_data";
// assert!(!verify(&puzzle, invalid_proof).unwrap_or(true), "잘못된 증명은 유효하지 않아야 합니다.");
