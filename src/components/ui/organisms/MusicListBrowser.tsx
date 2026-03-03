'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Disc, Headphones, Music } from 'lucide-react';
import TypeSelector from '@/components/ui/molecules/TypeSelector';
import MusicListGrid from '@/components/ui/organisms/MusicListGrid';
import type { ListType, MusicListItem, MusicListResponse, VisibilityScope } from '@/types';

type MusicListBrowserProps = {
  userId?: string;
  initialItems?: MusicListItem[];
  initialType?: ListType;
  limit?: number;
  visibility?: VisibilityScope;
};

const typeOptions = [
  { value: 'all', label: 'All', icon: <Headphones size={16} /> },
  { value: 'playlist', label: 'Playlist', icon: <Music size={16} /> },
  { value: 'albumlist', label: 'Album List', icon: <Disc size={16} /> },
] as const;

export default function MusicListBrowser({
  userId,
  initialItems,
  initialType = 'all',
  limit = 16,
  visibility = 'public',
}: MusicListBrowserProps) {
  const [type, setType] = useState<ListType>(initialType);
  const [items, setItems] = useState<MusicListItem[]>(initialItems ?? []);
  const [isLoading, setIsLoading] = useState(false);
  const hydratedRef = useRef(false);
  const cacheRef = useRef<Map<string, MusicListItem[]>>(new Map());

  const makeCacheKey = useCallback(
    (nextType: ListType) => `${userId ?? 'home'}:${visibility}:${limit}:${nextType}`,
    [userId, visibility, limit]
  );

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
    <section className="space-y-4">
      <TypeSelector
        name={userId ? 'user-list-type' : 'home-list-type'}
        ariaLabel="List type"
        value={type}
        options={typeOptions}
        onChange={setType}
      />
      <div className="min-h-8 px-4">{isLoading ? <p className="text-sm text-gray-400">Loading...</p> : null}</div>
      {!isLoading && items.length === 0 ? <p className="px-4 py-12 text-sm text-gray-400">리스트가 없습니다</p> : null}
      {items.length > 0 ? <MusicListGrid items={items} /> : null}
    </section>
  );
}
