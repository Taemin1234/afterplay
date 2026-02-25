import { createSupabaseServerClient } from '@/utils/supabase/server';
import { notFound } from "next/navigation";
import { fetchPlaylistDetail } from '@/lib/music-lists';
import ListDetailClient from '@/components/ui/organisms/ListDetailClient';

export default async function PlaylistPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  if (!id) notFound();

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const playlist = await fetchPlaylistDetail(id, user?.id);
  if (!playlist) notFound();

  const isLoggedIn = Boolean(user);
  const isOwner = isLoggedIn && playlist.author.id === user?.id;

  return <ListDetailClient item={playlist} isLoggedIn={isLoggedIn} isOwner={isOwner} />;
}
