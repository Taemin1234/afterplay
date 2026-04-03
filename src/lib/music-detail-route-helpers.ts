import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// 프론트에서 보내는 요청 형태 정의
export type MusicDetailActionPayload = {
  action?: 'toggle-like' | 'toggle-bookmark' | 'comment' | 'edit-comment' | 'delete-comment';
  commentId?: string;
  content?: string;
};

// 작업 수행 대상
type Actor = {
  id: string;
  role?: string | null;
};

// 대상 댓글 정보
type CommentTarget = {
  id: string;
  userId: string;
};

type CommentWithAuthor = {
  id: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  user: {
    id: string;
    nickname: string | null;
    avatarUrl: string | null;
    role: 'USER' | 'ADMIN';
  };
};

// 댓글 작성/수정/삭제 흐름 (앨범, 플레이는 외부에서 결정)
type HandleCommentActionsArgs = {
  action: MusicDetailActionPayload['action'];
  body: MusicDetailActionPayload;
  actor: Actor;
  createComment: (content: string) => Promise<CommentWithAuthor>;
  findCommentTarget: (commentId: string) => Promise<CommentTarget | null>;
  updateComment: (commentId: string, content: string) => Promise<CommentWithAuthor>;
  deleteComment: (commentId: string) => Promise<void>;
  countComments: () => Promise<number>;
  canDelete?: (params: { actor: Actor; targetUserId: string }) => boolean;
};

function badRequest(error: string) {
  return NextResponse.json({ error }, { status: 400 });
}

//DB에서 가져온 댓글 객체를 프론트 응답용 형태로 바꿔주는 함수
function toCommentResponse(comment: CommentWithAuthor) {
  return {
    id: comment.id,
    content: comment.content,
    createdAt: comment.createdAt.toISOString(),
    updatedAt: comment.updatedAt.toISOString(),
    user: comment.user,
  };
}


// 댓글 내용 파싱
type ParsedCommentContent = { content: string } | { error: string };

// 댓글 검증 
// 공백제거, 공백 확인, 500자 확인 문제 없으면 반환
function readCommentContent(content?: string): ParsedCommentContent {
  const normalized = content?.trim();
  if (!normalized) return { error: '내용을 작성해주세요' as const };
  if (normalized.length > 500) return { error: '댓글은 500자를 초과할 수 없습니다.' as const };
  return { content: normalized };
}

// 댓글 id 파싱
type ParsedCommentId = { commentId: string } | { error: string };

// 댓글 수정 삭제 시 필요한 id 검증
function readCommentId(commentId?: string): ParsedCommentId {
  const normalized = commentId?.trim();
  if (!normalized) return { error: 'commentId is required' as const };
  return { commentId: normalized };
}

// 댓글 삭제 권한
// 댓글 주인 또는 관리자만 
function defaultCanDelete({ actor, targetUserId }: { actor: Actor; targetUserId: string }) {
  return actor.id === targetUserId || actor.role === 'ADMIN';
}

// 댓글 컨트롤러
export async function handleCommentActions(args: HandleCommentActionsArgs): Promise<NextResponse | null> {
  // 호출하는 쪽에서 삭제 정책 전달
  const canDelete = args.canDelete ?? defaultCanDelete;

  // 댓글 동작 분기
  /////////////////////////////////

  // 댓글 작성
  if (args.action === 'comment') {
    //parsed가 error인지 content인지 분기
    const parsed = readCommentContent(args.body.content);
    if ('error' in parsed) return badRequest(parsed.error);

    // 댓글 생성 (api에서 진행)
    const comment = await args.createComment(parsed.content);
    const commentsCount = await args.countComments();

    // 결과 응답
    return NextResponse.json({
      ok: true,
      action: 'comment',
      commentsCount,
      comment: toCommentResponse(comment),
    });
  }

  // 댓글 수정
  if (args.action === 'edit-comment') {
    const parsedId = readCommentId(args.body.commentId);
    if ('error' in parsedId) return badRequest(parsedId.error);

    const parsedContent = readCommentContent(args.body.content);
    if ('error' in parsedContent) return badRequest(parsedContent.error);

    // 대상 댓글 찾기
    const target = await args.findCommentTarget(parsedId.commentId);
    if (!target) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }
    // 수정 권한 체크(본인만)
    if (target.userId !== args.actor.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 수정 진행
    const comment = await args.updateComment(parsedId.commentId, parsedContent.content);

    return NextResponse.json({
      ok: true,
      action: 'edit-comment',
      comment: toCommentResponse(comment),
    });
  }

  //삭제
  if (args.action === 'delete-comment') {
    const parsedId = readCommentId(args.body.commentId);
    if ('error' in parsedId) return badRequest(parsedId.error);

    const target = await args.findCommentTarget(parsedId.commentId);
    if (!target) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    if (!canDelete({ actor: args.actor, targetUserId: target.userId })) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await args.deleteComment(parsedId.commentId);
    const commentsCount = await args.countComments();

    return NextResponse.json({
      ok: true,
      action: 'delete-comment',
      commentId: parsedId.commentId,
      commentsCount,
    });
  }

  return null;
}

//////////////////////////////////////
// 북마크
//////////////////////////////////////

// SQL 식별자 검증
function assertSqlIdentifier(identifier: string) {
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(identifier)) {
    throw new Error(`Invalid SQL identifier: ${identifier}`);
  }
  return identifier;
}

// 북마크 토글 타입
type ToggleBookmarkByRawSqlArgs = {
  userId: string;
  tableName: string;
  foreignKeyColumn: string;
  foreignKeyValue: string;
};

// 북마크 공통함수
// 북마크 여부와 그에 따른 동작, 북마크 수와 내 북마크 여부 반환
export async function toggleBookmarkByRawSql({
  userId,
  tableName,
  foreignKeyColumn,
  foreignKeyValue,
}: ToggleBookmarkByRawSqlArgs) {
  // 동적 SQL에 들어갈 값을 검중
  const safeTable = assertSqlIdentifier(tableName);
  const safeForeignKey = assertSqlIdentifier(foreignKeyColumn);

  // 북마크 존재 확인
  // 사용자가 이 게시물을 북마크했는지 확인
  const existingRows = await prisma.$queryRawUnsafe<Array<{ exists: boolean }>>(
    `SELECT EXISTS(SELECT 1 FROM "${safeTable}" WHERE "userId" = $1 AND "${safeForeignKey}" = $2) AS "exists"`,
    userId,
    foreignKeyValue
  );

  // boolean 값 꺼내기
  const exists = existingRows[0]?.exists ?? false;

  if (exists) {
    // 존재하면 삭제
    await prisma.$executeRawUnsafe(
      `DELETE FROM "${safeTable}" WHERE "userId" = $1 AND "${safeForeignKey}" = $2`,
      userId,
      foreignKeyValue
    );
  } else {
    // 없으면 추가
    await prisma.$executeRawUnsafe(
      `INSERT INTO "${safeTable}" ("userId", "${safeForeignKey}") VALUES ($1, $2)`,
      userId,
      foreignKeyValue
    );
  }

  const [countRows, mineRows] = await Promise.all([
    // 해당 게시물을 북마크한 전체 사용자 수
    prisma.$queryRawUnsafe<Array<{ count: bigint }>>(
      `SELECT COUNT(*)::bigint AS "count" FROM "${safeTable}" WHERE "${safeForeignKey}" = $1`,
      foreignKeyValue
    ),
    // 현재 사용자가 해당 게시물에 대해 북마크 여부 확인
    prisma.$queryRawUnsafe<Array<{ count: bigint }>>(
      `SELECT COUNT(*)::bigint AS "count" FROM "${safeTable}" WHERE "${safeForeignKey}" = $1 AND "userId" = $2`,
      foreignKeyValue,
      userId
    ),
  ]);

  return {
    bookmarksCount: Number(countRows[0]?.count ?? 0),
    viewerHasBookmarked: Number(mineRows[0]?.count ?? 0) > 0,
  };
}
