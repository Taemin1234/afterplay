import { notFound } from 'next/navigation';
import MusicListForm from '@/components/ui/organisms/MusicListForm';
import { createSupabaseServerClient } from '@/utils/supabase/server';
import { fetchAlbumListDetail } from '@/lib/music-lists';

export default async function EditAlbumListPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    notFound();
  }

  const item = await fetchAlbumListDetail(id, user.id);
  if (!item || item.author.id !== user.id) {
    notFound();
  }

  return (
    <MusicListForm
      pageTitle="앨범리스트 수정"
      submitLabel="수정하기"
      initialType="album"
      lockType
      submitMethod="PATCH"
      submitEndpoint={`/api/music/albumlist/${id}`}
      successRedirectPath={`/albumlist/${id}`}
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
