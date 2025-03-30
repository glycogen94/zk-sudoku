import { v4 as uuidv4 } from 'uuid';
import { SudokuShareData, SharedPuzzlesList } from './types';

/**
 * 로컬 스토리지에 공유된 퍼즐 목록을 저장합니다.
 * @param puzzles 공유된 퍼즐 목록
 */
export function saveSharedPuzzlesToLocalStorage(puzzles: SudokuShareData[]): void {
  try {
    const data: SharedPuzzlesList = {
      puzzles,
      lastUpdated: new Date().toISOString()
    };
    localStorage.setItem('zk-sudoku-shared-puzzles', JSON.stringify(data));
  } catch (error) {
    console.error('공유된 퍼즐 저장 중 오류 발생:', error);
  }
}

/**
 * 로컬 스토리지에서 공유된 퍼즐 목록을 불러옵니다.
 * @returns 공유된 퍼즐 목록 또는 빈 배열
 */
export function loadSharedPuzzlesFromLocalStorage(): SudokuShareData[] {
    try {
      const rawData = localStorage.getItem('zk-sudoku-shared-puzzles');
      if (!rawData) {
        return []; // 데이터가 없으면 빈 배열 반환
      }
  
      const data: SharedPuzzlesList = JSON.parse(rawData);
  
      // 데이터 구조 검증 (선택 사항이지만 권장)
      if (data && Array.isArray(data.puzzles)) {
        // 각 퍼즐 데이터의 유효성을 추가로 검사할 수도 있음
        return data.puzzles;
      } else {
        console.warn('로컬 스토리지의 공유 퍼즐 데이터 형식이 잘못되었습니다.');
        localStorage.removeItem('zk-sudoku-shared-puzzles'); // 잘못된 데이터 삭제
        return [];
      }
    } catch (error) {
      console.error('공유된 퍼즐 로딩 중 오류 발생:', error);
      return []; // 오류 발생 시 빈 배열 반환
    }
  }
  