import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/utils/supabase/server';
import { fetchAlbumListDetail } from '@/lib/music-lists';
import prisma from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type AlbumListActionPayload = {
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

async function toggleAlbumListBookmark(userId: string, albumListId: string) {
  const existingRows = await prisma.$queryRawUnsafe<Array<{ exists: boolean }>>(
    'SELECT EXISTS(SELECT 1 FROM "AlbumListBookmark" WHERE "userId" = $1 AND "albumListId" = $2) AS "exists"',
    userId,
    albumListId
  );

  const exists = existingRows[0]?.exists ?? false;

  if (exists) {
    await prisma.$executeRawUnsafe(
      'DELETE FROM "AlbumListBookmark" WHERE "userId" = $1 AND "albumListId" = $2',
      userId,
      albumListId
    );
  } else {
    await prisma.$executeRawUnsafe(
      'INSERT INTO "AlbumListBookmark" ("userId", "albumListId") VALUES ($1, $2)',
      userId,
      albumListId
    );
  }

  const [countRows, mineRows] = await Promise.all([
    prisma.$queryRawUnsafe<Array<{ count: bigint }>>(
      'SELECT COUNT(*)::bigint AS "count" FROM "AlbumListBookmark" WHERE "albumListId" = $1',
      albumListId
    ),
    prisma.$queryRawUnsafe<Array<{ count: bigint }>>(
      'SELECT COUNT(*)::bigint AS "count" FROM "AlbumListBookmark" WHERE "albumListId" = $1 AND "userId" = $2',
      albumListId,
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

    const albumList = await fetchAlbumListDetail(id, user?.id);
    if (!albumList) {
      return NextResponse.json({ error: 'Album list not found' }, { status: 404 });
    }

    return NextResponse.json(albumList);
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

    const albumList = await fetchAlbumListDetail(id, user.id);
    if (!albumList) {
      return NextResponse.json({ error: 'Album list not found' }, { status: 404 });
    }

    const body = (await request.json()) as AlbumListActionPayload;

    if (body.action === 'toggle-like') {
      const key = { userId_albumListId: { userId: user.id, albumListId: id } };
      const existing = await prisma.albumListLike.findUnique({ where: key });

      if (existing) {
        await prisma.albumListLike.delete({ where: key });
      } else {
        await prisma.albumListLike.create({ data: { userId: user.id, albumListId: id } });
      }

      const [likesCount, viewerHasLiked] = await Promise.all([
        prisma.albumListLike.count({ where: { albumListId: id } }),
        prisma.albumListLike.count({ where: { albumListId: id, userId: user.id } }),
      ]);

      return NextResponse.json({
        ok: true,
        action: 'toggle-like',
        likesCount,
        viewerHasLiked: viewerHasLiked > 0,
      });
    }

    if (body.action === 'toggle-bookmark') {
      const { bookmarksCount, viewerHasBookmarked } = await toggleAlbumListBookmark(user.id, id);

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

      const comment = await prisma.albumListComment.create({
        data: {
          content,
          userId: user.id,
          albumListId: id,
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

      const commentsCount = await prisma.albumListComment.count({
        where: {
          albumListId: id,
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

    const albumList = await prisma.albumList.findFirst({
      where: { id, deletedAt: null },
      select: { authorId: true },
    });

    if (!albumList) {
      return NextResponse.json({ error: 'Album list not found' }, { status: 404 });
    }

    if (albumList.authorId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await prisma.$transaction([
      prisma.albumList.update({
        where: { id },
        data: { deletedAt: new Date() },
      }),
      prisma.listFeed.deleteMany({
        where: {
          kind: 'ALBUM_LIST',
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
