'use client';

import { ReactNode } from 'react';
import { WasmProvider } from './wasm-provider';

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <WasmProvider>
      {children}
    </WasmProvider>
  );
}
