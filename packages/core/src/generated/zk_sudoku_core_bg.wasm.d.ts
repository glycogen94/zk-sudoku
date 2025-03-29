/* tslint:disable */
/* eslint-disable */
export const memory: WebAssembly.Memory;
export const setup: () => [number, number, number, number];
export const prove: (a: number, b: number, c: number, d: number) => [number, number, number, number];
export const verify: (a: number, b: number, c: number, d: number) => [number, number, number];
export const solve_sudoku: (a: number, b: number) => [number, number, number];
export const validate_sudoku: (a: number, b: number, c: number) => number;
export const generate_sudoku: (a: number) => any;
export const start: () => void;
export const __wbindgen_free: (a: number, b: number, c: number) => void;
export const __wbindgen_malloc: (a: number, b: number) => number;
export const __wbindgen_realloc: (a: number, b: number, c: number, d: number) => number;
export const __wbindgen_export_3: WebAssembly.Table;
export const __externref_table_dealloc: (a: number) => void;
export const __wbindgen_start: () => void;
