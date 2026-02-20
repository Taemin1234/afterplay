import Link from 'next/link';
import Button from '@/components/ui/atoms/Button'
import NicknameEditor from '@/components/ui/molecules/NicknameEditor';

import { Plus } from 'lucide-react';

export default function ProfileInfo({initialNickname} : {initialNickname : string}) {
    
    return (
        <div className='flex justify-between items-center rounded-2xl border border-[#39ff14]/20 bg-black/40 px-8 p-10 shadow-xl'>
            <NicknameEditor initialNickname={initialNickname} />
            <Link href="/createList" scroll={false}>
                <Button rounded={'full'} as="span" icon={<Plus className="w-4 h-4" />}>플레이리스트 만들기</Button>
            </Link>
        </div>
    )
}