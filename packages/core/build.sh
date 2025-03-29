#!/bin/bash

# 코어 패키지 빌드 스크립트

echo "ZK-Games 코어 패키지 빌드 시작..."

# Rust WASM 빌드
echo "Rust 코드를 WebAssembly로 컴파일 중..."
cd rust
wasm-pack build --target web
cd ..

# TypeScript 빌드
echo "TypeScript 코드 컴파일 중..."
# WASM 모듈을 src 디렉토리로 복사
mkdir -p src/generated
cp -r rust/pkg/* src/generated/
# WASM 모듈 이름 변경 (zk_sudoku_core로 통일)
mv src/generated/zk_sudoku_core_bg.wasm src/generated/zk_sudoku_core.wasm
mv src/generated/zk_sudoku_core.js src/generated/zk_sudoku_core.js

# TypeScript 컴파일
npx tsc

# 빌드 결과 디렉토리 생성 및 파일 복사
mkdir -p dist
cp -r src/generated/*.wasm dist/
cp -r src/generated/*.js dist/

echo "ZK-Games 코어 패키지 빌드 완료!"
