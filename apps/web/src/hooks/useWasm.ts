'use client';

import { useState, useEffect } from 'react';
import { initWasm } from '@zk-sudoku/core';

// 로컬에서 사용할 WASM 모듈 타입 정의
type ZkSudokuWasm = any; // 타입 수정: 구체적인 타입 대신 any 사용

type WasmState = {
  module: ZkSudokuWasm | null;
  loading: boolean;
  error: Error | null;
};

/**
 * WASM 모듈을 로드하기 위한 React 훅
 * @returns WASM 모듈, 로딩 상태, 에러 상태를 포함하는 객체
 */
export function useWasm(): WasmState {
  const [state, setState] = useState<WasmState>({
    module: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let isMounted = true;

    async function loadWasm() {
      try {
        const wasmModule = await initWasm();
        
        if (isMounted) {
          setState({
            module: wasmModule,
            loading: false,
            error: null,
          });
        }
      } catch (error) {
        console.error('WASM 모듈 로드 오류:', error);
        
        if (isMounted) {
          setState({
            module: null,
            loading: false,
            error: error instanceof Error ? error : new Error(String(error)),
          });
        }
      }
    }

    loadWasm();

    return () => {
      isMounted = false;
    };
  }, []);

  return state;
}
