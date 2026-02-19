import Link from 'next/link';
import Button from '@/components/ui/atoms/Button'
import NicknameEditor from '@/components/ui/organisms/NicknameEditor';
import { createSupabaseServerClient } from '@/utils/supabase/server';
import prisma from '@/lib/prisma';
import { redirect } from 'next/navigation';

import { Plus } from 'lucide-react';

interface TabProps {
    searchParams: Promise<{ tab: string }>
}

export default async function MyPage({ searchParams }: TabProps) {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/auth/login?next=/mypage');
    }

    // Prisma에서 유저 정보(닉네임 포함) 가져오기
    const dbUser = await prisma.user.findUnique({
        where: { id: user?.id }
    });

    //닉네임 우선순위 결정
    const googleName = user.user_metadata?.full_name || user.user_metadata?.name;
    const initialNickname = dbUser?.nickname || googleName || '익명';

    const { tab } = await searchParams

    const activeTab = tab === 'liked' ? 'liked' : 'created';

    const tabMenu = [
        { id: 'created', label: '내가 만든 플리', href: '/mypage?tab=created' },
        { id: 'liked', label: '좋아요한 플리', href: '/mypage?tab=liked' },
    ];

    return (
        <section className="max-w-7xl">
            <div className='flex justify-between items-center rounded-2xl border border-[#39ff14]/20 bg-black/40 px-8 p-10 shadow-xl'>
                <NicknameEditor initialNickname={initialNickname} />
                <Link href="/createList" scroll={false}>
                    <Button rounded={'full'} as="span" icon={<Plus className="w-4 h-4" />}>플레이리스트 만들기</Button>
                </Link>
            </div>
            <div className="mt-8">
                <nav className="flex gap-8 border-b border-gray-800 mb-8">
                    {tabMenu.map((menu) => (
                        <Link
                            key={menu.id}
                            href={menu.href}
                            scroll={false}
                            className={`pb-4 text-lg transition-colors ${activeTab === menu.id
                                ? 'border-b-2 border-neon-green text-neon-green font-bold'
                                : 'text-gray-300 hover:text-gray-500'
                                }`}
                        >
                            {menu.label}
                        </Link>
                    ))}
                </nav>
                <main>
                    {activeTab === 'created' ? (
                        <p>내가 만든 리스트 컴포넌트</p>
                    ) : (
                        <p>내가 좋아요한 리스트 컴포넌트</p>
                    )}
                </main>
            </div>
        </section>
    )
}