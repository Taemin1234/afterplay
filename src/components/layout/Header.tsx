'use client';

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import { Disc3 } from 'lucide-react';
import Link from 'next/link';

import SearchBar from '@/components/ui/molecules/SearchBar';

import LoggedInUI from './LoggedInUI';
import LoggedOutUI from './LoggedOutUI';

type HeaderProps = {
  user: User | null;
  nickname: string | null;
  isAdmin?: boolean;
};

export default function Header({ user, nickname, isAdmin = false }: HeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [query, setQuery] = useState('');

  const isSearchPage = pathname.startsWith('/search');

  const handleSearch = () => {
    const trimmed = query.trim();
    if (trimmed.length < 2) return;
    router.push(`/search?q=${encodeURIComponent(trimmed)}&tab=content`);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    handleSearch();
  };

  return (
    <header className={isSearchPage ? 'hidden md:block' : 'block'}>
      <div className='w-full border-b border-[#39ff14]/20 bg-[#0a0f1c]/80 backdrop-blur-md md:sticky md:top-0 md:z-50 md:block'>
        <div className='container mx-auto flex h-16 items-center justify-between px-4'>
          <Link href='/' className='group flex items-center gap-2'>
            <div className='rounded-full bg-[#39ff14]/10 p-2 transition-colors group-hover:bg-[#39ff14]/20'>
              <Disc3 className='h-6 w-6 text-[#39ff14]' />
            </div>
            <span className='font-mono text-xl font-bold tracking-tighter text-white'>
              <span className='text-[#39ff14]'>Dustpeak</span>Club
            </span>
          </Link>

          <div className='mx-8 hidden max-w-md flex-1 md:block'>
            <SearchBar
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onClear={() => setQuery('')}
              onClick={handleSearch}
              onKeyDown={handleSearchKeyDown}
              placeholder='게시글, 태그, 사용자 검색'
            />
          </div>

          <div className='items-center gap-4 md:flex'>
            {user ? <LoggedInUI nickname={nickname} isAdmin={isAdmin} /> : <LoggedOutUI />}
          </div>
        </div>
      </div>
    </header>
  );
}
