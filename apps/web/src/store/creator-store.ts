import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { validateSudoku, generateProof, SudokuUtils } from '@zk-sudoku/core';

export type CreatorStatus = 'editing' | 'generating' | 'complete';

interface CreatorState {
  // 상태
  puzzleGrid: number[];
  solutionGrid: number[];
  proof: string;
  status: CreatorStatus;
  message: string | null;

  // 액션
  updatePuzzleCell: (index: number, value: number) => void;
  updateSolutionCell: (index: number, value: number) => void;
  clearGrids: () => void;
  validateGrids: () => Promise<boolean>;
  generateProof: () => Promise<void>;
  importSudoku: (puzzleStr: string, solutionStr?: string) => boolean;
  setMessage: (message: string | null) => void;
}

export const useCreatorStore = create<CreatorState>()(
  persist(
    (set, get) => ({
      // 초기 상태
      puzzleGrid: Array(81).fill(0),
      solutionGrid: Array(81).fill(0),
      proof: '',
      status: 'editing',
      message: null,

      // 액션
      updatePuzzleCell: (index, value) => {
        const { puzzleGrid, solutionGrid } = get();
        
        // 인덱스 유효성 검사
        if (index < 0 || index >= 81) {
          console.error(`유효하지 않은 인덱스: ${index}`);
          return;
        }
        
        // 값 유효성 검사
        if (value < 0 || value > 9) {
          console.error(`유효하지 않은 값: ${value}`);
          return;
        }
        
        const newPuzzleGrid = [...puzzleGrid];
        newPuzzleGrid[index] = value;
        set({ puzzleGrid: newPuzzleGrid });

        // 솔루션 그리드도 동일하게 업데이트 (퍼즐 값은 솔루션에 반영되어야 함)
        const newSolutionGrid = [...solutionGrid];
        newSolutionGrid[index] = value;
        set({ solutionGrid: newSolutionGrid });
      },

      updateSolutionCell: (index, value) => {
        const { puzzleGrid, solutionGrid } = get();
        
        // 인덱스 유효성 검사
        if (index < 0 || index >= 81) {
          console.error(`유효하지 않은 인덱스: ${index}`);
          return;
        }
        
        // 값 유효성 검사
        if (value < 0 || value > 9) {
          console.error(`유효하지 않은 값: ${value}`);
          return;
        }
        
        // 퍼즐에 이미 값이 있으면 솔루션에서 변경 불가
        if (puzzleGrid[index] !== 0) return;
        
        const newSolutionGrid = [...solutionGrid];
        newSolutionGrid[index] = value;
        set({ solutionGrid: newSolutionGrid });
      },

      clearGrids: () => {
        set({ 
          puzzleGrid: Array(81).fill(0),
          solutionGrid: Array(81).fill(0),
          proof: '',
          status: 'editing',
          message: null
        });
      },

      validateGrids: async () => {
        const { puzzleGrid, solutionGrid } = get();
        
        console.log('validateGrids: 그리드 검증 시작...', {
          puzzleLength: puzzleGrid?.length,
          solutionLength: solutionGrid?.length,
          puzzleType: typeof puzzleGrid,
          solutionType: typeof solutionGrid
        });
        
        // 감시(추적)하기 위해 값들 상세히 출력
        if (solutionGrid && solutionGrid.length > 0 && solutionGrid.length <= 10) {
          console.log('솔루션 그리드 데이터 감시 (10개까지):', solutionGrid);
        }
        
        // 이상한 배열 값 확인
        if (!puzzleGrid || !Array.isArray(puzzleGrid)) {
          set({ message: '퍼즐 그리드가 유효하지 않습니다. 배열이 필요합니다.' });
          return false;
        }
        
        if (puzzleGrid.length !== 81) {
          set({ message: `퍼즐 그리드 크기가 잘못되었습니다: ${puzzleGrid.length}. 81개 셀이 필요합니다.` });
          return false;
        }
        
        if (!solutionGrid || !Array.isArray(solutionGrid)) {
          set({ message: '솔루션 그리드가 유효하지 않습니다. 배열이 필요합니다.' });
          return false;
        }
        
        if (solutionGrid.length !== 81) {
          set({ message: `솔루션 그리드 크기가 잘못되었습니다: ${solutionGrid.length}. 81개 셀이 필요합니다.` });
          return false;
        }
        
        // 값 범위 검증
        if (!puzzleGrid.every(cell => Number.isInteger(cell) && cell >= 0 && cell <= 9)) {
          set({ message: '퍼즐에 유효하지 않은 값이 있습니다. 값은 0~9 사이의 정수여야 합니다.' });
          return false;
        }
        
        if (!solutionGrid.every(cell => Number.isInteger(cell) && cell >= 1 && cell <= 9)) {
          set({ message: '솔루션에 유효하지 않은 값이 있습니다. 값은 1~9 사이의 정수여야 합니다.' });
          return false;
        }
        
        // 기본 유효성 검사
        if (puzzleGrid.every(cell => cell === 0)) {
          set({ message: '퍼즐에 최소한 하나 이상의 숫자를 입력해야 합니다.' });
          return false;
        }

        if (solutionGrid.includes(0)) {
          set({ message: '솔루션 그리드를 완전히 채워야 합니다.' });
          return false;
        }

        // 퍼즐과 솔루션 일관성 검사
        for (let i = 0; i < 81; i++) {
          if (puzzleGrid[i] !== 0 && puzzleGrid[i] !== solutionGrid[i]) {
            set({ message: '퍼즐의 값과 솔루션의 값이 일치하지 않습니다.' });
            return false;
          }
        }

        // WebAssembly를 통한 스도쿠 규칙 검사
        try {
          console.log('스도쿠 검증 시작 - 솔루션 길이:', solutionGrid.length);
          
          // 데이터 복사를 통해 리퍼런스 문제 방지
          const solutionCopy = [...solutionGrid];
          
          // 솔루션이 올바른 스도쿠 규칙을 따르는지 검증
          const isValidSolution = await validateSudoku(solutionCopy, true);
          console.log('스도쿠 검증 결과:', isValidSolution);
          
          if (!isValidSolution) {
            set({ message: '솔루션이 스도쿠 규칙을 따르지 않습니다.' });
            return false;
          }
          return true;
        } catch (error) {
          console.error('솔루션 검증 중 오류 발생:', error);
          set({ message: `검증 중 오류가 발생했습니다: ${error}` });
          return false;
        }
      },

      generateProof: async () => {
        const { puzzleGrid, solutionGrid } = get();
        
        // 배열 유효성 검증 과정 추가 강화
        if (!puzzleGrid || !Array.isArray(puzzleGrid) || puzzleGrid.length !== 81) {
          set({ 
            status: 'editing',
            message: `퍼즐 그리드가 유효하지 않습니다. ${puzzleGrid?.length || 0}개 셀이 있지만 81개가 필요합니다.`
          });
          return;
        }
        
        if (!solutionGrid || !Array.isArray(solutionGrid) || solutionGrid.length !== 81) {
          set({ 
            status: 'editing',
            message: `솔루션 그리드가 유효하지 않습니다. ${solutionGrid?.length || 0}개 셀이 있지만 81개가 필요합니다.`
          });
          return;
        }
        
        const isValid = await get().validateGrids();
        if (!isValid) return;

        set({ status: 'generating', message: 'ZK-SNARK 증명을 생성하는 중입니다...' });

        try {
          console.log('증명 생성 시작 - 입력 크기:', puzzleGrid.length, solutionGrid.length);
          
          // 입력 값이 유효한 범위에 있는지 한 번 더 확인
          if (!puzzleGrid.every(val => Number.isInteger(val) && val >= 0 && val <= 9)) {
            throw new Error('퍼즐 그리드에 유효하지 않은 값이 있습니다.');
          }
          
          if (!solutionGrid.every(val => Number.isInteger(val) && val >= 1 && val <= 9)) {
            throw new Error('솔루션 그리드에 유효하지 않은 값이 있습니다.');
          }
          
          // ZK-SNARK 증명 생성
          const proofData = await generateProof(puzzleGrid, solutionGrid);
          
          console.log('증명 생성 성공:', proofData.substring(0, 50) + '...');
          
          // 웹 앱에서 사용할 수 있는 형식으로 증명 데이터 구조화
          const proofObject = {
            puzzle: puzzleGrid,
            proof: proofData,
            timestamp: new Date().toISOString(),
          };
          
          set({ 
            proof: JSON.stringify(proofObject, null, 2),
            status: 'complete',
            message: '증명이 성공적으로 생성되었습니다!'
          });
        } catch (error) {
          console.error('증명 생성 중 오류 발생:', error);
          set({ 
            status: 'editing',
            message: `증명 생성 중 오류가 발생했습니다: ${error}`
          });
        }
      },

      importSudoku: (puzzleStr, solutionStr) => {
        try {
          // 퍼즐 문자열을 그리드로 변환
          let puzzleGrid: number[];
          if (puzzleStr.trim().startsWith('[')) {
            // JSON 형식
            puzzleGrid = SudokuUtils.jsonToGrid(puzzleStr);
          } else {
            // 일반 텍스트 형식
            puzzleGrid = SudokuUtils.stringToGrid(puzzleStr);
          }
          
          // 배열 길이 검증
          if (puzzleGrid.length !== 81) {
            set({ message: `가져온 퍼즐 그리드 크기가 잘못되었습니다. 81개 셀이 필요하지만 ${puzzleGrid.length}개가 있습니다.` });
            return false;
          }
          
          // 솔루션 문자열이 제공된 경우 변환
          let solutionGrid: number[];
          if (solutionStr) {
            if (solutionStr.trim().startsWith('[')) {
              solutionGrid = SudokuUtils.jsonToGrid(solutionStr);
            } else {
              solutionGrid = SudokuUtils.stringToGrid(solutionStr);
            }
            
            // 배열 길이 검증
            if (solutionGrid.length !== 81) {
              set({ message: `가져온 솔루션 그리드 크기가 잘못되었습니다. 81개 셀이 필요하지만 ${solutionGrid.length}개가 있습니다.` });
              return false;
            }
          } else {
            // 솔루션이 제공되지 않은 경우 퍼즐을 복사하고 빈 셀은 0으로 유지
            solutionGrid = [...puzzleGrid];
          }
          
          set({ 
            puzzleGrid, 
            solutionGrid,
            proof: '',
            status: 'editing',
            message: '스도쿠를 성공적으로 가져왔습니다.'
          });
          
          return true;
        } catch (error) {
          console.error('스도쿠 가져오기 중 오류 발생:', error);
          set({ message: `스도쿠 데이터 가져오기에 실패했습니다: ${error}` });
          return false;
        }
      },

      setMessage: (message) => {
        set({ message });
      }
    }),
    {
      name: 'zk-sudoku-creator',
      partialize: (state) => ({
        puzzleGrid: state.puzzleGrid,
        solutionGrid: state.solutionGrid
      })
    }
  )
);
