/**
 * 스도쿠 퍼즐/증명 공유 데이터 모델
 */
export interface SudokuShareData {
  // 필수 필드
  id: string;             // 고유 식별자 (UUID)
  puzzle: number[];       // 스도쿠 퍼즐 배열 (81개 숫자)
  proof: string;          // ZK-SNARK 증명 문자열 (Base64 인코딩)
  timestamp: string;      // 생성/배포 시각 (ISO 8601 형식)
  
  // 선택적 필드
  creatorInfo?: string;   // 생성자 정보 (닉네임 등)
  difficulty?: number;    // 난이도 (1: 쉬움, 2: 중간, 3: 어려움)
  title?: string;         // 퍼즐 제목
  description?: string;   // 퍼즐 설명
}

/**
 * 공유 방식 옵션
 */
export type ShareMethod = 'url' | 'local' | 'server';

/**
 * 게임 난이도
 */
export enum GameDifficulty {
  Easy = 1,
  Medium = 2,
  Hard = 3
}

/**
 * 로컬 스토리지에 저장할 공유 퍼즐 목록 타입
 */
export interface SharedPuzzlesList {
  puzzles: SudokuShareData[];
  lastUpdated: string;
}
