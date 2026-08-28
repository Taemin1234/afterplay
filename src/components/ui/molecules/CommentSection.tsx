'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Button from '@/components/ui/atoms/Button';
import type { SerializedComment } from '@/lib/comment-threads';
import type { CommentPageResponse, ReplyPageResponse } from '@/lib/comment-pagination';

const COMMENT_MAX_LENGTH = 500;

export type ListComment = SerializedComment;

interface CommentSectionProps {
  apiSegment?: 'playlist' | 'albumlist';
  apiEndpoint?: string;
  commentsEndpoint?: string;
  itemId: string;
  isLoggedIn: boolean;
  isAdmin?: boolean;
  viewerUserId?: string | null;
  loginHref: string;
  initialComments: ListComment[];
  requireLogin: () => boolean;
  targetRef?: React.RefObject<HTMLElement | null>;
  onCommentsCountChange: (count: number) => void;
  className?: string;
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function isEditedComment(comment: ListComment) {
  return !comment.isDeleted && new Date(comment.updatedAt).getTime() > new Date(comment.createdAt).getTime();
}

function mergeComments(current: ListComment[], incoming: ListComment[]) {
  const byId = new Map(current.map((comment) => [comment.id, comment]));
  for (const comment of incoming) byId.set(comment.id, comment);
  return Array.from(byId.values());
}

export default function CommentSection({
  apiSegment,
  apiEndpoint,
  commentsEndpoint,
  itemId,
  isLoggedIn,
  isAdmin = false,
  viewerUserId = null,
  loginHref,
  initialComments,
  requireLogin,
  targetRef,
  onCommentsCountChange,
  className = 'rounded-2xl border border-white/10 bg-bg2 p-6',
}: CommentSectionProps) {
  const [comments, setComments] = useState<ListComment[]>(initialComments);
  const [commentInput, setCommentInput] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentInput, setEditingCommentInput] = useState('');
  const [replyingTo, setReplyingTo] = useState<ListComment | null>(null);
  const [replyInput, setReplyInput] = useState('');
  const [pendingCommentActionId, setPendingCommentActionId] = useState<string | null>(null);
  const [rootNextCursor, setRootNextCursor] = useState<string | null>(null);
  const [replyNextCursors, setReplyNextCursors] = useState<Record<string, string | null>>({});
  const [isLoadingComments, setIsLoadingComments] = useState(true);
  const [isLoadingMoreComments, setIsLoadingMoreComments] = useState(false);
  const [loadingReplyRootId, setLoadingReplyRootId] = useState<string | null>(null);
  const [commentsLoadError, setCommentsLoadError] = useState<string | null>(null);
  const endpoint = apiEndpoint ?? `/api/music/${apiSegment}/${itemId}`;
  const commentListEndpoint = commentsEndpoint ?? (apiEndpoint ? apiEndpoint : `${endpoint}/comments`);

  const threads = useMemo(
    () =>
      comments
        .filter((comment) => comment.rootId === null)
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
        .map((root) => ({
          root,
          replies: comments
            .filter((comment) => comment.rootId === root.id)
            .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
        })),
    [comments]
  );

  useEffect(() => {
    setComments(initialComments);
    setCommentInput('');
    setEditingCommentId(null);
    setEditingCommentInput('');
    setReplyingTo(null);
    setReplyInput('');
    setPendingCommentActionId(null);
    setRootNextCursor(null);
    setReplyNextCursors({});
    setCommentsLoadError(null);

    const controller = new AbortController();
    const loadInitialComments = async () => {
      setIsLoadingComments(true);
      try {
        const res = await fetch(commentListEndpoint, { cache: 'no-store', signal: controller.signal });
        if (!res.ok) throw new Error('failed');
        const data = (await res.json()) as CommentPageResponse;
        setComments(data.comments);
        setRootNextCursor(data.nextCursor);
        setReplyNextCursors(data.replyNextCursors);
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') return;
        console.error(error);
        setCommentsLoadError('댓글을 불러오지 못했습니다.');
      } finally {
        setIsLoadingComments(false);
      }
    };

    void loadInitialComments();
    return () => controller.abort();
  }, [commentListEndpoint, initialComments]);

  const handleLoadMoreComments = async () => {
    if (!rootNextCursor || isLoadingMoreComments) return;
    setIsLoadingMoreComments(true);
    try {
      const params = new URLSearchParams({ cursor: rootNextCursor });
      const res = await fetch(`${commentListEndpoint}?${params.toString()}`, { cache: 'no-store' });
      if (!res.ok) throw new Error('failed');
      const data = (await res.json()) as CommentPageResponse;
      setComments((current) => mergeComments(current, data.comments));
      setRootNextCursor(data.nextCursor);
      setReplyNextCursors((current) => ({ ...current, ...data.replyNextCursors }));
    } catch (error) {
      console.error(error);
      alert('댓글을 추가로 불러오지 못했습니다.');
    } finally {
      setIsLoadingMoreComments(false);
    }
  };

  const handleLoadMoreReplies = async (rootId: string) => {
    const cursor = replyNextCursors[rootId];
    if (!cursor || loadingReplyRootId) return;
    setLoadingReplyRootId(rootId);
    try {
      const params = new URLSearchParams({ rootId, cursor });
      const res = await fetch(`${commentListEndpoint}?${params.toString()}`, { cache: 'no-store' });
      if (!res.ok) throw new Error('failed');
      const data = (await res.json()) as ReplyPageResponse;
      setComments((current) => mergeComments(current, data.comments));
      setReplyNextCursors((current) => ({ ...current, [rootId]: data.nextCursor }));
    } catch (error) {
      console.error(error);
      alert('답글을 추가로 불러오지 못했습니다.');
    } finally {
      setLoadingReplyRootId(null);
    }
  };

  const postComment = async (content: string, parentCommentId?: string) => {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'comment', content, parentCommentId }),
    });
    if (!res.ok) throw new Error('failed');
    return (await res.json()) as { comment: ListComment; commentsCount: number };
  };

  const handleSubmitComment = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!requireLogin() || isSubmittingComment) return;
    const content = commentInput.trim();
    if (!content) return;

    setIsSubmittingComment(true);
    try {
      const data = await postComment(content);
      setCommentInput('');
      setComments((current) => [...current, data.comment]);
      onCommentsCountChange(data.commentsCount);
    } catch (error) {
      console.error(error);
      alert('댓글 등록 중 오류가 발생했습니다.');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleSubmitReply = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!replyingTo || !requireLogin() || isSubmittingComment) return;
    const content = replyInput.trim();
    if (!content) return;

    setIsSubmittingComment(true);
    try {
      const data = await postComment(content, replyingTo.id);
      setComments((current) => [
        ...current.map((comment) =>
          comment.id === replyingTo.id ? { ...comment, hasReplies: true } : comment
        ),
        data.comment,
      ]);
      setReplyingTo(null);
      setReplyInput('');
      onCommentsCountChange(data.commentsCount);
    } catch (error) {
      console.error(error);
      alert('답글 등록 중 오류가 발생했습니다.');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleUpdateComment = async (commentId: string) => {
    if (!requireLogin() || pendingCommentActionId) return;
    const content = editingCommentInput.trim();
    if (!content) return;

    setPendingCommentActionId(commentId);
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'edit-comment', commentId, content }),
      });
      if (!res.ok) throw new Error('failed');
      const data = (await res.json()) as { comment: ListComment };
      setComments((current) => current.map((comment) => (comment.id === commentId ? data.comment : comment)));
      setEditingCommentId(null);
      setEditingCommentInput('');
    } catch (error) {
      console.error(error);
      alert('답글이 달린 댓글은 수정할 수 없습니다.');
    } finally {
      setPendingCommentActionId(null);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!requireLogin() || pendingCommentActionId) return;
    if (!confirm('댓글을 삭제하시겠습니까?')) return;

    setPendingCommentActionId(commentId);
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete-comment', commentId }),
      });
      if (!res.ok) throw new Error('failed');
      const data = (await res.json()) as {
        comment: ListComment;
        commentsCount: number;
        hasReplies: boolean;
      };

      setComments((current) =>
        data.hasReplies
          ? current.map((comment) => (comment.id === commentId ? data.comment : comment))
          : current.filter((comment) => comment.id !== commentId)
      );
      if (replyingTo?.id === commentId) {
        setReplyingTo(null);
        setReplyInput('');
      }
      onCommentsCountChange(data.commentsCount);
    } catch (error) {
      console.error(error);
      alert('댓글 삭제 중 오류가 발생했습니다.');
    } finally {
      setPendingCommentActionId(null);
    }
  };

  const renderComment = (comment: ListComment, isReply: boolean) => {
    const isOwner = comment.user.id === viewerUserId;
    const canDelete = !comment.isDeleted && (isOwner || isAdmin);
    const canEdit = !comment.isDeleted && isOwner && !comment.hasReplies;

    return (
      <article
        key={comment.id}
        className={isReply ? 'border-l-2 border-point/25 py-3 pl-4' : 'rounded-lg border border-slate-800/80 bg-black/20 p-3'}
      >
        <div className="flex items-center justify-between gap-3 text-xs text-gray-400">
          <span className="inline-flex min-w-0 items-center gap-1.5">
            <span className="text-sm font-semibold truncate">{comment.user.nickname ?? '탈퇴한 사용자'}</span>
            {comment.user.role === 'ADMIN' ? (
              <span className="rounded-full border border-point/45 bg-point/15 px-1.5 py-0.5 text-[10px] font-semibold text-point">
                ADMIN
              </span>
            ) : null}
          </span>
          <span className="shrink-0">
            {formatDate(comment.createdAt)}
            {isEditedComment(comment) ? ' · 수정됨' : ''}
          </span>
        </div>

        {editingCommentId === comment.id ? (
          <div className="mt-2 space-y-2">
            <textarea
              value={editingCommentInput}
              onChange={(event) => setEditingCommentInput(event.target.value)}
              maxLength={COMMENT_MAX_LENGTH}
              disabled={pendingCommentActionId === comment.id}
              className="h-24 w-full resize-none rounded-md border border-slate-700 bg-[#070b16] px-3 py-2 text-sm text-white outline-none focus:border-neon-point"
            />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setEditingCommentId(null)}>
                취소
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => handleUpdateComment(comment.id)}
                disabled={!editingCommentInput.trim() || pendingCommentActionId === comment.id}
              >
                저장
              </Button>
            </div>
          </div>
        ) : (
          <>
            <p className={`mt-2 whitespace-pre-wrap text-sm ${comment.isDeleted ? 'italic text-gray-500' : 'text-gray-100'}`}>
              {!comment.isDeleted && comment.replyTo ? (
                <span className="mr-1 font-semibold text-point/80">@{comment.replyTo.user.nickname ?? '탈퇴한 사용자'}</span>
              ) : null}
              {comment.content}
            </p>
            <div className="mt-3 flex items-center justify-end gap-2">
              {!comment.isDeleted ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (!requireLogin()) return;
                    setReplyingTo(comment);
                    setReplyInput('');
                  }}
                  className="border-white/20 px-2 py-1 text-xs text-gray-300"
                >
                  답글
                </Button>
              ) : null}
              {canEdit ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditingCommentId(comment.id);
                    setEditingCommentInput(comment.content);
                  }}
                  className="border-white/20 px-2 py-1 text-xs text-gray-300"
                >
                  수정
                </Button>
              ) : null}
              {canDelete ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleDeleteComment(comment.id)}
                  disabled={Boolean(pendingCommentActionId)}
                  className="border-red-400/50 px-2 py-1 text-xs text-red-300 hover:bg-red-500/20"
                >
                  {isAdmin && !isOwner ? '관리자 삭제' : '삭제'}
                </Button>
              ) : null}
            </div>
          </>
        )}
      </article>
    );
  };

  const renderReplyForm = () => {
    if (!replyingTo) return null;

    return (
      <form
        onSubmit={handleSubmitReply}
        className="ml-4 mt-2 rounded-lg border border-point/25 bg-point/5 p-3 sm:ml-8"
      >
        <p className="mb-2 text-xs text-gray-400">
          <span className="font-semibold text-point">@{replyingTo.user.nickname ?? '탈퇴한 사용자'}</span> 님에게 답글
        </p>
        <textarea
          autoFocus
          value={replyInput}
          onChange={(event) => setReplyInput(event.target.value)}
          maxLength={COMMENT_MAX_LENGTH}
          disabled={isSubmittingComment}
          className="h-20 w-full resize-none rounded-md border border-slate-700 bg-[#070b16] px-3 py-2 text-sm text-white outline-none focus:border-neon-point"
        />
        <div className="mt-2 flex items-center justify-between">
          <span className="text-xs text-gray-400">{replyInput.length}/{COMMENT_MAX_LENGTH}</span>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setReplyingTo(null);
                setReplyInput('');
              }}
            >
              취소
            </Button>
            <Button type="submit" size="sm" disabled={!replyInput.trim() || isSubmittingComment}>
              답글 등록
            </Button>
          </div>
        </div>
      </form>
    );
  };

  return (
    <section ref={targetRef} className={className}>
      <h2 className="text-lg font-semibold text-white">댓글</h2>
      {!isLoggedIn ? (
        <p className="mt-2 text-sm text-gray-400">
          댓글 작성은 로그인이 필요합니다.{` `}
          <Link href={loginHref} className="text-neon-point">
            로그인하기
          </Link>
        </p>
      ) : null}

      <form onSubmit={handleSubmitComment} className="mt-4 space-y-2">
        <textarea
          value={commentInput}
          onChange={(event) => setCommentInput(event.target.value)}
          placeholder={isLoggedIn ? '댓글을 입력해주세요.' : '로그인 후 댓글을 작성할 수 있습니다.'}
          disabled={!isLoggedIn || isSubmittingComment}
          maxLength={COMMENT_MAX_LENGTH}
          className="h-24 w-full resize-none rounded-md border border-slate-700 bg-[#070b16] px-3 py-2 text-sm text-white outline-none focus:border-neon-point disabled:cursor-not-allowed disabled:opacity-60"
        />
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-400">{commentInput.length}/{COMMENT_MAX_LENGTH}</p>
          <Button type="submit" size="sm" disabled={!isLoggedIn || isSubmittingComment || !commentInput.trim()}>
            댓글 등록
          </Button>
        </div>
      </form>

      <div className="mt-5 space-y-3">
        {threads.map(({ root, replies }) => (
          <section key={root.id}>
            {renderComment(root, false)}
            {replies.length > 0 ? <div className="ml-4 space-y-0 sm:ml-8">{replies.map((reply) => renderComment(reply, true))}</div> : null}
            {replyNextCursors[root.id] ? (
              <div className="ml-4 mt-2 sm:ml-8">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => void handleLoadMoreReplies(root.id)}
                  disabled={loadingReplyRootId === root.id}
                >
                  {loadingReplyRootId === root.id ? '답글 불러오는 중...' : '답글 10개 더보기'}
                </Button>
              </div>
            ) : null}
            {replyingTo && (replyingTo.rootId ?? replyingTo.id) === root.id ? renderReplyForm() : null}
          </section>
        ))}
        {isLoadingComments ? <p className="py-6 text-center text-sm text-gray-500">댓글을 불러오는 중입니다.</p> : null}
        {!isLoadingComments && commentsLoadError ? <p className="py-6 text-center text-sm text-red-300">{commentsLoadError}</p> : null}
        {!isLoadingComments && !commentsLoadError && threads.length === 0 ? <p className="py-6 text-center text-sm text-gray-500">아직 댓글이 없습니다.</p> : null}
        {rootNextCursor ? (
          <div className="flex justify-center pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => void handleLoadMoreComments()}
              disabled={isLoadingMoreComments}
            >
              {isLoadingMoreComments ? '댓글 불러오는 중...' : '댓글 10개 더보기'}
            </Button>
          </div>
        ) : null}
      </div>
    </section>
  );
}
