use ark_ff::{Field, Zero};
use ark_relations::{
    lc,
    r1cs::{ConstraintSynthesizer, ConstraintSystemRef, SynthesisError},
};
use ark_bls12_381::Fr;

// 스도쿠 검증을 위한 회로 정의
#[derive(Clone)]
pub struct SudokuCircuit {
    // 9x9 스도쿠 퍼즐
    pub puzzle: Vec<Vec<Option<u8>>>, 
    // 9x9 스도쿠 솔루션
    pub solution: Vec<Vec<Option<u8>>>,
}

// 스도쿠 규칙 검증
impl ConstraintSynthesizer<Fr> for SudokuCircuit {
    fn generate_constraints(self, cs: ConstraintSystemRef<Fr>) -> Result<(), SynthesisError> {
        // 솔루션의 각 셀이 1-9 범위의 값인지 확인
        let mut variables = vec![vec![Fr::zero(); 9]; 9];
        
        for i in 0..9 {
            for j in 0..9 {
                let value = self.solution[i][j].map(|v| Fr::from(v as u64));
                let var = cs.new_witness_variable(|| value.ok_or(SynthesisError::AssignmentMissing))?;
                variables[i][j] = var;
                
                // 각 셀은 1-9 사이의 값이어야 함
                // 제약 조건: (value - 1) * (value - 2) * ... * (value - 9) = 0
                let mut constraint = lc!();
                let mut product = lc!();
                
                for val in 1..=9 {
                    let fr_val = Fr::from(val);
                    if product.is_zero() {
                        product = lc!() + var - fr_val;
                    } else {
                        product = product * (lc!() + var - fr_val);
                    }
                }
                
                cs.enforce_constraint(lc!(), lc!(), product)?;
                
                // 초기 퍼즐 값과 솔루션이 일치해야 함
                if let Some(puzzle_val) = self.puzzle[i][j] {
                    let puzzle_fr = Fr::from(puzzle_val as u64);
                    cs.enforce_constraint(lc!() + var, lc!() + 1, lc!() + puzzle_fr)?;
                }
            }
        }
        
        // 각 행에 1-9가 정확히 한 번씩 나타나야 함
        for i in 0..9 {
            for val in 1..=9 {
                let fr_val = Fr::from(val);
                let mut sum = lc!();
                
                for j in 0..9 {
                    sum = sum + (variables[i][j] - fr_val).square();
                }
                
                cs.enforce_constraint(lc!() + sum, lc!(), lc!())?;
            }
        }
        
        // 각 열에 1-9가 정확히 한 번씩 나타나야 함
        for j in 0..9 {
            for val in 1..=9 {
                let fr_val = Fr::from(val);
                let mut sum = lc!();
                
                for i in 0..9 {
                    sum = sum + (variables[i][j] - fr_val).square();
                }
                
                cs.enforce_constraint(lc!() + sum, lc!(), lc!())?;
            }
        }
        
        // 각 3x3 서브그리드에 1-9가 정확히 한 번씩 나타나야 함
        for grid_i in 0..3 {
            for grid_j in 0..3 {
                for val in 1..=9 {
                    let fr_val = Fr::from(val);
                    let mut sum = lc!();
                    
                    for i in 0..3 {
                        for j in 0..3 {
                            sum = sum + (variables[grid_i * 3 + i][grid_j * 3 + j] - fr_val).square();
                        }
                    }
                    
                    cs.enforce_constraint(lc!() + sum, lc!(), lc!())?;
                }
            }
        }
        
        Ok(())
    }
}
