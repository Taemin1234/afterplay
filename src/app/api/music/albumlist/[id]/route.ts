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

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type AlbumListActionPayload = {
  action?: 'toggle-like' | 'toggle-bookmark' | 'comment' | 'edit-comment' | 'delete-comment';
  commentId?: string;
  content?: string;
};

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

    // 댓글 동작
    /////////////////////////////////
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

    // 댓글 수정
    if (body.action === 'edit-comment') {
      const commentId = body.commentId?.trim(); // 댓글 ID
      const content = body.content?.trim(); // 댓글 내용

      // 잘못된 요청은 DB조회 전 차단
      if (!commentId) {
        return NextResponse.json({ error: '사용자가 없습니다.' }, { status: 400 });
      } // id가 없을때
      if (!content) {
        return NextResponse.json({ error: '내용이 없습니다.' }, { status: 400 });
      } // 내용이 없을때
      if (content.length > 500) {
        return NextResponse.json({ error: '댓글은 500자 이하로 제한됩니다.' }, { status: 400 });
      } // 댓글 길이가 500자 넘을 때

      // 수정 대상 댓글 조회
      const target = await prisma.albumListComment.findFirst({
        where: {
          id: commentId, // id와 commentId가 같고
          albumListId: id, // 현재 albumList에 속한 댓글
          deletedAt: null, // 삭제되지 않은 댓글
        },
        select: { id: true, userId: true }, // id와 userId 가져오기
      });

      // 댓글이 없을 때
      if (!target) {
        return NextResponse.json({ error: '댓글을 찾을 수 없습니다.' }, { status: 404 });
      }
      // 댓글 작성자 본인만 수정
      if (target.userId !== user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      // 댓글 업데이트
      const comment = await prisma.albumListComment.update({
        where: { id: commentId }, // 해당 댓글
        data: { content }, // 내용 변경
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

      // 수정 성공 응답
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

    // 댓글 삭제
    if (body.action === 'delete-comment') {
      const commentId = body.commentId?.trim();
      if (!commentId) {
        return NextResponse.json({ error: 'commentId is required' }, { status: 400 });
      }

      const target = await prisma.albumListComment.findFirst({
        where: {
          id: commentId,
          albumListId: id,
          deletedAt: null,
        },
        select: { id: true, userId: true },
      });

      if (!target) {
        return NextResponse.json({ error: '댓글을 찾을 수 없습니다.' }, { status: 404 });
      }

      const canDelete = target.userId === user.id || user.role === 'ADMIN';

      if (!canDelete) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      await prisma.albumListComment.delete({
        where: { id: commentId },
      });

      const commentsCount = await prisma.albumListComment.count({
        where: {
          albumListId: id,
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
