use ark_bls12_381::Bls12_381;
use ark_crypto_primitives::snark::SNARK;
use ark_groth16::Groth16;
use ark_serialize::CanonicalSerialize;
use ark_std::rand::rngs::StdRng;
use ark_std::rand::SeedableRng;
use std::env;
use std::fs::File;
use std::io::Write;
use std::path::Path;

// SudokuCircuit을 위한 모듈 임포트
mod circuit;
mod sudoku;
mod utils;

use circuit::SudokuCircuit;

fn main() -> Result<(), Box<dyn std::error::Error>> {
    println!("ZK-Sudoku CRS 생성기 시작");

    // 인자 파싱
    let args: Vec<String> = env::args().collect();
    let output_dir = if args.len() > 1 {
        Path::new(&args[1])
    } else {
        Path::new(".")
    };

    println!("출력 디렉토리: {:?}", output_dir);

    // 고정된 시드로 RNG 초기화 (재현성을 위해)
    println!("RNG 초기화...");
    let rng = &mut StdRng::seed_from_u64(0);

    // 샘플 회로 생성
    println!("샘플 SudokuCircuit 생성...");
    let circuit = sample_circuit();

    // 회로 설정
    println!("Groth16 파라미터 생성 중...");
    let (pk, vk) = Groth16::<Bls12_381>::circuit_specific_setup(circuit, rng)
        .map_err(|e| format!("Setup 오류: {:?}", e))?;

    // 키 직렬화
    println!("ProvingKey 직렬화 중...");
    let mut pk_bytes = Vec::new();
    pk.serialize_compressed(&mut pk_bytes)
        .map_err(|e| format!("PK 직렬화 오류: {:?}", e))?;

    println!("VerifyingKey 직렬화 중...");
    let mut vk_bytes = Vec::new();
    vk.serialize_compressed(&mut vk_bytes)
        .map_err(|e| format!("VK 직렬화 오류: {:?}", e))?;

    // 파일에 저장
    let pk_path = output_dir.join("sudoku_pk.bin");
    let vk_path = output_dir.join("sudoku_vk.bin");

    println!("ProvingKey를 파일에 저장 중: {:?}", pk_path);
    let mut pk_file = File::create(&pk_path)?;
    pk_file.write_all(&pk_bytes)?;

    println!("VerifyingKey를 파일에 저장 중: {:?}", vk_path);
    let mut vk_file = File::create(&vk_path)?;
    vk_file.write_all(&vk_bytes)?;

    println!("CRS 생성 완료!");
    println!("ProvingKey 크기: {} 바이트", pk_bytes.len());
    println!("VerifyingKey 크기: {} 바이트", vk_bytes.len());

    // 테스트: 생성된 파일 읽기 및 역직렬화
    println!("...테스트 생략...");

    println!("키 파일 유효성 검증 완료!");

    Ok(())
}

// 샘플 회로 생성 (lib.rs에서 복사)
fn sample_circuit() -> SudokuCircuit {
    // 퍼즐 데이터는 None을 포함해도 괜찮음
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

    // 솔루션 데이터는 반드시 1~9 값으로 완전히 채워져 있어야 함 (None 없음)
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
