import { NextResponse } from 'next/server';
import { fetchPlaylistDetail } from '@/lib/music-lists';
import prisma from '@/lib/prisma';
import {
  getAuthenticatedUser,
  type ListPayloadInput,
  upsertDbUser,
  upsertTags,
  validateAndNormalizeListPayload,
} from '@/lib/music-list-api';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type PlaylistActionPayload = {
  action?: 'toggle-like' | 'toggle-bookmark' | 'comment' | 'edit-comment' | 'delete-comment';
  commentId?: string;
  content?: string;
};

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

    if (body.action === 'edit-comment') {
      const commentId = body.commentId?.trim();
      const content = body.content?.trim();
      if (!commentId) {
        return NextResponse.json({ error: 'commentId is required' }, { status: 400 });
      }
      if (!content) {
        return NextResponse.json({ error: 'Comment content is required' }, { status: 400 });
      }
      if (content.length > 500) {
        return NextResponse.json({ error: 'Comment must be 500 characters or less' }, { status: 400 });
      }

      const target = await prisma.playlistComment.findFirst({
        where: {
          id: commentId,
          playlistId: id,
          deletedAt: null,
        },
        select: { id: true, userId: true },
      });

      if (!target) {
        return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
      }
      if (target.userId !== user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      const comment = await prisma.playlistComment.update({
        where: { id: commentId },
        data: { content },
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

      return NextResponse.json({
        ok: true,
        action: 'edit-comment',
        comment: {
          id: comment.id,
          content: comment.content,
          createdAt: comment.createdAt.toISOString(),
          user: comment.user,
        },
      });
    }

    if (body.action === 'delete-comment') {
      const commentId = body.commentId?.trim();
      if (!commentId) {
        return NextResponse.json({ error: 'commentId is required' }, { status: 400 });
      }

      const target = await prisma.playlistComment.findFirst({
        where: {
          id: commentId,
          playlistId: id,
          deletedAt: null,
        },
        select: { id: true, userId: true },
      });

      if (!target) {
        return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
      }

      const canDelete = target.userId === user.id || user.role === 'ADMIN';

      if (!canDelete) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      await prisma.playlistComment.delete({
        where: { id: commentId },
      });

      const commentsCount = await prisma.playlistComment.count({
        where: {
          playlistId: id,
          deletedAt: null,
        },
      });

      return NextResponse.json({
        ok: true,
        action: 'delete-comment',
        commentId,
        commentsCount,
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

export async function PATCH(request: Request, context: RouteContext) {
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

    const body = (await request.json()) as ListPayloadInput;
    const parsed = validateAndNormalizeListPayload(body, {
      expectedType: 'track',
      requireType: false,
    });
    if (!parsed.data) {
      return NextResponse.json({ error: parsed.error ?? 'Bad request' }, { status: 400 });
    }

    const { title, story, visibility, musicItems, tags } = parsed.data;
    const tagRows = await upsertTags(tags);

    await prisma.$transaction(async (tx) => {
      await tx.playlist.update({
        where: { id },
        data: { title, story, visibility },
      });

      await Promise.all(
        musicItems.map((item) =>
          tx.track.upsert({
            where: { spotifyId: item.id },
            update: {
              title: item.name,
              artist: item.artist,
              albumCover: item.albumImageUrl ?? '',
            },
            create: {
              spotifyId: item.id,
              title: item.name,
              artist: item.artist,
              albumCover: item.albumImageUrl ?? '',
            },
            select: { id: true, spotifyId: true },
          })
        )
      );

      const tracks = await tx.track.findMany({
        where: { spotifyId: { in: musicItems.map((item) => item.id) } },
        select: { id: true, spotifyId: true },
      });
      const trackIdBySpotifyId = new Map(tracks.map((track) => [track.spotifyId, track.id]));

      await tx.playlistTrack.deleteMany({ where: { playlistId: id } });
      await tx.playlistTrack.createMany({
        data: musicItems
          .map((item, index) => {
            const trackId = trackIdBySpotifyId.get(item.id);
            if (!trackId) return null;
            return {
              playlistId: id,
              trackId,
              order: index,
            };
          })
          .filter((row): row is { playlistId: string; trackId: string; order: number } => row !== null),
      });

      await tx.playlistTag.deleteMany({ where: { playlistId: id } });
      if (tagRows.length > 0) {
        await tx.playlistTag.createMany({
          data: tagRows.map((tag) => ({
            playlistId: id,
            tagId: tag.id,
          })),
          skipDuplicates: true,
        });
      }
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
