'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import SudokuGrid from '@/components/sudoku/SudokuGrid';
import { copyToClipboard, downloadData } from '@/lib/utils';
import { useCreatorStore } from '@/store';

export default function CreatePage() {
  const {
    puzzleGrid,
    solutionGrid,
    proof,
    status,
    message,
    updatePuzzleCell,
    updateSolutionCell,
    clearGrids,
    generateProof,
    setMessage
  } = useCreatorStore();
  
  const [showImportModal, setShowImportModal] = useState(false);
  const [importPuzzle, setImportPuzzle] = useState('');
  const [importSolution, setImportSolution] = useState('');

  const handleCopyProof = async () => {
    const success = await copyToClipboard(proof);
    if (success) {
      setMessage('증명이 클립보드에 복사되었습니다!');
    } else {
      setMessage('클립보드 복사에 실패했습니다.');
    }
  };

  const handleDownloadProof = () => {
    downloadData(proof, 'zk-sudoku-proof.json', 'application/json');
    setMessage('증명이 다운로드되었습니다!');
  };

  return (
    <div className="container mx-auto py-6 px-4">
      <Card>
        <CardHeader>
          <CardTitle>스도쿠 생성 및 증명</CardTitle>
          <CardDescription>
            나만의 스도쿠 퍼즐을 만들고 ZK-SNARK 증명을 생성하세요.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col lg:flex-row gap-8 max-w-6xl mx-auto">
            <div className="flex-1">
              <h3 className="text-lg font-medium mb-2">퍼즐</h3>
              <p className="text-sm text-muted-foreground mb-4">
                플레이어에게 보여줄 초기 스도쿠 퍼즐을 만드세요.
              </p>
              <SudokuGrid
                grid={puzzleGrid}
                onChange={updatePuzzleCell}
                className="mb-4"
              />
            </div>
            
            <div className="flex-1">
              <h3 className="text-lg font-medium mb-2">정답</h3>
              <p className="text-sm text-muted-foreground mb-4">
                완성된 스도쿠 솔루션을 입력하세요. 이 정답은 공개되지 않습니다.
              </p>
              <SudokuGrid
                grid={solutionGrid}
                onChange={updateSolutionCell}
                originalGrid={puzzleGrid}
                className="mb-4"
              />
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2 justify-center mt-6">
            <Button onClick={clearGrids} variant="outline">초기화</Button>
            <Button onClick={() => setShowImportModal(true)} variant="outline">가져오기</Button>
            <Button 
              onClick={generateProof} 
              disabled={status === 'generating'}
              className="gap-2"
            >
              {status === 'generating' && (
                <div className="h-4 w-4 rounded-full border-2 border-current border-r-transparent animate-spin" />
              )}
              증명 생성
            </Button>
          </div>
          
          {status === 'complete' && proof && (
            <div className="mt-8">
              <h3 className="text-lg font-medium mb-2">증명 결과</h3>
              <div className="border rounded-md">
                <div className="bg-muted p-2 flex justify-between items-center">
                  <span className="text-sm font-medium">ZK-SNARK 증명 데이터</span>
                  <div className="space-x-2">
                    <Button onClick={handleCopyProof} variant="ghost" size="sm">복사</Button>
                    <Button onClick={handleDownloadProof} variant="ghost" size="sm">다운로드</Button>
                  </div>
                </div>
                <div className="p-4 overflow-auto max-h-96">
                  <pre className="text-xs">{proof}</pre>
                </div>
              </div>
            </div>
          )}
          
          {message && (
            <div className={`mt-6 p-4 rounded-md ${
              message.includes('성공') ? 'bg-green-50 text-green-800 border border-green-200' : 
              message.includes('오류') ? 'bg-red-50 text-red-800 border border-red-200' : 
              'bg-blue-50 text-blue-800 border border-blue-200'
            }`}>
              {message}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 가져오기 모달 - 실제 구현에서는 Shadcn UI의 Dialog 컴포넌트 사용 권장 */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">스도쿠 가져오기</h3>
            <p className="text-sm mb-4">
              스도쿠 데이터를 텍스트 또는 JSON 형식으로 붙여넣으세요.
            </p>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">퍼즐</label>
              <textarea
                value={importPuzzle}
                onChange={(e) => setImportPuzzle(e.target.value)}
                className="w-full h-24 p-2 border rounded-md text-sm resize-none"
                placeholder="퍼즐 데이터 (필수)"
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">솔루션 (선택사항)</label>
              <textarea
                value={importSolution}
                onChange={(e) => setImportSolution(e.target.value)}
                className="w-full h-24 p-2 border rounded-md text-sm resize-none"
                placeholder="솔루션 데이터 (선택사항)"
              />
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowImportModal(false)}>
                취소
              </Button>
              <Button onClick={() => {
                if (importPuzzle.trim()) {
                  const success = useCreatorStore.getState().importSudoku(importPuzzle, importSolution);
                  if (success) {
                    setShowImportModal(false);
                    setImportPuzzle('');
                    setImportSolution('');
                  }
                } else {
                  setMessage('퍼즐 데이터를 입력해주세요.');
                }
              }}>
                가져오기
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
