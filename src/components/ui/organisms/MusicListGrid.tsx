'use client';

import ListItem from "@/components/ui/molecules/ListItem";
import TypeSelector from '@/components/ui/molecules/TypeSelector';
import type { MusicListItem } from "@/types";
import { Music, Disc, Headphones } from 'lucide-react';

import { useState } from 'react';

interface ListItemProps {
  items: MusicListItem[];
};

type SearchType = 'all' | 'track' | 'album';

const searchTypeOptionsAll = [
    { value: 'all', label: '전체', icon: <Headphones size={16} /> },
    { value: 'track', label: '플레이리스트', icon: <Music size={16} /> },
    { value: 'album', label: '앨범리스트', icon: <Disc size={16} /> },
] as const;

export default function MusicListGrid({items}: ListItemProps) {
    const [searchType, setSearchType] = useState<SearchType>('all');

    const aaa = (type: SearchType) => {
        console.log(type)
        setSearchType(type)
    }

    return (
        <div>
            <TypeSelector name="searchType" ariaLabel="타입 선택" value={searchType} options={searchTypeOptionsAll} onChange={aaa}/>
            <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 p-4">
            {items.map((item) => (
                <ListItem key={item.id} item={item} />
            ))}
            </ul>
        </div>
    )
}