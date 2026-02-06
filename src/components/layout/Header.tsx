import { Disc3 } from 'lucide-react';
import Link from 'next/link';

import SearchBar from '@/components/ui/molecules/SearchBar';
import LoggedInUI from './LoggedInUI';
import LoggedOutUI from './LoggedOutUI';
// 로그인 정보 가져오기
import { createSupabaseServerClient } from '@/utils/supabase/server';

export default async function Header () {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    return (
        <header className="sticky top-0 z-50 w-full border-b border-[#39ff14]/20 bg-[#0a0f1c]/80 backdrop-blur-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href={"/"} className="flex items-center gap-2 group">
            <div className="p-2 rounded-full bg-[#39ff14]/10 group-hover:bg-[#39ff14]/20 transition-colors">
              <Disc3 className="w-6 h-6 text-[#39ff14]" />
            </div>
            <span className="text-xl font-bold tracking-tighter text-white font-mono">
              After<span className="text-[#39ff14]">Play</span>
            </span>
          </Link>
  
          <div className="flex-1 max-w-md mx-8 hidden md:block">
            <SearchBar/>
          </div>
          
          <div className="flex items-center gap-4">
            {user ? (
              <LoggedInUI />
            ) : (
              <LoggedOutUI />
            )}
          </div>
        </div>
      </header>
    )
}