import Link from 'next/link';
import Button from '@/components/ui/atoms/Button'
import NicknameEditor from '@/components/ui/molecules/NicknameEditor';

import { Plus } from 'lucide-react';

interface ProfileInfoProps {
    initialNickname: string;
    isOwner?: boolean;
}

export default function ProfileInfo({ initialNickname, isOwner = false }: ProfileInfoProps) {

    return (
        <div className='flex flex-col items-start justify-between gap-4 rounded-2xl border border-[#39ff14]/20 bg-black/40 px-4 py-5 shadow-xl sm:flex-row sm:items-center sm:gap-6 md:px-8 md:py-10'>
            <NicknameEditor initialNickname={initialNickname} isOwner={isOwner} />
            {isOwner && (
                <Link href="/createList" scroll={false} className='w-full sm:w-auto'>
                    <Button rounded={'full'} as="span" icon={<Plus className="h-4 w-4" />} className='w-full sm:w-auto'>플레이리스트 만들기</Button>
                </Link>
            )}
        </div>
    )
}
