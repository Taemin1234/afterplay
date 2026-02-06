'use client';

import { User, LogOut } from 'lucide-react';
import Link from 'next/link'
import IconButton from '@/components/ui/atoms/IconButton';

import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';

export default function LoggedInUI() {
    const router = useRouter();
    const supabase = createClient();

    const handleSignOut = async () => {
        // 1. Supabase 로그아웃 호출 (브라우저 쿠키/세션 삭제)
        await supabase.auth.signOut();
        
        // 2. 페이지 새로고침 또는 메인으로 이동
        // 새로고침을 해줘야 Header의 서버 컴포넌트가 다시 실행되어 UI가 바뀝니다.
        router.refresh(); 
      };

    return (
        <>
            <Link href='/mypage'>
                <IconButton variant='bg' as='span' icon={<User className="w-4 h-4" />}/>
            </Link>
            <IconButton icon={<LogOut className="w-5 h-5" />} onClick={handleSignOut}/>
        </>
    )
}