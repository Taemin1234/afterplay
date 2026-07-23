'use client';

import { useEffect, useState } from 'react';
import { Menu, Search, X } from 'lucide-react';
import { usePathname } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import Link from 'next/link';
import Image from 'next/image';

import LoggedInUI from './LoggedInUI';
import LoggedOutUI from './LoggedOutUI';

type HeaderProps = {
  user: User | null;
  nickname: string | null;
  isAdmin?: boolean;
};

type NavigationItem = {
  href: string;
  label: string;
  isActive: (pathname: string) => boolean;
};

const contentNavigation: NavigationItem[] = [
  {
    href: '/polls',
    label: 'PEAK N PICK',
    isActive: (pathname) => pathname.startsWith('/polls'),
  },
  {
    href: '/lists',
    label: '음악 리스트',
    isActive: (pathname) => pathname.startsWith('/lists'),
  },
  {
    href: '/weekly-new-releases',
    label: '이주의 신곡',
    isActive: (pathname) => pathname.startsWith('/weekly-new-releases'),
  },
  // {
  //   href: '/featured',
  //   label: '특별게시글',
  //   isActive: (pathname) => pathname.startsWith('/featured'),
  // },
];

export default function Header({ user, nickname, isAdmin = false }: HeaderProps) {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const isSearchPage = pathname.startsWith('/search');

  useEffect(() => {
    if (!isMenuOpen) return;

    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsMenuOpen(false);
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMenuOpen]);

  return (
    <header className={isSearchPage ? 'hidden lg:block' : 'block'}>
      <div className="sticky top-0 z-50 w-full border-b-2 border-point/20 bg-app-bg/90 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center gap-4 px-4">
          <Link href="/" className="group flex shrink-0 items-center gap-2">
            <Image
              src="/main_logo.png"
              alt="DustpeakClub 홈"
              width={225}
              height={53}
              className="h-auto w-[clamp(140px,22vw,210px)]"
              priority
            />
          </Link>

          <nav className="hidden min-w-0 flex-1 items-center justify-center gap-1 lg:flex" aria-label="주요 콘텐츠">
            {contentNavigation.map((item) => {
              const active = item.isActive(pathname);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={`relative whitespace-nowrap rounded-md px-3 py-2 text-md font-semibold transition-colors xl:px-4 ${
                    active
                      ? 'text-neon-point'
                      : 'text-slate-300 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  {item.label}
                  {active ? (
                    <span className="absolute inset-x-3 -bottom-[13px] h-0.5 rounded-full bg-neon-point" />
                  ) : null}
                </Link>
              );
            })}
          </nav>

          <div className="ml-auto hidden shrink-0 items-center gap-2 lg:flex">
            <Link
              href="/search"
              aria-label="검색 페이지로 이동"
              aria-current={isSearchPage ? 'page' : undefined}
              className={`inline-flex h-10 w-10 items-center justify-center rounded-md transition-colors ${
                isSearchPage
                  ? 'bg-point/15 text-point'
                  : 'text-slate-300 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Search className="h-5 w-5" />
            </Link>
            {user ? <LoggedInUI nickname={nickname} isAdmin={isAdmin} /> : <LoggedOutUI />}
          </div>

          <button
            type="button"
            className="ml-auto inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-slate-200 transition-colors hover:bg-white/10 hover:text-white lg:hidden"
            aria-label="전체 메뉴 열기"
            aria-expanded={isMenuOpen}
            aria-controls="mobile-navigation"
            onClick={() => setIsMenuOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>
      </div>

      {isMenuOpen ? (
        <div className="fixed inset-0 z-[70] lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/65 backdrop-blur-sm"
            aria-label="전체 메뉴 닫기"
            onClick={() => setIsMenuOpen(false)}
          />

          <nav
            id="mobile-navigation"
            aria-label="모바일 전체 메뉴"
            className="absolute right-0 top-0 flex h-full w-[min(86vw,360px)] flex-col border-l border-white/10 bg-app-bg px-5 pb-[max(24px,env(safe-area-inset-bottom))] pt-4 shadow-[-24px_0_60px_rgba(0,0,0,0.45)]"
          >
            <div className="flex h-12 items-center justify-between border-b border-white/10 pb-3">
              <span className="font-paperlogy text-lg font-bold text-white">MENU</span>
              <button
                type="button"
                className="inline-flex h-10 w-10 items-center justify-center rounded-md text-slate-300 hover:bg-white/10 hover:text-white"
                aria-label="전체 메뉴 닫기"
                onClick={() => setIsMenuOpen(false)}
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="mt-5 space-y-1">
              {contentNavigation.map((item) => {
                const active = item.isActive(pathname);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? 'page' : undefined}
                    onClick={() => setIsMenuOpen(false)}
                    className={`flex min-h-12 items-center rounded-lg px-3 text-base font-semibold transition-colors ${
                      active
                        ? 'bg-point/15 text-point'
                        : 'text-slate-200 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>

            <div className="my-5 border-t border-white/10" />

            <div className="space-y-1">
              <Link
                href="/search"
                onClick={() => setIsMenuOpen(false)}
                className="flex min-h-12 items-center gap-3 rounded-lg px-3 text-slate-200 hover:bg-white/10 hover:text-white"
              >
                <Search className="h-5 w-5" />
                검색
              </Link>
              {user ? (
                <>
                  <Link
                    href="/createList"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex min-h-12 items-center rounded-lg px-3 text-slate-200 hover:bg-white/10 hover:text-white"
                  >
                    새 리스트 작성
                  </Link>
                  <Link
                    href="/mypage"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex min-h-12 items-center justify-between rounded-lg px-3 text-slate-200 hover:bg-white/10 hover:text-white"
                  >
                    <span>마이페이지</span>
                    <span className="max-w-40 truncate text-xs text-slate-500">{nickname ?? '익명'}</span>
                  </Link>
                </>
              ) : (
                <Link
                  href="/auth/login"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex min-h-12 items-center rounded-lg px-3 text-slate-200 hover:bg-white/10 hover:text-white"
                >
                  로그인
                </Link>
              )}
              {isAdmin ? (
                <Link
                  href="/admin/polls"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex min-h-12 items-center rounded-lg px-3 text-point hover:bg-point/10"
                >
                  관리자 메뉴
                </Link>
              ) : null}
            </div>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
