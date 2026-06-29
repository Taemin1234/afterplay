import MusicListBrowser from '@/components/ui/organisms/MusicListBrowser';
import MusicListGrid from '@/components/ui/organisms/MusicListGrid';
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
    limit: 12,
    cursor: null,
    visibility: 'public',
  });

  return (
    <>
      <h1 className='font-Paperozi relative before:content before:absolute before:w-full before:h-0.5 before:bg-neon-point/80 before:left-0 before:right-0 before:bottom-0 text-3xl md:text-5xl font-bold mt-5 md:mt-10 mb-5 pb-3'><span className='text-neon-point'>DPC</span> 리스트</h1>
      <MusicListBrowser initialItems={items} initialNextCursor={nextCursor} initialType="all" limit={12}>
        <MusicListGrid items={items} />
      </MusicListBrowser>
    </>
  );
}
