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
          const isValidSolution = await validateSudoku(solutionGrid, true);
          if (!isValidSolution) {
            set({ message: '솔루션이 스도쿠 규칙을 따르지 않습니다.' });
            return false;
          }
          return true;
        } catch (error) {
          console.error('솔루션 검증 중 오류 발생:', error);
          set({ message: '검증 중 오류가 발생했습니다.' });
          return false;
        }
      },

      generateProof: async () => {
        const isValid = await get().validateGrids();
        if (!isValid) return;

        set({ status: 'generating', message: 'ZK-SNARK 증명을 생성하는 중입니다...' });

        try {
          // ZK-SNARK 증명 생성
          const proofData = await generateProof(get().puzzleGrid, get().solutionGrid);
          
          // 웹 앱에서 사용할 수 있는 형식으로 증명 데이터 구조화
          const proofObject = {
            puzzle: get().puzzleGrid,
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
          
          // 솔루션 문자열이 제공된 경우 변환
          let solutionGrid: number[];
          if (solutionStr) {
            if (solutionStr.trim().startsWith('[')) {
              solutionGrid = SudokuUtils.jsonToGrid(solutionStr);
            } else {
              solutionGrid = SudokuUtils.stringToGrid(solutionStr);
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
          set({ message: '스도쿠 데이터 가져오기에 실패했습니다.' });
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
