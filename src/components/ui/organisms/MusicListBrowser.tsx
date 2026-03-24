'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Disc, Headphones, Music } from 'lucide-react';
import TypeSelector from '@/components/ui/molecules/TypeSelector';
import MusicListGrid from '@/components/ui/organisms/MusicListGrid';
import MusicListGridSkeleton from "@/components/layout/MusicListGridSkeleton";
import type { ListSortOption, ListType, MusicListItem, MusicListResponse, VisibilityScope } from '@/types';

type MusicListBrowserProps = {
  userId?: string;
  initialItems?: MusicListItem[];
  initialNextCursor?: string | null;
  initialType?: ListType;
  limit?: number;
  visibility?: VisibilityScope;
};

const typeOptions = [
  { value: 'all', label: '전체', icon: <Headphones size={16} /> },
  { value: 'playlist', label: '플레이리스트', icon: <Music size={16} /> },
  { value: 'albumlist', label: '앨범리스트', icon: <Disc size={16} /> },
] as const;

const sortOptions: Array<{ value: ListSortOption; label: string }> = [
  { value: 'latest', label: '최신순' },
  { value: 'likes', label: '좋아요순' },
];

export default function MusicListBrowser({
  userId,
  initialItems,
  initialNextCursor,
  initialType = 'all',
  limit = 16,
  visibility = 'public',
}: MusicListBrowserProps) {
  const [type, setType] = useState<ListType>(initialType);
  const [sort, setSort] = useState<ListSortOption>('latest');
  const [items, setItems] = useState<MusicListItem[]>(initialItems ?? []);
  const [isLoading, setIsLoading] = useState(initialItems === undefined);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(initialNextCursor ?? null);
  // 초기 서버 데이터가 있으면 다시 fetch 방지
  const hydratedRef = useRef(false);
  const cacheRef = useRef<Map<string, { items: MusicListItem[]; nextCursor: string | null }>>(new Map());
  // 무한 스크롤 감지 Dom
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const isFetchingMoreRef = useRef(false);
  const skeletonCount = Math.min(limit, 8)

  // 캐시 키 작성(탭 별로 다른 데이터 저장)
  const makeCacheKey = useCallback(
    (nextType: ListType, nextSort: ListSortOption) =>
      `${userId ?? 'home'}:${visibility}:${limit}:${nextType}:${nextSort}`,
    [userId, visibility, limit]
  );

  const createKey = useCallback((item: MusicListItem) => `${item.kind}:${item.id}`, []);

  // 기존 목록과 새항목은 합치고 중복은 제거
  const mergeItems = useCallback(
    (baseItems: MusicListItem[], appendedItems: MusicListItem[]) => {
      const seen = new Set(baseItems.map(createKey));
      const merged = [...baseItems];

      for (const item of appendedItems) {
        const key = createKey(item);
        if (seen.has(key)) continue;
        seen.add(key);
        merged.push(item);
      }

      return merged;
    },
    [createKey]
  );

  // 초기 데이터 캐시 저장
  useEffect(() => {
    if (!initialItems) return;
    cacheRef.current.set(makeCacheKey(initialType, 'latest'), {
      items: initialItems,
      nextCursor: initialNextCursor ?? null,
    });
  }, [initialItems, initialType, makeCacheKey, initialNextCursor]);

  useEffect(() => {
    const skipFirstFetch =
      !hydratedRef.current &&
      initialItems &&
      type === initialType &&
      sort === 'latest' &&
      initialItems.length > 0;
    hydratedRef.current = true;
    if (skipFirstFetch) return;

    // 탭 변경 시 캐시 먼저 확인
    // 있으면 setItems에 넣고 없으면 api 요청
    const cacheKey = makeCacheKey(type, sort);
    const cached = cacheRef.current.get(cacheKey);
    if (cached) {
      setItems(cached.items);
      setNextCursor(cached.nextCursor);
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();

    const load = async () => {
      try {
        setIsLoading(true);

        const baseUrl = userId ? `/api/users/${userId}/lists` : '/api/music/lists';
        const params = new URLSearchParams({
          type,
          sort,
          limit: String(limit),
        });

        if (userId) {
          params.set('visibility', visibility);
        }

        const res = await fetch(`${baseUrl}?${params.toString()}`, {
          cache: 'no-store',
          signal: controller.signal,
        });

        if (!res.ok) throw new Error('Failed to fetch list items');

        const data: MusicListResponse = await res.json();
        // 새로 fetch한 데이터도 캐시에 저장
        cacheRef.current.set(cacheKey, {
          items: data.items,
          nextCursor: data.nextCursor,
        });
        setItems(data.items);
        setNextCursor(data.nextCursor);
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') return;
        console.error('Failed to load list items:', error);
      } finally {
        setIsLoading(false);
      }
    };

    load();

    return () => controller.abort();
  }, [type, sort, userId, limit, visibility, initialItems, initialType, makeCacheKey]);

  // 다음 페이지 요청
  const fetchNextPage = useCallback(async () => {
    if (!nextCursor || isLoading || isFetchingMoreRef.current) return;

    isFetchingMoreRef.current = true; // 즉시 중복 요청 차단
    setIsFetchingMore(true); // UI용 로딩 상태 표시
    try {
      const baseUrl = userId ? `/api/users/${userId}/lists` : '/api/music/lists';
      // cursor 포함해서 fetch
      const params = new URLSearchParams({
        type,
        sort,
        limit: String(limit),
        cursor: nextCursor,
      });

      if (userId) {
        params.set('visibility', visibility);
      }

      const res = await fetch(`${baseUrl}?${params.toString()}`, {
        cache: 'no-store',
      });

      if (!res.ok) throw new Error('Failed to fetch next list items');

      const data: MusicListResponse = await res.json();
      // 다음 페이지를 가져온 후 캐시 업데이트
      setItems((prevItems) => {
        // 기존 목록과 병합
        const merged = mergeItems(prevItems, data.items);
        cacheRef.current.set(makeCacheKey(type, sort), {
          items: merged,
          nextCursor: data.nextCursor,
        });
        return merged;
      });
      setNextCursor(data.nextCursor);
    } catch (error) {
      console.error('Failed to load next list items:', error);
    } finally {
      isFetchingMoreRef.current = false;
      setIsFetchingMore(false);
    }
  }, [nextCursor, isLoading, userId, type, sort, limit, visibility, mergeItems, makeCacheKey]);

  // IntersectionObserver 등록
  useEffect(() => {
    const target = sentinelRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (!entry?.isIntersecting) return;
        void fetchNextPage();
      },
      { rootMargin: '180px 0px' }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [fetchNextPage, type, sort, items.length]);

  return (
    <>
      {/* <div className="sticky top-0 left-0 right-0 -mx-5 z-40 bg-[#0a0f1c]  md:hidden">
        <TypeSelector
            name={userId ? 'user-list-type-mobile' : 'home-list-type-mobile'}
            ariaLabel="List type mobile"
            value={type}
            options={typeOptions}
            onChange={setType}
            className="w-full text-2xl"
          />
      </div> */}
      <section className="relative space-y-4 sm:space-y-5 sm:pb-0">
        <div className="flex flex-col gap-3 sm:gap-4 md:flex-row md:items-center md:justify-between">
          <div className="w-full pb-1">
            <TypeSelector
              name={userId ? 'user-list-type' : 'home-list-type'}
              ariaLabel="List type"
              value={type}
              options={typeOptions}
              onChange={setType}
              className="w-full md:min-w-max"
            />
          </div>
          {/* 최신순, 좋아요 순 정렬 */}
          <div className="pb-1">
            <TypeSelector
              name={userId ? 'user-list-sort' : 'home-list-sort'}
              ariaLabel="List sort"
              value={sort}
              options={sortOptions}
              onChange={setSort}
              variant="subtle"
              size="sm"
              className="min-w-max sm:ml-auto"
            />
          </div>
        </div>
        {!isLoading && items.length === 0 ? (
          <p className="rounded-xl border border-slate-800/70 bg-black/20 px-4 py-12 text-center text-sm text-gray-400 sm:text-base">
            리스트가 없습니다
          </p>
        ) : null}
        {isLoading ? <MusicListGridSkeleton count={skeletonCount}/> : <MusicListGrid items={items} /> }
        {!isLoading && items.length > 0 ? (
          <div ref={sentinelRef} className="h-12 w-full">
            {isFetchingMore ? (
              <p className="py-3 text-center text-sm text-gray-400">게시물을 불러오는 중...</p>
            ) : null}
          </div>
        ) : null}
      </section>
    </>
  );
}
