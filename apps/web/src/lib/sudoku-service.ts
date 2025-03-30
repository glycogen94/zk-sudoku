/**
 * 스도쿠 관련 기능을 제공하는 서비스
 * 이 파일은 core의 solve 알고리즘이 작동하지 않을 때 대체 솔루션을 제공합니다.
 */
import { useCallback } from 'react';
import { 
  solveSudoku as coreSolveSudoku, 
  generateSudoku as coreGenerateSudoku,
  validateSudoku as coreValidateSudoku,
  isWasmReady
} from '@zk-sudoku/core';

// 스도쿠 솔루션 캐시
// 생성된 스도쿠 퍼즐의 솔루션을 저장하는 데 사용됩니다.
type SudokuCache = Record<string, number[]>;

// 브라우저 환경에서만 localStorage 접근
const getCache = (): SudokuCache => {
  if (typeof window === 'undefined') return {};
  
  try {
    const cache = localStorage.getItem('sudoku-solutions');
    return cache ? JSON.parse(cache) : {};
  } catch (e) {
    console.error('캐시 로드 오류:', e);
    return {};
  }
};

const saveCache = (cache: SudokuCache): void => {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem('sudoku-solutions', JSON.stringify(cache));
  } catch (e) {
    console.error('캐시 저장 오류:', e);
  }
};

/**
 * 주어진 스도쿠 퍼즐을 풉니다.
 * 1. 먼저 캐시에서 솔루션을 찾아봅니다.
 * 2. 캐시에 없으면 Core 라이브러리의 solveSudoku 호출을 시도합니다.
 * 3. Core 호출이 실패하면 JavaScript 구현을 사용합니다.
 * 
 * @param grid 9x9 스도쿠 퍼즐 (0은 빈 셀, 1-9는 채워진 셀)
 * @returns 솔루션 또는 null (솔루션이 없는 경우)
 */
export async function solveSudoku(grid: number[]): Promise<number[] | null> {
  if (!grid || grid.length !== 81) {
    console.error('유효하지 않은 그리드 크기입니다. 81개의 셀이 필요합니다.');
    return null;
  }
  
  // 캐시에서 솔루션 찾기
  const gridKey = grid.join('');
  const cache = getCache();
  
  if (cache[gridKey]) {
    console.log('캐시된 솔루션 사용');
    return cache[gridKey];
  }
  
  try {
    // Core 라이브러리 호출 시도
    if (isWasmReady()) {
      console.log('Core 라이브러리의 solveSudoku 호출');
      const solution = await coreSolveSudoku(grid);
      
      // 솔루션이 있으면 캐시에 저장
      if (solution) {
        cache[gridKey] = solution;
        saveCache(cache);
      }
      
      return solution;
    }
  } catch (error) {
    console.error('Core 라이브러리 solveSudoku 호출 오류:', error);
  }
  
  // JavaScript 구현으로 대체
  console.log('JavaScript 솔버 사용');
  const solution = solveSudokuJS(grid);
  
  // 솔루션이 있으면 캐시에 저장
  if (solution) {
    cache[gridKey] = solution;
    saveCache(cache);
  }
  
  return solution;
}

/**
 * 난이도에 따라 스도쿠 퍼즐을 생성합니다.
 * 솔루션은 자동으로 캐시에 저장됩니다.
 * 
 * @param difficulty 난이도 (1: 쉬움, 2: 중간, 3: 어려움)
 * @returns 생성된 9x9 스도쿠 퍼즐 (0은 빈 셀, 1-9는 채워진 셀)
 */
export async function generateSudoku(difficulty: number = 2): Promise<number[]> {
  try {
    // Core 라이브러리 호출 시도
    if (isWasmReady()) {
      console.log('Core 라이브러리의 generateSudoku 호출');
      const puzzle = await coreGenerateSudoku(difficulty);
      
      // 생성 후 솔루션 계산 및 캐시 저장
      const solution = await solveSudoku([...puzzle]);
      if (solution) {
        const cache = getCache();
        cache[puzzle.join('')] = solution;
        saveCache(cache);
      }
      
      return puzzle;
    }
  } catch (error) {
    console.error('Core 라이브러리 generateSudoku 호출 오류:', error);
  }
  
  // JavaScript 구현으로 대체
  console.log('JavaScript 구현으로 스도쿠 생성');
  const { puzzle, solution } = generateSudokuWithSolution(difficulty);
  
  // 솔루션 캐시에 저장
  const cache = getCache();
  cache[puzzle.join('')] = solution;
  saveCache(cache);
  
  return puzzle;
}

/**
 * 스도쿠 퍼즐 또는 솔루션의 유효성을 검사합니다.
 * 
 * @param grid 9x9 스도쿠 그리드 (0은 빈 셀, 1-9는 채워진 셀)
 * @param checkComplete 완전히 채워진 솔루션인지 확인 (기본값: false)
 * @returns 유효성 결과 (true/false)
 */
export async function validateSudoku(grid: number[], checkComplete: boolean = false): Promise<boolean> {
  if (!grid || grid.length !== 81) {
    return false;
  }
  
  try {
    // Core 라이브러리 호출 시도
    if (isWasmReady()) {
      console.log('Core 라이브러리의 validateSudoku 호출');
      return await coreValidateSudoku(grid, checkComplete);
    }
  } catch (error) {
    console.error('Core 라이브러리 validateSudoku 호출 오류:', error);
  }
  
  // JavaScript 구현으로 대체
  console.log('JavaScript 구현으로 유효성 검사');
  return validateSudokuJS(grid, checkComplete);
}

/**
 * 백트래킹 알고리즘을 사용하여 스도쿠를 풉니다.
 * @param grid 9x9 스도쿠 그리드 (0은 빈 셀, 1-9는 채워진 셀)
 * @returns 솔루션 또는 솔루션이 없는 경우 null
 */
export function solveSudokuJS(grid: number[]): number[] | null {
  if (!grid || grid.length !== 81) {
    console.error("Invalid grid size. Expected 81 cells.");
    return null;
  }

  // 2차원 배열로 변환
  const board: number[][] = [];
  for (let i = 0; i < 9; i++) {
    board.push(grid.slice(i * 9, (i + 1) * 9));
  }

  // 백트래킹으로 풀기
  if (solveBacktrack(board)) {
    // 1차원 배열로 다시 변환
    const solution: number[] = [];
    for (let i = 0; i < 9; i++) {
      for (let j = 0; j < 9; j++) {
        solution.push(board[i][j]);
      }
    }
    return solution;
  }

  return null;
}

/**
 * 백트래킹 알고리즘을 사용하여 스도쿠 보드를 풉니다.
 * @param board 2차원 스도쿠 보드
 * @returns 솔루션을 찾았는지 여부
 */
function solveBacktrack(board: number[][]): boolean {
  // 빈 셀 찾기
  const emptyCell = findEmptyCell(board);
  if (!emptyCell) {
    return true; // 모든 셀이 채워짐
  }

  const [row, col] = emptyCell;

  // 1부터 9까지 시도
  for (let num = 1; num <= 9; num++) {
    if (isValidPlacement(board, row, col, num)) {
      // 유효한 숫자를 배치
      board[row][col] = num;

      // 재귀적으로 나머지 해결 시도
      if (solveBacktrack(board)) {
        return true;
      }

      // 실패하면 셀 초기화 (백트래킹)
      board[row][col] = 0;
    }
  }

  // 유효한 솔루션 없음
  return false;
}

/**
 * 빈 셀(값이 0인 셀)을 찾습니다.
 * @param board 스도쿠 보드
 * @returns 빈 셀의 [행, 열] 또는 없는 경우 null
 */
function findEmptyCell(board: number[][]): [number, number] | null {
  for (let i = 0; i < 9; i++) {
    for (let j = 0; j < 9; j++) {
      if (board[i][j] === 0) {
        return [i, j];
      }
    }
  }
  return null;
}

/**
 * 특정 위치에 숫자를 놓을 수 있는지 확인합니다.
 * @param board 스도쿠 보드
 * @param row 행 인덱스
 * @param col 열 인덱스
 * @param num 배치할 숫자
 * @returns 유효한 배치인지 여부
 */
function isValidPlacement(board: number[][], row: number, col: number, num: number): boolean {
  // 행 확인
  for (let j = 0; j < 9; j++) {
    if (board[row][j] === num) {
      return false;
    }
  }

  // 열 확인
  for (let i = 0; i < 9; i++) {
    if (board[i][col] === num) {
      return false;
    }
  }

  // 3x3 박스 확인
  const boxRow = Math.floor(row / 3) * 3;
  const boxCol = Math.floor(col / 3) * 3;
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      if (board[boxRow + i][boxCol + j] === num) {
        return false;
      }
    }
  }

  return true;
}

/**
 * 스도쿠 그리드가 유효한지 확인합니다.
 * @param grid 9x9 스도쿠 그리드 (0은 빈 셀, 1-9는 채워진 셀)
 * @param checkComplete 완전히 채워진 솔루션인지 확인 (기본값: false)
 * @returns 유효성 결과
 */
export function validateSudokuJS(grid: number[], checkComplete: boolean = false): boolean {
  if (!grid || grid.length !== 81) {
    return false;
  }

  // 2차원 배열로 변환
  const board: number[][] = [];
  for (let i = 0; i < 9; i++) {
    board.push(grid.slice(i * 9, (i + 1) * 9));
  }

  // 행 검사
  for (let i = 0; i < 9; i++) {
    const seen = new Set<number>();
    for (let j = 0; j < 9; j++) {
      const value = board[i][j];
      if (value === 0) {
        if (checkComplete) return false;
      } else {
        if (seen.has(value)) return false;
        seen.add(value);
      }
    }
  }

  // 열 검사
  for (let j = 0; j < 9; j++) {
    const seen = new Set<number>();
    for (let i = 0; i < 9; i++) {
      const value = board[i][j];
      if (value !== 0) {
        if (seen.has(value)) return false;
        seen.add(value);
      }
    }
  }

  // 3x3 박스 검사
  for (let boxRow = 0; boxRow < 3; boxRow++) {
    for (let boxCol = 0; boxCol < 3; boxCol++) {
      const seen = new Set<number>();
      for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
          const value = board[boxRow * 3 + i][boxCol * 3 + j];
          if (value !== 0) {
            if (seen.has(value)) return false;
            seen.add(value);
          }
        }
      }
    }
  }

  return true;
}

/**
 * 난이도에 따라 스도쿠 퍼즐을 생성하고 솔루션도 함께 반환합니다.
 * @param difficulty 난이도 (1: 쉬움, 2: 중간, 3: 어려움)
 * @returns {puzzle: number[], solution: number[]} 퍼즐과 솔루션
 */
export function generateSudokuWithSolution(difficulty: number = 2): {puzzle: number[], solution: number[]} {
  // 빈 보드 생성
  const board: number[][] = Array(9).fill(0).map(() => Array(9).fill(0));
  
  // 솔루션 생성 (랜덤한 수로 채움)
  fillBoard(board);
  
  // 솔루션을 1차원 배열로 변환
  const solution = board.flat();
  
  // 보드에서 셀 제거하여 퍼즐 생성
  const puzzle = createPuzzleFromSolution(board, difficulty);
  
  return { puzzle, solution };
}

/**
 * 스도쿠 보드를 유효한 숫자로 채웁니다.
 * @param board 스도쿠 보드
 * @returns 성공 여부
 */
function fillBoard(board: number[][]): boolean {
  return fillBoardRecursive(board, 0, 0);
}

/**
 * 재귀적으로 스도쿠 보드를 채웁니다.
 * @param board 스도쿠 보드
 * @param row 현재 행
 * @param col 현재 열
 * @returns 성공 여부
 */
function fillBoardRecursive(board: number[][], row: number, col: number): boolean {
  // 다음 위치 계산
  let nextRow = row;
  let nextCol = col + 1;
  if (nextCol === 9) {
    nextRow++;
    nextCol = 0;
  }

  // 모든 셀을 채웠으면 성공
  if (row === 9) {
    return true;
  }

  // 숫자 1-9를 랜덤한 순서로 시도
  const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  shuffleArray(nums);

  for (const num of nums) {
    if (isValidPlacement(board, row, col, num)) {
      board[row][col] = num;
      
      // 다음 셀로 진행
      if (fillBoardRecursive(board, nextRow, nextCol)) {
        return true;
      }
      
      // 실패하면 백트래킹
      board[row][col] = 0;
    }
  }

  return false;
}

/**
 * 배열을 랜덤하게 섞습니다.
 * @param array 섞을 배열
 */
function shuffleArray<T>(array: T[]): void {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

/**
 * 솔루션에서 특정 난이도의 퍼즐을 생성합니다.
 * @param solution 완성된 스도쿠 솔루션
 * @param difficulty 난이도 (1: 쉬움, 2: 중간, 3: 어려움)
 * @returns 1차원 퍼즐 배열
 */
function createPuzzleFromSolution(solution: number[][], difficulty: number): number[] {
  // 솔루션 복사
  const puzzle: number[][] = solution.map(row => [...row]);
  
  // 난이도에 따라 제거할 셀 수 결정
  const cellsToRemove = ({
    1: 30, // 쉬움
    2: 45, // 중간
    3: 55, // 어려움
  } as Record<number, number>)[difficulty] || 45;
  
  // 제거할 셀 위치 목록 생성
  const positions: [number, number][] = [];
  for (let i = 0; i < 9; i++) {
    for (let j = 0; j < 9; j++) {
      positions.push([i, j]);
    }
  }
  
  // 위치 섞기
  shuffleArray(positions);
  
  // 셀 제거
  let removed = 0;
  for (const [row, col] of positions) {
    if (removed >= cellsToRemove) break;
    
    const temp = puzzle[row][col];
    puzzle[row][col] = 0;
    
    // 성능상의 이유로 모든 위치에 대해 유일 솔루션 확인은 하지 않습니다.
    // 실제 구현에서는 보다 정교한 알고리즘이 필요할 수 있습니다.
    
    removed++;
  }
  
  // 1차원 배열로 변환
  return puzzle.flat();
}

/**
 * 스도쿠 후크 - 리액트 컴포넌트에서 스도쿠 기능을 사용하기 쉽게 해주는 후크
 */
export function useSudoku() {
  // 스도쿠 생성
  const generate = useCallback(async (difficulty: number = 2) => {
    return await generateSudoku(difficulty);
  }, []);
  
  // 스도쿠 풀기
  const solve = useCallback(async (grid: number[]) => {
    return await solveSudoku(grid);
  }, []);
  
  // 스도쿠 유효성 검사
  const validate = useCallback(async (grid: number[], checkComplete: boolean = false) => {
    return await validateSudoku(grid, checkComplete);
  }, []);
  
  return {
    generate,
    solve,
    validate
  };
}
