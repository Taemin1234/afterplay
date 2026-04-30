'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

import SearchBar from '@/components/ui/molecules/SearchBar';
import TypeSelector from '@/components/ui/molecules/TypeSelector';
import type { MusicListItem } from '@/types';

type SearchTab = 'content' | 'tag' | 'music' | 'user';

// 유저검색 타입
type SearchUserItem = {
  id: string;
  nickname: string;
  nicknameSlug: string | null;
  avatarUrl: string | null;
};

// api 응답 전체타입
type SearchResponse = {
  content: MusicListItem[];
  tag: MusicListItem[];
  music: MusicListItem[];
  users: SearchUserItem[];
};

const tabOptions = [
  { value: 'content', label: '게시글 내용' },
  { value: 'tag', label: '태그' },
  { value: 'music', label: '노래/앨범/가수' },
  { value: 'user', label: '사용자' },
] as const;

// 타입 가드
function isSearchTab(value: string | null): value is SearchTab {
  return value === 'content' || value === 'tag' || value === 'music' || value === 'user';
}

// 게시글 결과 표시 컴포넌트
function SearchPostList({ items }: { items: MusicListItem[] }) {
  if (items.length === 0) {
    return <p className='rounded-lg border border-white/10 bg-white/5 p-6 text-sm text-slate-400'>검색 결과가 없습니다.</p>;
  }

  return (
    <ul className='space-y-3'>
      {items.map((item) => {
        const href = item.kind === 'PLAYLIST' ? `/playlist/${item.id}` : `/albumlist/${item.id}`;
        const badge = item.kind === 'PLAYLIST' ? 'PLAYLIST' : 'ALBUMLIST';

        return (
          <li key={`${item.kind}-${item.id}`}>
            <Link
              href={href}
              className='block rounded-lg border border-white/10 bg-white/5 p-4 transition-colors hover:border-[#39ff14]/40'
            >
              <div className='mb-2 flex items-center justify-between gap-2 text-xs text-slate-400'>
                <span className='rounded-full border border-[#39ff14]/30 px-2 py-0.5 text-[#39ff14]'>{badge}</span>
                <span>{new Date(item.createdAt).toLocaleDateString('ko-KR')}</span>
              </div>
              <h3 className='line-clamp-1 text-base font-semibold text-white'>{item.title}</h3>
              <p className='mt-1 line-clamp-2 text-sm text-slate-300'>{item.story}</p>
              <div className='mt-3 flex flex-wrap gap-2'>
                {item.tags.slice(0, 4).map((tag) => (
                  <span key={tag} className='rounded-full bg-[#39ff14]/10 px-2 py-0.5 text-xs text-[#39ff14]'>
                    #{tag}
                  </span>
                ))}
              </div>
              <p className='mt-3 text-xs text-slate-400'>작성자: {item.authorNickname ?? '탈퇴한 사용자'}</p>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

// 유저 결과 컴포넌트
function SearchUserList({ items }: { items: SearchUserItem[] }) {
  if (items.length === 0) {
    return <p className='rounded-lg border border-white/10 bg-white/5 p-6 text-sm text-slate-400'>검색 결과가 없습니다.</p>;
  }

  return (
    <ul className='space-y-2'>
      {items.map((user) => {
        const href = user.nicknameSlug ? `/profile/${encodeURIComponent(user.nicknameSlug)}` : '#';

        return (
          <li key={user.id}>
            <Link
              href={href}
              className='flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 p-3 transition-colors hover:border-[#39ff14]/40'
            >
              <div className='flex h-10 w-10 items-center justify-center rounded-full bg-slate-700 text-sm text-white'>
                {user.nickname.slice(0, 1).toUpperCase()}
              </div>
              <div>
                <p className='text-sm font-medium text-white'>{user.nickname}</p>
                <p className='text-xs text-slate-400'>프로필 보기</p>
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function SearchLoadingStatus() {
  return (
    <div className='flex items-center gap-2 text-sm text-slate-400' role='status' aria-live='polite' aria-label='검색 결과를 불러오는 중'>
      <span className='relative flex h-4 w-4'>
        <span className='absolute inline-flex h-full w-full animate-ping rounded-full bg-[#39ff14]/35' />
        <span className='relative inline-flex h-4 w-4 rounded-full border border-[#39ff14]/70 bg-[#39ff14]/20' />
      </span>
      <span className='h-4 w-20 animate-pulse rounded bg-white/10' />
    </div>
  );
}

function SearchPostSkeleton() {
  return (
    <li className='rounded-lg border border-white/10 bg-white/5 p-4'>
      <div className='animate-pulse space-y-3'>
        <div className='flex items-center justify-between gap-2'>
          <div className='h-5 w-20 rounded-full bg-[#39ff14]/15' />
          <div className='h-4 w-16 rounded bg-white/10' />
        </div>
        <div className='space-y-2'>
          <div className='h-5 w-3/5 rounded bg-white/10' />
          <div className='h-4 w-full rounded bg-white/10' />
          <div className='h-4 w-4/5 rounded bg-white/10' />
        </div>
        <div className='flex gap-2'>
          <div className='h-5 w-14 rounded-full bg-[#39ff14]/10' />
          <div className='h-5 w-16 rounded-full bg-[#39ff14]/10' />
          <div className='h-5 w-12 rounded-full bg-[#39ff14]/10' />
        </div>
        <div className='h-4 w-28 rounded bg-white/10' />
      </div>
    </li>
  );
}

function SearchUserSkeleton() {
  return (
    <li className='flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 p-3'>
      <div className='h-10 w-10 animate-pulse rounded-full bg-white/10' />
      <div className='animate-pulse space-y-2'>
        <div className='h-4 w-24 rounded bg-white/10' />
        <div className='h-3 w-16 rounded bg-white/10' />
      </div>
    </li>
  );
}

function SearchResultsSkeleton({ tab }: { tab: SearchTab }) {
  const isUserTab = tab === 'user';

  return (
    <ul className={isUserTab ? 'space-y-2' : 'space-y-3'} aria-label='검색 결과 로딩'>
      {Array.from({ length: isUserTab ? 4 : 3 }).map((_, index) =>
        isUserTab ? <SearchUserSkeleton key={`search-user-skeleton-${index}`} /> : <SearchPostSkeleton key={`search-post-skeleton-${index}`} />
      )}
    </ul>
  );
}

export default function SearchPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // 초기 쿼리스트링 설정
  const initialQuery = searchParams.get('q') ?? '';
  const tabParam = searchParams.get('tab');
  const initialTab: SearchTab = isSearchTab(tabParam) ? tabParam : 'content';

  const [query, setQuery] = useState(initialQuery);
  const [tab, setTab] = useState<SearchTab>(initialTab);
  const [results, setResults] = useState<SearchResponse>({ content: [], tag: [], music: [], users: [] });
  const [isLoading, setIsLoading] = useState(false);

  // 쿼리값 변경 시 재설정
  useEffect(() => {
    setQuery(initialQuery);
    setTab(initialTab);
  }, [initialQuery, initialTab]);

  // api 호출
  useEffect(() => {
    // 공백제거
    const normalized = query.trim();

    // 두글자이상만 요청
    if (normalized.length < 2) {
      setResults({ content: [], tag: [], music: [], users: [] });
      setIsLoading(false);
      return;
    }

    // 디바운스로 입력할때마다 요청 방지
    const controller = new AbortController();

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams({
          q: normalized,
          tab,
        });
        const response = await fetch(`/api/search?${params.toString()}`, {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error('Search failed');
        const data: SearchResponse = await response.json();
        setResults((prev) => ({ ...prev, ...data }));
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') return;
        setResults({ content: [], tag: [], music: [], users: [] });
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, tab]);

  const updateUrl = (nextQuery: string, nextTab: SearchTab) => {
    const trimmed = nextQuery.trim();
    const params = new URLSearchParams();

    if (trimmed) params.set('q', trimmed);
    params.set('tab', nextTab);

    router.push(`/search?${params.toString()}`);
  };

  const handleSearchSubmit = () => {
    updateUrl(query, tab);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    handleSearchSubmit();
  };

  // 탭 변경
  const handleTabChange = (nextTab: SearchTab) => {
    setTab(nextTab);
    updateUrl(query, nextTab);
  };

  // 탭 결과 개수 계산
  const currentCount = useMemo(() => {
    if (tab === 'content') return results.content.length;
    if (tab === 'tag') return results.tag.length;
    if (tab === 'music') return results.music.length;
    return results.users.length;
  }, [results, tab]);

  return (
    <section className='mx-auto w-full max-w-3xl space-y-4'>
      <div className='space-y-3 rounded-xl border border-white/10 bg-black/20 p-3 sm:p-4'>
        <SearchBar
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onClear={() => setQuery('')}
          onClick={handleSearchSubmit}
          onKeyDown={handleSearchKeyDown}
          placeholder='게시글 제목/내용, 태그, 닉네임 검색'
          autoFocus
        />

        <TypeSelector
          name='search-tab'
          value={tab}
          options={tabOptions}
          onChange={handleTabChange}
          ariaLabel='검색 결과 탭'
          variant='subtle'
          size='sm'
          className='w-full'
        />
      </div>

      {query.trim().length < 2 ? (
        <p className='text-sm text-slate-400'>2글자 이상 입력하면 검색됩니다.</p>
      ) : isLoading ? (
        <SearchLoadingStatus />
      ) : (
        <p className='text-sm text-slate-400'>{currentCount}개 결과</p>
      )}

      {isLoading ? (
        <SearchResultsSkeleton tab={tab} />
      ) : (
        <>
          {tab === 'content' && <SearchPostList items={results.content} />}
          {tab === 'tag' && <SearchPostList items={results.tag} />}
          {tab === 'music' && <SearchPostList items={results.music} />}
          {tab === 'user' && <SearchUserList items={results.users} />}
        </>
      )}
    </section>
  );
}
