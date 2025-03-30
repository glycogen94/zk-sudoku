#[cfg(test)]
mod tests {
    // 상위 모듈(lib.rs)의 항목들을 가져옴
    use crate::circuit::SudokuCircuit;
    use crate::sudoku::{convert_flat_to_grid, is_valid_sudoku, solve_backtrack};
    use ark_bls12_381::Bls12_381;
    use ark_crypto_primitives::snark::SNARK;
    use ark_groth16::Groth16;
    use ark_groth16::ProvingKey;
    use ark_groth16::VerifyingKey;
    use ark_groth16::{prepare_verifying_key, PreparedVerifyingKey}; // prepare_verifying_key 직접 사용
    use ark_serialize::CanonicalDeserialize;
    use rand::rngs::StdRng;
    use rand::SeedableRng;
    use std::fs::File;
    use std::io::Read;
    use std::sync::Mutex; // 네이티브 테스트에서도 Mutex 사용 가능
    use std::sync::OnceLock;

    // 테스트용 키를 로드하고 준비하는 함수 (Mutex 사용)
    // 테스트 실행 시 한 번만 로드하도록 static 변수와 Mutex 사용
    static TEST_PK: OnceLock<ProvingKey<Bls12_381>> = OnceLock::new();
    static TEST_PVK: OnceLock<Mutex<PreparedVerifyingKey<Bls12_381>>> = OnceLock::new();

    fn load_test_keys() -> (
        &'static ProvingKey<Bls12_381>,
        &'static Mutex<PreparedVerifyingKey<Bls12_381>>,
    ) {
        TEST_PK.get_or_init(|| {
            // PK 로드
            let mut pk_file =
                File::open("sudoku_pk.bin") // 현재 디렉토리(core/rust) 기준
                    .expect("테스트 PK 파일 sudoku_pk.bin을 열 수 없습니다.");
            let mut pk_bytes = Vec::new();
            pk_file
                .read_to_end(&mut pk_bytes)
                .expect("테스트 PK 파일 읽기 실패");
            ProvingKey::<Bls12_381>::deserialize_compressed(&pk_bytes[..])
                .expect("테스트 PK 역직렬화 실패")
        });

        TEST_PVK.get_or_init(|| {
            // VK 로드 및 준비
            let mut vk_file = File::open("sudoku_vk.bin")
                .expect("테스트 VK 파일 sudoku_vk.bin을 열 수 없습니다.");
            let mut vk_bytes = Vec::new();
            vk_file
                .read_to_end(&mut vk_bytes)
                .expect("테스트 VK 파일 읽기 실패");
            let vk = VerifyingKey::<Bls12_381>::deserialize_compressed(&vk_bytes[..])
                .expect("테스트 VK 역직렬화 실패");
            // 네이티브 테스트에서는 prepare_verifying_key를 직접 사용
            let pvk = prepare_verifying_key(&vk);
            Mutex::new(pvk)
        });

        (TEST_PK.get().unwrap(), TEST_PVK.get().unwrap())
    }

    // --- 기본 스도쿠 함수 테스트 (WASM 테스트와 유사하게 작성) ---
    #[test]
    fn test_validate_sudoku_native_valid_complete() {
        let solution: [u8; 81] = [
            5, 3, 4, 6, 7, 8, 9, 1, 2, 6, 7, 2, 1, 9, 5, 3, 4, 8, 1, 9, 8, 3, 4, 2, 5, 6, 7, 8, 5,
            9, 7, 6, 1, 4, 2, 3, 4, 2, 6, 8, 5, 3, 7, 9, 1, 7, 1, 3, 9, 2, 4, 8, 5, 6, 9, 6, 1, 5,
            3, 7, 2, 8, 4, 2, 8, 7, 4, 1, 9, 6, 3, 5, 3, 4, 5, 2, 8, 6, 1, 7, 9,
        ];
        let grid_vec = convert_flat_to_grid(&solution); // 내부 함수 직접 사용
        assert!(
            is_valid_sudoku(&grid_vec, true),
            "유효한 완성 퍼즐이어야 합니다."
        );
    }

    #[test]
    fn test_solve_sudoku_native() {
        let puzzle_flat: [u8; 81] = [
            5, 3, 0, 0, 7, 0, 0, 0, 0, 6, 0, 0, 1, 9, 5, 0, 0, 0, 0, 9, 8, 0, 0, 0, 0, 6, 0, 8, 0,
            0, 0, 6, 0, 0, 0, 3, 4, 0, 0, 8, 0, 3, 0, 0, 1, 7, 0, 0, 0, 2, 0, 0, 0, 6, 0, 6, 0, 0,
            0, 0, 2, 8, 0, 0, 0, 0, 4, 1, 9, 0, 0, 5, 0, 0, 0, 0, 8, 0, 0, 7, 9,
        ];
        let mut grid_vec = convert_flat_to_grid(&puzzle_flat);
        let solved = solve_backtrack(&mut grid_vec); // 내부 함수 직접 사용
        assert!(solved, "퍼즐이 풀려야 합니다.");
        assert!(
            grid_vec
                .iter()
                .all(|row| row.iter().all(|cell| cell.is_some())),
            "풀린 그리드는 빈 칸이 없어야 합니다."
        );
        assert!(
            is_valid_sudoku(&grid_vec, true),
            "풀린 그리드는 유효해야 합니다."
        );
    }

    // --- ZK-SNARK 관련 함수 테스트 (네이티브) ---
    #[test]
    fn test_prove_and_verify_native() {
        // 테스트 키 로드
        let (pk, pvk_mutex) = load_test_keys();
        let pvk = pvk_mutex.lock().unwrap(); // Mutex 잠금 해제

        // 테스트 데이터 (이전과 동일)
        let puzzle_flat: [u8; 81] = [
            5, 3, 0, 0, 7, 0, 0, 0, 0, 6, 0, 0, 1, 9, 5, 0, 0, 0, 0, 9, 8, 0, 0, 0, 0, 6, 0, 8, 0,
            0, 0, 6, 0, 0, 0, 3, 4, 0, 0, 8, 0, 3, 0, 0, 1, 7, 0, 0, 0, 2, 0, 0, 0, 6, 0, 6, 0, 0,
            0, 0, 2, 8, 0, 0, 0, 0, 4, 1, 9, 0, 0, 5, 0, 0, 0, 0, 8, 0, 0, 7, 9,
        ];
        let solution_flat: [u8; 81] = [
            5, 3, 4, 6, 7, 8, 9, 1, 2, 6, 7, 2, 1, 9, 5, 3, 4, 8, 1, 9, 8, 3, 4, 2, 5, 6, 7, 8, 5,
            9, 7, 6, 1, 4, 2, 3, 4, 2, 6, 8, 5, 3, 7, 9, 1, 7, 1, 3, 9, 2, 4, 8, 5, 6, 9, 6, 1, 5,
            3, 7, 2, 8, 4, 2, 8, 7, 4, 1, 9, 6, 3, 5, 3, 4, 5, 2, 8, 6, 1, 7, 9,
        ];

        // 회로 인스턴스 생성
        let circuit = SudokuCircuit {
            puzzle: convert_flat_to_grid(&puzzle_flat),
            solution: convert_flat_to_grid(&solution_flat),
        };

        // RNG 생성 (시드 고정 가능)
        let mut rng = StdRng::seed_from_u64(0);

        println!("네이티브 증명 생성 시작...");
        // 증명 생성 (Groth16 직접 사용)
        let proof = Groth16::<Bls12_381>::prove(pk, circuit.clone(), &mut rng) // circuit 복제 사용
            .expect("네이티브 증명 생성 실패");
        println!("네이티브 증명 생성 완료.");

        // 공개 입력 생성 (lib.rs의 verify 함수 로직 참고)
        let puzzle_grid = convert_flat_to_grid(&puzzle_flat);
        let mut public_inputs = Vec::new();
        for i in 0..9 {
            for j in 0..9 {
                // 주의: 회로의 public input 정의와 일치해야 함
                // SudokuCircuit은 현재 public input을 명시적으로 사용하지 않으므로,
                // 검증 시에도 비어 있어야 할 수 있음. 회로 정의에 따라 수정 필요.
                // 아래는 퍼즐 값을 public input으로 사용하는 예시 (회로 수정 필요 시)
                if let Some(val) = puzzle_grid[i][j] {
                    // 회로가 Fr 필드를 사용한다고 가정
                    public_inputs.push(ark_bls12_381::Fr::from(val));
                }
            }
        }
        let public_inputs: Vec<ark_bls12_381::Fr> = Vec::new();
        println!("Public Inputs (비어 있어야 함): {:?}", public_inputs);

        println!("네이티브 증명 검증 시작...");
        // 증명 검증 (Groth16 직접 사용)
        let is_valid = Groth16::<Bls12_381>::verify_with_processed_vk(&pvk, &public_inputs, &proof) // 수정된 public_inputs 사용
            .expect("네이티브 증명 검증 중 오류 발생");
        println!("네이티브 증명 검증 완료: {}", is_valid);

        assert!(
            is_valid,
            "네이티브 환경에서 생성된 증명이 유효하지 않습니다."
        );

        // 추가: 잘못된 입력으로 검증 시 실패하는지 테스트
        let mut wrong_public_inputs = public_inputs.clone();
        if !wrong_public_inputs.is_empty() {
            wrong_public_inputs[0] += ark_bls12_381::Fr::from(1u64); // 입력 변경
            let is_invalid =
                Groth16::<Bls12_381>::verify_with_processed_vk(&pvk, &wrong_public_inputs, &proof)
                    .expect("잘못된 입력 검증 중 오류 발생");
            assert!(
                !is_invalid,
                "잘못된 public input으로 검증 시 실패해야 합니다."
            );
        } else {
            println!("Public input이 없어 잘못된 입력 테스트는 생략합니다.");
        }
    }
}
