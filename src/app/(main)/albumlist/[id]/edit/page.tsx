import { notFound } from 'next/navigation';
import MusicListForm from '@/components/ui/organisms/MusicListForm';
import { createSupabaseServerClient } from '@/utils/supabase/server';
import { fetchAlbumListDetail } from '@/lib/music-lists';
import type { MusicListContentBlock } from '@/types/music-list-content';

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
        visibility: item.visibility,
        tags: item.tags,
        contentBlocks: item.contentBlocks.flatMap<MusicListContentBlock>((block) => {
          if (block.type === 'text') return [block];
          const music = item.musicItems.find((candidate) => candidate.id === block.musicId);
          return music ? [{
            id: block.id,
            type: 'music' as const,
            item: {
              id: music.id,
              name: music.title,
              artist: music.artist,
              albumImageUrl: music.albumImageUrl,
            },
          }] : [];
        }),
      }}
    />
  );
}
