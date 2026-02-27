import { notFound } from 'next/navigation';
import MusicListForm from '@/components/ui/organisms/MusicListForm';
import { createSupabaseServerClient } from '@/utils/supabase/server';
import { fetchPlaylistDetail } from '@/lib/music-lists';

export default async function EditPlaylistPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    notFound();
  }

  const item = await fetchPlaylistDetail(id, user.id);
  if (!item || item.author.id !== user.id) {
    notFound();
  }

  return (
    <MusicListForm
      pageTitle="플레이리스트 수정"
      submitLabel="수정하기"
      initialType="track"
      lockType
      submitMethod="PATCH"
      submitEndpoint={`/api/music/playlist/${id}`}
      successRedirectPath={`/playlist/${id}`}
      initialValues={{
        title: item.title,
        story: item.story,
        visibility: item.visibility,
        tags: item.tags,
        musicItems: item.musicItems.map((music) => ({
          id: music.id,
          name: music.title,
          artist: music.artist,
          albumImageUrl: music.albumImageUrl,
        })),
      }}
    />
  );
}
