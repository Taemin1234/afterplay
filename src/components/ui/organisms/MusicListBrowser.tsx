'use client';

import { Suspense } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Disc, Headphones, Music } from 'lucide-react';
import TypeSelector from '@/components/ui/molecules/TypeSelector';
import MusicListGrid from '@/components/ui/organisms/MusicListGrid';
import MusicListGridSkeleton from "@/components/layout/MusicListGridSkeleton";
import type { ListType, MusicListItem, MusicListResponse, VisibilityScope } from '@/types';

type MusicListBrowserProps = {
  userId?: string;
  initialItems?: MusicListItem[];
  initialType?: ListType;
  limit?: number;
  visibility?: VisibilityScope;
};

type SortOption = 'latest' | 'likes';

const typeOptions = [
  { value: 'all', label: '전체', icon: <Headphones size={16} /> },
  { value: 'playlist', label: '플레이리스트', icon: <Music size={16} /> },
  { value: 'albumlist', label: '앨범리스트', icon: <Disc size={16} /> },
] as const;

const sortOptions: Array<{ value: SortOption; label: string }> = [
  { value: 'latest', label: '최신순' },
  { value: 'likes', label: '좋아요순' },
];

export default function MusicListBrowser({
  userId,
  initialItems,
  initialType = 'all',
  limit = 16,
  visibility = 'public',
}: MusicListBrowserProps) {
  const [type, setType] = useState<ListType>(initialType);
  const [sort, setSort] = useState<SortOption>('latest');
  const [items, setItems] = useState<MusicListItem[]>(initialItems ?? []);
  const [isLoading, setIsLoading] = useState(initialItems === undefined);
  const hydratedRef = useRef(false);
  const cacheRef = useRef<Map<string, MusicListItem[]>>(new Map());
  const skeletonCount = Math.min(limit, 8)

  const makeCacheKey = useCallback(
    (nextType: ListType) => `${userId ?? 'home'}:${visibility}:${limit}:${nextType}`,
    [userId, visibility, limit]
  );

  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => {
      if (sort === 'likes' && b.likesCount !== a.likesCount) {
        return b.likesCount - a.likesCount;
      }

      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [items, sort]);

  useEffect(() => {
    if (!initialItems || initialItems.length === 0) return;
    cacheRef.current.set(makeCacheKey(initialType), initialItems);
  }, [initialItems, initialType, makeCacheKey]);

  useEffect(() => {
    const skipFirstFetch = !hydratedRef.current && initialItems && type === initialType && initialItems.length > 0;
    hydratedRef.current = true;
    if (skipFirstFetch) return;

    const cacheKey = makeCacheKey(type);
    const cached = cacheRef.current.get(cacheKey);
    if (cached) {
      setItems(cached);
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
        cacheRef.current.set(cacheKey, data.items);
        setItems(data.items);
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') return;
        console.error('Failed to load list items:', error);
      } finally {
        setIsLoading(false);
      }
    };

    load();

    return () => controller.abort();
  }, [type, userId, limit, visibility, initialItems, initialType, makeCacheKey]);

  return (
    <>
    <section className="space-y-4 pb-24 sm:space-y-5 sm:pb-0">
      <div className="flex flex-col gap-3 sm:gap-4 md:flex-row md:items-center md:justify-between">
        <div className="hidden w-full pb-1 md:block">
          <TypeSelector
            name={userId ? 'user-list-type' : 'home-list-type'}
            ariaLabel="List type"
            value={type}
            options={typeOptions}
            onChange={setType}
            className="min-w-max"
          />
        </div>
        <div className="pb-1">
          <TypeSelector
            name={userId ? 'user-list-sort' : 'home-list-sort'}
            ariaLabel="List sort"
            value={sort}
            options={sortOptions}
            onChange={setSort}
            variant="subtle"
            className="min-w-max sm:ml-auto"
          />
        </div>
      </div>
      {!isLoading && sortedItems.length === 0 ? (
        <p className="rounded-xl border border-slate-800/70 bg-black/20 px-4 py-12 text-center text-sm text-gray-400 sm:text-base">
          리스트가 없습니다
        </p>
      ) : null}
      <Suspense fallback={<MusicListGridSkeleton count={skeletonCount}/>}>
        {isLoading ? <MusicListGridSkeleton count={skeletonCount}/> : <MusicListGrid items={sortedItems} /> }
      </Suspense>
    </section>
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-800/80 bg-[#050816]/90 backdrop-blur md:hidden">
      <TypeSelector
          name={userId ? 'user-list-type-mobile' : 'home-list-type-mobile'}
          ariaLabel="List type mobile"
          value={type}
          options={typeOptions}
          onChange={setType}
          variant="mobile"
        />
    </div>
    </>
  );
}
