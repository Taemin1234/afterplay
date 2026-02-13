"use client"

import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import IconButton from '../atoms/IconButton';
import SearchBar from '../molecules/SearchBar';
import { X } from 'lucide-react';

interface SearchMusicItem {
    id: string;
    name: string;
    artist: string;
    albumImageUrl: string;
}

interface SearchMusicProps {
    searchQuery: string;
    setSearchQuery: (val: string) => void;
    searchType: 'track' | 'album';
    searchResults: SearchMusicItem[];
    setSearchResults: (results: SearchMusicItem[]) => void;
    onSelect: (item: SearchMusicItem) => void;
    onClose?: () => void;
}

export default function SearchMusic({ searchQuery, setSearchQuery, searchType, searchResults, setSearchResults, onSelect, onClose }: SearchMusicProps) {
    return (
        <div className="relative h-full w-full rounded-2xl border border-white/10 bg-[#0f0f10] p-6 shadow-2xl sm:p-8">
            <div className="mb-5 flex w-full items-center justify-between gap-4">
                <div className="min-w-0">
                    <div className="text-base font-semibold text-white">
                        {searchType === 'track' ? '곡 추가' : '앨범 추가'}
                    </div>
                    <div className="mt-1 text-xs text-white/60">
                        검색 후 항목을 클릭하면 리스트에 추가됩니다.
                    </div>
                </div>
                <IconButton icon={<X size={20} />} variant='bg' onClick={onClose} />
            </div>

            <div className="w-full">
                <SearchBar
                    rounded="md"
                    variant="form"
                    placeholder={searchType === 'track' ? '어떤 곡을 추가할까요?' : '어떤 앨범을 추가할까요?'}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    value={searchQuery}
                    autoFocus={true}
                />
            </div>
            {/* 검색 결과 리스트 */}
            <AnimatePresence>
                {searchResults.length > 0 && (
                    <motion.ul
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="mt-4 w-full max-h-[80vh] overflow-y-auto rounded-xl border border-white/10 bg-[#151517] shadow-2xl"
                    >
                        {searchResults.map((item) => (
                            <li
                                key={item.id}
                                onClick={() => {
                                    onSelect(item);
                                    setSearchQuery('');
                                    setSearchResults([]);
                                }}
                                className="flex cursor-pointer items-center gap-3 px-4 py-3 transition-colors hover:bg-white/5"
                            >
                                <Image src={item.albumImageUrl} width={40} height={40} className="rounded shadow-md" alt={item.name} />
                                <div className="flex flex-col overflow-hidden">
                                    <span className="truncate text-sm font-medium text-white">{item.name}</span>
                                    <span className="truncate text-xs text-white/60">{item.artist}</span>
                                </div>
                            </li>
                        ))}
                    </motion.ul>
                )}
            </AnimatePresence>
        </div>
    )
}