'use client';

import type { User } from '@supabase/supabase-js';
import { Home, Search, User as UserIcon } from 'lucide-react';
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

export default function MobileBottomNav({ user, nickname, isAdmin = false }: MobileBottomNavProps) {
  const pathname = usePathname();

  const navItems: NavItem[] = [
    {
      href: '/',
      label: 'Home',
      icon: Home,
      isActive: (path) => path === '/',
    },
    {
      href: '/search',
      label: 'Search',
      icon: Search,
      isActive: (path) => path.startsWith('/search'), // search로 시작하는 경로
    },
    {
      href: user ? '/mypage' : '/auth/login',
      label: 'Profile',
      icon: UserIcon,
      isActive: (path) => path.startsWith('/mypage') || path.startsWith('/profile') || path.startsWith('/auth/login'),
    },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-point/[0.18] bg-[linear-gradient(135deg,rgba(19,28,49,0.92),rgba(7,12,24,0.86)_48%,rgb(var(--point-color-rgb)_/_0.10))] shadow-[0_-8px_32px_rgba(0,0,0,0.42),inset_0_1px_0_rgb(var(--point-color-rgb)_/_0.10)] backdrop-blur-2xl backdrop-saturate-150 pb-[env(safe-area-inset-bottom)] md:hidden"
      style={{
        WebkitTransform: 'translateZ(0)',
        transform: 'translateZ(0)',
        WebkitBackdropFilter: 'blur(24px) saturate(150%)',
        backdropFilter: 'blur(24px) saturate(150%)',
      }}
    >
      <div className='mx-auto grid h-16 max-w-lg grid-cols-3'>
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = item.isActive(pathname);

          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-1 transition-colors ${
                active ? 'text-point' : 'text-slate-400 hover:text-slate-100'
              }`}
            >
              <Icon className='h-5 w-5' />
              {item.label === 'Profile' ? (
                <span className='flex max-w-[90px] items-center gap-1 text-xs font-medium'>
                  <span className='truncate'>{nickname}</span>
                  {isAdmin ? <span className='shrink-0 text-[10px] text-point'>A</span> : null}
                </span>
              ) : null}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
