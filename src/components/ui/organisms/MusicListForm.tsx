'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion, Reorder } from 'framer-motion';
import { Disc, GripVertical, LockKeyhole, LockKeyholeOpen, Music, Trash2, X } from 'lucide-react';
import Image from 'next/image';
import Button from '@/components/ui/atoms/Button';
import IconButton from '@/components/ui/atoms/IconButton';
import Input from '@/components/ui/atoms/Input';
import Textarea from '@/components/ui/atoms/Textarea';
import ModalWrap from '@/components/ui/molecules/ModalWrap';
import SearchBar from '@/components/ui/molecules/SearchBar';
import TypeSelector from '@/components/ui/molecules/TypeSelector';
import SearchMusic from '@/components/ui/organisms/SearchMusic';

type SearchType = 'track' | 'album';
type Visibility = 'PUBLIC' | 'PRIVATE';
type SubmitMethod = 'POST' | 'PATCH';

export interface MusicListFormItem {
  id: string;
  name: string;
  artist: string;
  albumImageUrl: string;
}

export interface MusicListFormValues {
  title: string;
  story: string;
  visibility: Visibility;
  tags: string[];
  musicItems: MusicListFormItem[];
}

interface MusicListFormProps {
  pageTitle?: string;
  submitLabel?: string;
  initialType?: SearchType;
  initialValues?: Partial<MusicListFormValues>;
  lockType?: boolean;
  submitMethod?: SubmitMethod;
  submitEndpoint?: string;
  successRedirectPath?: string;
}

const typeOptions = [
  { value: 'track', label: '플레이리스트', icon: <Music size={16} /> },
  { value: 'album', label: '앨범리스트', icon: <Disc size={16} /> },
] as const;

export default function MusicListForm({
  pageTitle = '새 리스트 만들기',
  submitLabel = '등록하기',
  initialType = 'track',
  initialValues,
  lockType = false,
  submitMethod = 'POST',
  submitEndpoint,
  successRedirectPath = '/mypage',
}: MusicListFormProps) {
  const router = useRouter();

  const [searchType, setSearchType] = useState<SearchType>(initialType);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<MusicListFormItem[]>([]);
  const [selectedMusic, setSelectedMusic] = useState<MusicListFormItem[]>(initialValues?.musicItems ?? []);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [form, setForm] = useState({
    title: initialValues?.title ?? '',
    story: initialValues?.story ?? '',
    visibility: initialValues?.visibility ?? ('PUBLIC' as Visibility),
    tags: initialValues?.tags ?? [],
  });

  const endpoint = useMemo(() => {
    if (submitEndpoint) return submitEndpoint;
    return searchType === 'track' ? '/api/music/playlist' : '/api/music/albumlist';
  }, [searchType, submitEndpoint]);

  const handleTypeChange = (type: SearchType) => {
    if (lockType) return;
    setSearchType(type);
    setSearchQuery('');
    setSearchResults([]);
    setSelectedMusic([]);
  };

  const handleToggleModal = () => {
    setIsModalOpen((prev) => !prev);
  };

  const handleDeleteMusic = (id: string) => {
    setSelectedMusic((prev) => prev.filter((item) => item.id !== id));
  };

  const handleSelectMusic = (item: MusicListFormItem) => {
    setSelectedMusic((prev) => {
      if (prev.some((music) => music.id === item.id)) return prev;
      return [...prev, item];
    });
    setIsModalOpen(false);
  };

  const handleAddTag = () => {
    const tag = tagInput.trim();
    if (!tag) return;

    setForm((prev) => {
      if (prev.tags.includes(tag)) return prev;
      if (prev.tags.length >= 10) {
        alert('태그는 최대 10개까지 입력할 수 있습니다.');
        return prev;
      }
      return { ...prev, tags: [...prev.tags, tag] };
    });

    setTagInput('');
  };

  const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    handleAddTag();
  };

  const handleRemoveTag = (indexToRemove: number) => {
    setForm((prev) => ({
      ...prev,
      tags: prev.tags.filter((_, index) => index !== indexToRemove),
    }));
  };

  const handleToggleVisibility = () => {
    setForm((prev) => ({
      ...prev,
      visibility: prev.visibility === 'PUBLIC' ? 'PRIVATE' : 'PUBLIC',
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.title.trim() || !form.story.trim() || selectedMusic.length === 0) {
      alert('제목, 내용, 음악을 모두 입력해주세요.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(endpoint, {
        method: submitMethod,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          type: searchType,
          musicItems: selectedMusic,
        }),
      });

      const text = await response.text();
      if (!response.ok) throw new Error(text || 'request failed');

      alert(submitMethod === 'PATCH' ? '리스트가 수정되었습니다.' : '리스트가 저장되었습니다.');
      router.push(successRedirectPath);
      router.refresh();
    } catch (error) {
      console.error(error);
      alert(submitMethod === 'PATCH' ? '수정 중 오류가 발생했습니다.' : '저장 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 767px)');
    const updateViewport = () => setIsMobileViewport(mediaQuery.matches);
    updateViewport();

    mediaQuery.addEventListener('change', updateViewport);
    return () => mediaQuery.removeEventListener('change', updateViewport);
  }, []);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.trim().length < 2) {
        setSearchResults([]);
        return;
      }

      try {
        const response = await fetch(
          `/api/music/search?q=${encodeURIComponent(searchQuery)}&type=${searchType}`
        );
        if (!response.ok) throw new Error('search failed');
        const mapped: MusicListFormItem[] = await response.json();
        setSearchResults(mapped);
      } catch (error) {
        console.error(error);
        setSearchResults([]);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery, searchType]);

  return (
    <div className="flex items-center justify-center">
      <motion.div className="relative w-full rounded-2xl border border-gray-800 bg-[#121212] py-5 px-3 md:p-8">
        <h2 className="mb-6 font-sans text-2xl font-bold text-neon-green">{pageTitle}</h2>

        <div className="flex flex-col items-end justify-between sm:flex-row sm:items-center">
          <div className={`w-full ${lockType ? 'pointer-events-none opacity-70' : ''}`}>
            <TypeSelector
              name="searchType"
              ariaLabel="리스트 유형 선택"
              value={searchType}
              options={typeOptions}
              onChange={handleTypeChange}
              className='w-full sm:max-w-fit'
            />
          </div>

          <div className="flex mt-2 items-center justify-between gap-1.5 px-1 sm:mt-0">
            <p className="shrink-0 text-sm font-medium text-white">비밀글</p>

            <label className="relative inline-flex cursor-pointer items-center">
              <input
                type="checkbox"
                className="sr-only"
                checked={form.visibility === 'PRIVATE'}
                onChange={handleToggleVisibility}
                aria-label="비밀글 설정"
              />

              <div
                className={`relative flex h-8 w-14 items-center rounded-full p-1 transition-colors duration-300 ${form.visibility === 'PUBLIC' ? 'bg-gray-800' : 'bg-neon-green/30'}`}
              >
                <motion.div
                  className={`flex h-6 w-6 items-center justify-center rounded-full shadow-md ${form.visibility === 'PUBLIC' ? 'bg-gray-600' : 'bg-neon-green/30'}`}
                  layout
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  initial={false}
                  animate={{ x: form.visibility === 'PUBLIC' ? 0 : 24 }}
                >
                  {form.visibility === 'PUBLIC' ? <LockKeyholeOpen size={16} /> : <LockKeyhole size={16} />}
                </motion.div>
              </div>
            </label>
          </div>
        </div>

        <form className="mt-4 space-y-4" onSubmit={handleSave}>
          <Input
            placeholder={searchType === 'track' ? '플레이리스트 제목' : '앨범리스트 제목'}
            value={form.title}
            onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
          />
          <Textarea
            value={form.story}
            placeholder="리스트 설명을 입력해주세요."
            onChange={(e) => setForm((prev) => ({ ...prev, story: e.target.value }))}
          />

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-400">태그 (최대 10개)</label>
            <div className="mt-3">
              <SearchBar
                variant="form"
                placeholder="태그를 입력해주세요"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onClear={() => setTagInput('')}
                onClick={handleAddTag}
                onKeyDown={handleTagInputKeyDown}
              />
            </div>

            <div className="mb-2 flex flex-wrap gap-2">
              <AnimatePresence>
                {form.tags.map((tag, index) => (
                  <motion.span
                    key={`${tag}-${index}`}
                    layout
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="flex items-center gap-1 rounded-full border border-neon-green/30 bg-neon-green/10 px-3 py-1 text-sm text-neon-green"
                  >
                    #{tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(index)}
                      className="cursor-pointer transition-colors hover:text-white"
                    >
                      <Trash2 size={12} className="ml-1" />
                    </button>
                  </motion.span>
                ))}
              </AnimatePresence>
            </div>
          </div>

          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-400">
              {searchType === 'track' ? <Music size={16} /> : <Disc size={16} />}
              {searchType === 'track' ? '곡 추가' : '앨범 추가'}
            </label>

            <div className="relative">
              <SearchBar rounded="md" variant="form" mode="ui" onClick={handleToggleModal} />

              {selectedMusic.length > 0 && (
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="mt-2"
                >
                  <Reorder.Group
                    axis="y"
                    values={selectedMusic}
                    onReorder={setSelectedMusic}
                    className="flex flex-col gap-2"
                  >
                    {selectedMusic.map((musicItem) => (
                      <Reorder.Item
                        key={musicItem.id}
                        value={musicItem}
                        className="flex cursor-grab items-center justify-between rounded-md border border-[#1DB954]/30 bg-[#1DB954]/10 p-3 active:cursor-grabbing"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <GripVertical size={16} className="shrink-0 text-gray-400" />
                          <Image
                            src={musicItem.albumImageUrl}
                            width={48}
                            height={48}
                            className="rounded shadow-lg"
                            alt={musicItem.name}
                          />
                          <div className="min-w-0">
                            <div className="truncate text-sm font-bold text-white">{musicItem.name}</div>
                            <div className="truncate text-xs text-gray-400">{musicItem.artist}</div>
                          </div>
                        </div>
                        <IconButton icon={<Trash2 size={18} />} onClick={() => handleDeleteMusic(musicItem.id)} />
                      </Reorder.Item>
                    ))}
                  </Reorder.Group>
                </motion.div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => router.back()}>
                취소
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? '처리 중...' : submitLabel}
              </Button>
            </div>
          </div>
        </form>
      </motion.div>

      {isModalOpen &&
        (isMobileViewport ? (
          <div className="fixed inset-0 z-60 overflow-y-auto bg-[#070b16] px-4 py-4 sm:px-6 sm:py-6">
            <div className="mx-auto w-full max-w-2xl h-full">
              <div className="absolute right-6 top-6 z-70">
                <IconButton
                  icon={<X size={18} />}
                  onClick={handleToggleModal}
                  className="border-white/15 text-white hover:bg-white/10 text-[0px]"
                />
              </div>
              <SearchMusic
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                searchType={searchType}
                searchResults={searchResults}
                setSearchResults={setSearchResults}
                onClose={handleToggleModal}
                onSelect={handleSelectMusic}
              />
            </div>
          </div>
        ) : (
          <ModalWrap onClose={handleToggleModal} showCloseButton panelClassName="h-full">
            <SearchMusic
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              searchType={searchType}
              searchResults={searchResults}
              setSearchResults={setSearchResults}
              onClose={handleToggleModal}
              onSelect={handleSelectMusic}
            />
          </ModalWrap>
        ))}
    </div>
  );
}
