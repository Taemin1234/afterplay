import prisma from '@/lib/prisma';
import { serializeCommentThread, type CommentRow, type SerializedComment } from '@/lib/comment-threads';

export const ROOT_COMMENT_PAGE_SIZE = 10;
export const REPLY_PREVIEW_SIZE = 3;
export const REPLY_PAGE_SIZE = 10;

type CommentKind = 'playlist' | 'albumlist' | 'poll';

type CursorValue = {
  createdAt: string;
  id: string;
};

export type CommentPageResponse = {
  comments: SerializedComment[];
  nextCursor: string | null;
  replyNextCursors: Record<string, string | null>;
};

export type ReplyPageResponse = {
  comments: SerializedComment[];
  nextCursor: string | null;
};

const commentSelect = {
  id: true,
  content: true,
  parentId: true,
  rootId: true,
  deletedAt: true,
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
  parent: {
    select: {
      id: true,
      user: { select: { id: true, nickname: true } },
    },
  },
  _count: { select: { replies: true } },
} as const;

function encodeCursor(row: Pick<CommentRow, 'createdAt' | 'id'>) {
  return Buffer.from(
    JSON.stringify({ createdAt: row.createdAt.toISOString(), id: row.id } satisfies CursorValue)
  ).toString('base64url');
}

function decodeCursor(rawCursor: string | null | undefined): CursorValue | null {
  if (!rawCursor) return null;

  try {
    const parsed = JSON.parse(Buffer.from(rawCursor, 'base64url').toString('utf8')) as Partial<CursorValue>;
    if (typeof parsed.createdAt !== 'string' || Number.isNaN(Date.parse(parsed.createdAt))) return null;
    if (typeof parsed.id !== 'string' || !parsed.id) return null;
    return { createdAt: parsed.createdAt, id: parsed.id };
  } catch {
    return null;
  }
}

function buildCursorWhere(rawCursor: string | null | undefined) {
  const cursor = decodeCursor(rawCursor);
  if (!cursor) return {};

  const createdAt = new Date(cursor.createdAt);
  return {
    OR: [
      { createdAt: { gt: createdAt } },
      { createdAt, id: { gt: cursor.id } },
    ],
  };
}

async function findRootComments(
  kind: CommentKind,
  itemId: string,
  cursor: string | null | undefined,
  take: number
): Promise<CommentRow[]> {
  const cursorWhere = buildCursorWhere(cursor);
  const query = {
    where: {
      rootId: null,
      AND: [
        cursorWhere,
        {
          OR: [
            { deletedAt: null },
            { threadReplies: { some: { deletedAt: null } } },
          ],
        },
      ],
    },
    orderBy: [{ createdAt: 'asc' as const }, { id: 'asc' as const }],
    take,
    select: commentSelect,
  };

  if (kind === 'playlist') {
    return prisma.playlistComment.findMany({ ...query, where: { playlistId: itemId, ...query.where } });
  }
  if (kind === 'albumlist') {
    return prisma.albumListComment.findMany({ ...query, where: { albumListId: itemId, ...query.where } });
  }
  return prisma.musicPollComment.findMany({ ...query, where: { pollId: itemId, ...query.where } });
}

async function findReplies(
  kind: CommentKind,
  itemId: string,
  rootId: string,
  cursor: string | null | undefined,
  take: number
): Promise<CommentRow[]> {
  const cursorWhere = buildCursorWhere(cursor);
  const query = {
    where: { rootId, ...cursorWhere },
    orderBy: [{ createdAt: 'asc' as const }, { id: 'asc' as const }],
    take,
    select: commentSelect,
  };

  if (kind === 'playlist') {
    return prisma.playlistComment.findMany({ ...query, where: { playlistId: itemId, ...query.where } });
  }
  if (kind === 'albumlist') {
    return prisma.albumListComment.findMany({ ...query, where: { albumListId: itemId, ...query.where } });
  }
  return prisma.musicPollComment.findMany({ ...query, where: { pollId: itemId, ...query.where } });
}

export async function fetchCommentPage(
  kind: CommentKind,
  itemId: string,
  cursor?: string | null
): Promise<CommentPageResponse> {
  const roots = await findRootComments(kind, itemId, cursor, ROOT_COMMENT_PAGE_SIZE + 1);
  const hasMoreRoots = roots.length > ROOT_COMMENT_PAGE_SIZE;
  const pageRoots = roots.slice(0, ROOT_COMMENT_PAGE_SIZE);
  const replyPages = await Promise.all(
    pageRoots.map(async (root) => {
      const replies = await findReplies(kind, itemId, root.id, null, REPLY_PREVIEW_SIZE + 1);
      const hasMoreReplies = replies.length > REPLY_PREVIEW_SIZE;
      const visibleReplies = replies.slice(0, REPLY_PREVIEW_SIZE);
      return {
        rootId: root.id,
        replies: visibleReplies,
        nextCursor: hasMoreReplies && visibleReplies.length > 0
          ? encodeCursor(visibleReplies[visibleReplies.length - 1])
          : null,
      };
    })
  );

  const rows = pageRoots.flatMap((root) => [
    root,
    ...(replyPages.find((page) => page.rootId === root.id)?.replies ?? []),
  ]);

  return {
    comments: serializeCommentThread(rows),
    nextCursor: hasMoreRoots && pageRoots.length > 0
      ? encodeCursor(pageRoots[pageRoots.length - 1])
      : null,
    replyNextCursors: Object.fromEntries(replyPages.map((page) => [page.rootId, page.nextCursor])),
  };
}

export async function fetchReplyPage(
  kind: CommentKind,
  itemId: string,
  rootId: string,
  cursor?: string | null
): Promise<ReplyPageResponse> {
  const replies = await findReplies(kind, itemId, rootId, cursor, REPLY_PAGE_SIZE + 1);
  const hasMore = replies.length > REPLY_PAGE_SIZE;
  const pageReplies = replies.slice(0, REPLY_PAGE_SIZE);

  return {
    comments: serializeCommentThread(pageReplies),
    nextCursor: hasMore && pageReplies.length > 0
      ? encodeCursor(pageReplies[pageReplies.length - 1])
      : null,
  };
}
