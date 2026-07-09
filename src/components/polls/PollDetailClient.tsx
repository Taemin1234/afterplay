'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, MessageCircle, Send, X } from 'lucide-react';
import Button from '@/components/ui/atoms/Button';
import PollCard from '@/components/polls/PollCard';
import type { PollComment, PollDetail, PollOption } from '@/components/polls/types';

type PollDetailClientProps = {
  initialPoll: PollDetail;
  isLoggedIn: boolean;
  viewerUserId?: string | null;
};

const COMMENT_MAX_LENGTH = 500;

function formatDate(value: string | null) {
  if (!value) return '무기한';
  return new Date(value).toLocaleString('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatShortDate(value: string) {
  return new Date(value).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function itemTypeLabel(type: PollDetail['itemType']) {
  return type === 'TRACK' ? '노래' : '앨범';
}

function statusLabel(poll: PollDetail) {
  if (poll.isClosed) return '종료';
  if (!poll.endsAt) return '진행중';
  return `마감 ${formatDate(poll.endsAt)}`;
}

function isEditedComment(comment: PollComment) {
  return new Date(comment.updatedAt).getTime() > new Date(comment.createdAt).getTime();
}

function OptionPanel({
  option,
  isSelected,
  isDimmed,
  canSeeResults,
  onSelect,
}: {
  option: PollOption;
  isSelected: boolean;
  isDimmed: boolean;
  canSeeResults: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`relative min-w-0 rounded-lg border p-3 text-left transition-all duration-300 cursor-pointer ${
        isSelected ? 'scale-[1.025] border-point bg-point/10 shadow-[0_0_24px_rgba(57,255,20,0.12)]' : 'border-white/10 bg-bg2'
      } ${isDimmed ? 'scale-[0.975] opacity-55' : ''}`}
    >
      {isSelected ? (
        <span className="absolute right-3 top-3 z-10 inline-flex h-7 w-7 items-center justify-center rounded-full bg-point text-black">
          <Check className="h-4 w-4" />
        </span>
      ) : null}
      <div className="aspect-square overflow-hidden rounded-md bg-black/30">
        <Image src={option.imageUrl || '/dpc_icon.png'} alt={option.title} width={640} height={640} className="h-full w-full object-cover" />
      </div>
      <div className="mt-4 min-w-0">
        <p className="line-clamp-2 text-lg font-semibold text-white">{option.title}</p>
        <p className="mt-1 truncate text-sm text-slate-400">{option.artist}</p>
        {option.releaseDate ? <p className="mt-1 text-xs text-slate-500">발매 {option.releaseDate}</p> : null}
        {option.description ? <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-300">{option.description}</p> : null}
      </div>
      {canSeeResults && option.result ? (
        <div className="mt-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400">비중</span>
            <span className="font-semibold text-white">{option.result.percentage}%</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-point transition-all duration-500" style={{ width: `${option.result.percentage}%` }} />
          </div>
        </div>
      ) : null}
    </button>
  );
}

export default function PollDetailClient({ initialPoll, isLoggedIn, viewerUserId = null }: PollDetailClientProps) {
  const router = useRouter();
  const [poll, setPoll] = useState(initialPoll);
  const [selectedOptionId, setSelectedOptionId] = useState(initialPoll.viewerVote?.optionId ?? '');
  const [isVoting, setIsVoting] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [voteError, setVoteError] = useState<string | null>(null);

  const [commentInput, setCommentInput] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentInput, setEditingCommentInput] = useState('');
  const [pendingCommentId, setPendingCommentId] = useState<string | null>(null);

  const canSeeResults = Boolean(poll.viewerVote);
  const loginHref = useMemo(() => `/auth/login?next=${encodeURIComponent(`/polls/${poll.id}`)}`, [poll.id]);
  const selectedOption = poll.options.find((option) => option.id === selectedOptionId);

  const requireLogin = () => {
    if (isLoggedIn) return true;
    setShowLoginPrompt(true);
    return false;
  };

  const submitVote = async () => {
    if (!selectedOptionId || isVoting || poll.isClosed) return;
    if (!requireLogin()) return;

    setIsVoting(true);
    setVoteError(null);
    try {
      const response = await fetch(`/api/polls/${poll.id}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ optionId: selectedOptionId }),
      });
      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error ?? '투표에 실패했습니다.');
      }
      const data = (await response.json()) as { poll: PollDetail };
      setPoll({ ...data.poll, relatedPolls: poll.relatedPolls, otherPolls: poll.otherPolls });
      setSelectedOptionId(data.poll.viewerVote?.optionId ?? selectedOptionId);
      router.refresh();
    } catch (e) {
      setVoteError(e instanceof Error ? e.message : '투표에 실패했습니다.');
    } finally {
      setIsVoting(false);
    }
  };

  const submitComment = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!requireLogin() || isSubmittingComment) return;

    const content = commentInput.trim();
    if (!content) return;

    setIsSubmittingComment(true);
    try {
      const response = await fetch(`/api/polls/${poll.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'comment', content }),
      });
      if (!response.ok) throw new Error('failed');
      const data = (await response.json()) as { comment: PollComment; commentsCount: number };
      setPoll((current) => ({
        ...current,
        comments: [data.comment, ...current.comments],
        commentsCount: data.commentsCount,
      }));
      setCommentInput('');
    } catch {
      alert('댓글 등록 중 오류가 발생했습니다.');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const updateComment = async (commentId: string) => {
    if (!requireLogin() || pendingCommentId) return;

    const content = editingCommentInput.trim();
    if (!content) return;

    setPendingCommentId(commentId);
    try {
      const response = await fetch(`/api/polls/${poll.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'edit-comment', commentId, content }),
      });
      if (!response.ok) throw new Error('failed');
      const data = (await response.json()) as { comment: PollComment };
      setPoll((current) => ({
        ...current,
        comments: current.comments.map((comment) => (comment.id === commentId ? data.comment : comment)),
      }));
      setEditingCommentId(null);
      setEditingCommentInput('');
    } catch {
      alert('댓글 수정 중 오류가 발생했습니다.');
    } finally {
      setPendingCommentId(null);
    }
  };

  const deleteComment = async (commentId: string) => {
    if (!requireLogin() || pendingCommentId) return;
    if (!window.confirm('댓글을 삭제하시겠습니까?')) return;

    setPendingCommentId(commentId);
    try {
      const response = await fetch(`/api/polls/${poll.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete-comment', commentId }),
      });
      if (!response.ok) throw new Error('failed');
      const data = (await response.json()) as { commentsCount: number };
      setPoll((current) => ({
        ...current,
        comments: current.comments.filter((comment) => comment.id !== commentId),
        commentsCount: data.commentsCount,
      }));
    } catch {
      alert('댓글 삭제 중 오류가 발생했습니다.');
    } finally {
      setPendingCommentId(null);
    }
  };

  return (
    <section className="mx-auto w-full max-w-6xl space-y-6">
      <article className="rounded-lg border border-white/10 bg-black/20 p-4 sm:p-6">
        <header className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <div>
              <span className="rounded border border-white/10 px-2 py-1 text-slate-300">{itemTypeLabel(poll.itemType)}</span>
              <span className={`rounded px-2 py-1 ${poll.isClosed ? 'bg-red-500/15 text-red-200' : 'bg-point/10 text-point'}`}>
                {statusLabel(poll)}
              </span>
            </div>
            {poll.viewerVote ? <span className="rounded bg-green1 px-2 py-1 text-slate">투표완료</span> : null}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white sm:text-3xl">{poll.title}</h1>
            {poll.description ? <p className="mt-3 whitespace-pre-line text-sm text-slate-300 sm:text-base">{poll.description}</p> : null}
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500">
            <span>{formatShortDate(poll.createdAt)}</span>
            <span>마감 : {formatDate(poll.endsAt)}</span>
            <span className="inline-flex items-center gap-1">
              <MessageCircle className="h-3.5 w-3.5" />
              댓글 {poll.commentsCount}
            </span>
          </div>
        </header>

        <div className="mt-6 grid items-start gap-4 md:grid-cols-[1fr_auto_1fr]">
          <OptionPanel
            option={poll.options[0]}
            isSelected={selectedOptionId === poll.options[0].id}
            isDimmed={Boolean(selectedOptionId && selectedOptionId !== poll.options[0].id)}
            canSeeResults={canSeeResults}
            onSelect={() => setSelectedOptionId(poll.options[0].id)}
          />
          <div className="flex items-center justify-center md:h-full">
            <span className="rounded-full border border-point/40 bg-point/10 px-4 py-2 text-sm font-bold text-point">VS</span>
          </div>
          <OptionPanel
            option={poll.options[1]}
            isSelected={selectedOptionId === poll.options[1].id}
            isDimmed={Boolean(selectedOptionId && selectedOptionId !== poll.options[1].id)}
            canSeeResults={canSeeResults}
            onSelect={() => setSelectedOptionId(poll.options[1].id)}
          />
        </div>

        {voteError ? <p className="mt-4 text-sm text-red-300">{voteError}</p> : null}
        {canSeeResults && poll.results ? (
          <p className="mt-4 text-base text-center text-slate">나의 선택 : {selectedOption?.title ?? '선택됨'}</p>
        ) : null}

        <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
          <Button
            type="button"
            disabled={!selectedOptionId || isVoting || poll.isClosed}
            onClick={submitVote}
            className="w-full sm:w-auto"
          >
            {poll.viewerVote ? '투표 변경하기' : '투표하기'}
          </Button>
        </div>
      </article>

      <section className="rounded-lg border border-white/10 bg-bg2 p-4 sm:p-6">
        <h2 className="text-lg font-semibold text-white">댓글</h2>
        {!isLoggedIn ? <p className="mt-2 text-sm text-slate-400">댓글 작성은 로그인이 필요합니다.</p> : null}

        <form onSubmit={submitComment} className="mt-4 space-y-2">
          <textarea
            value={commentInput}
            onChange={(e) => setCommentInput(e.target.value)}
            maxLength={COMMENT_MAX_LENGTH}
            disabled={!isLoggedIn || isSubmittingComment}
            placeholder={isLoggedIn ? '댓글을 입력해주세요.' : '로그인 후 댓글을 작성할 수 있습니다.'}
            className="h-24 w-full resize-none rounded-md border border-slate-700 bg-[#070b16] px-3 py-2 text-sm text-white outline-none focus:border-point disabled:cursor-not-allowed disabled:opacity-60"
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">
              {commentInput.length}/{COMMENT_MAX_LENGTH}
            </span>
            <Button type="submit" size="sm" icon={<Send className="h-4 w-4" />} disabled={!isLoggedIn || !commentInput.trim() || isSubmittingComment}>
              댓글 등록
            </Button>
          </div>
        </form>

        <ul className="mt-5 space-y-3">
          {poll.comments.map((comment) => (
            <li key={comment.id} className="rounded-lg border border-slate-800/80 bg-black/20 p-3">
              <div className="flex items-center justify-between gap-3 text-xs text-slate-400">
                <span className="min-w-0 truncate">{comment.user.nickname ?? '탈퇴한 사용자'}</span>
                <span className="shrink-0">
                  {formatShortDate(comment.createdAt)}
                  {isEditedComment(comment) ? ' · 수정됨' : ''}
                </span>
              </div>
              {editingCommentId === comment.id ? (
                <div className="mt-2 space-y-2">
                  <textarea
                    value={editingCommentInput}
                    onChange={(e) => setEditingCommentInput(e.target.value)}
                    maxLength={COMMENT_MAX_LENGTH}
                    disabled={pendingCommentId === comment.id}
                    className="h-24 w-full resize-none rounded-md border border-slate-700 bg-[#070b16] px-3 py-2 text-sm text-white outline-none focus:border-point"
                  />
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" color="white" size="sm" onClick={() => setEditingCommentId(null)}>
                      취소
                    </Button>
                    <Button type="button" size="sm" onClick={() => updateComment(comment.id)} disabled={!editingCommentInput.trim() || pendingCommentId === comment.id}>
                      저장
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-slate-100">{comment.content}</p>
                  {comment.user.id === viewerUserId ? (
                    <div className="mt-3 flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        color="white"
                        size="sm"
                        onClick={() => {
                          setEditingCommentId(comment.id);
                          setEditingCommentInput(comment.content);
                        }}
                      >
                        수정
                      </Button>
                      <Button type="button" variant="danger" size="sm" onClick={() => deleteComment(comment.id)} disabled={pendingCommentId === comment.id}>
                        삭제
                      </Button>
                    </div>
                  ) : null}
                </>
              )}
            </li>
          ))}
          {poll.comments.length === 0 ? <li className="py-6 text-center text-sm text-slate-500">아직 댓글이 없습니다.</li> : null}
        </ul>
      </section>

      {poll.relatedPolls.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-white">이 후보들의 다른 대결</h2>
          <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {poll.relatedPolls.map((item) => (
              <li key={item.id}>
                <PollCard poll={item} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {poll.otherPolls.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-white">다른 최신 투표</h2>
          <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {poll.otherPolls.map((item) => (
              <li key={item.id}>
                <PollCard poll={item} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {showLoginPrompt ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-sm rounded-lg border border-white/10 bg-bg2 p-5 shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-white">로그인이 필요합니다</h2>
                <p className="mt-2 text-sm text-slate-400">로그인 페이지로 이동하시겠습니까?</p>
              </div>
              <button type="button" onClick={() => setShowLoginPrompt(false)} className="rounded p-1 text-slate-400 hover:bg-white/10">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <Button type="button" variant="outline" color="white" size="sm" onClick={() => setShowLoginPrompt(false)}>
                아니요
              </Button>
              <Button type="button" size="sm" onClick={() => router.push(loginHref)}>
                예
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
