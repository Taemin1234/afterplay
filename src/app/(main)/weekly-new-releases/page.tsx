import type { Metadata } from 'next';
import ListCollectionPage from '@/app/(main)/_components/ListCollectionPage';

export const metadata: Metadata = {
  title: '이주의 신곡',
  description: '이번 주에 주목할 신곡을 만나보세요.',
  alternates: { canonical: '/weekly-new-releases' },
};

export default function WeeklyNewReleasesPage() {
  return (
    <ListCollectionPage
      title="이주의 신곡"
      description="이번 주의 신곡을 만나보세요."
      featuredSectionKey="weekly-new-releases"
    />
  );
}
