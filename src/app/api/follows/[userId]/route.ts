import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { createSupabaseServerClient } from '@/utils/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic'; // 매 요청마다 동적으로 실행

type RouteContext = {
  params: Promise<{
    userId: string;
  }>;
};

type FollowListType = 'followers' | 'following';

// 쿼리스트링 type이 followers가 아니면 following
function parseListType(value: string | null): FollowListType {
  return value === 'followers' ? 'followers' : 'following';
}

// 현재 요청을 보낸 로그인 사용자의 id 가져오기
async function getViewerUserId() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user?.id ?? null;
}

// 팔로워, 팔로잉 목록 조회
export async function GET(request: Request, context: RouteContext) {
  // userId 검사
  const { userId } = await context.params;
  if (!userId) {
    return NextResponse.json({ error: 'userId is required' }, { status: 400 });
  }

  // 대상 유저 존재 여부 확인
  const targetUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });

  if (!targetUser) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  // 브라우저에서 받아온 type 읽어오기
  const listType = parseListType(new URL(request.url).searchParams.get('type'));
  const viewerUserId = await getViewerUserId();

  // 해당 유저의 팔로워를 가져오는 로직
  if (listType === 'followers') {
    // DB조회
    // followingId에서 followerId의 정보를 가져오기
    const rows = await prisma.follow.findMany({
      where: { followingId: userId },
      orderBy: { createdAt: 'desc' },
      select: {
        followerId: true,
        follower: {
          select: {
            id: true,
            nickname: true,
            nicknameSlug: true,
            avatarUrl: true,
          },
        },
      },
    });

    // 현재 로그인한 사용자가 이 목록 속 사람들을 다시 팔로우하고 있는지 확인
    // 내가 타인의 팔로우 리스트를 보고 있을 때 내가 그 사람들을 팔로우 하고 있는지 확인
    const targetIds = rows.map((row) => row.followerId).filter((id) => id !== viewerUserId);
    const followingSet = new Set<string>();

    if (viewerUserId && targetIds.length > 0) {
      const followingRows = await prisma.follow.findMany({
        where: {
          followerId: viewerUserId,
          followingId: { in: targetIds },
        },
        select: { followingId: true },
      });
      followingRows.forEach((row) => followingSet.add(row.followingId));
    }

    return NextResponse.json({
      type: listType,
      items: rows.map((row) => ({
        id: row.follower.id, // 팔로워 유저 id
        nickname: row.follower.nickname ?? 'Anonymous',
        nicknameSlug: row.follower.nicknameSlug,
        avatarUrl: row.follower.avatarUrl,
        isFollowing: viewerUserId ? followingSet.has(row.follower.id) : false, // 현재 로그인한 유저가 이 사람을 팔로우 중인가
        isMe: viewerUserId ? row.follower.id === viewerUserId : false, // 이 사람이 난가?
      })),
    });
  }

  // following 분기
  const rows = await prisma.follow.findMany({
    where: { followerId: userId },
    orderBy: { createdAt: 'desc' },
    select: {
      followingId: true,
      following: {
        select: {
          id: true,
          nickname: true,
          nicknameSlug: true,
          avatarUrl: true,
        },
      },
    },
  });

  const targetIds = rows.map((row) => row.followingId).filter((id) => id !== viewerUserId);
  const followingSet = new Set<string>();

  if (viewerUserId && targetIds.length > 0) {
    const followingRows = await prisma.follow.findMany({
      where: {
        followerId: viewerUserId,
        followingId: { in: targetIds },
      },
      select: { followingId: true },
    });
    followingRows.forEach((row) => followingSet.add(row.followingId));
  }

  return NextResponse.json({
    type: listType,
    items: rows.map((row) => ({
      id: row.following.id,
      nickname: row.following.nickname ?? 'Anonymous',
      nicknameSlug: row.following.nicknameSlug,
      avatarUrl: row.following.avatarUrl,
      isFollowing: viewerUserId ? followingSet.has(row.following.id) : false,
      isMe: viewerUserId ? row.following.id === viewerUserId : false,
    })),
  });
}

// 팔로우 하기 (현재 사용자가 userId 유저를 팔로우)
export async function POST(_: Request, context: RouteContext) {
  const { userId } = await context.params;
  if (!userId) {
    return NextResponse.json({ error: 'userId is required' }, { status: 400 });
  }
  // 로그인 확인
  const viewerUserId = await getViewerUserId();
  if (!viewerUserId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 자기자신 팔로우 방지
  if (viewerUserId === userId) {
    return NextResponse.json({ error: 'Cannot follow yourself' }, { status: 400 });
  }

  // 팔로우 대상 유저 존재 확인
  const targetUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });

  if (!targetUser) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  // 팔로우 생성
  await prisma.follow.upsert({
    where: {
      followerId_followingId: {
        followerId: viewerUserId,
        followingId: userId,
      },
    },
    create: {
      followerId: viewerUserId,
      followingId: userId,
    },
    update: {},
  });

  // 팔로워 수 다시 계산
  const followerCount = await prisma.follow.count({
    where: { followingId: userId },
  });

  return NextResponse.json({ success: true, isFollowing: true, followerCount });
}

// 언팔로우하기
export async function DELETE(_: Request, context: RouteContext) {
  const { userId } = await context.params;
  if (!userId) {
    return NextResponse.json({ error: 'userId is required' }, { status: 400 });
  }

  const viewerUserId = await getViewerUserId();
  if (!viewerUserId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (viewerUserId === userId) {
    return NextResponse.json({ error: 'Cannot unfollow yourself' }, { status: 400 });
  }

  await prisma.follow.deleteMany({
    where: {
      followerId: viewerUserId,
      followingId: userId,
    },
  });

  // 팔로워 수 다시 계산
  const followerCount = await prisma.follow.count({
    where: { followingId: userId },
  });

  return NextResponse.json({ success: true, isFollowing: false, followerCount });
}
