'use client';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import SudokuGrid from '@/components/sudoku/SudokuGrid';
import { useVerifierStore } from '@/store';

export default function VerifyPage() {
  const {
    puzzleGrid,
    proofText,
    isVerifying,
    verificationResult,
    setProofText,
    verifyProof,
    reset
  } = useVerifierStore();

  return (
    <div className="container mx-auto py-6 px-4">
      <Card>
        <CardHeader>
          <CardTitle>증명 검증</CardTitle>
          <CardDescription>
            다른 사용자의 스도쿠 퍼즐과 ZK-SNARK 증명을 검증하세요.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-medium mb-2">증명 데이터 입력</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  검증할 증명 데이터를 JSON 형식으로 붙여넣으세요.
                </p>
                <textarea
                  value={proofText}
                  onChange={(e) => setProofText(e.target.value)}
                  className="w-full h-[300px] p-3 border rounded-md font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder='{"puzzle": [5,3,0,0,7,0,0,0,0,...], "proof": "..."}'
                />
                <div className="mt-4 flex gap-2">
                  <Button 
                    onClick={() => verifyProof()} 
                    className="w-full"
                    disabled={isVerifying}
                  >
                    {isVerifying ? (
                      <>
                        <div className="h-4 w-4 mr-2 rounded-full border-2 border-current border-r-transparent animate-spin" />
                        검증 중...
                      </>
                    ) : "증명 검증하기"}
                  </Button>
                  <Button 
                    onClick={reset} 
                    variant="outline"
                    className="flex-shrink-0"
                  >
                    초기화
                  </Button>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-2">스도쿠 퍼즐</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  증명에 포함된 스도쿠 퍼즐입니다.
                </p>
                <SudokuGrid
                  grid={puzzleGrid}
                  readOnly={true}
                  className="mb-4"
                />

                {verificationResult && (
                  <div className={`mt-4 p-4 rounded-md ${
                    verificationResult.success 
                      ? 'bg-green-50 text-green-800 border border-green-200' 
                      : 'bg-red-50 text-red-800 border border-red-200'
                  }`}>
                    <div className="font-medium mb-1">
                      {verificationResult.success ? '검증 성공 ✅' : '검증 실패 ❌'}
                    </div>
                    <p>{verificationResult.message}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
