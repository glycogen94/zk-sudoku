/* tslint:disable */
/* eslint-disable */
export function start(): void;
/**
 * ZK-SNARK 파라미터 설정
 */
export function setup(): string;
/**
 * 증명 생성
 */
export function prove(puzzle_data: Uint8Array, solution_data: Uint8Array): string;
/**
 * 증명 검증
 */
export function verify(puzzle_data: Uint8Array, proof_str: string): boolean;
/**
 * 스도쿠 퍼즐 풀기
 */
export function solve_sudoku(grid_data: Uint8Array): Uint8Array;
/**
 * 스도쿠 유효성 검사
 */
export function validate_sudoku(grid_data: Uint8Array, check_complete: boolean): boolean;
/**
 * 스도쿠 퍼즐 생성
 */
export function generate_sudoku(difficulty: number): Uint8Array;

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
  readonly memory: WebAssembly.Memory;
  readonly setup: () => [number, number, number, number];
  readonly prove: (a: number, b: number, c: number, d: number) => [number, number, number, number];
  readonly verify: (a: number, b: number, c: number, d: number) => [number, number, number];
  readonly solve_sudoku: (a: number, b: number) => [number, number, number];
  readonly validate_sudoku: (a: number, b: number, c: number) => number;
  readonly generate_sudoku: (a: number) => any;
  readonly start: () => void;
  readonly __wbindgen_free: (a: number, b: number, c: number) => void;
  readonly __wbindgen_malloc: (a: number, b: number) => number;
  readonly __wbindgen_realloc: (a: number, b: number, c: number, d: number) => number;
  readonly __wbindgen_export_3: WebAssembly.Table;
  readonly __externref_table_dealloc: (a: number) => void;
  readonly __wbindgen_start: () => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;
/**
* Instantiates the given `module`, which can either be bytes or
* a precompiled `WebAssembly.Module`.
*
* @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
*
* @returns {InitOutput}
*/
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
* If `module_or_path` is {RequestInfo} or {URL}, makes a request and
* for everything else, calls `WebAssembly.instantiate` directly.
*
* @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
*
* @returns {Promise<InitOutput>}
*/
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
