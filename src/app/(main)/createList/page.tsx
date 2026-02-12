'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Music, Trash2, Disc } from 'lucide-react';
import Image from 'next/image';

import ModalWrap from '@/components/ui/molecules/ModalWrap';
import Button from '@/components/ui/atoms/Button';
import Input from '@/components/ui/atoms/Input';
import Textarea from '@/components/ui/atoms/Textarea';
import IconButton from '@/components/ui/atoms/IconButton';
import SearchBar from '@/components/ui/molecules/SearchBar';
import SearchMusic from '@/components/ui/organisms/SearchMusic';

interface MusicItem {
  id: string;
  name: string;
  artist: string;
  albumImageUrl: string;
}

interface ItunesResult {
  trackId?: number;
  collectionId?: number;
  trackName?: string;
  collectionName?: string;
  artistName?: string;
  artworkUrl100?: string;
}

type SearchType = 'track' | 'album';

interface CreatedListProps {
  title: string;
  initialData?: { title: string; content: string }; // 수정 시 데이터
  onSave?: (data: unknown) => void;
}

export default function CreatedList({ title, initialData }: CreatedListProps) {
  const router = useRouter();

  const [searchType, setSearchType] = useState<SearchType>('track');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<MusicItem[]>([]);
  const [selectedMusic, setSelectedMusic] = useState<MusicItem[] | null>(null);
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

  const handleDeleteMusic = (id: string) => {
    setSelectedMusic((prev) => (prev ? prev.filter((item) => item.id !== id) : null));
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.length > 1) {
        try {
          // 1. 우리 앱의 내부 API Route 호출
          // type은 'track' 또는 'album' (Spotify 표준 파라미터)
          const res = await fetch(
            `/api/music/search?q=${encodeURIComponent(searchQuery)}&type=${searchType}`
          );
          
          if (!res.ok) throw new Error('Network response was not ok');
  
          // 2. 서버에서 이미 MusicItem[] 형태로 가공해준 데이터를 받음
          const mapped: MusicItem[] = await res.json();
  
          setSearchResults(mapped);
        } catch (error) {
          console.error("Spotify Search error:", error);
          setSearchResults([]);
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
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all cursor-pointer ${searchType === 'track'
              ? 'bg-[#39FF14] text-black'
              : 'text-gray-500 hover:text-white'
              }`}
          >
            <Music size={16} /> 곡 검색
          </button>
          <button
            type="button"
            onClick={() => handleTypeChange('album')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all cursor-pointer ${searchType === 'album'
              ? 'bg-[#39FF14] text-black'
              : 'text-gray-500 hover:text-white'
              }`}
          >
            <Disc size={16} /> 앨범 검색
          </button>
        </div>
        <form className="space-y-4 mt-4">
          <Input placeholder={searchType === 'track' ? "플레이리스트 제목" : "앨범 리스트 제목"} value={form.title} onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))} />
          <Textarea value={form.story} placeholder="이야기를 들려주세요" onChange={(e) => setForm((prev) => ({ ...prev, story: e.target.value }))} />

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
                      <IconButton icon={<Trash2 size={18} />} onClick={() => handleDeleteMusic(musicItem.id)} />
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
          <SearchMusic
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            searchType={searchType}
            searchResults={searchResults}
            setSearchResults={setSearchResults}
            onClose={onHandleModal}
            onSelect={(item) => {
              setSelectedMusic([...(selectedMusic ?? []), item]);
              onHandleModal();
            }}
          />
        </ModalWrap>}
    </div>
  );
}