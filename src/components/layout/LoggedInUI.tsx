'use client';

import { LogOut, User } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

import IconButton from '@/components/ui/atoms/IconButton';
import { createClient } from '@/utils/supabase/client';

export default function LoggedInUI({ nickname }: { nickname?: string | null }) {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  const handleSignOut = async () => {
    // 1) Supabase 로그아웃: 브라우저 세션/쿠키 해제
    await supabase.auth.signOut();

    // 2) 보호 페이지에서는 로그인 페이지 대신 홈으로 이동
    const protectedPrefixes = ['/mypage', '/createList'];
    const isOnProtectedPage = protectedPrefixes.some((prefix) => pathname.startsWith(prefix));

    if (isOnProtectedPage) {
      router.replace('/');
      return;
    }

    // 3) 그 외 페이지는 현재 화면만 갱신해서 UI 상태 반영
    router.refresh();
  };

  return (
    <>
      <Link href='/mypage' className='hidden items-center justify-center gap-3 md:flex'>
        <p>{nickname ?? '익명'}</p>
        <IconButton variant='bg' as='span' icon={<User className='w-4 h-4' />} />
      </Link>
      <IconButton icon={<LogOut size={20} />} onClick={handleSignOut} />
    </>
  );
}
