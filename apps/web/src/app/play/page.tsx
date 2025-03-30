'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import SudokuGrid from '@/components/sudoku/SudokuGrid';
import { formatTime } from '@/lib/utils';
import { useGameStore } from '@/store';
import { useWasmContext } from '@/providers/wasm-provider';

export default function PlayPage() {
  const { isLoaded, isLoading: wasmLoading, error: wasmError, reload } = useWasmContext();
  
  // 로컬 상태 관리
  const [solution, setSolution] = useState<number[] | null>(null);
  const [showingSolution, setShowingSolution] = useState(false);
  
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

  // 디버깅용 로그 - 매번 렌더링할 때마다 상태 출력
  useEffect(() => {
    console.log("Current grid:", grid);
    console.log("Solution:", solution);
    console.log("Showing solution:", showingSolution);
    console.log("Grid length:", grid?.length);
    console.log("Status:", status);
  }, [grid, solution, showingSolution, status]);

  // WASM 로딩 중이라면 로딩 화면 표시
  if (wasmLoading) {
    return (
      <div className="container mx-auto py-6 px-4">
        <Card>
          <CardHeader>
            <CardTitle>스도쿠 게임</CardTitle>
            <CardDescription>게임 모듈을 로드하는 중입니다...</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center items-center py-20">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="ml-3">로딩 중...</span>
          </CardContent>
        </Card>
      </div>
    );
  }

  // WASM 로드 에러가 있다면 에러 화면 표시
  if (wasmError) {
    return (
      <div className="container mx-auto py-6 px-4">
        <Card>
          <CardHeader>
            <CardTitle>오류 발생</CardTitle>
            <CardDescription>게임을 로드하는 중 문제가 발생했습니다.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md">
              <p className="font-medium">게임 모듈을 로드하지 못했습니다</p>
              <p className="mt-2">{wasmError.message}</p>
              <Button onClick={reload} className="mt-4">다시 시도</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 커스텀 솔루션 보기 핸들러
  const handleShowSolution = async () => {
    try {
      setMessage('솔루션 계산 중...');
      
      // 솔루션 계산
      const solutionData = await solveGame();
      
      if (solutionData && Array.isArray(solutionData) && solutionData.length === 81) {
        console.log("Got solution data:", solutionData);
        console.log("Solution length:", solutionData.length);
        
        // 솔루션 데이터 저장
        setSolution([...solutionData]);
        
        // 솔루션 표시 모드 활성화
        setShowingSolution(true);
        
        // 메시지 표시
        setMessage('솔루션이 표시되었습니다. 이제 정답을 확인할 수 있습니다.');
      } else {
        console.error("솔루션을 구할 수 없습니다:", solutionData);
        setMessage('이 퍼즐에 대한 해결책을 찾을 수 없습니다.');
      }
    } catch (error) {
      console.error('솔루션 계산 중 오류 발생:', error);
      setMessage('솔루션 계산 중 오류가 발생했습니다.');
    }
  };

  // 리셋 핸들러
  const handleReset = () => {
    // 솔루션 상태 초기화
    if (showingSolution) {
      setShowingSolution(false);
      setSolution(null);
    }
    resetGame();
  };

  // 새 게임 핸들러
  const handleNewGame = () => {
    // 솔루션 관련 상태 초기화
    setShowingSolution(false);
    setSolution(null);
    useGameStore.setState({ 
      status: 'idle',
      message: null
    });
  };

  // 현재 표시할 그리드 결정
  const displayGrid = showingSolution && solution ? solution : grid;

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
          ) : status === 'loading' ? (
            <div className="flex justify-center items-center py-20">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="ml-3">스도쿠 생성 중...</span>
            </div>
          ) : status === 'error' ? (
            <div className="mx-auto max-w-lg">
              <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md mb-4">
                <p className="font-medium">오류가 발생했습니다</p>
                <p className="mt-2">{message}</p>
              </div>
              <Button onClick={() => useGameStore.setState({ status: 'idle', message: null })} className="w-full">
                다시 시도
              </Button>
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
              
              {/* 솔루션이나 현재 게임 상태에 따라 그리드 표시 */}
              {displayGrid && displayGrid.length === 81 ? (
                <SudokuGrid 
                  grid={displayGrid} 
                  onChange={updateCell} 
                  originalGrid={originalGrid}
                  readOnly={status === 'complete' || showingSolution} 
                />
              ) : (
                <div className="text-red-500 text-center my-4">
                  스도쿠 그리드 생성 중 오류가 발생했습니다.
                </div>
              )}
              
              <div className="flex flex-wrap gap-2 mt-6 justify-center">
                <Button onClick={handleReset} variant="outline">리셋</Button>
                <Button onClick={() => checkSolution()}>확인</Button>
                <Button onClick={handleShowSolution} variant="secondary">솔루션 보기</Button>
                <Button onClick={handleNewGame} variant="ghost">새 게임</Button>
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
