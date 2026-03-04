import { createHash } from 'node:crypto';
import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import { createSupabaseServerClient } from '@/utils/supabase/server';
import {
  fetchAlbumListDetail,
  fetchPlaylistDetail,
  registerListView,
} from '@/lib/music-lists';
import ListDetailClient from '@/components/ui/organisms/ListDetailClient';

type ListKind = 'playlist' | 'albumlist';

interface MusicListDetailPageProps {
  id: string;
  kind: ListKind;
  isModalContext?: boolean;
}

export default async function MusicListDetailPage({
  id,
  kind,
  isModalContext = false,
}: MusicListDetailPageProps) {
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

  // 조회수 카운트
  try {
    // 헤더에서 클라이언트 정보 추출
    const headerStore = await headers();
    // IP 추출
    const rawForwardedFor = headerStore.get('x-forwarded-for');
    const ip = rawForwardedFor?.split(',')[0]?.trim() || headerStore.get('x-real-ip') || '';
    // 브라우저/기기정보 추출
    const userAgent = headerStore.get('user-agent') || '';
    // deviceId 생성하여 저장 (hash로 값을 가려서 저장)
    const fingerprintSeed = `${ip}|${userAgent}`;
    const deviceId = fingerprintSeed === '|'
      ? undefined
      : createHash('sha256').update(fingerprintSeed).digest('hex');

      // 조회수 로직에 전달
    await registerListView({
      kind,
      id,
      authorId: item.author.id,
      viewerUserId: user?.id,
      deviceId,
    });
  } catch (error) {
    console.error('Failed to register list view', error);
  }

  return (
    <ListDetailClient
      item={item}
      isLoggedIn={isLoggedIn}
      isOwner={isOwner}
      isModalContext={isModalContext}
    />
  );
}
