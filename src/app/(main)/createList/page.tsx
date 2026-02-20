'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Music, Trash2, Disc, LockKeyhole, LockKeyholeOpen } from 'lucide-react';
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
  const [tagInput, setTagInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [form, setForm] = useState({
    title: initialData?.title ?? "",
    story: initialData?.content ?? "",
    visibility: "PUBLIC" as "PUBLIC" | "PRIVATE",
    tags: [] as string[],
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

  const onSelectItem = (item:MusicItem) => {
    setSelectedMusic((prev) => {
      const current = prev ?? [];
  
      const isAlreadySelected = current.some(
        (music) => music.id === item.id
      );
  
      if (isAlreadySelected) return current; // 이미 있으면 그대로 반환
  
      return [...current, item]; // 없으면 추가
    });
  
    onHandleModal();
  }

  // 태그 추가 함수
  const handleAddTag = () => {
    const trimmedTag = tagInput.trim();
  
    if (!trimmedTag) return;
      
    setForm(prev => {
      if (prev.tags.includes(trimmedTag)) return prev;
      if (prev.tags.length >= 5) {
        alert("태그는 최대 5개까지 가능합니다.");
        return prev;
      }
  
      return {
        ...prev,
        tags: [...prev.tags, trimmedTag],
      };
    });
    setTagInput("");
  };

  // 엔터키 핸들러
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  // 태그 삭제 함수
  const handleRemoveTag = (indexToRemove: number) => {
    setForm(prev => ({
      ...prev,
      tags: prev.tags.filter((_, index) => index !== indexToRemove),
    }));
  };

  // 토글 함수
  const toggleVisibility = () => {
    setForm(prev => ({
      ...prev,
      visibility: prev.visibility === "PUBLIC" ? "PRIVATE" : "PUBLIC"
    }));
  };

  // 내용 저장
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault(); // 폼 제출 기본 동작 방지
  
    // 유효성 검사
    if (!form.title || !form.story || !selectedMusic || selectedMusic.length === 0) {
      alert("내용을 모두 추가해주세요!");
      return;
    }
  
    setIsLoading(true);

    const endpoint = searchType === "track" ? "/api/music/playlist" : "/api/music/albumlist";
  
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          type: searchType, // 'track' 또는 'album'
          musicItems: selectedMusic, // 선택한 음악 배열 전체
        }),
      });
  
      if (!response.ok) throw new Error('저장에 실패했습니다.');
  
      alert('성공적으로 저장되었습니다! 🎧');
      router.push('/mypage'); // 저장 후 마이페이지로 이동
      router.refresh(); // 데이터 최신화를 위해 페이지 갱신
    } catch (error) {
      console.error(error);
      alert('저장 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    //debounce로 spoitfy에 폭발적 요청 억제
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.length > 1) { // 검색어 2글자 이상
        try {
          // 우리 앱의 내부 API Route 호출(spotify 직접 호출 X)
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

        <div className='flex justify-between items-center'>
          <div
            className="flex gap-4 p-1 bg-black rounded-lg border border-gray-800 w-fit"
            role="radiogroup"
            aria-label="검색 타입 선택"
          >
            <label className="cursor-pointer">
              <input
                type="radio"
                name="searchType"
                value="track"
                className="sr-only"
                checked={searchType === "track"}
                onChange={() => handleTypeChange("track")}
              />
              <span
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  searchType === "track"
                    ? "bg-[#39FF14] text-black"
                    : "text-gray-500 hover:text-white"
                }`}
              >
                <Music size={16} /> 플레이리스트
              </span>
            </label>

            <label className="cursor-pointer">
              <input
                type="radio"
                name="searchType"
                value="album"
                className="sr-only"
                checked={searchType === "album"}
                onChange={() => handleTypeChange("album")}
              />
              <span
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  searchType === "album"
                    ? "bg-[#39FF14] text-black"
                    : "text-gray-500 hover:text-white"
                }`}
              >
                <Disc size={16} /> 앨범리스트
              </span>
            </label>
          </div>

          {/* 비밀글 설정 */}
          <div className="flex items-center justify-between mb-6 px-1 gap-1.5">
            <div className="flex flex-col">
              <span className="text-sm font-medium text-white">비밀글</span>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              {/* 실제 컨트롤 */}
              <input
                type="checkbox"
                className="sr-only"
                checked={form.visibility === "PRIVATE"}
                onChange={() => toggleVisibility()}
                aria-label="비밀글 설정"
              />

              {/* 토글 트랙 */}
              <div
                className={`relative w-14 h-8 flex items-center rounded-full p-1 transition-colors duration-300 ${
                  form.visibility === "PUBLIC" ? "bg-gray-800" : "bg-neon-green/30"
                }`}
              >
                {/* 움직이는 노브 */}
                <motion.div
                  className={`w-6 h-6 rounded-full shadow-md flex items-center justify-center ${
                    form.visibility === "PUBLIC" ? "bg-gray-600" : "bg-neon-green/30"
                  }`}
                  layout
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  initial={false}
                  animate={{ x: form.visibility === "PUBLIC" ? 0 : 24 }}
                >
                  {form.visibility === "PUBLIC" ? (
                    <LockKeyholeOpen size={16} />
                  ) : (
                    <LockKeyhole size={16} />
                  )}
                </motion.div>
              </div>
            </label>
          </div>
        </div>
        <form className="space-y-4 mt-4">
          <Input placeholder={searchType === 'track' ? "플레이리스트 제목" : "앨범 리스트 제목"} value={form.title} onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))} />
          <Textarea value={form.story} placeholder="이야기를 들려주세요" onChange={(e) => setForm((prev) => ({ ...prev, story: e.target.value }))} />

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-400">태그 (최대 5개)</label>

            <div className='mt-3'>
              <SearchBar variant='form' placeholder='태그를 입력해주세요' value={tagInput} onChange={(e) => setTagInput(e.target.value)} onClick={handleAddTag} onKeyDown={handleKeyDown}/>
            </div>
            
            <div className="flex flex-wrap gap-2 mb-2">
              <AnimatePresence>
                {form.tags.map((tag, index) => (
                  <motion.span
                    key={tag}
                    layout
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="flex items-center gap-1 px-3 py-1 bg-neon-green/10 border border-neon-green/30 text-neon-green text-sm rounded-full"
                  >
                    #{tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(index)}
                      className="hover:text-white transition-colors  cursor-pointer"
                    >
                      <Trash2 size={12} className="ml-1" />
                    </button>
                  </motion.span>
                ))}
              </AnimatePresence>
            </div>
          </div>

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
              <Button onClick={handleSave}>저장하기</Button>
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
            onSelect={onSelectItem}
          />
        </ModalWrap>}
    </div>
  );
}