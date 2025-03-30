'use client';

import React, { useState } from 'react';
import { SudokuGame } from '@/components/sudoku';

export default function SudokuPage() {
  const [difficulty, setDifficulty] = useState<number>(2);
  const [solvedCount, setSolvedCount] = useState<number>(0);

  // 스도쿠 풀이 완료 처리
  const handleSolve = () => {
    setSolvedCount(prev => prev + 1);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-center mb-6">ZK-스도쿠</h1>
      
      <div className="max-w-xl mx-auto bg-white rounded-lg shadow-lg p-6">
        <div className="mb-6">
          <p className="text-gray-700 mb-4">
            스도쿠를 즐겨보세요! 난이도를 선택하고 새 게임을 시작하세요.
            비어있는 셀을 채워서 모든 행, 열, 3x3 박스에 1-9까지 숫자가 정확히 한 번씩 나타나도록 만드세요.
          </p>
          
          <div className="flex items-center mb-4">
            <span className="mr-4 font-medium">난이도:</span>
            <div className="flex space-x-2">
              {[
                { value: 1, label: '쉬움' },
                { value: 2, label: '중간' },
                { value: 3, label: '어려움' }
              ].map(option => (
                <button
                  key={option.value}
                  onClick={() => setDifficulty(option.value)}
                  className={`px-4 py-2 rounded transition ${
                    difficulty === option.value
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
          
          {solvedCount > 0 && (
            <div className="text-green-600 font-medium mb-4">
              🎉 완료한 퍼즐: {solvedCount}개
            </div>
          )}
        </div>
        
        <SudokuGame 
          difficulty={difficulty} 
          onSolve={handleSolve} 
        />
      </div>
    </div>
  );
}