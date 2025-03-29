'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { 
  generateSudoku, 
  solveSudoku, 
  validateSudoku,
  isWasmReady
} from '@zk-sudoku/core';

export type GameStatus = 'idle' | 'loading' | 'playing' | 'paused' | 'complete' | 'error';

interface GameState {
  // 게임 상태
  grid: number[];
  originalGrid: number[];
  status: GameStatus;
  timer: number;
  difficulty: number;
  startTime: number | null;
  message: string | null;

  // 액션
  startNewGame: (difficulty: number) => void;
  restartGame: () => void;
  pauseGame: () => void;
  resumeGame: () => void;
  updateCell: (index: number, value: number) => void;
  resetGame: () => void;
  solveGame: () => Promise<number[] | null>; // 리턴 타입 변경
  checkSolution: () => Promise<boolean>;
  incrementTimer: () => void;
  setMessage: (message: string | null) => void;
}

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      // 초기 상태
      grid: Array(81).fill(0),
      originalGrid: Array(81).fill(0),
      status: 'idle',
      timer: 0,
      difficulty: 1,
      startTime: null,
      message: null,

      // 액션
      startNewGame: async (difficulty) => {
        // WASM이 준비되었는지 확인
        if (!isWasmReady()) {
          set({ 
            status: 'error', 
            message: 'WASM 모듈이 준비되지 않았습니다. 페이지를 새로고침해주세요.' 
          });
          return;
        }

        set({ status: 'loading', timer: 0, difficulty, message: null, startTime: Date.now() });
        
        try {
          // 지정된 난이도의 새 스도쿠 생성
          const newGrid = await generateSudoku(difficulty);
          set({ 
            originalGrid: [...newGrid], 
            grid: [...newGrid], 
            status: 'playing' 
          });
        } catch (error) {
          console.error('스도쿠 생성 중 오류 발생:', error);
          set({ 
            message: '스도쿠 생성 중 오류가 발생했습니다.', 
            status: 'error' 
          });
        }
      },

      restartGame: () => {
        const { originalGrid } = get();
        set({ 
          grid: [...originalGrid], 
          status: 'playing', 
          timer: 0, 
          message: null,
          startTime: Date.now() 
        });
      },

      pauseGame: () => {
        if (get().status === 'playing') {
          set({ status: 'paused' });
        }
      },

      resumeGame: () => {
        if (get().status === 'paused') {
          set({ status: 'playing', startTime: Date.now() });
        }
      },

      updateCell: (index, value) => {
        const { grid, originalGrid, status } = get();
        
        // 게임 중이 아니거나 원래 채워진 셀이면 업데이트 불가
        if (status !== 'playing' || originalGrid[index] !== 0) return;
        
        const newGrid = [...grid];
        newGrid[index] = value;
        set({ grid: newGrid });
        
        // 그리드가 모두 채워졌는지 확인
        if (!newGrid.includes(0)) {
          get().checkSolution();
        }
      },

      resetGame: () => {
        const { originalGrid } = get();
        set({ grid: [...originalGrid], message: null });
      },

      solveGame: async () => {
        const { originalGrid } = get();

        // WASM이 준비되었는지 확인
        if (!isWasmReady()) {
          set({ 
            message: 'WASM 모듈이 준비되지 않았습니다. 페이지를 새로고침해주세요.',
            status: 'error' 
          });
          return null;
        }
        
        set({ message: '솔루션 계산 중...', status: 'loading' });
        
        try {
          const solution = await solveSudoku(originalGrid);
          if (solution) {
            // 상태를 변경하여 솔루션 메시지를 표시하고 그리드를 업데이트
            set({ 
              grid: solution, 
              status: 'playing',
              message: '솔루션이 표시되었습니다. 이제 정답을 확인할 수 있습니다.' 
            });
            return solution;
          } else {
            set({ 
              message: '이 퍼즐에 대한 해결책을 찾을 수 없습니다.',
              status: 'playing'
            });
            return null;
          }
        } catch (error) {
          console.error('스도쿠 해결 중 오류 발생:', error);
          set({ 
            message: '솔루션 계산 중 오류가 발생했습니다.',
            status: 'error'
          });
          return null;
        }
      },

      checkSolution: async () => {
        const { grid } = get();

        // WASM이 준비되었는지 확인
        if (!isWasmReady()) {
          set({ 
            message: 'WASM 모듈이 준비되지 않았습니다. 페이지를 새로고침해주세요.',
            status: 'error'
          });
          return false;
        }
        
        set({ message: '솔루션 검증 중...' });
        
        try {
          const isValid = await validateSudoku(grid, true);
          
          if (isValid) {
            set({ 
              status: 'complete', 
              message: '축하합니다! 스도쿠를 성공적으로 완성했습니다!' 
            });
            return true;
          } else {
            set({ 
              message: '스도쿠 솔루션이 올바르지 않습니다. 다시 확인해보세요.' 
            });
            return false;
          }
        } catch (error) {
          console.error('솔루션 검증 중 오류 발생:', error);
          set({ 
            message: '솔루션 검증 중 오류가 발생했습니다.',
            status: 'error'
          });
          return false;
        }
      },

      incrementTimer: () => {
        const { status } = get();
        if (status === 'playing') {
          set((state) => ({ timer: state.timer + 1 }));
        }
      },

      setMessage: (message) => {
        set({ message });
      }
    }),
    {
      name: 'zk-sudoku-game',
      partialize: (state) => ({
        grid: state.grid,
        originalGrid: state.originalGrid,
        status: state.status,
        timer: state.timer,
        difficulty: state.difficulty
      })
    }
  )
);
