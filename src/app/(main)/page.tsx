import MusicListBrowser from '@/components/ui/organisms/MusicListBrowser';
import { fetchListItems } from '@/lib/music-lists';
import type { Metadata } from 'next';

export const revalidate = 15;

export const metadata: Metadata = {
  title: 'dustpeakclub',
  description: '뻔한 리스트는 지겨우니까. 나만 알고 싶은 명곡 디깅 플레이스.',
  alternates: {
    canonical: '/',
  },
};

export default async function Home() {
  const { items, nextCursor } = await fetchListItems({
    type: 'all',
    sort: 'latest',
    limit: 16,
    cursor: null,
    visibility: 'public',
  });

  return <MusicListBrowser initialItems={items} initialNextCursor={nextCursor} initialType="all" limit={16} />;
}
