import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// 클래스 이름을 병합하는 유틸리티 함수
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
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
