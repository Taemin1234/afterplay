'use client';

import { useCallback, useEffect, useState } from 'react';
import { Search, X } from 'lucide-react';
import PollCard from '@/components/polls/PollCard';
import type { PollItemType, PollListItem } from '@/components/polls/types';

type PollListClientProps = {
  initialPolls: PollListItem[];
};

export default function PollListClient({ initialPolls }: PollListClientProps) {
  const [polls, setPolls] = useState<PollListItem[]>(initialPolls);
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
    loadPolls();
  }, [loadPolls]);

  return (
    <section className="mx-auto w-full max-w-6xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white sm:text-3xl">투표</h1>
          <p className="mt-2 text-sm text-slate-400">두 곡 또는 두 앨범 중 마음이 가는 쪽을 골라보세요.</p>
        </div>
        <div className="inline-flex w-fit rounded-md border border-white/10 bg-black/25 p-1">
          {[
            { value: 'ALL', label: '전체' },
            { value: 'TRACK', label: '노래' },
            { value: 'ALBUM', label: '앨범' },
          ].map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setItemType(option.value as 'ALL' | PollItemType)}
              className={`rounded px-3 py-1.5 text-sm transition-colors ${
                itemType === option.value ? 'bg-point text-black' : 'text-slate-300 hover:bg-white/10'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
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
      {isLoading ? <p className="py-8 text-center text-sm text-slate-400">투표 목록을 불러오는 중...</p> : null}
      {!isLoading && polls.length === 0 ? (
        <p className="rounded-lg border border-white/10 bg-bg2 py-12 text-center text-sm text-slate-500">표시할 투표가 없습니다.</p>
      ) : null}
      {!isLoading && polls.length > 0 ? (
        <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {polls.map((poll) => (
            <li key={poll.id}>
              <PollCard poll={poll} />
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
