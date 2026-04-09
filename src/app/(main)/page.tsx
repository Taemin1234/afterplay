import MusicListBrowser from '@/components/ui/organisms/MusicListBrowser';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'dustpeakclub',
  description: '뻔한 리스트는 지겨우니까. 나만 알고 싶은 명곡 디깅 플레이스.',
  alternates: {
    canonical: '/',
  },
};

export default function Home() {
  return <MusicListBrowser initialType="all" limit={16} />;
}
