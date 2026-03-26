import ProfileInfo from '@/components/ui/organisms/ProfileInfo';
import MusicListBrowser from '@/components/ui/organisms/MusicListBrowser';
import { fetchListItems } from '@/lib/music-lists';
import { createSupabaseServerClient } from '@/utils/supabase/server';
import prisma from '@/lib/prisma';
import { notFound } from 'next/navigation';

export default async function UserProfile({ params }: { params: Promise<{ nicknameSlug: string }> }) {
  const { nicknameSlug: rawNicknameSlug } = await params;

  // Decode once so both raw and decoded slug can match.
  let decodedNicknameSlug = rawNicknameSlug;
  try {
    decodedNicknameSlug = decodeURIComponent(rawNicknameSlug);
  } catch {
    decodedNicknameSlug = rawNicknameSlug;
  }

  const profileUser = await prisma.user.findFirst({
    where: {
      OR: [{ nicknameSlug: rawNicknameSlug }, { nicknameSlug: decodedNicknameSlug }],
    },
    select: {
      id: true,
      nickname: true,
      avatarUrl: true,
      _count: {
        select: {
          followers: true,
          following: true,
        },
      },
    },
  });

  if (!profileUser) {
    notFound();
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const viewerUserId = user?.id ?? null;
  const isOwner = Boolean(viewerUserId && viewerUserId === profileUser.id);

  const initialIsFollowing =
    !isOwner && viewerUserId
      ? Boolean(
          await prisma.follow.findUnique({
            where: {
              followerId_followingId: {
                followerId: viewerUserId,
                followingId: profileUser.id,
              },
            },
            select: { followerId: true },
          })
        )
      : false;

  const { items, nextCursor } = await fetchListItems({
    type: 'all',
    limit: 16,
    cursor: null,
    feedUserId: profileUser.id,
    authorId: profileUser.id,
    visibility: isOwner ? 'all' : 'public',
  });

  return (
    <div>
      <ProfileInfo
        profileUserId={profileUser.id}
        initialNickname={profileUser.nickname ?? '\uC775\uBA85'}
        isOwner={isOwner}
        viewerUserId={viewerUserId}
        initialFollowerCount={profileUser._count.followers}
        initialFollowingCount={profileUser._count.following}
        initialIsFollowing={initialIsFollowing}
      />
      <section className="mt-8">
        <MusicListBrowser
          userId={profileUser.id}
          initialItems={items}
          initialNextCursor={nextCursor}
          initialType="all"
          limit={16}
          visibility={isOwner ? 'all' : 'public'}
        />
      </section>
    </div>
  );
}