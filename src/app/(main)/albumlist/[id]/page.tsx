import { createSupabaseServerClient } from '@/utils/supabase/server';
import { notFound } from 'next/navigation';
import { fetchAlbumListDetail } from '@/lib/music-lists';
import ListDetailClient from '@/components/ui/organisms/ListDetailClient';

export default async function AlbumListPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  if (!id) notFound();

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const albumList = await fetchAlbumListDetail(id, user?.id);
  if (!albumList) notFound();

  const isLoggedIn = Boolean(user);
  const isOwner = isLoggedIn && albumList.author.id === user?.id;

  return <ListDetailClient item={albumList} isLoggedIn={isLoggedIn} isOwner={isOwner} />;
}
