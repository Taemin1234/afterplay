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
import {
  type MusicDetailActionPayload,
  handleCommentActions,
  toggleBookmarkByRawSql,
} from '@/lib/music-detail-route-helpers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

async function findAccessiblePlaylist(id: string, userId: string) {
  return prisma.playlist.findFirst({
    where: {
      id,
      deletedAt: null,
      OR: [{ visibility: 'PUBLIC' }, { authorId: userId }],
    },
    select: { id: true },
  });
}

async function togglePlaylistLike(id: string, userId: string) {
  const key = { userId_playlistId: { userId, playlistId: id } };
  const existing = await prisma.playlistLike.findUnique({ where: key });

  if (existing) {
    await prisma.playlistLike.delete({ where: key });
  } else {
    await prisma.playlistLike.create({ data: { userId, playlistId: id } });
  }

  const likesCount = await prisma.playlistLike.count({ where: { playlistId: id } });

  return {
    likesCount,
    viewerHasLiked: !existing,
  };
}

function isCommentAction(action: MusicDetailActionPayload['action']) {
  return action === 'comment' || action === 'edit-comment' || action === 'delete-comment';
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

    const body = (await request.json()) as MusicDetailActionPayload;

    if (body.action === 'toggle-like') {
      const playlist = await findAccessiblePlaylist(id, user.id);
      if (!playlist) {
        return NextResponse.json({ error: 'Playlist not found' }, { status: 404 });
      }

      const { likesCount, viewerHasLiked } = await togglePlaylistLike(id, user.id);

      return NextResponse.json({
        ok: true,
        action: 'toggle-like',
        likesCount,
        viewerHasLiked,
      });
    }

    if (body.action === 'toggle-bookmark') {
      const playlist = await findAccessiblePlaylist(id, user.id);
      if (!playlist) {
        return NextResponse.json({ error: 'Playlist not found' }, { status: 404 });
      }

      const { bookmarksCount, viewerHasBookmarked } = await toggleBookmarkByRawSql({
        userId: user.id,
        tableName: 'PlaylistBookmark',
        foreignKeyColumn: 'playlistId',
        foreignKeyValue: id,
      });

      return NextResponse.json({
        ok: true,
        action: 'toggle-bookmark',
        bookmarksCount,
        viewerHasBookmarked,
      });
    }

    if (!isCommentAction(body.action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const [playlist, dbUser] = await Promise.all([
      findAccessiblePlaylist(id, user.id),
      prisma.user.findUnique({
        where: { id: user.id },
        select: { role: true },
      }),
    ]);

    if (!playlist) {
      return NextResponse.json({ error: 'Playlist not found' }, { status: 404 });
    }

    if (body.action === 'comment' && !dbUser) {
      await upsertDbUser(user);
    }

    const commentActionResponse = await handleCommentActions({
      action: body.action,
      body,
      actor: {
        id: user.id,
        role: dbUser?.role ?? 'USER',
      },
      createComment: async (content) =>
        prisma.playlistComment.create({
          data: {
            content,
            userId: user.id,
            playlistId: id,
          },
          select: {
            id: true,
            content: true,
            createdAt: true,
            updatedAt: true,
            user: {
              select: {
                id: true,
                nickname: true,
                avatarUrl: true,
                role: true,
              },
            },
          },
        }),
      findCommentTarget: async (commentId) =>
        prisma.playlistComment.findFirst({
          where: {
            id: commentId,
            playlistId: id,
            deletedAt: null,
          },
          select: { id: true, userId: true },
        }),
      updateComment: async (commentId, content) =>
        prisma.playlistComment.update({
          where: { id: commentId },
          data: { content },
          select: {
            id: true,
            content: true,
            createdAt: true,
            updatedAt: true,
            user: {
              select: {
                id: true,
                nickname: true,
                avatarUrl: true,
                role: true,
              },
            },
          },
        }),
      deleteComment: async (commentId) => {
        await prisma.playlistComment.delete({
          where: { id: commentId },
        });
      },
      countComments: async () =>
        prisma.playlistComment.count({
          where: {
            playlistId: id,
            deletedAt: null,
          },
        }),
    });
    if (commentActionResponse) {
      return commentActionResponse;
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
