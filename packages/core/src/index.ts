import * as WasmModule from './wasm-wrapper';
export * from './wasm-wrapper';

// 스도쿠 유틸리티 함수들
export const SudokuUtils = {
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
   * 스도쿠 그리드를 JSON 문자열로 변환합니다.
   * @param grid 9x9 스도쿠 그리드 (0은 빈 셀, 1-9는 채워진 셀)
   * @returns JSON 문자열
   */
  gridToJson(grid: number[]): string {
    return JSON.stringify(grid);
  },

  /**
   * JSON 문자열을 스도쿠 그리드로 변환합니다.
   * @param json JSON 문자열
   * @returns 9x9 스도쿠 그리드 (0은 빈 셀, 1-9는 채워진 셀)
   */
  jsonToGrid(json: string): number[] {
    try {
      const parsed = JSON.parse(json);
      if (Array.isArray(parsed) && parsed.length === 81) {
        return parsed.map(val => (typeof val === 'number' && val >= 0 && val <= 9) ? val : 0);
      }
      throw new Error('유효한 스도쿠 그리드 JSON이 아닙니다.');
    } catch (error) {
      console.error('JSON 파싱 오류:', error);
      return new Array(81).fill(0);
    }
  },

  /**
   * 빈 스도쿠 그리드를 생성합니다.
   * @returns 0으로 채워진 81칸의 배열
   */
  createEmptyGrid(): number[] {
    return new Array(81).fill(0);
  },

  /**
   * 스도쿠 그리드가 규칙을 만족하는지 확인합니다.
   * 참고: 이 함수는 기본적인 검사만 수행하며, 완전한 검증은 WebAssembly 모듈의 validateSudoku 함수를 사용하세요.
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
  }
};

// 모든 기능을 기본 내보내기로 묶기
export default {
  ...WasmModule,
  SudokuUtils
};
