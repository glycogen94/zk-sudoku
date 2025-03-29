import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// 숫자를 포맷팅하는 함수
export function formatNumber(num: number, options?: Intl.NumberFormatOptions) {
  return new Intl.NumberFormat("ko-KR", options).format(num);
}

// 시간을 포맷팅하는 함수
export function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

// 데이터를 다운로드하는 함수
export function downloadData(data: string, filename: string, type = "text/plain") {
  const blob = new Blob([data], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// 클립보드에 복사하는 함수
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error("클립보드 복사 실패:", err);
    return false;
  }
}

// 로컬 스토리지에 저장하는 함수
export function saveToLocalStorage(key: string, data: any): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch (err) {
    console.error("로컬 스토리지 저장 실패:", err);
    return false;
  }
}

// 로컬 스토리지에서 불러오는 함수
export function loadFromLocalStorage<T>(key: string, defaultValue: T): T {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultValue;
  } catch (err) {
    console.error("로컬 스토리지 로드 실패:", err);
    return defaultValue;
  }
}

// 배열 섞기 함수 (Fisher-Yates 알고리즘)
export function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

// 스도쿠 그리드 생성 함수
export function createEmptyGrid(): number[] {
  return Array(81).fill(0);
}

// 스도쿠 퍼즐 유효성 검사 함수
export function isValidSudoku(grid: number[]): boolean {
  // 각 행 검사
  for (let row = 0; row < 9; row++) {
    const seen = new Set<number>();
    for (let col = 0; col < 9; col++) {
      const value = grid[row * 9 + col];
      if (value !== 0) {
        if (seen.has(value)) return false;
        seen.add(value);
      }
    }
  }

  // 각 열 검사
  for (let col = 0; col < 9; col++) {
    const seen = new Set<number>();
    for (let row = 0; row < 9; row++) {
      const value = grid[row * 9 + col];
      if (value !== 0) {
        if (seen.has(value)) return false;
        seen.add(value);
      }
    }
  }

  // 각 3x3 박스 검사
  for (let boxRow = 0; boxRow < 3; boxRow++) {
    for (let boxCol = 0; boxCol < 3; boxCol++) {
      const seen = new Set<number>();
      for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 3; col++) {
          const value = grid[(boxRow * 3 + row) * 9 + (boxCol * 3 + col)];
          if (value !== 0) {
            if (seen.has(value)) return false;
            seen.add(value);
          }
        }
      }
    }
  }

  return true;
}
