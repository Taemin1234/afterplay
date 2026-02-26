import { notFound } from 'next/navigation';
import { createSupabaseServerClient } from '@/utils/supabase/server';
import { fetchAlbumListDetail, fetchPlaylistDetail } from '@/lib/music-lists';
import ListDetailClient from '@/components/ui/organisms/ListDetailClient';

type ListKind = 'playlist' | 'albumlist';

interface MusicListDetailPageProps {
  id: string;
  kind: ListKind;
}

export default async function MusicListDetailPage({ id, kind }: MusicListDetailPageProps) {
  if (!id) {
    notFound();
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const item =
    kind === 'playlist'
      ? await fetchPlaylistDetail(id, user?.id)
      : await fetchAlbumListDetail(id, user?.id);

  if (!item) {
    notFound();
  }

  const isLoggedIn = Boolean(user);
  const isOwner = isLoggedIn && item.author.id === user?.id;

  return <ListDetailClient item={item} isLoggedIn={isLoggedIn} isOwner={isOwner} />;
}
