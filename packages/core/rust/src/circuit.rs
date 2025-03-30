use ark_bls12_381::Fr;
use ark_ff::{Field, One, Zero}; // Zero 추가
use ark_relations::{
    lc, // 편의를 위해 lc! 매크로 사용
    r1cs::{
        ConstraintSynthesizer, ConstraintSystemRef, LinearCombination, SynthesisError, Variable,
    },
};

#[derive(Clone)]
pub struct SudokuCircuit {
    pub puzzle: Vec<Vec<Option<u8>>>,
    pub solution: Vec<Vec<Option<u8>>>,
}

impl ConstraintSynthesizer<Fr> for SudokuCircuit {
    fn generate_constraints(self, cs: ConstraintSystemRef<Fr>) -> Result<(), SynthesisError> {
        println!("generate_constraints 시작: {:?}", cs.num_constraints());
        let mut solution_vars = vec![vec![Variable::One; 9]; 9]; // witness 변수 저장

        // --- 각 셀 변수 할당 및 1-9 범위 제약 (비트 분해 + 제외 방식) ---
        for r in 0..9 {
            for c in 0..9 {
                // witness 값 가져오기 (setup 시에도 값이 있어야 함을 가정)
                let value_u8 = self.solution[r][c].ok_or(SynthesisError::AssignmentMissing)?; // 값이 없으면 setup 실패
                let value_fr = Fr::from(value_u8);

                // 1. 솔루션 변수 할당
                let sol_var = cs.new_witness_variable(|| Ok(value_fr))?;
                solution_vars[r][c] = sol_var;

                // 2. 비트 분해 (값이 0-15 사이의 정수임을 강제)
                // 4개의 비트 변수 b0, b1, b2, b3 할당 및 제약 추가
                let mut bits = Vec::with_capacity(4);
                let mut reconstructed_val_lc = LinearCombination::<Fr>::zero();
                let mut coeff = Fr::one(); // 비트 가중치 (1, 2, 4, 8)

                for i in 0..4 {
                    let bit_val = Fr::from(((value_u8 >> i) & 1) as u64); // 비트 값 (0 또는 1)
                    let bit_var = cs.new_witness_variable(|| Ok(bit_val))?; // 비트 witness 할당
                    bits.push(bit_var);

                    // 비트 제약: bit * (1 - bit) = 0 (값이 0 또는 1임을 강제)
                    cs.enforce_constraint(
                        lc!() + bit_var,                 // A = bit
                        lc!() + Variable::One - bit_var, // B = 1 - bit
                        lc!(),                           // C = 0
                    )?;

                    // 재구성에 비트 추가 (가중치 적용: b0*1 + b1*2 + b2*4 + b3*8)
                    reconstructed_val_lc += (coeff, bit_var);
                    coeff.double_in_place(); // 다음 가중치
                }

                // 3. 재구성 제약: reconstructed_value == sol_var
                // 비트 분해가 올바르게 이루어졌는지 확인
                cs.enforce_constraint(
                    reconstructed_val_lc - sol_var, // A = reconstructed - sol_var
                    lc!() + Variable::One,          // B = 1
                    lc!(),                          // C = 0
                )?;

                // 4. 엄격한 범위 제약: 1 <= sol_var <= 9
                //    비트 분해로 0-15 정수는 보장됨.
                //    이제 값이 0, 10, 11, 12, 13, 14, 15가 아님을 보여야 함.
                //    (sol_var != forbidden_value) 제약 추가
                enforce_not_equal_constant(cs.clone(), sol_var, Fr::zero())?; // sol_var != 0
                for forbidden_val_u64 in 10..=15 {
                    // 10부터 15까지의 값 제외
                    enforce_not_equal_constant(cs.clone(), sol_var, Fr::from(forbidden_val_u64))?;
                }

                // --- 퍼즐 값 제약 (Public Input 처리) ---
                if let Some(puzzle_val) = self.puzzle[r][c] {
                    let puzzle_fr = Fr::from(puzzle_val);
                    // 제약: sol_var == puzzle_value
                    cs.enforce_constraint(
                        lc!() + sol_var,                    // A = sol_var
                        lc!() + Variable::One,              // B = 1
                        lc!() + (puzzle_fr, Variable::One), // C = puzzle_fr
                    )?;
                }
            }
        }

        println!("All-Different 제약 추가 시작");
        // --- 행, 열, 박스 All-Different 제약 (이전 답변과 동일 - setup 모드 지원) ---
        for r in 0..9 {
            let row_vars: Vec<Variable> = solution_vars[r].to_vec();
            enforce_all_different(cs.clone(), &row_vars)?;
        }
        for c in 0..9 {
            let col_vars: Vec<Variable> = (0..9).map(|r| solution_vars[r][c]).collect();
            enforce_all_different(cs.clone(), &col_vars)?;
        }
        for br in (0..9).step_by(3) {
            for bc in (0..9).step_by(3) {
                let mut box_vars = Vec::new();
                for r_offset in 0..3 {
                    for c_offset in 0..3 {
                        box_vars.push(solution_vars[br + r_offset][bc + c_offset]);
                    }
                }
                enforce_all_different(cs.clone(), &box_vars)?;
            }
        }
        println!("All-Different 제약 추가 완료");
        println!("generate_constraints 종료: {:?}", cs.num_constraints());
        Ok(())
    }
}

/// Helper: 변수와 상수가 다른지 확인하는 R1CS 제약을 추가 (Setup 모드 지원)
fn enforce_not_equal_constant(
    cs: ConstraintSystemRef<Fr>,
    var: Variable,
    constant: Fr,
) -> Result<(), SynthesisError> {
    // delta_lc = var - constant
    let delta_lc = lc!() + var - (constant, Variable::One);

    // witness 변수: is_equal (var == constant 이면 1, 아니면 0)
    // setup 모드에서는 assigned_value가 None일 수 있으므로 unwrap_or(false) 사용
    let is_equal_wit = Fr::from(cs.assigned_value(var).map_or(false, |v| v == constant) as u64);
    let is_equal_var = cs.new_witness_variable(|| Ok(is_equal_wit))?;
    // 제약: is_equal이 boolean 임을 강제 (is_equal * (1 - is_equal) = 0)
    cs.enforce_constraint(
        lc!() + is_equal_var,
        lc!() + Variable::One - is_equal_var,
        lc!(),
    )?;

    // witness 변수: inv (delta의 역원, delta=0 이면 임의 값(0))
    // setup 모드에서는 assigned_value가 None일 수 있으므로 unwrap_or_default 사용
    let delta_val = cs.assigned_value(var).unwrap_or_default() - constant;
    let inv_wit = delta_val.inverse().unwrap_or(Fr::zero()); // delta=0일 때 0 사용
    let inv_var = cs.new_witness_variable(|| Ok(inv_wit))?;

    // 제약 1: delta * is_equal = 0
    cs.enforce_constraint(delta_lc.clone(), lc!() + is_equal_var, lc!())?;

    // 제약 2: delta * inv = 1 - is_equal
    cs.enforce_constraint(
        delta_lc.clone(),
        lc!() + inv_var,
        lc!() + Variable::One - is_equal_var,
    )?;

    Ok(())
}

/// Helper: 변수 목록 값들이 모두 다른지 확인하는 R1CS 제약을 추가 (Setup 모드 지원)
fn enforce_all_different(
    cs: ConstraintSystemRef<Fr>,
    vars: &[Variable],
) -> Result<(), SynthesisError> {
    assert_eq!(
        vars.len(),
        9,
        "스도쿠 행/열/박스는 9개의 변수를 가져야 합니다."
    );

    for i in 0..vars.len() {
        for j in i + 1..vars.len() {
            // delta_lc = vars[i] - vars[j]
            let delta_lc = lc!() + vars[i] - vars[j];

            // witness 변수: is_equal (vars[i] == vars[j] 이면 1, 아니면 0)
            // setup 모드 대비 unwrap_or(false) 사용
            let is_equal_wit =
                Fr::from((cs.assigned_value(vars[i]) == cs.assigned_value(vars[j])) as u64);
            let is_equal_var = cs.new_witness_variable(|| Ok(is_equal_wit))?;
            // 제약: is_equal이 boolean 임을 강제
            cs.enforce_constraint(
                lc!() + is_equal_var,
                lc!() + Variable::One - is_equal_var,
                lc!(),
            )?;

            // witness 변수: inv (delta의 역원, delta=0 이면 임의 값(0))
            // setup 모드 대비 unwrap_or_default 사용
            let delta_val = cs.assigned_value(vars[i]).unwrap_or_default()
                - cs.assigned_value(vars[j]).unwrap_or_default();
            let inv_wit = delta_val.inverse().unwrap_or(Fr::zero());
            let inv_var = cs.new_witness_variable(|| Ok(inv_wit))?;

            // 제약 1: delta * is_equal = 0
            cs.enforce_constraint(delta_lc.clone(), lc!() + is_equal_var, lc!())?;

            // 제약 2: delta * inv = 1 - is_equal
            cs.enforce_constraint(
                delta_lc.clone(),
                lc!() + inv_var,
                lc!() + Variable::One - is_equal_var,
            )?;
        }
    }
    Ok(())
}
