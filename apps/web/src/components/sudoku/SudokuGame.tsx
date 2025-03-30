'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSudoku } from '@/lib/sudoku-service';
import SudokuGrid from './SudokuGrid';

interface SudokuGameProps {
  difficulty?: number;
  onSolve?: (solution: number[]) => void;
  className?: string;
}

const SudokuGame: React.FC<SudokuGameProps> = ({ 
  difficulty = 2,
  onSolve,
  className
}) => {
  // 스도쿠 퍼즐 상태
  const [puzzle, setPuzzle] = useState<number[]>([]);
  const [userInput, setUserInput] = useState<number[]>([]);
  const [originalPuzzle, setOriginalPuzzle] = useState<number[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [solved, setSolved] = useState<boolean>(false);
  
  // 스도쿠 서비스 훅
  const { generate, solve, validate } = useSudoku();
  
  // 새 게임 시작
  const startNewGame = useCallback(async () => {
    setLoading(true);
    setError(null);
    setSolved(false);
    
    try {
      const newPuzzle = await generate(difficulty);
      setPuzzle(newPuzzle);
      setOriginalPuzzle([...newPuzzle]);
      
      // 사용자 입력 초기화 (원래 퍼즐과 동일하게 시작)
      setUserInput([...newPuzzle]);
    } catch (err) {
      console.error('스도쿠 생성 오류:', err);
      setError('스도쿠 퍼즐을 생성하는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, [difficulty, generate]);
  
  // 컴포넌트 마운트 시 새 게임 시작
  useEffect(() => {
    startNewGame();
  }, [startNewGame]);
  
  // 셀 값 변경 핸들러
  const handleCellChange = (index: number, value: number) => {
    const newUserInput = [...userInput];
    newUserInput[index] = value;
    setUserInput(newUserInput);
    
    // 자동으로 완료 여부 확인
    checkCompletion(newUserInput);
  };
  
  // 완료 여부 확인
  const checkCompletion = async (grid: number[]) => {
    // 빈 셀이 있으면 완료되지 않음
    if (grid.includes(0)) return;
    
    try {
      const isValid = await validate(grid, true);
      if (isValid) {
        setSolved(true);
        if (onSolve) onSolve(grid);
      }
    } catch (err) {
      console.error('유효성 검사 오류:', err);
    }
  };
  
  // 힌트 보기
  const showHint = async () => {
    try {
      const solution = await solve(originalPuzzle);
      if (!solution) {
        setError('이 퍼즐에 대한 해결책을 찾을 수 없습니다.');
        return;
      }
      
      // 랜덤한 빈 셀에 힌트 제공
      const emptyCells: number[] = [];
      for (let i = 0; i < originalPuzzle.length; i++) {
        if (originalPuzzle[i] === 0 && userInput[i] === 0) {
          emptyCells.push(i);
        }
      }
      
      if (emptyCells.length === 0) return;
      
      // 랜덤한 빈 셀 선택
      const randomIndex = Math.floor(Math.random() * emptyCells.length);
      const cellIndex = emptyCells[randomIndex];
      
      // 힌트 적용
      const newUserInput = [...userInput];
      newUserInput[cellIndex] = solution[cellIndex];
      setUserInput(newUserInput);
      
      // 완료 여부 확인
      checkCompletion(newUserInput);
    } catch (err) {
      console.error('힌트 제공 오류:', err);
      setError('힌트를 제공하는 중 오류가 발생했습니다.');
    }
  };
  
  // 솔루션 보기
  const showSolution = async () => {
    try {
      const solution = await solve(originalPuzzle);
      if (!solution) {
        setError('이 퍼즐에 대한 해결책을 찾을 수 없습니다.');
        return;
      }
      
      setUserInput(solution);
      setSolved(true);
      if (onSolve) onSolve(solution);
    } catch (err) {
      console.error('솔루션 제공 오류:', err);
      setError('솔루션을 제공하는 중 오류가 발생했습니다.');
    }
  };
  
  // 로딩 중 표시
  if (loading) {
    return <div className="flex justify-center items-center h-60">로딩 중...</div>;
  }
  
  // 오류 표시
  if (error) {
    return (
      <div className="text-center">
        <p className="text-red-500 mb-4">{error}</p>
        <button 
          onClick={startNewGame}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          다시 시도
        </button>
      </div>
    );
  }
  
  return (
    <div className={`max-w-lg mx-auto p-4 ${className || ''}`}>
      <div className="mb-4 flex justify-between items-center">
        <h2 className="text-xl font-bold">스도쿠 게임</h2>
        {solved && <div className="text-green-500 font-bold">완료!</div>}
      </div>
      
      {/* 스도쿠 그리드 - 기존 SudokuGrid 컴포넌트 활용 */}
      <SudokuGrid 
        grid={userInput}
        onChange={handleCellChange}
        originalGrid={originalPuzzle}
        readOnly={solved}
      />
      
      {/* 버튼 영역 */}
      <div className="flex space-x-2 mt-4">
        <button
          onClick={startNewGame}
          className="flex-1 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
        >
          새 게임
        </button>
        <button
          onClick={showHint}
          className="flex-1 px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition"
          disabled={solved}
        >
          힌트
        </button>
        <button
          onClick={showSolution}
          className="flex-1 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition"
          disabled={solved}
        >
          풀이 보기
        </button>
      </div>
    </div>
  );
};

export default SudokuGame;