import type { Metadata } from 'next';
import ListCollectionPage from '@/app/(main)/_components/ListCollectionPage';

export const metadata: Metadata = {
  title: 'Our Dust',
  description: '우리들의 취향을 만나보세요.',
  alternates: { canonical: '/lists' },
};

export default function ListsPage() {
  return (
    <ListCollectionPage
      title="Our Dust"
      description="개인의 취향을 담은 플레이리스트와 앨범리스트입니다."
      excludeFeaturedSectionKey="weekly-new-releases"
    />
  );
}
