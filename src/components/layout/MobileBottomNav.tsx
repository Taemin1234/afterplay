'use client';

import type { User } from '@supabase/supabase-js';
import { Home, ListMusic, Search, User as UserIcon, Vote } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ComponentType } from 'react';

type MobileBottomNavProps = {
  user: User | null;
  nickname?: string | null;
  isAdmin?: boolean;
};

type NavItem = {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  isActive: (pathname: string) => boolean;
};

export default function MobileBottomNav({ user }: MobileBottomNavProps) {
  const pathname = usePathname();

  const navItems: NavItem[] = [
    {
      href: '/',
      label: '홈',
      icon: Home,
      isActive: (path) => path === '/',
    },
    {
      href: '/lists',
      label: '리스트',
      icon: ListMusic,
      isActive: (path) => path.startsWith('/lists'),
    },
    {
      href: '/polls',
      label: 'PICK',
      icon: Vote,
      isActive: (path) => path.startsWith('/polls'),
    },
    {
      href: '/search',
      label: '검색',
      icon: Search,
      isActive: (path) => path.startsWith('/search'),
    },
    {
      href: user ? '/mypage' : '/auth/login',
      label: 'MY',
      icon: UserIcon,
      isActive: (path) =>
        path.startsWith('/mypage') ||
        path.startsWith('/profile') ||
        path.startsWith('/auth/login'),
    },
  ];

  return (
    <nav
      aria-label="모바일 주요 메뉴"
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-point/[0.18] bg-[linear-gradient(135deg,rgba(23,23,23,0.94),rgba(14,14,14,0.88)_48%,rgb(var(--point-color-rgb)_/_0.14))] pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_32px_rgba(0,0,0,0.42),inset_0_1px_0_rgb(var(--point-color-rgb)_/_0.12)] backdrop-blur-2xl backdrop-saturate-150 lg:hidden"
      style={{
        WebkitTransform: 'translateZ(0)',
        transform: 'translateZ(0)',
        WebkitBackdropFilter: 'blur(24px) saturate(150%)',
        backdropFilter: 'blur(24px) saturate(150%)',
      }}
    >
      <div className="mx-auto grid h-16 max-w-lg grid-cols-5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = item.isActive(pathname);

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className={`flex min-w-0 flex-col items-center justify-center gap-1 transition-colors ${
                active ? 'text-point' : 'text-slate-400 hover:text-slate-100'
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="max-w-full truncate px-1 text-[11px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
