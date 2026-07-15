import type { Metadata } from 'next';
import ListCollectionPage from '@/app/(main)/_components/ListCollectionPage';

export const metadata: Metadata = {
  title: '리스트 목록',
  description: '플레이리스트와 앨범리스트를 최신순으로 만나보세요.',
  alternates: { canonical: '/lists' },
};

export default function ListsPage() {
  return (
    <ListCollectionPage
      title="리스트 목록"
      description="이주의 신곡을 제외한 플레이리스트와 앨범리스트입니다."
      excludeFeaturedSectionKey="weekly-new-releases"
    />
  );
}
