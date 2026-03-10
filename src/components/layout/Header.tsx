import type { User } from '@supabase/supabase-js';
import { Disc3 } from 'lucide-react';
import Link from 'next/link';

import SearchBar from '@/components/ui/molecules/SearchBar';

import LoggedInUI from './LoggedInUI';
import LoggedOutUI from './LoggedOutUI';

type HeaderProps = {
  user: User | null;
  nickname: string | null;
};

export default function Header({ user, nickname }: HeaderProps) {
  return (
    <header className='w-full border-b border-[#39ff14]/20 bg-[#0a0f1c]/80 backdrop-blur-md md:sticky md:top-0 md:z-50 md:block'>
      <div className='container mx-auto flex h-16 items-center justify-between px-4'>
        <Link href='/' className='group flex items-center gap-2'>
          <div className='rounded-full bg-[#39ff14]/10 p-2 transition-colors group-hover:bg-[#39ff14]/20'>
            <Disc3 className='h-6 w-6 text-[#39ff14]' />
          </div>
          <span className='font-mono text-xl font-bold tracking-tighter text-white'>
            After<span className='text-[#39ff14]'>Play</span>
          </span>
        </Link>

        <div className='mx-8 hidden max-w-md flex-1 md:block'>
          <SearchBar />
        </div>

        <div className='hidden items-center gap-4 md:flex'>
          {user ? <LoggedInUI nickname={nickname} /> : <LoggedOutUI />}
        </div>
      </div>
    </header>
  );
}
