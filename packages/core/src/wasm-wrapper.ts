/**
 * WebAssembly 모듈 인터페이스
 */
export interface ZkSudokuWasm {
  setup(): string;
  prove(puzzle: Uint8Array, solution: Uint8Array): string;
  verify(puzzle: Uint8Array, proof: string): boolean;
  solve_sudoku(grid: Uint8Array): Uint8Array;
  validate_sudoku(grid: Uint8Array, check_complete: boolean): boolean;
  generate_sudoku(difficulty: number): Uint8Array;
  memory: WebAssembly.Memory;
}

// WASM 모듈 초기화 상태
let wasmModule: any = null;

/**
 * ZK-Sudoku WASM 모듈을 초기화합니다.
 * @param wasmPath WebAssembly 파일 경로 (선택적)
 */
export async function initWasm(wasmPath?: string): Promise<any> {
  if (wasmModule) return wasmModule;

  try {
    console.log('WASM 모듈 초기화 시작...');
    
    // 브라우저 환경
    if (typeof window !== 'undefined') {
      // 동적 임포트를 사용하여 WASM 모듈 가져오기
      try {
        const wasm = await import('../rust/pkg/zk_sudoku_core');
        console.log('WASM 모듈 임포트 성공!');
        
        // 경로가 제공된 경우 해당 경로로 초기화, 아니면 기본 값 사용
        wasmModule = await wasm.default();
        console.log('WASM 기본값으로 초기화 성공!');
      } catch (error) {
        console.error('WASM 초기화 실패:', error);
        throw error;
      }
    } 
    // Node.js 환경 (필요한 경우)
    else {
      const wasm = require('../rust/pkg/zk_sudoku_core');
      const fs = require('fs');
      const path = require('path');
      
      // 경로가 제공된 경우 해당 경로 사용, 아니면 기본 경로 사용
      const wasmPath2 = wasmPath || path.resolve(__dirname, '../rust/pkg/zk_sudoku_core_bg.wasm');
      const wasmBinary = fs.readFileSync(wasmPath2);
      
      wasmModule = await wasm.default(wasmBinary);
    }
    
    console.log('WASM 모듈 초기화 완료');
    return wasmModule;
  } catch (error) {
    console.error('ZK-Sudoku WASM 초기화 중 오류 발생:', error);
    throw new Error(`WASM 모듈 초기화 실패: ${error}`);
  }
}

/**
 * ZK-SNARK 파라미터를 설정합니다.
 */
export async function setupParams(): Promise<string> {
  const wasm = await initWasm();
  return wasm.setup();
}

/**
 * 주어진 퍼즐과 솔루션에 대한 ZK-SNARK 증명을 생성합니다.
 * @param puzzle 9x9 스도쿠 퍼즐 (0은 빈 셀, 1-9는 채워진 셀)
 * @param solution 9x9 스도쿠 솔루션 (1-9로 모두 채워진 상태)
 * @returns 증명 문자열 (base64 인코딩)
 */
export async function generateProof(puzzle: number[], solution: number[]): Promise<string> {
  const wasm = await initWasm();
  
  const puzzleArray = new Uint8Array(puzzle);
  const solutionArray = new Uint8Array(solution);
  
  return wasm.prove(puzzleArray, solutionArray);
}

/**
 * 주어진 퍼즐과 증명을 검증합니다.
 * @param puzzle 9x9 스도쿠 퍼즐 (0은 빈 셀, 1-9는 채워진 셀)
 * @param proof 증명 문자열 (base64 인코딩)
 * @returns 검증 결과 (true/false)
 */
export async function verifyProof(puzzle: number[], proof: string): Promise<boolean> {
  const wasm = await initWasm();
  
  const puzzleArray = new Uint8Array(puzzle);
  return wasm.verify(puzzleArray, proof);
}

/**
 * 주어진 스도쿠 퍼즐을 풉니다.
 * @param grid 9x9 스도쿠 퍼즐 (0은 빈 셀, 1-9는 채워진 셀)
 * @returns 솔루션 또는 null (솔루션이 없는 경우)
 */
export async function solveSudoku(grid: number[]): Promise<number[] | null> {
  try {
    const wasm = await initWasm();
    
    const gridArray = new Uint8Array(grid);
    const solution = wasm.solve_sudoku(gridArray);
    return Array.from(solution);
  } catch (error) {
    console.error('스도쿠 풀기 중 오류 발생:', error);
    return null;
  }
}

/**
 * 스도쿠 퍼즐 또는 솔루션의 유효성을 검사합니다.
 * @param grid 9x9 스도쿠 그리드 (0은 빈 셀, 1-9는 채워진 셀)
 * @param checkComplete 완전히 채워진 솔루션인지 확인 (기본값: false)
 * @returns 유효성 결과 (true/false)
 */
export async function validateSudoku(grid: number[], checkComplete = false): Promise<boolean> {
  const wasm = await initWasm();
  
  const gridArray = new Uint8Array(grid);
  return wasm.validate_sudoku(gridArray, checkComplete);
}

/**
 * 지정된 난이도의 스도쿠 퍼즐을 생성합니다.
 * @param difficulty 난이도 (1: 쉬움, 2: 중간, 3: 어려움)
 * @returns 생성된 9x9 스도쿠 퍼즐 (0은 빈 셀, 1-9는 채워진 셀)
 */
export async function generateSudoku(difficulty = 2): Promise<number[]> {
  const wasm = await initWasm();
  
  const puzzle = wasm.generate_sudoku(difficulty);
  return Array.from(puzzle);
}

/**
 * WebAssembly 모듈이 초기화되었는지 확인합니다.
 * @returns 초기화 상태 (true/false)
 */
export function isWasmInitialized(): boolean {
  return wasmModule !== null;
}

export default {
  initWasm,
  setupParams,
  generateProof,
  verifyProof,
  solveSudoku,
  validateSudoku,
  generateSudoku,
  isWasmInitialized,
};
