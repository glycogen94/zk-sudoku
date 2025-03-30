import init, * as wasmBindings from '../dist/wasm/zk_sudoku_core.js';

/**
 * WebAssembly 모듈 인터페이스
 */
export interface ZkSudokuWasm {
  setup(): string;
  init_keys(pk_bytes: Uint8Array, vk_bytes: Uint8Array): void;
  prove(puzzle: Uint8Array, solution: Uint8Array): string;
  verify(puzzle: Uint8Array, proof: string): boolean;
  solve_sudoku(grid: Uint8Array): Uint8Array;
  validate_sudoku(grid: Uint8Array, check_complete: boolean): boolean;
  generate_sudoku(difficulty: number): Uint8Array;
  has_solution(grid: Uint8Array): boolean;
  memory: WebAssembly.Memory;
}

// WASM 모듈 초기화 상태
let wasmModule: any = null;
let initPromise: Promise<any> | null = null;

/**
 * 키 파일을 가져오는 도우미 함수
 * @param url 키 파일 URL
 * @returns Uint8Array로 변환된 키 데이터
 */
async function fetchKeyBytes(url: string): Promise<Uint8Array> {
  try {
    console.log(`키 파일 가져오기 시도: ${url}`);
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
    }
    const buffer = await response.arrayBuffer();
    console.log(`키 파일 가져오기 성공: ${url}, 크기: ${buffer.byteLength} 바이트`);
    return new Uint8Array(buffer);
  } catch (error: any) {
    console.error(`키 파일 ${url} 가져오기 오류:`, error);
    throw error;
  }
}

/**
 * ZK-Sudoku WASM 모듈을 초기화합니다.
 * @param wasmPath WebAssembly 파일 경로 (선택적)
 */
export async function initWasm(wasmPath?: string): Promise<any> {
  if (wasmModule) {
    console.log('이미 초기화된 WASM 모듈 반환');
    return wasmModule;
  }
  
  if (initPromise) {
    console.log('진행 중인 초기화 Promise 반환');
    return initPromise;
  }

  console.log('***** WASM 모듈 초기화 시작 *****');
  
  initPromise = (async () => {
    try {
      console.log('WASM 모듈 로딩 프로세스 시작');
      
          // `init` 함수는 .wasm 파일을 웹 루트 또는 지정된 경로에서 로드함
          // 빌드 시 public 폴더로 복사했으므로 웹 루트 경로 사용
          const wasmUrl = '/zk_sudoku_core_bg.wasm'; // public 폴더 기준 경로
          console.log(`다음 경로에서 WASM 초기화 시도: ${wasmUrl}`);

          // wasm-bindgen이 생성한 `init` 함수로 모듈 초기화
          wasmModule = await init(wasmUrl);
          // init 함수가 바인딩을 직접 반환하지 않으면, 임포트된 모듈 사용
          // wasmModule = wasmBindings; // 필요에 따라 주석 해제

          console.log('WASM 초기화 성공!');

          // CRS 파일 가져오기 (public 폴더 기준 경로)
          console.log('CRS 파일(PK, VK) 가져오는 중...');
          try {
            const [pkBytes, vkBytes] = await Promise.all([
              fetchKeyBytes('/sudoku_pk.bin'),
              fetchKeyBytes('/sudoku_vk.bin')
            ]);
            console.log(`PK 크기: ${pkBytes.length} 바이트, VK 크기: ${vkBytes.length} 바이트`);

            console.log('WASM에 키 초기화 시도...');
            // 초기화된 모듈의 init_keys 함수 호출
            if (!wasmModule || typeof wasmModule.init_keys !== 'function') {
                 throw new Error("WASM 모듈 또는 init_keys 함수가 초기화 후 사용 불가 상태입니다.");
            }
            wasmModule.init_keys(pkBytes, vkBytes); // 초기화된 모듈 객체에서 함수 호출
            console.log('키 초기화 완료!');

          } catch (fetchError: any) {
            console.error('CRS 파일 가져오기 실패:', fetchError);
            throw new Error(`CRS 파일 가져오기 실패: ${fetchError?.message || String(fetchError)}`);
          }

          console.log('***** WASM 모듈 초기화 완료! *****');
          return wasmModule; // 초기화된 모듈 반환

        } catch (error: any) {
          console.error('ZK-Sudoku WASM 초기화 중 오류 발생 (최상위 catch):', error);
          initPromise = null; // 실패 시 상태 초기화
          wasmModule = null;
          throw new Error(`WASM 모듈 초기화 실패: ${error?.message || String(error)}`);
        }
      })();

      return initPromise;
}

/**
 * 주어진 퍼즐과 솔루션에 대한 ZK-SNARK 증명을 생성합니다.
 * @param puzzle 9x9 스도쿠 퍼즐 (0은 빈 셀, 1-9는 채워진 셀)
 * @param solution 9x9 스도쿠 솔루션 (1-9로 모두 채워진 상태)
 * @returns 증명 문자열 (base64 인코딩)
 */
export async function generateProof(puzzle: number[], solution: number[]): Promise<string> {
  console.log('generateProof 호출됨 - 입력 검증 시작');
  // 입력 검증
  if (puzzle.length !== 81) {
    throw new Error(`Invalid puzzle size. Expected 81 cells, got ${puzzle.length}.`);
  }
  if (solution.length !== 81) {
    throw new Error(`Invalid solution size. Expected 81 cells, got ${solution.length}.`);
  }
  
  // 값 범위 검증
  if (!puzzle.every(val => val >= 0 && val <= 9)) {
    throw new Error("Puzzle contains invalid values. Must be between 0-9.");
  }
  if (!solution.every(val => val >= 1 && val <= 9)) {
    throw new Error("Solution contains invalid values. Must be between 1-9.");
  }
  
  console.log('initWasm 호출 시작');
  const wasm = await initWasm();
  console.log('initWasm 호출 완료, WASM 인스턴스 받음');
  
  const puzzleArray = new Uint8Array(puzzle);
  const solutionArray = new Uint8Array(solution);
  
  console.log('prove 함수 호출 시작');
  try {
    const result = wasm.prove(puzzleArray, solutionArray);
    console.log('prove 함수 호출 완료, 결과 길이:', result.length);
    return result;
  } catch (error: any) {
    console.error('prove 함수 호출 중 오류 발생:', error);
    throw new Error(`증명 생성 실패: ${error?.message || String(error)}`);
  }
}

/**
 * 주어진 퍼즐과 증명을 검증합니다.
 * @param puzzle 9x9 스도쿠 퍼즐 (0은 빈 셀, 1-9는 채워진 셀)
 * @param proof 증명 문자열 (base64 인코딩)
 * @returns 검증 결과 (true/false)
 */
export async function verifyProof(puzzle: number[], proof: string): Promise<boolean> {
  console.log('verifyProof 호출됨 - 입력 검증 시작');
  // 입력 검증
  if (puzzle.length !== 81) {
    throw new Error(`Invalid puzzle size. Expected 81 cells, got ${puzzle.length}.`);
  }
  if (!puzzle.every(val => val >= 0 && val <= 9)) {
    throw new Error("Puzzle contains invalid values. Must be between 0-9.");
  }
  
  console.log('initWasm 호출 시작');
  const wasm = await initWasm();
  console.log('initWasm 호출 완료, WASM 인스턴스 받음');
  
  const puzzleArray = new Uint8Array(puzzle);
  
  console.log('verify 함수 호출 시작');
  try {
    const result = wasm.verify(puzzleArray, proof);
    console.log('verify 함수 호출 완료, 결과:', result);
    return result;
  } catch (error: any) {
    console.error('verify 함수 호출 중 오류 발생:', error);
    throw new Error(`증명 검증 실패: ${error?.message || String(error)}`);
  }
}

/**
 * 주어진 스도쿠 퍼즐을 풉니다.
 * @param grid 9x9 스도쿠 퍼즐 (0은 빈 셀, 1-9는 채워진 셀)
 * @returns 솔루션 또는 null (솔루션이 없는 경우)
 */
export async function solveSudoku(grid: number[]): Promise<number[] | null> {
  console.log('solveSudoku 호출됨 - 입력 검증 시작');
  if (grid.length !== 81) {
    throw new Error(`Invalid grid size. Expected 81 cells, got ${grid.length}.`);
  }
  
  try {
    console.log('initWasm 호출 시작');
    const wasm = await initWasm();
    console.log('initWasm 호출 완료, WASM 인스턴스 받음');
    
    const gridArray = new Uint8Array(grid);
    
    // 먼저 솔루션이 존재하는지 확인
    const hasSolution = wasm.has_solution(gridArray);
    if (!hasSolution) {
      console.log('스도쿠 퍼즐에 솔루션이 없습니다');
      return null;
    }
    
    console.log('solve_sudoku 함수 호출');
    const solution = wasm.solve_sudoku(gridArray);
    console.log('solve_sudoku 함수 호출 완료, 솔루션 길이:', solution.length);
    
    // 모든 값이 0인지 확인 (솔루션이 없는 경우)
    const solutionArray = Array.from(solution) as number[];
    if (solutionArray.every(val => val === 0)) {
      console.log('모든 값이 0인 솔루션이 반환되었습니다 (솔루션 없음)');
      return null;
    }
    
    return solutionArray;
  } catch (error) {
    console.error('스도쿠 풀기 중 오류 발생:', error);
    return null;
  }
}

/**
 * 스도쿠 퍼즐에 솔루션이 존재하는지 확인합니다.
 * @param grid 9x9 스도쿠 그리드 (0은 빈 셀, 1-9는 채워진 셀)
 * @returns 솔루션 존재 여부 (true/false)
 */
export async function hasSolution(grid: number[]): Promise<boolean> {
  console.log('hasSolution 호출됨 - 입력 검증 시작');
  if (grid.length !== 81) {
    throw new Error(`Invalid grid size. Expected 81 cells, got ${grid.length}.`);
  }
  
  try {
    console.log('initWasm 호출 시작');
    const wasm = await initWasm();
    console.log('initWasm 호출 완료, WASM 인스턴스 받음');
    
    const gridArray = new Uint8Array(grid);
    const result = wasm.has_solution(gridArray);
    console.log('has_solution 함수 호출 완료, 결과:', result);
    return result;
  } catch (error: any) {
    console.error('solubility 확인 중 오류 발생:', error);
    return false;
  }
}

/**
 * 데이터 유효성 검사를 위한 유틸리티 함수
 * 반환값에 유효성 여부와 오류 메세지가 포함됨
 */
function validateGridData(grid: any, isComplete = false): { isValid: boolean; message: string | null } {
  // 비어있는지 검사
  if (!grid) {
    return { isValid: false, message: '유효한 그리드가 없습니다.' };
  }
  
  // 배열 형식인지 검사
  if (!Array.isArray(grid)) {
    return { isValid: false, message: '그리드는 배열이어야 합니다.' };
  }
  
  // 길이 검사
  if (grid.length !== 81) {
    return { 
      isValid: false, 
      message: `그리드 크기가 잘못되었습니다. 81개 셀이 필요하지만 ${grid.length}개가 있습니다.` 
    };
  }
  
  // 값 검사
  if (!grid.every(val => Number.isInteger(val) && val >= 0 && val <= 9)) {
    return { 
      isValid: false, 
      message: '그리드에 유효하지 않은 값이 있습니다. 값은 0-9 사이의 정수여야 합니다.' 
    };
  }
  
  // 완성된 솔루션이어야 하는 경우 추가 검사
  if (isComplete && !grid.every(val => Number.isInteger(val) && val >= 1 && val <= 9)) {
    return { 
      isValid: false, 
      message: '완성된 퍼즐은 1-9 사이의 값만 포함해야 합니다. 빈 칸(0)이 있습니다.' 
    };
  }
  
  return { isValid: true, message: null };
}

/**
 * 스도쿠 퍼즐 또는 솔루션의 유효성을 검사합니다.
 * @param grid 9x9 스도쿠 그리드 (0은 빈 셀, 1-9는 채워진 셀)
 * @param checkComplete 완전히 채워진 솔루션인지 확인 (기본값: false)
 * @returns 유효성 결과 (true/false)
 */
export async function validateSudoku(grid: number[], checkComplete = false): Promise<boolean> {
  console.log('validateSudoku 호출됨 - 입력 검증 시작', grid?.length, checkComplete);
  
  // 특별히 JavaScript 레벨에서 입력 검사 - Wasm으로 잘못된 데이터가 전달되지 않도록 방지
  const { isValid, message } = validateGridData(grid, checkComplete);
  if (!isValid) {
    console.error(message);
    return false;
  }
  
  try {
    console.log('initWasm 호출 시작');
    const wasm = await initWasm();
    console.log('initWasm 호출 완료, WASM 인스턴스 받음');
    
    try {
      // 안전한 Uint8Array 생성 - 다시 한번 값 범위 확인
      const safeValues = grid.map(val => 
        Number.isInteger(val) && val >= 0 && val <= 9 ? val : 0
      );
      
      const gridArray = new Uint8Array(safeValues);
      if (gridArray.length !== 81) {
        console.error(`오류: 생성된 Uint8Array 길이가 81이 아님: ${gridArray.length}`);
        return false;
      }
      
      console.log('validate_sudoku 함수 호출 시작', gridArray.length);
      const result = wasm.validate_sudoku(gridArray, checkComplete);
      console.log('validate_sudoku 함수 호출 완료, 결과:', result);
      return result;
    } catch (error: any) {
      console.error('validate_sudoku 함수 호출 중 오류 발생:', error);
      console.error(`스도쿠 검증 실패: ${error?.message || String(error)}`);
      return false;
    }
  } catch (error: any) {
    console.error('WASM 초기화 중 오류 발생:', error);
    return false;
  }
}

/**
 * 지정된 난이도의 스도쿠 퍼즐을 생성합니다.
 * @param difficulty 난이도 (1: 쉬움, 2: 중간, 3: 어려움)
 * @returns 생성된 9x9 스도쿠 퍼즐 (0은 빈 셀, 1-9는 채워진 셀)
 */
export async function generateSudoku(difficulty = 2): Promise<number[]> {
  console.log('generateSudoku 호출됨 - 난이도:', difficulty);
  
  console.log('initWasm 호출 시작');
  const wasm = await initWasm();
  console.log('initWasm 호출 완료, WASM 인스턴스 받음');
  
  console.log('generate_sudoku 함수 호출 시작');
  try {
    const puzzle = wasm.generate_sudoku(difficulty);
    console.log('generate_sudoku 함수 호출 완료, 퍼즐 길이:', puzzle.length);
    return Array.from(puzzle) as number[];
  } catch (error: any) {
    console.error('generate_sudoku 함수 호출 중 오류 발생:', error);
    throw new Error(`스도쿠 생성 실패: ${error?.message || String(error)}`);
  }
}

/**
 * 스도쿠 유틸리티 함수들
 */
export const SudokuUtils = {
  /**
   * 문자열로 된 스도쿠 그리드를 숫자 배열로 변환
   * @param str 스도쿠 문자열 (81개 문자)
   */
  stringToGrid(str: string): number[] {
    const cleanStr = str.replace(/[^0-9.]/g, '');
    if (cleanStr.length !== 81) {
      throw new Error(`Invalid sudoku string length: ${cleanStr.length}`);
    }
    
    return Array.from(cleanStr).map(char => char === '.' ? 0 : parseInt(char, 10));
  },
  
  /**
   * JSON 문자열을 그리드 배열로 변환
   * @param json JSON 문자열
   */
  jsonToGrid(json: string): number[] {
    try {
      const data = JSON.parse(json);
      if (Array.isArray(data) && data.length === 81) {
        return data;
      } else if (data.puzzle && Array.isArray(data.puzzle) && data.puzzle.length === 81) {
        return data.puzzle;
      }
      throw new Error('Invalid JSON structure for sudoku grid');
    } catch (e) {
      throw new Error(`Failed to parse JSON: ${e}`);
    }
  }
};

/**
 * WebAssembly 모듈이 초기화되었는지 확인합니다.
 * @returns 초기화 상태 (true/false)
 */
export function isWasmReady(): boolean {
  return wasmModule !== null;
}

export default {
  initWasm,
  generateProof,
  verifyProof,
  solveSudoku,
  validateSudoku,
  generateSudoku,
  hasSolution,
  isWasmReady,
  SudokuUtils,
};