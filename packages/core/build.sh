#!/bin/bash

# 코어 패키지 빌드 스크립트
set -e  # 오류 발생 시 스크립트 중단

echo "ZK-Sudoku 코어 패키지 빌드 시작..."

# Rust 환경 확인
echo "Rust 환경 확인 중..."
rustc --version
cargo --version
wasm-pack --version

# Rust WASM 빌드
echo "Rust 코드를 WebAssembly로 컴파일 중..."
cd rust
wasm-pack build --target web --out-name zk_sudoku_core --release
cd ..

# 빌드 결과 확인
echo "WASM 빌드 결과 확인..."
ls -la rust/pkg/

# 디렉토리 생성
echo "디렉토리 준비 중..."
mkdir -p dist/pkg
cp -r rust/pkg/* dist/pkg/

# TypeScript 파일 컴파일
echo "TypeScript 파일 컴파일 중..."
tsc

# 웹 앱의 public 디렉토리에 wasm 파일 와 JS 파일 복사
echo "Next.js public 디렉토리로 wasm 파일 복사 중..."
mkdir -p ../../apps/web/public

# wasm 파일 복사
cp rust/pkg/zk_sudoku_core_bg.wasm ../../apps/web/public/

# 필요하다면 JS 파일도 복사
cp rust/pkg/zk_sudoku_core.js ../../apps/web/public/
cp rust/pkg/zk_sudoku_core_bg.js ../../apps/web/public/

echo "WASM 관련 파일들을 public 디렉토리로 복사 완료"

echo "ZK-Sudoku 코어 패키지 빌드 완료!"
