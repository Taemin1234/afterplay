'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Music, Trash2, Disc, CheckCircle2 } from 'lucide-react';

import ModalWrap from '@/components/ui/molecules/ModalWrap';
import Button from '@/components/ui/atoms/Button';

interface MusicItem {
    id: string;
    name: string;
    artist: string;
    albumImageUrl: string;
}

type SearchType = 'track' | 'album';

interface CreatedListProps {
  title: string;
  initialData?: { title: string; content: string }; // 수정 시 데이터
  onSave?: (data: unknown) => void;
}

export default function CreatedList({ title, initialData, onSave }: CreatedListProps) {
  const router = useRouter();

  const [searchType, setSearchType] = useState<SearchType>('track');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<MusicItem[]>([]);
  const [selectedMusic, setSelectedMusic] = useState<MusicItem | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

    // 검색 타입 변경 시 이전 결과 초기화
    const handleTypeChange = (type: SearchType) => {
        setSearchType(type);
        setSearchQuery('');
        setSearchResults([]);
        setSelectedMusic(null);
    };

    const onHandleModal = () => {
        setIsModalOpen(!isModalOpen);
      };

  // 검색 로직 (iTunes API 활용)
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.length > 1) {
        setIsSearching(true);
        try {
          // searchType이 track이면 song, 아니면 album으로 검색
          const entity = searchType === 'track' ? 'song' : 'album';
          const res = await fetch(
            `https://itunes.apple.com/search?term=${encodeURIComponent(searchQuery)}&entity=${entity}&limit=10`
          );
          const data = await res.json();    
          
          const mapped = data.results.map((item: any) => ({
            // 앨범일 경우 collectionId, 곡일 경우 trackId 사용
            id: (searchType === 'track' ? item.trackId : item.collectionId).toString(),
            // 앨범일 경우 collectionName, 곡일 경우 trackName 사용
            name: searchType === 'track' ? item.trackName : item.collectionName,
            artist: item.artistName,
            albumImageUrl: item.artworkUrl100,
          }));
          setSearchResults(mapped);
        } catch (error) {
          console.error("Search error:", error);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults([]);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, searchType]);


  return (
    <div className="flex items-center justify-center">
      <motion.div 
        className="relative w-full bg-[#121212] border border-gray-800 p-8 rounded-2xl"
      >
        <h2 className="text-2xl font-bold font-sans text-neon-green mb-6">{title} 제목을 입력해주세요</h2>

        <div className="flex gap-4 p-1 bg-black rounded-lg border border-gray-800 w-fit">
            <button
                type="button"
                onClick={() => handleTypeChange('track')}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                searchType === 'track' 
                ? 'bg-[#39FF14] text-black' 
                : 'text-gray-500 hover:text-white'
                }`}
            >
                <Music size={16} /> 곡 검색
            </button>
            <button
                type="button"
                onClick={() => handleTypeChange('album')}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                searchType === 'album' 
                ? 'bg-[#39FF14] text-black' 
                : 'text-gray-500 hover:text-white'
                }`}
            >
                <Disc size={16} /> 앨범 검색
            </button>
        </div>
        <form className="space-y-4">
        
          <input 
            defaultValue={initialData?.title}
            placeholder={searchType === 'track' ? "플레이리스트 제목" : "앨범 리스트 제목"}
            className="w-full bg-black border border-gray-800 p-3 rounded-md text-white outline-none focus:border-neon-green"
          />
          <textarea 
            defaultValue={initialData?.content}
            placeholder="이야기를 들려주세요"
            className="w-full h-52 bg-black border border-gray-800 p-3 rounded-md text-white outline-none focus:border-neon-green resize-none"
          />

            {/* --- 음악 검색 섹션 --- */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-400 flex items-center gap-2">
                {searchType === 'track' ? <Music size={16} /> : <Disc size={16} />}
                {searchType === 'track' ? '사연의 주인공이 될 곡' : '사연의 주인공이 될 앨범'}
            </label>

            <div className="relative">
                <Search onClick={onHandleModal} className="absolute left-3 top-3.5 text-gray-500" size={18} />
                <input 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  
                  placeholder={searchType === 'track' ? "어떤 곡을 추가할까요?" : "어떤 앨범을 추가할까요?"}
                  className="w-full bg-black border border-gray-800 p-3 pl-10 rounded-md text-white outline-none focus:border-[#39FF14]"
                />
                
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
                            setSelectedMusic(item);
                            setSearchQuery('');
                            setSearchResults([]);
                          }}
                          className="flex items-center gap-3 p-3 hover:bg-[#282828] cursor-pointer transition-colors"
                        >
                          <img src={item.albumImageUrl} className="w-10 h-10 rounded shadow-md" alt={item.name} />
                          <div className="flex flex-col overflow-hidden">
                            <span className="text-white text-sm font-medium truncate">{item.name}</span>
                            <span className="text-gray-500 text-xs truncate">{item.artist}</span>
                          </div>
                        </li>
                      ))}
                    </motion.ul>
                  )}
                </AnimatePresence>
              
                {selectedMusic ? (
                    <motion.div 
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="flex items-center justify-between p-3 bg-[#1DB954]/10 border border-[#1DB954]/30 rounded-md"
                    >
                        <div className="flex items-center gap-3">
                            <img src={selectedMusic.albumImageUrl} className="w-12 h-12 rounded shadow-lg" alt={selectedMusic.name} />
                            <div>
                                <div className="text-white font-bold text-sm">{selectedMusic.name}</div>
                                <div className="text-gray-400 text-xs">{selectedMusic.artist}</div>
                            </div>
                        </div>
                        <button 
                        type="button" 
                        onClick={() => setSelectedMusic(null)}
                        className="text-gray-500 hover:text-red-500 p-2 transition-colors"
                        >
                        <Trash2 size={18} />
                        </button>
                    </motion.div>
                ) : (
                    null
                )}
            </div>
             
          {/* ---------------------- */}
          
            <div className="flex justify-end gap-3 pt-4">
            {/* router.back()으로 모달을 닫습니다. */}
                <Button variant="outline" onClick={() => router.back()}>취소</Button>
                <Button>저장하기</Button>
            </div>
          </div>
        </form>
      </motion.div>
      {isModalOpen && <ModalWrap onClose={onHandleModal}><button onClick={onHandleModal}>닫기</button></ModalWrap>}
    </div>
  );
}