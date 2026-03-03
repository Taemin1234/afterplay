import MusicListBrowser from '@/components/ui/organisms/MusicListBrowser';

export default function Home() {
  return <MusicListBrowser initialType="all" limit={16} />;
}
