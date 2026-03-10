'use client';

import type { User } from '@supabase/supabase-js';
import { Home, Search, User as UserIcon } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ComponentType } from 'react';

type MobileBottomNavProps = {
  user: User | null;
  nickname?: string | null;
};

type NavItem = {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  isActive: (pathname: string) => boolean;
};

export default function MobileBottomNav({ user, nickname }: MobileBottomNavProps) {
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
      className='fixed bottom-0 left-0 right-0 z-50 border-t border-[#39ff14]/20 bg-[#0a0f1c]/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden'
      style={{ WebkitTransform: 'translateZ(0)' }}
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
                active ? 'text-[#39ff14]' : 'text-zinc-400 hover:text-zinc-100'
              }`}
            >
              <Icon className='h-5 w-5' />
              {item.label === 'Profile' ? <span className='text-xs font-medium truncate'>{nickname}</span> : null}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
