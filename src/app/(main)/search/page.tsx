import { Suspense } from 'react';
import SearchPageClient from '@/components/ui/organisms/SearchPageClient';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '검색',
  description: '아티스트, 곡, 태그, 사용자로 음악 리스트를 검색해보세요.',
  alternates: {
    canonical: '/search',
  },
};

export default function SearchPage() {
  return (
    <Suspense fallback={null}>
      <SearchPageClient />
    </Suspense>
  );
}
