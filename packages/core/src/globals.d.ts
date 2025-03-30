// WebAssembly 모듈 타입 선언
declare module './zk_sudoku_core.js' {
  export default function(): Promise<{
    setup(): string;
    init_keys(pk_bytes: Uint8Array, vk_bytes: Uint8Array): void;
    prove(puzzle: Uint8Array, solution: Uint8Array): string;
    verify(puzzle: Uint8Array, proof: string): boolean;
    solve_sudoku(grid: Uint8Array): Uint8Array;
    validate_sudoku(grid: Uint8Array, check_complete: boolean): boolean;
    generate_sudoku(difficulty: number): Uint8Array;
    memory: WebAssembly.Memory;
  }>;
}

declare module '../rust/pkg/zk_sudoku_core' {
  export default function(wasm_binary: ArrayBuffer): Promise<{
    setup(): string;
    init_keys(pk_bytes: Uint8Array, vk_bytes: Uint8Array): void;
    prove(puzzle: Uint8Array, solution: Uint8Array): string;
    verify(puzzle: Uint8Array, proof: string): boolean;
    solve_sudoku(grid: Uint8Array): Uint8Array;
    validate_sudoku(grid: Uint8Array, check_complete: boolean): boolean;
    generate_sudoku(difficulty: number): Uint8Array;
    memory: WebAssembly.Memory;
  }>;
}
