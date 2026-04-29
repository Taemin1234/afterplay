'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Button from '@/components/ui/atoms/Button';

const COMMENT_MAX_LENGTH = 500;

export type ListComment = {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    nickname: string | null;
    avatarUrl: string | null;
    role: 'USER' | 'ADMIN';
  };
};

interface CommentSectionProps {
  apiSegment: 'playlist' | 'albumlist';
  itemId: string;
  isLoggedIn: boolean;
  viewerUserId?: string | null;
  loginHref: string;
  initialComments: ListComment[];
  requireLogin: () => boolean;
  targetRef: React.RefObject<HTMLElement | null>;
  onCommentsCountChange: (count: number) => void;
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function isEditedComment(comment: ListComment) {
  return new Date(comment.updatedAt).getTime() > new Date(comment.createdAt).getTime();
}

export default function CommentSection({
  apiSegment,
  itemId,
  isLoggedIn,
  viewerUserId = null,
  loginHref,
  initialComments,
  requireLogin,
  targetRef,
  onCommentsCountChange,
}: CommentSectionProps) {
  const [comments, setComments] = useState<ListComment[]>(initialComments);
  const [commentInput, setCommentInput] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentInput, setEditingCommentInput] = useState('');
  const [pendingCommentActionId, setPendingCommentActionId] = useState<string | null>(null);

  useEffect(() => {
    setComments(initialComments);
    setCommentInput('');
    setEditingCommentId(null);
    setEditingCommentInput('');
    setPendingCommentActionId(null);
  }, [initialComments]);

  const handleSubmitComment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!requireLogin() || isSubmittingComment) return;

    const content = commentInput.trim();
    if (!content) return;

    setIsSubmittingComment(true);
    try {
      const res = await fetch(`/api/music/${apiSegment}/${itemId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'comment', content }),
      });

      if (!res.ok) throw new Error('failed');
      const data = await res.json();
      setCommentInput('');
      onCommentsCountChange(data.commentsCount);
      setComments((prev) => [data.comment, ...prev]);
    } catch (error) {
      console.error(error);
      alert('댓글 등록 중 오류가 발생했습니다.');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleStartEditComment = (comment: ListComment) => {
    setEditingCommentId(comment.id);
    setEditingCommentInput(comment.content);
  };

  const handleCancelEditComment = () => {
    setEditingCommentId(null);
    setEditingCommentInput('');
  };

  const handleUpdateComment = async (commentId: string) => {
    if (!requireLogin() || pendingCommentActionId) return;

    const content = editingCommentInput.trim();
    if (!content) return;

    const previousComments = comments;
    const previousEditingCommentId = editingCommentId;
    const previousEditingCommentInput = editingCommentInput;
    const updatedAt = new Date().toISOString();

    setPendingCommentActionId(commentId);
    setComments((prev) =>
      prev.map((comment) =>
        comment.id === commentId
          ? {
              ...comment,
              content,
              updatedAt,
            }
          : comment
      )
    );
    handleCancelEditComment();

    try {
      const res = await fetch(`/api/music/${apiSegment}/${itemId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'edit-comment',
          commentId,
          content,
        }),
      });

      if (!res.ok) throw new Error('failed');
      const data = await res.json();

      setComments((prev) =>
        prev.map((comment) =>
          comment.id === commentId
            ? {
                ...comment,
                content: data.comment.content,
                updatedAt: data.comment.updatedAt,
              }
            : comment
        )
      );
    } catch (error) {
      setComments(previousComments);
      setEditingCommentId(previousEditingCommentId);
      setEditingCommentInput(previousEditingCommentInput);
      console.error(error);
      alert('댓글 수정 중 오류가 발생했습니다.');
    } finally {
      setPendingCommentActionId(null);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!requireLogin() || pendingCommentActionId) return;

    const ok = confirm('댓글을 삭제하시겠습니까?');
    if (!ok) return;

    const previousComments = comments;

    setPendingCommentActionId(commentId);
    setComments((prev) => prev.filter((comment) => comment.id !== commentId));
    onCommentsCountChange(Math.max(0, comments.length - 1));
    if (editingCommentId === commentId) {
      handleCancelEditComment();
    }

    try {
      const res = await fetch(`/api/music/${apiSegment}/${itemId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete-comment',
          commentId,
        }),
      });

      if (!res.ok) throw new Error('failed');
      const data = await res.json();

      onCommentsCountChange(data.commentsCount);
    } catch (error) {
      setComments(previousComments);
      onCommentsCountChange(previousComments.length);
      console.error(error);
      alert('댓글 삭제 중 오류가 발생했습니다.');
    } finally {
      setPendingCommentActionId(null);
    }
  };

  return (
    <section ref={targetRef} className="rounded-2xl border border-slate-800/70 bg-[#0b1020] p-6">
      <h2 className="text-lg font-semibold text-white">댓글</h2>

      {!isLoggedIn && (
        <p className="mt-2 text-sm text-gray-400">
          댓글 작성은 로그인이 필요합니다.{` `}
          <Link href={loginHref} className="text-neon-green">
            로그인하기
          </Link>
        </p>
      )}

      <form onSubmit={handleSubmitComment} className="mt-4 space-y-2">
        <textarea
          value={commentInput}
          onChange={(e) => setCommentInput(e.target.value)}
          placeholder={isLoggedIn ? '댓글을 입력해주세요.' : '로그인 후 댓글을 작성할 수 있습니다.'}
          disabled={!isLoggedIn || isSubmittingComment}
          maxLength={COMMENT_MAX_LENGTH}
          className="h-24 w-full resize-none rounded-md border border-slate-700 bg-[#070b16] px-3 py-2 text-sm text-white outline-none focus:border-neon-green disabled:cursor-not-allowed disabled:opacity-60"
        />
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-400">
            {commentInput.length}/{COMMENT_MAX_LENGTH}
          </p>
          <Button
            type="submit"
            size="sm"
            disabled={!isLoggedIn || isSubmittingComment || !commentInput.trim()}
            className="font-semibold"
          >
            댓글 등록
          </Button>
        </div>
      </form>

      <ul className="mt-5 space-y-3">
        {comments.map((comment) => (
          <li key={comment.id} className="rounded-lg border border-slate-800/80 bg-black/20 p-3">
            <div className="flex items-center justify-between text-xs text-gray-400">
              <span className="inline-flex items-center gap-1.5">
                <span>{comment.user.nickname ?? '탈퇴한 사용자'}</span>
                {comment.user.role === 'ADMIN' ? (
                  <span className="rounded-full border border-[#39ff14]/45 bg-[#39ff14]/15 px-1.5 py-0.5 text-[10px] font-semibold text-[#39ff14]">
                    ADMIN
                  </span>
                ) : null}
              </span>
              <span className="inline-flex items-center gap-2">
                {formatDate(comment.createdAt)}
                {isEditedComment(comment) && (
                  <span className="rounded bg-slate-700/70 px-1.5 py-0.5 text-[10px] text-gray-200">
                    수정됨
                  </span>
                )}
              </span>
            </div>
            {editingCommentId === comment.id ? (
              <div className="mt-2 space-y-2">
                <textarea
                  value={editingCommentInput}
                  onChange={(e) => setEditingCommentInput(e.target.value)}
                  maxLength={COMMENT_MAX_LENGTH}
                  disabled={pendingCommentActionId === comment.id}
                  className="h-24 w-full resize-none rounded-md border border-slate-700 bg-[#070b16] px-3 py-2 text-sm text-white outline-none focus:border-neon-green disabled:cursor-not-allowed disabled:opacity-60"
                />
                <div className="flex items-center justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCancelEditComment}
                    disabled={pendingCommentActionId === comment.id}
                    className="border-white/20 px-2 py-1 text-xs text-gray-300 hover:bg-white/10"
                  >
                    취소
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleUpdateComment(comment.id)}
                    disabled={pendingCommentActionId === comment.id || !editingCommentInput.trim()}
                    className="px-2 py-1 text-xs font-semibold"
                  >
                    저장
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <p className="mt-2 whitespace-pre-wrap text-sm text-gray-100">{comment.content}</p>
                {comment.user.id === viewerUserId && (
                  <div className="mt-3 flex items-center justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleStartEditComment(comment)}
                      disabled={Boolean(pendingCommentActionId)}
                      className="border-white/20 px-2 py-1 text-xs text-gray-300 hover:bg-white/10"
                    >
                      수정
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteComment(comment.id)}
                      disabled={Boolean(pendingCommentActionId)}
                      className="border-red-400/50 px-2 py-1 text-xs text-red-300 hover:bg-red-500/20"
                    >
                      삭제
                    </Button>
                  </div>
                )}
              </>
            )}
          </li>
        ))}
        {comments.length === 0 && <li className="text-center text-sm text-gray-500">아직 댓글이 없습니다.</li>}
      </ul>
    </section>
  );
}
