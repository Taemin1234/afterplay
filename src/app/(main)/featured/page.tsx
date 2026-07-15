import type { Metadata } from 'next';
import ListCollectionPage from '@/app/(main)/_components/ListCollectionPage';

export const metadata: Metadata = {
  title: '특별게시글',
  description: 'DustpeakClub이 선정한 특별게시글을 만나보세요.',
  alternates: { canonical: '/featured' },
};

export default function FeaturedPage() {
  return (
    <ListCollectionPage
      title="특별게시글"
      description="DustpeakClub이 선정한 특별 리스트입니다."
      featuredSectionKey="featured"
    />
  );
}
