import MusicListDetailPage from '../../_components/MusicListDetailPage';
import type { Metadata } from 'next';
import { fetchPlaylistMetadata } from '@/lib/music-lists';
import { SITE_NAME } from '@/lib/seo';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const item = await fetchPlaylistMetadata(id);

  if (!item) {
    return {
      title: '플레이리스트',
      robots: { index: false, follow: false },
    };
  }

  const author = item.authorNickname ?? '익명';
  const title = item.title;
  const description = item.story || `${author}의 플레이리스트를 감상해보세요.`;

  return {
    title,
    description,
    alternates: {
      canonical: `/playlist/${id}`,
    },
    openGraph: {
      title: `${title} | ${SITE_NAME}`,
      description,
      url: `/playlist/${id}`,
      type: 'article',
      images: item.imageUrl ? [{ url: item.imageUrl, alt: title }] : undefined,
    },
    twitter: {
      title: `${title} | ${SITE_NAME}`,
      description,
      images: item.imageUrl ? [item.imageUrl] : undefined,
    },
  };
}

export default async function PlaylistPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <MusicListDetailPage id={id} kind="playlist" />;
}
