'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { initWasm, isWasmReady } from '@zk-sudoku/core';

type WasmContextType = {
  isLoaded: boolean;
  isLoading: boolean;
  error: Error | null;
  reload: () => Promise<void>;
};

const WasmContext = createContext<WasmContextType>({
  isLoaded: false,
  isLoading: true,
  error: null,
  reload: async () => {},
});

export const useWasmContext = () => useContext(WasmContext);

export function WasmProvider({ children }: { children: ReactNode }) {
const [state, setState] = useState<{
isLoaded: boolean;
isLoading: boolean;
error: Error | null;
}>({    
// 기본은 모듈 초기화 시작으로 설정
isLoaded: false, 
isLoading: true,
  error: null,
  });

const loadWasm = async () => {
    if (state.isLoaded) return;
setState({ isLoaded: false, isLoading: true, error: null });

try {
console.log('웹어셈블리 파일 로드 시도...');
await initWasm();
console.log('WASM 로드 성공!');
setState({ isLoaded: true, isLoading: false, error: null });
} catch (err) {
console.error('WASM 로드 오류:', err);
  setState({
  isLoaded: false,
  isLoading: false,
error: err instanceof Error ? err : new Error(String(err)),
});
}
};

  useEffect(() => {
    // 클라이언트 사이드에서만 WASM을 로드
    if (typeof window !== 'undefined') {
      loadWasm();
    }
  }, []);

  const contextValue: WasmContextType = {
    ...state,
    reload: loadWasm,
  };

  // WASM 로딩 상태에 따른 UI 처리
  if (state.isLoading) {
    return (
      <WasmContext.Provider value={contextValue}>
        <div className="flex justify-center items-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p>WASM 모듈 로딩 중...</p>
          </div>
        </div>
      </WasmContext.Provider>
    );
  }

  if (state.error) {
    return (
      <WasmContext.Provider value={contextValue}>
        <div className="flex justify-center items-center h-screen">
          <div className="text-center p-6 max-w-md">
            <div className="text-red-500 text-5xl mb-4">⚠️</div>
            <h2 className="text-xl font-bold mb-4">WASM 로드 실패</h2>
            <p className="mb-4 text-muted-foreground">
              {state.error.message}
            </p>
            <button 
              onClick={loadWasm}
              className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
            >
              다시 시도
            </button>
          </div>
        </div>
      </WasmContext.Provider>
    );
  }

  return (
    <WasmContext.Provider value={contextValue}>
      {children}
    </WasmContext.Provider>
  );
}
