import { create } from 'zustand';
import { verifyProof, SudokuUtils } from '@zk-sudoku/core';

interface VerifierState {
  // 상태
  puzzleGrid: number[];
  proofText: string;
  isVerifying: boolean;
  verificationResult: {
    success: boolean;
    message: string;
  } | null;

  // 액션
  setPuzzleGrid: (grid: number[]) => void;
  setProofText: (text: string) => void;
  parsePuzzleFromProof: () => boolean;
  verifyProof: () => Promise<void>;
  reset: () => void;
}

export const useVerifierStore = create<VerifierState>()((set, get) => ({
  // 초기 상태
  puzzleGrid: Array(81).fill(0),
  proofText: '',
  isVerifying: false,
  verificationResult: null,

  // 액션
  setPuzzleGrid: (grid) => {
    set({ puzzleGrid: grid });
  },

  setProofText: (text) => {
    set({ proofText: text, verificationResult: null });
  },

  parsePuzzleFromProof: () => {
    try {
      // 사용자가 입력한 텍스트에서 퍼즐 데이터 파싱 시도
      const data = JSON.parse(get().proofText);
      
      if (data.puzzle && Array.isArray(data.puzzle) && data.puzzle.length === 81) {
        set({ puzzleGrid: data.puzzle });
        return true;
      } else {
        set({
          verificationResult: {
            success: false,
            message: '유효한 퍼즐 데이터가 없습니다. 올바른 JSON 형식인지 확인하세요.'
          }
        });
        return false;
      }
    } catch (error) {
      set({
        verificationResult: {
          success: false,
          message: '증명 데이터를 파싱할 수 없습니다. 올바른 JSON 형식인지 확인하세요.'
        }
      });
      return false;
    }
  },

  verifyProof: async () => {
    // 입력된 증명 텍스트 확인
    if (!get().proofText.trim()) {
      set({
        verificationResult: {
          success: false,
          message: '증명 데이터를 입력해주세요.'
        }
      });
      return;
    }

    set({ isVerifying: true });
    
    try {
      // 퍼즐 파싱
      const validPuzzle = get().parsePuzzleFromProof();
      if (!validPuzzle) {
        set({ isVerifying: false });
        return;
      }

      // JSON에서 증명 데이터 추출
      const data = JSON.parse(get().proofText);
      if (!data.proof) {
        set({
          isVerifying: false,
          verificationResult: {
            success: false,
            message: '증명 데이터에 필요한 "proof" 필드가 없습니다.'
          }
        });
        return;
      }

      // ZK-SNARK 증명 검증
      const result = await verifyProof(get().puzzleGrid, data.proof);
      
      if (result) {
        set({
          verificationResult: {
            success: true,
            message: '증명이 성공적으로 검증되었습니다! 이 퍼즐에 대한 유효한 솔루션이 존재합니다.'
          }
        });
      } else {
        set({
          verificationResult: {
            success: false,
            message: '증명이 유효하지 않습니다. 퍼즐과 증명 데이터가 일치하지 않거나 변조되었을 수 있습니다.'
          }
        });
      }
    } catch (error) {
      set({
        verificationResult: {
          success: false,
          message: `증명 검증 중 오류가 발생했습니다: ${error}`
        }
      });
    } finally {
      set({ isVerifying: false });
    }
  },

  reset: () => {
    set({
      puzzleGrid: Array(81).fill(0),
      proofText: '',
      verificationResult: null
    });
  }
}));
