'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import SudokuGrid from '@/components/sudoku/SudokuGrid';
import { formatTime } from '@/lib/utils';
import { useGameStore } from '@/store';

export default function PlayPage() {
  const { 
    grid, 
    originalGrid, 
    status, 
    timer, 
    difficulty, 
    message,
    startNewGame, 
    updateCell, 
    resetGame, 
    checkSolution, 
    solveGame,
    incrementTimer,
    setMessage
  } = useGameStore();

  // 타이머 관리
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (status === 'playing') {
      interval = setInterval(() => {
        incrementTimer();
      }, 1000);
    }
    
    return () => clearInterval(interval);
  }, [status, incrementTimer]);

  return (
    <div className="container mx-auto py-6 px-4">
      <Card>
        <CardHeader>
          <CardTitle>스도쿠 게임</CardTitle>
          <CardDescription>다양한 난이도의 스도쿠 퍼즐을 즐겨보세요.</CardDescription>
        </CardHeader>
        <CardContent>
          {status === 'idle' ? (
            <div className="mx-auto max-w-lg">
              <h2 className="text-xl font-semibold mb-4">난이도 선택</h2>
              <div className="flex flex-col gap-4">
                <Button onClick={() => startNewGame(1)} size="lg" className="w-full">쉬움</Button>
                <Button onClick={() => startNewGame(2)} size="lg" className="w-full">중간</Button>
                <Button onClick={() => startNewGame(3)} size="lg" className="w-full">어려움</Button>
              </div>
            </div>
          ) : (
            <div className="max-w-2xl mx-auto">
              <div className="flex justify-between items-center mb-4">
                <div className="text-lg font-medium">
                  난이도: {difficulty === 1 ? '쉬움' : difficulty === 2 ? '중간' : '어려움'}
                </div>
                <div className="text-lg font-mono">
                  시간: {formatTime(timer)}
                </div>
              </div>
              
              <SudokuGrid 
                grid={grid} 
                onChange={updateCell} 
                originalGrid={originalGrid}
                readOnly={status === 'complete'}
              />
              
              <div className="flex flex-wrap gap-2 mt-6 justify-center">
                <Button onClick={resetGame} variant="outline">리셋</Button>
                <Button onClick={() => checkSolution()}>확인</Button>
                <Button onClick={() => solveGame()} variant="secondary">솔루션 보기</Button>
                <Button onClick={() => useGameStore.setState({ status: 'idle' })} variant="ghost">새 게임</Button>
              </div>
              
              {message && (
                <div className={`mt-6 p-4 rounded-md ${
                  message.includes('축하') ? 'bg-green-50 text-green-800 border border-green-200' : 
                  message.includes('오류') ? 'bg-red-50 text-red-800 border border-red-200' : 
                  'bg-blue-50 text-blue-800 border border-blue-200'
                }`}>
                  {message}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
