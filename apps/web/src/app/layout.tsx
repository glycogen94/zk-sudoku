import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import Providers from '@/providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'ZK-Sudoku',
  description: 'Zero-Knowledge Proof 기반의 스도쿠 웹 애플리케이션',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className={inter.className}>
        <Providers>
          <div className="min-h-screen flex flex-col">
            <header className="border-b">
              <div className="container mx-auto py-4 px-4">
                <div className="flex flex-col sm:flex-row justify-between items-center">
                  <Link href="/" className="text-2xl font-bold mb-4 sm:mb-0">
                    ZK-Sudoku
                  </Link>
                  <nav>
                    <ul className="flex flex-wrap space-x-1 sm:space-x-4">
                      <li>
                        <Button variant="ghost" asChild className="text-sm sm:text-base">
                          <Link href="/">홈</Link>
                        </Button>
                      </li>
                      <li>
                        <Button variant="ghost" asChild className="text-sm sm:text-base">
                          <Link href="/play">게임</Link>
                        </Button>
                      </li>
                      <li>
                        <Button variant="ghost" asChild className="text-sm sm:text-base">
                          <Link href="/create">생성</Link>
                        </Button>
                      </li>
                      <li>
                        <Button variant="ghost" asChild className="text-sm sm:text-base">
                          <Link href="/verify">검증</Link>
                        </Button>
                      </li>
                      <li>
                        <Button variant="ghost" asChild className="text-sm sm:text-base">
                          <Link href="/about">소개</Link>
                        </Button>
                      </li>
                    </ul>
                  </nav>
                </div>
              </div>
            </header>
            
            <main className="flex-grow">
              {children}
            </main>
            
            <footer className="border-t py-6">
              <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
                <p>© {new Date().getFullYear()} ZK-Sudoku - <a href="https://github.com/glycogen94/zk-sudoku" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">GitHub</a></p>
              </div>
            </footer>
          </div>
        </Providers>
      </body>
    </html>
  );
}
