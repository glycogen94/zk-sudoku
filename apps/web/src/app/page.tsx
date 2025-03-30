import Link from 'next/link';
import { FaPlay, FaPlus, FaCheck, FaInfoCircle } from 'react-icons/fa';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

export default function HomePage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <section className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">ZK-Sudoku</h1>
        <p className="text-xl mb-8">
          Zero-Knowledge Proof를 활용한 스도쿠 게임 플랫폼
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Button asChild className="gap-2">
            <Link href="/sudoku">
              <FaPlay /> 게임 시작
            </Link>
          </Button>
          <Button asChild variant="outline" className="gap-2">
            <Link href="/about">
              <FaInfoCircle /> 자세히 알아보기
            </Link>
          </Button>
        </div>
      </section>

      <section className="grid md:grid-cols-3 gap-8 mb-12">
        <Card>
          <CardHeader>
            <div className="text-4xl text-blue-600 mb-4 flex justify-center">
              <FaPlay />
            </div>
            <CardTitle>스도쿠 플레이</CardTitle>
            <CardDescription>
              다양한 난이도의 스도쿠 퍼즐을 풀어보세요. 게임 진행 상황은 자동으로 저장됩니다.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button asChild variant="link" className="w-full">
              <Link href="/sudoku">
                게임 시작하기 →
              </Link>
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <div className="text-4xl text-green-600 mb-4 flex justify-center">
              <FaPlus />
            </div>
            <CardTitle>스도쿠 생성</CardTitle>
            <CardDescription>
              나만의 스도쿠 퍼즐을 만들고, ZK-SNARK 증명을 생성하여 공유해보세요.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button asChild variant="link" className="w-full">
              <Link href="/create">
                퍼즐 만들기 →
              </Link>
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <div className="text-4xl text-purple-600 mb-4 flex justify-center">
              <FaCheck />
            </div>
            <CardTitle>증명 검증</CardTitle>
            <CardDescription>
              다른 사용자가 만든 스도쿠 퍼즐과 증명을 검증해보세요. 정답을 알 필요 없이 검증이 가능합니다.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button asChild variant="link" className="w-full">
              <Link href="/verify">
                증명 검증하기 →
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </section>

      <Card className="mb-12">
        <CardHeader>
          <CardTitle>Zero-Knowledge Proof란?</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4">
            Zero-Knowledge Proof(영지식 증명)는 어떤 정보를 실제로 공개하지 않고도,
            그 정보를 알고 있다는 것을 증명할 수 있는 암호학적 방법입니다.
          </p>
          <p className="mb-4">
            ZK-Sudoku에서는 이 기술을 활용하여 스도쿠 퍼즐의 정답을 공개하지 않고도
            유효한 정답을 가지고 있다는 것을 증명할 수 있습니다.
          </p>
        </CardContent>
        <CardFooter>
          <Button asChild variant="link">
            <Link href="/about">
              자세히 알아보기 →
            </Link>
          </Button>
        </CardFooter>
      </Card>

      <section>
        <h2 className="text-2xl font-bold mb-4">시작하는 방법</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center mb-2">1</div>
              <CardTitle className="text-lg">게임 선택</CardTitle>
            </CardHeader>
            <CardContent>
              <p>난이도에 맞는 스도쿠 게임을 선택하세요.</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center mb-2">2</div>
              <CardTitle className="text-lg">퍼즐 풀기</CardTitle>
            </CardHeader>
            <CardContent>
              <p>스도쿠 규칙에 따라 1-9까지의 숫자를 배치하세요.</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center mb-2">3</div>
              <CardTitle className="text-lg">증명 생성 및 공유</CardTitle>
            </CardHeader>
            <CardContent>
              <p>완성된 퍼즐의 증명을 생성하고 다른 사람과 공유하세요.</p>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
