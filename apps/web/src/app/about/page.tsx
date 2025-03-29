import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function AboutPage() {
  return (
    <div className="container mx-auto py-6 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">ZK-Sudoku 소개</h1>
        
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Zero-Knowledge Proof란?</CardTitle>
            <CardDescription>영지식 증명의 개념과 작동 방식</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              Zero-Knowledge Proof(영지식 증명)는 어떤 주장이 참임을 그 주장과 관련된 정보를 
              실제로 공개하지 않고도 증명할 수 있는 암호학적 방법입니다.
            </p>
            <p>
              예를 들어, 스도쿠 퍼즐의 경우 정답을 직접 공개하지 않고도 
              "내가 이 퍼즐의 정답을 알고 있다"는 사실을 증명할 수 있습니다.
            </p>
            <p>
              영지식 증명은 세 가지 중요한 특성을 가지고 있습니다:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>완전성(Completeness):</strong> 주장이 참이라면, 정직한 증명자는 검증자를 설득할 수 있습니다.</li>
              <li><strong>건전성(Soundness):</strong> 주장이 거짓이라면, 부정직한 증명자는 검증자를 설득할 수 없습니다.</li>
              <li><strong>영지식성(Zero-Knowledge):</strong> 검증자는 주장이 참이라는 사실 외에는 아무 정보도 얻을 수 없습니다.</li>
            </ul>
          </CardContent>
        </Card>
        
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>ZK-SNARK</CardTitle>
            <CardDescription>간결한 비대화형 지식 증명</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              ZK-SNARK(Zero-Knowledge Succinct Non-Interactive Argument of Knowledge)는 
              영지식 증명의 한 종류로, 크기가 작고(간결한) 상호작용 없이 검증이 가능한 증명 시스템입니다.
            </p>
            <p>
              ZK-SNARK의 특징:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>간결성(Succinct):</strong> 증명의 크기가 작고 검증 시간이 짧습니다.</li>
              <li><strong>비대화형(Non-Interactive):</strong> 증명자와 검증자 간의 대화가 필요 없습니다.</li>
              <li><strong>지식 증명(Argument of Knowledge):</strong> 증명자는 실제로 그 지식을 알고 있어야 합니다.</li>
            </ul>
            <p>
              ZK-SNARK는 블록체인, 암호화폐, 디지털 신원 증명, 개인정보 보호 등 다양한 분야에서 활용되고 있습니다.
            </p>
          </CardContent>
        </Card>
        
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>ZK-Sudoku 작동 방식</CardTitle>
            <CardDescription>이 애플리케이션의 기술적 구현</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              ZK-Sudoku는 다음과 같은 방식으로 작동합니다:
            </p>
            <ol className="list-decimal pl-6 space-y-3">
              <li>
                <strong>스도쿠 생성:</strong> 사용자는 스도쿠 퍼즐과 그 정답을 만듭니다.
              </li>
              <li>
                <strong>회로 생성:</strong> 스도쿠 규칙을 검증하는 산술 회로가 생성됩니다. 이 회로는 다음을 확인합니다:
                <ul className="list-disc pl-6 mt-2">
                  <li>각 행, 열, 3x3 박스에 1부터 9까지의 숫자가 정확히 한 번씩 나타나는지</li>
                  <li>퍼즐의 초기 값이 정답에 유지되는지</li>
                </ul>
              </li>
              <li>
                <strong>증명 생성:</strong> 사용자의 브라우저에서 Rust로 작성된 arkworks 라이브러리가 
                WebAssembly를 통해 ZK-SNARK 증명을 생성합니다.
              </li>
              <li>
                <strong>증명 검증:</strong> 다른 사용자는 증명과 퍼즐만으로 정답을 알 필요 없이 
                유효한 솔루션이 존재하는지 검증할 수 있습니다.
              </li>
            </ol>
            <p>
              이 모든 과정은 클라이언트 측에서 이루어지므로 서버가 필요하지 않습니다. 
              스도쿠 정답은 사용자의 브라우저를 떠나지 않고, 증명만 공유됩니다.
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>기술 스택</CardTitle>
            <CardDescription>이 프로젝트에 사용된 기술들</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">프론트엔드</h3>
                <ul className="list-disc pl-6 space-y-1">
                  <li>React & Next.js</li>
                  <li>TypeScript</li>
                  <li>TailwindCSS</li>
                  <li>Shadcn UI</li>
                  <li>Zustand (상태 관리)</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">암호학 및 백엔드</h3>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Rust</li>
                  <li>Arkworks (ZK-SNARK 라이브러리)</li>
                  <li>WebAssembly</li>
                  <li>Turborepo (모노레포)</li>
                </ul>
              </div>
            </div>
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-2">소스 코드</h3>
              <p>
                이 프로젝트의 소스 코드는 <a href="https://github.com/glycogen94/zk-sudoku" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">GitHub</a>에서 확인할 수 있습니다.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
