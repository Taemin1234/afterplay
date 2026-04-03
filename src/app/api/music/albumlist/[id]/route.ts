import { NextResponse } from 'next/server';
import { fetchAlbumListDetail } from '@/lib/music-lists';
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

    const body = (await request.json()) as MusicDetailActionPayload;

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
      const { bookmarksCount, viewerHasBookmarked } = await toggleBookmarkByRawSql({
        userId: user.id,
        tableName: 'AlbumListBookmark',
        foreignKeyColumn: 'albumListId',
        foreignKeyValue: id,
      });

      return NextResponse.json({
        ok: true,
        action: 'toggle-bookmark',
        bookmarksCount,
        viewerHasBookmarked,
      });
    }

    const commentActionResponse = await handleCommentActions({
      action: body.action,
      body,
      actor: {
        id: user.id,
        role: user.role,
      },
      createComment: async (content) =>
        prisma.albumListComment.create({
          data: {
            content,
            userId: user.id,
            albumListId: id,
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
        prisma.albumListComment.findFirst({
          where: {
            id: commentId,
            albumListId: id,
            deletedAt: null,
          },
          select: { id: true, userId: true },
        }),
      updateComment: async (commentId, content) =>
        prisma.albumListComment.update({
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
        await prisma.albumListComment.delete({
          where: { id: commentId },
        });
      },
      countComments: async () =>
        prisma.albumListComment.count({
          where: {
            albumListId: id,
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

    const body = (await request.json()) as ListPayloadInput;
    const parsed = validateAndNormalizeListPayload(body, {
      expectedType: 'album',
      requireType: false,
    });
    if (!parsed.data) {
      return NextResponse.json({ error: parsed.error ?? 'Bad request' }, { status: 400 });
    }

    const { title, story, visibility, musicItems, tags } = parsed.data;
    const tagRows = await upsertTags(tags);

    await prisma.$transaction(async (tx) => {
      await tx.albumList.update({
        where: { id },
        data: { title, story, visibility },
      });

      await Promise.all(
        musicItems.map((item) =>
          tx.album.upsert({
            where: { spotifyId: item.id },
            update: {
              title: item.name,
              artist: item.artist,
              coverImage: item.albumImageUrl ?? '',
            },
            create: {
              spotifyId: item.id,
              title: item.name,
              artist: item.artist,
              coverImage: item.albumImageUrl ?? '',
            },
            select: { id: true, spotifyId: true },
          })
        )
      );

      const albums = await tx.album.findMany({
        where: { spotifyId: { in: musicItems.map((item) => item.id) } },
        select: { id: true, spotifyId: true },
      });
      const albumIdBySpotifyId = new Map(albums.map((album) => [album.spotifyId, album.id]));

      await tx.albumEntry.deleteMany({ where: { albumListId: id } });
      await tx.albumEntry.createMany({
        data: musicItems
          .map((item, index) => {
            const albumId = albumIdBySpotifyId.get(item.id);
            if (!albumId) return null;
            return {
              albumListId: id,
              albumId,
              order: index,
            };
          })
          .filter((row): row is { albumListId: string; albumId: string; order: number } => row !== null),
      });

      await tx.albumListTag.deleteMany({ where: { albumListId: id } });
      if (tagRows.length > 0) {
        await tx.albumListTag.createMany({
          data: tagRows.map((tag) => ({
            albumListId: id,
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
