import React from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// VIBE 코딩 페이지 컴포넌트
export default function VibePage() {
  return (
    <main className="container mx-auto py-8 px-4">
      <h1 className="text-4xl font-bold mb-6 text-center">VIBE 코딩</h1>
      
      <Tabs defaultValue="about" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-8">
          <TabsTrigger value="about">VIBE 코딩 소개</TabsTrigger>
          <TabsTrigger value="tools">개발 툴</TabsTrigger>
          <TabsTrigger value="mcp">MCP 정보</TabsTrigger>
        </TabsList>
        
        {/* VIBE 코딩 소개 탭 */}
        <TabsContent value="about" className="space-y-6">
          <Card className="p-6">
            <h2 className="text-2xl font-semibold mb-4">VIBE 코딩이란?</h2>
            <p className="mb-4">
              VIBE 코딩(vibecoding)은 대규모 언어 모델(LLM)에 간단한 문장으로 문제를 설명하고, 이를 통해 AI가 소프트웨어를 생성하는 프로그래밍 기법입니다.
              이 방식은 프로그래머의 역할을 직접 코딩에서 AI가 생성한 코드를 안내, 테스트, 개선하는 방향으로 전환시킵니다.
            </p>

            <p className="mb-4">
              VIBE 코딩의 장점은 전통적인 소프트웨어 엔지니어링에 필요한 광범위한 교육이나 기술 없이도 
              초보 프로그래머가 소프트웨어를 제작할 수 있다는 점입니다. 이 용어는 2025년 2월 Andrej Karpathy에 의해 소개되었으며, 
              같은 해 3월 메리엄-웹스터 사전에 "속어 및 트렌드" 명사로 등재되었습니다.
            </p>
            
            <h3 className="text-xl font-semibold mt-6 mb-3">핵심 원칙</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>AI 주도 개발</strong>: 대규모 언어 모델을 활용하여 코드 생성</li>
              <li><strong>자연어 설명</strong>: 복잡한 문제를 간단한 문장으로 설명</li>
              <li><strong>반복적 개선</strong>: AI가 생성한 코드를 테스트하고 지속적으로 개선</li>
              <li><strong>접근성 향상</strong>: 프로그래밍 진입 장벽 낮추기</li>
            </ul>
          </Card>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
            <Card className="p-4 overflow-hidden">
              <div className="w-full h-80 relative">
                <img 
                  src="/images/vibe-coding-1.png"
                  alt="VIBE 코딩 이미지 1"
                  className="w-full h-full object-contain"
                />
              </div>
            </Card>
            
            <Card className="p-4 overflow-hidden">
              <div className="w-full h-80 relative">
                <img 
                  src="/images/vibe-coding-2.png"
                  alt="VIBE 코딩 이미지 2"
                  className="w-full h-full object-contain"
                />
              </div>
            </Card>
          </div>
        </TabsContent>
        
        {/* 개발 툴 탭 */}
        <TabsContent value="tools" className="space-y-6">
          <Card className="p-6">
            <h2 className="text-2xl font-semibold mb-4">현재 사용 중인 개발 툴</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="p-4">
                <h3 className="text-xl font-semibold mb-2">iTerm2</h3>
                <p className="text-gray-700 mb-2">개발 작업을 위한 고급 터미널 에뮬레이터</p>
                <p className="text-sm text-gray-600"><strong>주요 용도:</strong> 개발 서버 실행, 코드 빌드 및 배포</p>
              </Card>
              
              <Card className="p-4">
                <h3 className="text-xl font-semibold mb-2">Visual Studio Code</h3>
                <p className="text-gray-700 mb-2">주 코드 에디터</p>
                <p className="text-sm text-gray-600"><strong>주요 용도:</strong> 코드 작성, 디버깅, Git 연동</p>
              </Card>
              
              <Card className="p-4">
                <h3 className="text-xl font-semibold mb-2">Chrome DevTools</h3>
                <p className="text-gray-700 mb-2">웹 브라우저 내장 개발 도구</p>
                <p className="text-sm text-gray-600"><strong>주요 용도:</strong> UI 디버깅, 네트워크 분석, 성능 최적화</p>
              </Card>
              
              <Card className="p-4">
                <h3 className="text-xl font-semibold mb-2">Yarn</h3>
                <p className="text-gray-700 mb-2">패키지 관리자</p>
                <p className="text-sm text-gray-600"><strong>주요 용도:</strong> 의존성 관리 및 스크립트 실행</p>
              </Card>
              
              <Card className="p-4">
                <h3 className="text-xl font-semibold mb-2">Turbo</h3>
                <p className="text-gray-700 mb-2">모노레포 빌드 시스템</p>
                <p className="text-sm text-gray-600"><strong>주요 용도:</strong> 다중 패키지 구조의 효율적인 빌드 및 개발</p>
              </Card>
            </div>
          </Card>
          
          <Card className="p-6">
            <h2 className="text-2xl font-semibold mb-4">ZK-Sudoku 핵심 기술 스택</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-xl font-semibold mb-3">Frontend</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Next.js 14.0</li>
                  <li>React 18.2</li>
                  <li>TypeScript 5.2</li>
                  <li>Tailwind CSS 3.3</li>
                  <li>Shadcn UI (컴포넌트 라이브러리)</li>
                  <li>Zustand (상태 관리)</li>
                  <li>Framer Motion (애니메이션)</li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-xl font-semibold mb-3">ZK 핵심 기술</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Rust (Wasm 컴파일)</li>
                  <li>Arkworks (ZK-SNARK 라이브러리)</li>
                  <li>WebAssembly</li>
                </ul>
                
                <h3 className="text-xl font-semibold mt-6 mb-3">개발 도구</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Turbo (모노레포 관리)</li>
                  <li>Yarn (패키지 관리)</li>
                  <li>ESLint + Prettier (코드 스타일링)</li>
                </ul>
              </div>
            </div>
          </Card>
        </TabsContent>
        
        {/* MCP 정보 탭 */}
        <TabsContent value="mcp" className="space-y-6">
          <Card className="p-6">
            <h2 className="text-2xl font-semibold mb-4">MCP(Model Context Protocol) 소개</h2>
            <p className="mb-4">
              Model Context Protocol(MCP)은 대규모 언어 모델(LLM)과 같은 AI 모델의 컨텍스트 관리를 위한 프로토콜입니다.
              이 프로토콜은 AI와의 상호작용에서 컨텍스트를 효과적으로 관리하고, 모델의 성능과 정확성을 향상시키는 데 중요한 역할을 합니다.
            </p>
            
            <h3 className="text-xl font-semibold mt-6 mb-3">MCP의 주요 기능</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>컨텍스트 관리</strong>: 대화 및 상호작용의 문맥을 효과적으로 유지</li>
              <li><strong>메모리 최적화</strong>: 제한된 컨텍스트 창에서 중요 정보 유지</li>
              <li><strong>모델 성능 향상</strong>: 관련성 높은 컨텍스트 제공으로 응답 품질 개선</li>
            </ul>
            
            <p className="mt-4">
              자세한 내용은 <a href="https://modelcontextprotocol.io/introduction" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">공식 MCP 소개 페이지</a>에서 확인할 수 있습니다.
            </p>
          </Card>
          
          <Card className="p-6">
            <h2 className="text-2xl font-semibold mb-4">VIBE 코딩에서의 MCP 활용</h2>
            <p className="mb-4">
              VIBE 코딩에서는 MCP를 활용하여 AI와의 상호작용을 최적화하고, 더 나은 코드 생성 결과를 얻을 수 있습니다.
              효과적인 프롬프트 작성과 컨텍스트 관리는 VIBE 코딩의 성공에 핵심적인 요소입니다.
            </p>
          </Card>
        </TabsContent>
      </Tabs>
    </main>
  );
}
