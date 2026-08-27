'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronDown, Search, X } from 'lucide-react';
import Button from '@/components/ui/atoms/Button';
import TypeSelector from '@/components/ui/molecules/TypeSelector';
import PollCard from '@/components/polls/PollCard';
import type { PollItemType, PollListItem } from '@/components/polls/types';

type PollListClientProps = {
  initialPolls: PollListItem[];
};

const PAGE_SIZE = 16;
const POLLS_IMAGE_SIZES =
  '(min-width: 1280px) 163px, (min-width: 768px) calc(25vw - 34px), calc(50vw - 36px)';
const itemTypeOptions = [
  { value: 'ALL', label: '전체' },
  { value: 'TRACK', label: '노래' },
  { value: 'ALBUM', label: '앨범' },
] as const;

export default function PollListClient({ initialPolls }: PollListClientProps) {
  const didMount = useRef(false);
  const [polls, setPolls] = useState<PollListItem[]>(initialPolls);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [queryInput, setQueryInput] = useState('');
  const [query, setQuery] = useState('');
  const [itemType, setItemType] = useState<'ALL' | PollItemType>('ALL');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPolls = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({ take: '50' });
      if (query) params.set('q', query);
      if (itemType !== 'ALL') params.set('itemType', itemType);

      const response = await fetch(`/api/polls?${params.toString()}`, { cache: 'no-store' });
      if (!response.ok) throw new Error('투표 목록을 불러오지 못했습니다.');
      const data = (await response.json()) as PollListItem[];
      setPolls(data);
      setVisibleCount(PAGE_SIZE);
    } catch (e) {
      setError(e instanceof Error ? e.message : '투표 목록을 불러오지 못했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [itemType, query]);

  useEffect(() => {
    const timer = window.setTimeout(() => setQuery(queryInput.trim()), 250);
    return () => window.clearTimeout(timer);
  }, [queryInput]);

  useEffect(() => {
    if (!didMount.current) {
      didMount.current = true;
      return;
    }

    void loadPolls();
  }, [loadPolls]);

  return (
    <section className="mx-auto w-full max-w-6xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white sm:text-3xl">Peak n&apos; Pick</h1>
          <p className="mt-2 text-sm text-slate-400">오늘의 취향을 pick해주세요</p>
        </div>
        <TypeSelector
          name="poll-item-type"
          value={itemType}
          options={itemTypeOptions}
          onChange={setItemType}
          ariaLabel="투표 항목 유형 선택"
          variant="subtle"
        />
      </div>

      <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-bg2 px-3">
        <Search className="h-4 w-4 text-slate-500" />
        <input
          value={queryInput}
          onChange={(e) => setQueryInput(e.target.value)}
          placeholder="곡 제목, 앨범명, 아티스트 검색"
          className="h-12 min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
        />
        {queryInput ? (
          <button type="button" onClick={() => setQueryInput('')} className="rounded p-1 text-slate-400 hover:bg-white/10">
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      {error ? <p className="rounded-md border border-red-500/30 bg-red-950/20 px-3 py-2 text-sm text-red-200">{error}</p> : null}
      {isLoading ? <p className="py-8 text-center text-sm text-slate-400">목록을 불러오는 중...</p> : null}
      {!isLoading && polls.length === 0 ? (
        <p className="rounded-lg border border-white/10 bg-bg2 py-12 text-center text-sm text-slate-500">아직 내용이 없어요. 조금만 기다려주세요</p>
      ) : null}
      {!isLoading && polls.length > 0 ? (
        <>
          <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {polls.slice(0, visibleCount).map((poll, index) => (
              <li key={poll.id}>
                <PollCard
                  poll={poll}
                  imageSizes={POLLS_IMAGE_SIZES}
                  preloadImages={index === 0}
                />
              </li>
            ))}
          </ul>
          {visibleCount < polls.length ? (
            <div className="flex justify-center pt-2">
              <Button
                variant="outline"
                rounded="md"
                onClick={() => setVisibleCount((count) => Math.min(count + PAGE_SIZE, polls.length))}
                icon={<ChevronDown size={18} />}
                className="bg-app-bg/70 px-5"
              >
                더보기
              </Button>
            </div>
          ) : null}
        </>
      ) : null}
    </section>
  );
}
