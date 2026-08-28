export const DELETED_COMMENT_CONTENT = '삭제된 댓글입니다';

export type SerializedComment = {
  id: string;
  content: string;
  parentId: string | null;
  rootId: string | null;
  isDeleted: boolean;
  hasReplies: boolean;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    nickname: string | null;
    avatarUrl: string | null;
    role: 'USER' | 'ADMIN';
  };
  replyTo: {
    commentId: string;
    user: {
      id: string;
      nickname: string | null;
    };
  } | null;
};

export type CommentRow = {
  id: string;
  content: string;
  parentId: string | null;
  rootId: string | null;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  user: SerializedComment['user'];
  parent: {
    id: string;
    user: {
      id: string;
      nickname: string | null;
    };
  } | null;
  _count: {
    replies: number;
  };
};

/**
 * Deleted comments remain visible only when they connect an active reply to its
 * thread. This preserves conversation context without keeping empty tombstones.
 */
export function serializeCommentThread(rows: CommentRow[]): SerializedComment[] {
  const byId = new Map(rows.map((row) => [row.id, row]));
  const visibleIds = new Set(rows.filter((row) => !row.deletedAt).map((row) => row.id));

  for (const row of rows) {
    if (row.deletedAt) continue;

    if (row.rootId) visibleIds.add(row.rootId);

    let parentId = row.parentId;
    const visited = new Set<string>();
    while (parentId && !visited.has(parentId)) {
      visited.add(parentId);
      visibleIds.add(parentId);
      parentId = byId.get(parentId)?.parentId ?? null;
    }
  }

  return rows
    .filter((row) => visibleIds.has(row.id))
    .map((row) => ({
      id: row.id,
      content: row.deletedAt ? DELETED_COMMENT_CONTENT : row.content,
      parentId: row.parentId,
      rootId: row.rootId,
      isDeleted: Boolean(row.deletedAt),
      hasReplies: row._count.replies > 0,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      user: row.user,
      replyTo: row.parent
        ? {
            commentId: row.parent.id,
            user: row.parent.user,
          }
        : null,
    }));
}
