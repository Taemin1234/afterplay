import { createHash } from 'node:crypto';
import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import { after } from 'next/server';
import { createSupabaseServerClient } from '@/utils/supabase/server';
import {
  fetchAlbumListDetail,
  fetchFeaturedSections,
  fetchPlaylistDetail,
  registerListView,
} from '@/lib/music-lists';
import prisma from '@/lib/prisma';
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
  const dbUser = user
    ? await prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true },
    })
    : null;
  const isAdmin = dbUser?.role === 'ADMIN';

  const item =
    kind === 'playlist'
      ? await fetchPlaylistDetail(id, user?.id, { canViewPrivate: isAdmin })
      : await fetchAlbumListDetail(id, user?.id, { canViewPrivate: isAdmin });

  if (!item) {
    notFound();
  }

  const isLoggedIn = Boolean(user);
  const isOwner = isLoggedIn && item.author.id === user?.id;
  const featuredSections = isAdmin ? await fetchFeaturedSections() : [];
  const headerStore = await headers();
  const rawForwardedFor = headerStore.get('x-forwarded-for');
  const ip = rawForwardedFor?.split(',')[0]?.trim() || headerStore.get('x-real-ip') || '';
  const userAgent = headerStore.get('user-agent') || '';
  const fingerprintSeed = `${ip}|${userAgent}`;
  const deviceId = fingerprintSeed === '|' ? undefined : createHash('sha256').update(fingerprintSeed).digest('hex');

  after(async () => {
    try {
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
  });

  return (
    <ListDetailClient
      item={item}
      isLoggedIn={isLoggedIn}
      isOwner={isOwner}
      isAdmin={isAdmin}
      featuredSections={featuredSections}
      viewerUserId={user?.id ?? null}
      isModalContext={isModalContext}
    />
  );
}
