# ZK-Sudoku

ZK-Sudoku는 Zero-Knowledge Proof (영지식 증명) 기술을 활용한 스도쿠 웹 애플리케이션입니다. 사용자는 스도쿠 퍼즐을 풀거나 만들고, ZK-SNARK 증명을 통해 정답 공개 없이 검증할 수 있습니다.

## 기능

- **스도쿠 게임 플레이**: 다양한 난이도의 스도쿠 퍼즐을 웹에서 즐길 수 있습니다.
- **스도쿠 생성**: 나만의 스도쿠 퍼즐을 만들고 ZK-SNARK 증명과 함께 공유할 수 있습니다.
- **증명 검증**: 다른 사용자가 만든 스도쿠 퍼즐과 증명을 실시간으로 검증할 수 있습니다.
- **백엔드 없는 구조**: 모든 연산은 클라이언트 측에서 WebAssembly를 통해 처리됩니다.

## 기술 스택

- **프론트엔드**: React, Next.js, TypeScript, TailwindCSS, Shadcn UI
- **ZK-SNARK**: Rust의 arkworks 라이브러리
- **WebAssembly**: Rust 코드를 브라우저에서 실행
- **상태 관리**: Zustand
- **모노레포**: Turborepo

## 프로젝트 구조

```
zk-sudoku-monorepo/
├── apps/
│   └── web/           # Next.js 웹 애플리케이션
│       ├── src/
│       │   ├── app/       # Next.js 앱 라우터
│       │   ├── components/ # React 컴포넌트
│       │   ├── lib/       # 유틸리티 함수
│       │   └── store/     # Zustand 스토어
├── packages/
│   ├── core/          # ZK-SNARK 코어 라이브러리
│   │   ├── rust/      # Rust 구현체
│   │   └── src/       # TypeScript 래퍼
│   └── ui/            # 공통 UI 컴포넌트
└── turbo.json         # Turborepo 설정
```

## 시작하기

### 사전 요구사항

- Node.js 18.x 이상
- Rust와 Cargo
- wasm-pack

### 설치 및 개발 환경 실행

```bash
# 저장소 클론
git clone https://github.com/glycogen94/zk-sudoku.git
cd zk-sudoku

# 의존성 설치
yarn install

# Rust 코어 라이브러리 빌드
cd packages/core
wasm-pack build --target web ./rust
cd ../..

# 개발 서버 실행
yarn dev
```

## 개발자 정보

- 개발자: [@glycogen94](https://github.com/glycogen94)

## 라이센스

MIT License
