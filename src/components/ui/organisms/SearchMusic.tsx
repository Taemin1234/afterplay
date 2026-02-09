"use client"

import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import SearchBar from '../molecules/SearchBar';

interface SearchMusicProps {
    searchQuery: string;
    setSearchQuery: (val: string) => void;
    searchType: 'track' | 'album';
    searchResults: any[];
    setSearchResults: (results: any[]) => void; 
    onSelect: (item: any) => void;
}

export default function SearchMusic ({searchQuery, setSearchQuery, searchType, searchResults, setSearchResults, onSelect } : SearchMusicProps) {
    return (
        <div>
            <SearchBar rounded='md' variant='form' placeholder= {searchType === 'track' ? "어떤 곡을 추가할까요?" : "어떤 앨범을 추가할까요?"} onChange={(e) => setSearchQuery(e.target.value)} value={searchQuery}/>
            {/* 검색 결과 리스트 */}
            <AnimatePresence>
                {searchResults.length > 0 && (
                    <motion.ul 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="w-full max-h-96 mt-1 bg-[#181818] border border-gray-800 rounded-md z-10 shadow-2xl overflow-hidden scroll-auto"
                    >
                        {searchResults.map((item) => (
                            <li 
                                key={item.id}
                                onClick={() => {
                                    onSelect(item);
                                    setSearchQuery('');
                                    setSearchResults([]);
                                }}
                                className="flex items-center gap-3 p-3 hover:bg-[#282828] cursor-pointer transition-colors"
                            >
                                <Image src={item.albumImageUrl} width={40} height={40} className="rounded shadow-md" alt={item.name} />
                                <div className="flex flex-col overflow-hidden">
                                    <span className="text-white text-sm font-medium truncate">{item.name}</span>
                                    <span className="text-gray-500 text-xs truncate">{item.artist}</span>
                                </div>
                            </li>
                        ))}
                    </motion.ul>
                )}
            </AnimatePresence>
        </div>
    )
}