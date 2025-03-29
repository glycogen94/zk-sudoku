/// 스도쿠 관련 핵심 기능들

/// 1차원 배열을 2차원 그리드로 변환
pub fn convert_flat_to_grid(flat: &[u8]) -> Vec<Vec<Option<u8>>> {
    let mut grid = vec![vec![None; 9]; 9];
    
    for i in 0..9 {
        for j in 0..9 {
            let idx = i * 9 + j;
            if idx < flat.len() {
                let val = flat[idx];
                if val >= 1 && val <= 9 {
                    grid[i][j] = Some(val);
                }
            }
        }
    }
    
    grid
}

/// 스도쿠 유효성 검사
pub fn is_valid_sudoku(grid: &Vec<Vec<Option<u8>>>, check_complete: bool) -> bool {
    // 행 검증
    for row in grid {
        let mut seen = [false; 10]; // 1-9 표시용 (0번 인덱스는 사용 안함)
        for &cell in row {
            if let Some(val) = cell {
                if val < 1 || val > 9 || seen[val as usize] {
                    return false;
                }
                seen[val as usize] = true;
            } else if check_complete {
                return false; // 완성된 스도쿠를 확인할 때는 빈 셀이 없어야 함
            }
        }
    }
    
    // 열 검증
    for j in 0..9 {
        let mut seen = [false; 10];
        for i in 0..9 {
            if let Some(val) = grid[i][j] {
                if val < 1 || val > 9 || seen[val as usize] {
                    return false;
                }
                seen[val as usize] = true;
            }
        }
    }
    
    // 3x3 서브그리드 검증
    for grid_i in 0..3 {
        for grid_j in 0..3 {
            let mut seen = [false; 10];
            for i in 0..3 {
                for j in 0..3 {
                    if let Some(val) = grid[grid_i * 3 + i][grid_j * 3 + j] {
                        if val < 1 || val > 9 || seen[val as usize] {
                            return false;
                        }
                        seen[val as usize] = true;
                    }
                }
            }
        }
    }
    
    true
}

/// 백트래킹을 이용한 스도쿠 풀기
pub fn solve_backtrack(grid: &mut Vec<Vec<Option<u8>>>) -> bool {
    // 빈 셀 찾기
    let mut row = 0;
    let mut col = 0;
    let mut found_empty = false;
    
    'outer: for i in 0..9 {
        for j in 0..9 {
            if grid[i][j].is_none() {
                row = i;
                col = j;
                found_empty = true;
                break 'outer;
            }
        }
    }
    
    // 빈 셀이 없으면 완료
    if !found_empty {
        return true;
    }
    
    // 1~9 시도
    for num in 1..=9 {
        if is_safe(grid, row, col, num) {
            // 유효한 숫자면 배치
            grid[row][col] = Some(num);
            
            // 재귀적으로 나머지 해결 시도
            if solve_backtrack(grid) {
                return true;
            }
            
            // 실패하면 셀 초기화
            grid[row][col] = None;
        }
    }
    
    // 유효한 솔루션 없음
    false
}

/// 한 위치에 숫자를 놓을 수 있는지 확인
pub fn is_safe(grid: &Vec<Vec<Option<u8>>>, row: usize, col: usize, num: u8) -> bool {
    // 행 확인
    for j in 0..9 {
        if grid[row][j] == Some(num) {
            return false;
        }
    }
    
    // 열 확인
    for i in 0..9 {
        if grid[i][col] == Some(num) {
            return false;
        }
    }
    
    // 3x3 서브그리드 확인
    let start_row = (row / 3) * 3;
    let start_col = (col / 3) * 3;
    
    for i in 0..3 {
        for j in 0..3 {
            if grid[start_row + i][start_col + j] == Some(num) {
                return false;
            }
        }
    }
    
    true
}
