import MusicListDetailPage from '../../_components/MusicListDetailPage';
import type { Metadata } from 'next';
import { fetchAlbumListDetail } from '@/lib/music-lists';
import { SITE_NAME } from '@/lib/seo';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const item = await fetchAlbumListDetail(id);

  if (!item) {
    return {
      title: '앨범리스트',
      robots: { index: false, follow: false },
    };
  }

  const author = item.author.nickname ?? '익명';
  const title = item.title;
  const description = item.story || `${author}님의 앨범리스트를 감상해보세요.`;

  return {
    title,
    description,
    alternates: {
      canonical: `/albumlist/${id}`,
    },
    openGraph: {
      title: `${title} | ${SITE_NAME}`,
      description,
      url: `/albumlist/${id}`,
      type: 'article',
      images: item.musicItems[0]?.albumImageUrl
        ? [{ url: item.musicItems[0].albumImageUrl, alt: title }]
        : undefined,
    },
    twitter: {
      title: `${title} | ${SITE_NAME}`,
      description,
      images: item.musicItems[0]?.albumImageUrl ? [item.musicItems[0].albumImageUrl] : undefined,
    },
  };
}

export default async function AlbumListPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <MusicListDetailPage id={id} kind="albumlist" />;
}
