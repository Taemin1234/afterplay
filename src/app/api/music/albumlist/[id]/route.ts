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
} from '@/lib/music-detail-route-helpers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

async function getDbUserRole(userId: string) {
  const dbUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  return dbUser?.role ?? 'USER';
}

async function findAccessibleAlbumList(id: string, userId: string, isAdmin = false) {
  return prisma.albumList.findFirst({
    where: {
      id,
      deletedAt: null,
      ...(isAdmin ? {} : { OR: [{ visibility: 'PUBLIC' }, { authorId: userId }] }),
    },
    select: { id: true, visibility: true },
  });
}

async function toggleAlbumListLike(id: string, userId: string) {
  const key = { userId_albumListId: { userId, albumListId: id } };
  const existing = await prisma.albumListLike.findUnique({ where: key });

  if (existing) {
    await prisma.albumListLike.delete({ where: key });
  } else {
    await prisma.albumListLike.create({ data: { userId, albumListId: id } });
  }

  const likesCount = await prisma.albumListLike.count({ where: { albumListId: id } });

  return {
    likesCount,
    viewerHasLiked: !existing,
  };
}

async function toggleAlbumListBookmark(id: string, userId: string) {
  const key = { userId_albumListId: { userId, albumListId: id } };
  const existing = await prisma.albumListBookmark.findUnique({ where: key });

  if (existing) {
    await prisma.albumListBookmark.delete({ where: key });
  } else {
    await prisma.albumListBookmark.create({ data: { userId, albumListId: id } });
  }

  const bookmarksCount = await prisma.albumListBookmark.count({ where: { albumListId: id } });

  return {
    bookmarksCount,
    viewerHasBookmarked: !existing,
  };
}

async function toggleFeaturedAlbumList(id: string, userId: string, sectionId: string, enabled: boolean) {
  const [albumList, section] = await Promise.all([
    prisma.albumList.findFirst({
      where: { id, deletedAt: null },
      select: { id: true, visibility: true },
    }),
    prisma.featuredAlbumListSection.findFirst({
      where: { id: sectionId, isActive: true },
      select: { id: true },
    }),
  ]);

  if (!albumList) {
    return NextResponse.json({ error: 'Album list not found' }, { status: 404 });
  }
  if (albumList.visibility !== 'PUBLIC') {
    return NextResponse.json({ error: '비공개 게시물은 특별게시물로 설정할 수 없습니다.' }, { status: 400 });
  }
  if (!section) {
    return NextResponse.json({ error: 'Featured section not found' }, { status: 404 });
  }

  if (enabled) {
    await prisma.featuredAlbumList.upsert({
      where: { albumListId_sectionId: { albumListId: id, sectionId } },
      update: {
        isActive: true,
        setByUserId: userId,
      },
      create: {
        albumListId: id,
        sectionId,
        setByUserId: userId,
      },
    });
  } else {
    await prisma.featuredAlbumList.updateMany({
      where: { albumListId: id, sectionId },
      data: { isActive: false },
    });
  }

  const featuredSettings = await prisma.featuredAlbumList.findMany({
    where: { albumListId: id, isActive: true },
    select: { sectionId: true },
  });

  return NextResponse.json({
    ok: true,
    action: 'toggle-featured',
    featuredSectionIds: featuredSettings.map((setting) => setting.sectionId),
  });
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
    const isAdmin = user ? (await getDbUserRole(user.id)) === 'ADMIN' : false;

    const albumList = await fetchAlbumListDetail(id, user?.id, { canViewPrivate: isAdmin });
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

    const body = (await request.json()) as MusicDetailActionPayload;

    if (body.action === 'toggle-like') {
      const albumList = await findAccessibleAlbumList(id, user.id);
      if (!albumList) {
        return NextResponse.json({ error: 'Album list not found' }, { status: 404 });
      }

      const { likesCount, viewerHasLiked } = await toggleAlbumListLike(id, user.id);

      return NextResponse.json({
        ok: true,
        action: 'toggle-like',
        likesCount,
        viewerHasLiked,
      });
    }

    if (body.action === 'toggle-bookmark') {
      const albumList = await findAccessibleAlbumList(id, user.id);
      if (!albumList) {
        return NextResponse.json({ error: 'Album list not found' }, { status: 404 });
      }

      const { bookmarksCount, viewerHasBookmarked } = await toggleAlbumListBookmark(id, user.id);

      return NextResponse.json({
        ok: true,
        action: 'toggle-bookmark',
        bookmarksCount,
        viewerHasBookmarked,
      });
    }

    if (body.action === 'toggle-featured') {
      const role = await getDbUserRole(user.id);
      if (role !== 'ADMIN') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      if (!body.sectionId || typeof body.enabled !== 'boolean') {
        return NextResponse.json({ error: 'sectionId and enabled are required' }, { status: 400 });
      }

      return toggleFeaturedAlbumList(id, user.id, body.sectionId, body.enabled);
    }

    if (!isCommentAction(body.action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const [albumList, dbUser] = await Promise.all([
      findAccessibleAlbumList(id, user.id),
      prisma.user.findUnique({
        where: { id: user.id },
        select: { role: true },
      }),
    ]);

    if (!albumList) {
      return NextResponse.json({ error: 'Album list not found' }, { status: 404 });
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

export async function DELETE(request: Request, context: RouteContext) {
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
      select: { authorId: true, title: true },
    });

    if (!albumList) {
      return NextResponse.json({ error: 'Album list not found' }, { status: 404 });
    }

    const role = await getDbUserRole(user.id);
    if (albumList.authorId !== user.id && role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const body = (await request.json().catch(() => null)) as { confirmationTitle?: string } | null;
    if (body?.confirmationTitle !== albumList.title) {
      return NextResponse.json({ error: '게시물 제목 확인이 필요합니다.' }, { status: 400 });
    }

    await prisma.$transaction([
      prisma.albumList.update({
        where: { id },
        data: { deletedAt: new Date() },
      }),
      prisma.featuredAlbumList.updateMany({
        where: { albumListId: id },
        data: { isActive: false },
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

      if (visibility === 'PRIVATE') {
        await tx.featuredAlbumList.updateMany({
          where: { albumListId: id },
          data: { isActive: false },
        });
      }

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
