import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/utils/supabase/server';
import { fetchPlaylistDetail } from '@/lib/music-lists';
import prisma from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type PlaylistActionPayload = {
  action?: 'toggle-like' | 'toggle-bookmark' | 'comment';
  content?: string;
};

async function getAuthenticatedUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
}

async function upsertDbUser(user: { id: string; email?: string; user_metadata?: { avatar_url?: string } }) {
  const email = user.email?.trim();
  if (!email) return;

  await prisma.user.upsert({
    where: { id: user.id },
    update: {
      email,
      avatarUrl: user.user_metadata?.avatar_url ?? null,
    },
    create: {
      id: user.id,
      email,
      avatarUrl: user.user_metadata?.avatar_url ?? null,
      nickname: null,
    },
  });
}

async function togglePlaylistBookmark(userId: string, playlistId: string) {
  const existingRows = await prisma.$queryRawUnsafe<Array<{ exists: boolean }>>(
    'SELECT EXISTS(SELECT 1 FROM "PlaylistBookmark" WHERE "userId" = $1 AND "playlistId" = $2) AS "exists"',
    userId,
    playlistId
  );

  const exists = existingRows[0]?.exists ?? false;

  if (exists) {
    await prisma.$executeRawUnsafe(
      'DELETE FROM "PlaylistBookmark" WHERE "userId" = $1 AND "playlistId" = $2',
      userId,
      playlistId
    );
  } else {
    await prisma.$executeRawUnsafe(
      'INSERT INTO "PlaylistBookmark" ("userId", "playlistId") VALUES ($1, $2)',
      userId,
      playlistId
    );
  }

  const [countRows, mineRows] = await Promise.all([
    prisma.$queryRawUnsafe<Array<{ count: bigint }>>(
      'SELECT COUNT(*)::bigint AS "count" FROM "PlaylistBookmark" WHERE "playlistId" = $1',
      playlistId
    ),
    prisma.$queryRawUnsafe<Array<{ count: bigint }>>(
      'SELECT COUNT(*)::bigint AS "count" FROM "PlaylistBookmark" WHERE "playlistId" = $1 AND "userId" = $2',
      playlistId,
      userId
    ),
  ]);

  return {
    bookmarksCount: Number(countRows[0]?.count ?? 0),
    viewerHasBookmarked: Number(mineRows[0]?.count ?? 0) > 0,
  };
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const user = await getAuthenticatedUser();

    const playlist = await fetchPlaylistDetail(id, user?.id);
    if (!playlist) {
      return NextResponse.json({ error: 'Playlist not found' }, { status: 404 });
    }

    return NextResponse.json(playlist);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await upsertDbUser(user);

    const playlist = await fetchPlaylistDetail(id, user.id);
    if (!playlist) {
      return NextResponse.json({ error: 'Playlist not found' }, { status: 404 });
    }

    const body = (await request.json()) as PlaylistActionPayload;

    if (body.action === 'toggle-like') {
      const key = { userId_playlistId: { userId: user.id, playlistId: id } };
      const existing = await prisma.playlistLike.findUnique({ where: key });

      if (existing) {
        await prisma.playlistLike.delete({ where: key });
      } else {
        await prisma.playlistLike.create({ data: { userId: user.id, playlistId: id } });
      }

      const [likesCount, viewerHasLiked] = await Promise.all([
        prisma.playlistLike.count({ where: { playlistId: id } }),
        prisma.playlistLike.count({ where: { playlistId: id, userId: user.id } }),
      ]);

      return NextResponse.json({
        ok: true,
        action: 'toggle-like',
        likesCount,
        viewerHasLiked: viewerHasLiked > 0,
      });
    }

    if (body.action === 'toggle-bookmark') {
      const { bookmarksCount, viewerHasBookmarked } = await togglePlaylistBookmark(user.id, id);

      return NextResponse.json({
        ok: true,
        action: 'toggle-bookmark',
        bookmarksCount,
        viewerHasBookmarked,
      });
    }

    if (body.action === 'comment') {
      const content = body.content?.trim();
      if (!content) {
        return NextResponse.json({ error: 'Comment content is required' }, { status: 400 });
      }
      if (content.length > 500) {
        return NextResponse.json({ error: 'Comment must be 500 characters or less' }, { status: 400 });
      }

      const comment = await prisma.playlistComment.create({
        data: {
          content,
          userId: user.id,
          playlistId: id,
        },
        select: {
          id: true,
          content: true,
          createdAt: true,
          user: {
            select: {
              id: true,
              nickname: true,
              avatarUrl: true,
            },
          },
        },
      });

      const commentsCount = await prisma.playlistComment.count({
        where: {
          playlistId: id,
          deletedAt: null,
        },
      });

      return NextResponse.json({
        ok: true,
        action: 'comment',
        commentsCount,
        comment: {
          id: comment.id,
          content: comment.content,
          createdAt: comment.createdAt.toISOString(),
          user: comment.user,
        },
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const playlist = await prisma.playlist.findFirst({
      where: { id, deletedAt: null },
      select: { authorId: true },
    });

    if (!playlist) {
      return NextResponse.json({ error: 'Playlist not found' }, { status: 404 });
    }

    if (playlist.authorId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await prisma.$transaction([
      prisma.playlist.update({
        where: { id },
        data: { deletedAt: new Date() },
      }),
      prisma.listFeed.deleteMany({
        where: {
          kind: 'PLAYLIST',
          refId: id,
        },
      }),
    ]);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
