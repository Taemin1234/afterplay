import type { Metadata } from 'next';
import ListCollectionPage from '@/app/(main)/_components/ListCollectionPage';

export const metadata: Metadata = {
  title: '스페셜 세트',
  description: 'DustpeakClub이 선정한 스페셜 세트을 만나보세요.',
  alternates: { canonical: '/featured' },
};

export default function FeaturedPage() {
  return (
    <ListCollectionPage
      title="스페셜 세트"
      description="DustpeakClub이 선정한 스페셜 세트입니다."
      featuredSectionKey="featured"
    />
  );
}
