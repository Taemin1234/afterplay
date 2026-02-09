'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Search, Music, Trash2, Disc, CheckCircle2 } from 'lucide-react';
import Image from 'next/image';

import ModalWrap from '@/components/ui/molecules/ModalWrap';
import Button from '@/components/ui/atoms/Button';
import Input from '@/components/ui/atoms/Input';
import Textarea from '@/components/ui/atoms/Textarea';
import SearchBar from '@/components/ui/molecules/SearchBar';
import SearchMusic from '@/components/ui/organisms/SearchMusic';

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
  const [selectedMusic, setSelectedMusic] = useState<MusicItem[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [form, setForm] = useState({
    title: initialData?.title ?? "",
    story: initialData?.content ?? "",
  });

  // 검색 타입 변경 시 이전 결과 초기화
  const handleTypeChange = (type: SearchType) => {
      setSearchType(type);
      setSearchQuery('');
      setSearchResults([]);
      setSelectedMusic([]);
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
        <form className="space-y-4 mt-4">
          <Input placeholder={searchType === 'track' ? "플레이리스트 제목" : "앨범 리스트 제목"} value={form.title} onChange={(e) => setForm((prev) => ({...prev, title:e.target.value}))}/>
          <Textarea value={form.story} placeholder="이야기를 들려주세요" onChange={(e) => setForm((prev) => ({...prev, story:e.target.value}))}/>

            {/* --- 음악 검색 섹션 --- */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-400 flex items-center gap-2">
                {searchType === 'track' ? <Music size={16} /> : <Disc size={16} />}
                {searchType === 'track' ? '노래를 추가해주세요' : '앨범을 추가해주세요'}
            </label>

            <div className="relative">
              <SearchBar rounded='md' variant='form' mode='ui' onClick={onHandleModal} />
              
                {selectedMusic ? (
                    <motion.ul 
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="flex flex-col gap-2 mt-2"
                    >
                      {selectedMusic.map((musicItem) => (
                        <li key={musicItem.id} className="flex items-center justify-between p-3 bg-[#1DB954]/10 border border-[#1DB954]/30 rounded-md">
                            <div className="flex items-center gap-3">
                              <Image src={musicItem.albumImageUrl} width={48} height={48} className="rounded shadow-lg" alt={musicItem.name} />
                              <div>
                                  <div className="text-white font-bold text-sm">{musicItem.name}</div>
                                  <div className="text-gray-400 text-xs">{musicItem.artist}</div>
                              </div>
                          </div>
                          <button 
                            type="button" 
                            onClick={() => setSelectedMusic(null)}
                            className="text-gray-500 hover:text-red-500 p-2 transition-colors"
                          >
                            <Trash2 size={18} />
                          </button>
                        </li>
                      ))}
                    </motion.ul>
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
      {isModalOpen && 
        <ModalWrap onClose={onHandleModal}>
          <SearchMusic searchQuery={searchQuery} setSearchQuery={setSearchQuery} searchType={searchType} searchResults={searchResults} setSearchResults={setSearchResults} onSelect={(item) => { setSelectedMusic([...(selectedMusic ?? []), item]); onHandleModal(); }}/>
        </ModalWrap>}
    </div>
  );
}