// WASM 래퍼 모듈에서 모든 함수를 가져옵니다.
import {
    initWasm as wasmInitWasm, // 이름 충돌 방지를 위해 alias 사용 가능
    generateProof as wasmGenerateProof,
    verifyProof as wasmVerifyProof,
    solveSudoku as wasmSolveSudoku,
    validateSudoku as wasmValidateSudoku,
    generateSudoku as wasmGenerateSudoku,
    hasSolution as wasmHasSolution, // 추가 (필요시)
    isWasmReady as wasmIsWasmReady,
    SudokuUtils as WasmSudokuUtils // SudokuUtils는 아래에서 재정의하므로 alias 사용
  } from './wasm-wrapper';
  
/**
 * 유틸리티 함수들
 */
export const SudokuUtils = {
  // wasm-wrapper의 SudokuUtils 함수들 임포트
  ...WasmSudokuUtils,
  
  /**
   * 스도쿠 그리드를 문자열로 변환합니다.
   * @param grid 9x9 스도쿠 그리드 (0은 빈 셀, 1-9는 채워진 셀)
   * @returns 문자열 표현 (각 행은 줄바꿈으로 구분)
   */
  gridToString(grid: number[]): string {
    let result = '';
    for (let i = 0; i < 9; i++) {
      for (let j = 0; j < 9; j++) {
        const value = grid[i * 9 + j];
        result += value === 0 ? '.' : value.toString();
      }
      if (i < 8) result += '\n';
    }
    return result;
  },

  /**
   * 문자열을 스도쿠 그리드로 변환합니다.
   * @param str 스도쿠 문자열 표현 (각 행은 줄바꿈으로 구분, 빈 셀은 ., 0, 또는 공백)
   * @returns 9x9 스도쿠 그리드 (0은 빈 셀, 1-9는 채워진 셀)
   */
  stringToGrid(str: string): number[] {
    const grid = new Array(81).fill(0);
    const rows = str.trim().split(/\n|\r\n/);
    
    for (let i = 0; i < Math.min(rows.length, 9); i++) {
      const row = rows[i].trim();
      for (let j = 0; j < Math.min(row.length, 9); j++) {
        const char = row[j];
        if (char >= '1' && char <= '9') {
          grid[i * 9 + j] = parseInt(char, 10);
        }
      }
    }
    
    return grid;
  },

  /**
   * 빈 스도쿠 그리드를 생성합니다.
   * @returns 0으로 채워진 81칸의 배열
   */
  createEmptyGrid(): number[] {
    return new Array(81).fill(0);
  },

  /**
   * 스도쿠 그리드가 규칙을 만족하는지 확인합니다. (클라이언트 사이드)
   * @param grid 스도쿠 그리드
   * @returns 유효성 여부 (boolean)
   */
  isValidSudoku(grid: number[]): boolean {
    // 행 검사
    for (let row = 0; row < 9; row++) {
      const seen = new Set<number>();
      for (let col = 0; col < 9; col++) {
        const value = grid[row * 9 + col];
        if (value !== 0) {
          if (seen.has(value)) return false;
          seen.add(value);
        }
      }
    }

    // 열 검사
    for (let col = 0; col < 9; col++) {
      const seen = new Set<number>();
      for (let row = 0; row < 9; row++) {
        const value = grid[row * 9 + col];
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
        for (let row = 0; row < 3; row++) {
          for (let col = 0; col < 3; col++) {
            const value = grid[(boxRow * 3 + row) * 9 + (boxCol * 3 + col)];
            if (value !== 0) {
              if (seen.has(value)) return false;
              seen.add(value);
            }
          }
        }
      }
    }

    return true;
  },

  /**
   * JSON 문자열을 스도쿠 그리드로 변환합니다.
   * @param jsonStr 스도쿠 그리드를 표현하는 JSON 문자열
   * @returns 9x9 스도쿠 그리드 (0은 빈 셀, 1-9는 채워진 셀)
   */
  jsonToGrid(jsonStr: string): number[] {
    try {
      const parsed = JSON.parse(jsonStr);
      if (Array.isArray(parsed)) {
        // 1차원 배열인 경우
        if (parsed.length === 81 && parsed.every(num => typeof num === 'number')) {
          return parsed;
        }
        // 2차원 배열인 경우
        else if (parsed.length === 9 && parsed.every(row => Array.isArray(row) && row.length === 9)) {
          const flatGrid: number[] = [];
          for (const row of parsed as any[][]) {
            for (const cell of row) {
              flatGrid.push(typeof cell === 'number' ? cell : 0);
            }
          }
          return flatGrid;
        }
      }
      
      // 유효한 형식이 아닌 경우 빈 그리드 반환
      console.error('유효하지 않은 JSON 형식입니다.');
      return this.createEmptyGrid();
    } catch (error) {
      console.error('JSON 파싱 중 오류 발생:', error);
      return this.createEmptyGrid();
    }
  }
};

// 사용하기 쉽도록 모든 함수를 내보냅니다.
export const initWasm = wasmInitWasm;
export const generateProof = wasmGenerateProof;
export const verifyProof = wasmVerifyProof;
export const solveSudoku = wasmSolveSudoku;
export const validateSudoku = wasmValidateSudoku;
export const generateSudoku = wasmGenerateSudoku;
export const hasSolution = wasmHasSolution; // 필요하다면 추가
export const isWasmReady = wasmIsWasmReady;

// 편의성을 위한 기본 내보내기
export default {
  initWasm,
  generateProof,
  verifyProof,
  solveSudoku,
  validateSudoku,
  generateSudoku,
  isWasmReady,
};
