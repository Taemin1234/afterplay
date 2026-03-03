'use client';

import { useEffect, useRef, useState } from 'react';
import { Disc, Headphones, Music } from 'lucide-react';
import TypeSelector from '@/components/ui/molecules/TypeSelector';
import MusicListGrid from '@/components/ui/organisms/MusicListGrid';
import type { ListType, MusicListItem, MusicListResponse } from '@/types';

type MusicListBrowserProps = {
  userId?: string;
  initialItems?: MusicListItem[];
  initialType?: ListType;
  limit?: number;
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
}: MusicListBrowserProps) {
  const [type, setType] = useState<ListType>(initialType);
  const [items, setItems] = useState<MusicListItem[]>(initialItems ?? []);
  const [isLoading, setIsLoading] = useState(false);
  const hydratedRef = useRef(false);

  useEffect(() => {
    const skipFirstFetch = !hydratedRef.current && initialItems && type === initialType;
    hydratedRef.current = true;
    if (skipFirstFetch) return;

    const controller = new AbortController();

    const load = async () => {
      try {
        setIsLoading(true);
        const baseUrl = userId ? `/api/users/${userId}/lists` : '/api/music/lists';
        const res = await fetch(`${baseUrl}?type=${type}&limit=${limit}`, {
          cache: 'no-store',
          signal: controller.signal,
        });
        if (!res.ok) throw new Error('Failed to fetch list items');

        const data: MusicListResponse = await res.json();
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
  }, [type, userId, limit, initialItems, initialType]);

  return (
    <section className="space-y-4">
      <TypeSelector
        name={userId ? 'user-list-type' : 'home-list-type'}
        ariaLabel="List type"
        value={type}
        options={typeOptions}
        onChange={setType}
      />
      {isLoading && items.length === 0 ? (
        <p className="px-4 py-12 text-sm text-gray-400">리스트가 없습니다.</p>
      ) : (
        <MusicListGrid items={items} />
      )}
    </section>
  );
}
