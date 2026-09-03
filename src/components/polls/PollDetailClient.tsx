'use client';

import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, ExternalLink, MessageCircle, Play, X } from 'lucide-react';
import Button from '@/components/ui/atoms/Button';
import CommentSection from '@/components/ui/molecules/CommentSection';
import PollCarousel from '@/components/polls/PollCarousel';
import type { PollDetail, PollOption } from '@/components/polls/types';

type PollDetailClientProps = {
  initialPoll: PollDetail;
  isLoggedIn: boolean;
  isAdmin?: boolean;
  viewerUserId?: string | null;
};

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

function YouTubePreview({ option }: { option: PollOption }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [thumbnailFailed, setThumbnailFailed] = useState(false);

  if (!option.youtubeVideoId) {
    return (null);
  }

  const thumbnailUrl = `https://i.ytimg.com/vi/${option.youtubeVideoId}/hqdefault.jpg`;
  const watchUrl = `https://www.youtube.com/watch?v=${option.youtubeVideoId}`;
  const embedUrl = `https://www.youtube-nocookie.com/embed/${option.youtubeVideoId}?autoplay=1&rel=0&modestbranding=1`;

  return (
    <div>
        <div className="mt-3 aspect-video overflow-hidden rounded-md bg-black/40">
          {isPlaying ? (
            <iframe
              src={embedUrl}
              title={`${option.title} YouTube player`}
              className="h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              loading="lazy"
              referrerPolicy="strict-origin-when-cross-origin"
            />
          ) : (
            <button
              type="button"
              onClick={() => setIsPlaying(true)}
              className="group relative h-full w-full overflow-hidden bg-black text-left"
            >
              {thumbnailFailed ? (
                <Image src={option.imageUrl || '/dpc_icon.png'} alt={option.title} width={640} height={360} className="h-full w-full object-cover opacity-75" />
              ) : (
                <img
                  src={thumbnailUrl}
                  alt={`${option.title} YouTube thumbnail`}
                  loading="lazy"
                  onError={() => setThumbnailFailed(true)}
                  className="h-full w-full object-cover opacity-75 transition-transform duration-300 group-hover:scale-105"
                />
              )}
              <span className="absolute inset-0 bg-black/20" />
              <span className="absolute left-1/2 top-1/2 inline-flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-red-600 text-white shadow-lg">
                <Play className="ml-0.5 h-7 w-7 fill-current" />
              </span>
            </button>
          )}
        </div>
      <div className='mt-2 flex justify-between items-center gap-1'>
        <p className="text-xs text-slate-500">
          영상이 삭제, 비공개, 제한 상태라면 재생되지 않을 수 있습니다.
        </p>
        <a
          href={watchUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex shrink-0 items-center gap-1 rounded border border-white/15 px-2 py-1 text-xs text-slate-300 hover:bg-white/10"
        >
          <ExternalLink className="h-3 w-3" />
          YouTube
        </a>
      </div>
    </div>
  );
}

function OptionPanel({
  option,
  isSelected,
  isDimmed,
  canSeeResults,
  isVoting,
  isClosed,
  onSelect,
}: {
  option: PollOption;
  isSelected: boolean;
  isDimmed: boolean;
  canSeeResults: boolean;
  isVoting:boolean;
  isClosed: boolean;
  onSelect: (optionId: PollOption['id']) => void;
}) {
  return (
    <div
      className={`relative flex flex-col justify-between min-w-0 rounded-lg border p-3 text-left transition-all duration-300 ${
        isSelected ? 'scale-[1.025] border-point bg-point/10 shadow-[0_0_24px_rgba(57,255,20,0.12)]' : 'border-white/10 bg-bg2'
      } ${isDimmed ? 'scale-[0.975] opacity-55' : ''}`}
    >
      {isSelected ? (
        <span className="absolute right-3 top-3 z-10 inline-flex h-7 w-7 items-center justify-center rounded-full bg-point text-black">
          <Check className="h-4 w-4" />
        </span>
      ) : null}
      
      <div className="flex justify-between gap-3">
        <div className="flex-1 aspect-square overflow-hidden">
          <Image src={option.imageUrl || '/dpc_icon.png'} alt={option.title} width={400} height={400} className="w-full object-cover" />
        </div>
        <div className='flex-2'>
          <p className="line-clamp-2 text-lg font-semibold text-white">{option.title}</p>
          <p className="mt-1 truncate text-sm text-slate-400">{option.artist}</p>
          {option.releaseDate ? <p className="mt-1 text-xs text-slate-500">발매 {option.releaseDate}</p> : null}
          {option.description ? <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-300">{option.description}</p> : null}
        </div>
      </div>

      <YouTubePreview option={option}/>
      
      {canSeeResults && option.result ? (
        <div className="mt-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400">득표율</span>
            <span className="font-semibold text-white">{option.result.percentage}%</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-point transition-all duration-500" style={{ width: `${option.result.percentage}%` }} />
          </div>
        </div>
      ) : null}

        <Button
          key={option.id}
          type="button"
          variant={isSelected ? 'primary' : 'outline'}
          color={isSelected ? 'point' : 'white'}
          icon={isSelected ? <Check className="h-4 w-4" /> : undefined}
          onClick={() => onSelect(option.id)}
          disabled={isVoting || isClosed}
          className="min-h-12 w-full mt-3 border-point!"
        >
          선택하기
        </Button>
      </div>
  );
}

export default function PollDetailClient({ initialPoll, isLoggedIn, isAdmin = false, viewerUserId = null }: PollDetailClientProps) {
  const router = useRouter();
  const [poll, setPoll] = useState(initialPoll);
  const [selectedOptionId, setSelectedOptionId] = useState(initialPoll.viewerVote?.optionId ?? '');
  const [isVoting, setIsVoting] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [voteError, setVoteError] = useState<string | null>(null);

  const canSeeResults = Boolean(poll.viewerVote) || poll.isClosed;
  const loginHref = useMemo(() => `/auth/login?next=${encodeURIComponent(`/polls/${poll.id}`)}`, [poll.id]);
  const selectedOption = poll.options.find((option) => option.id === selectedOptionId);

  useEffect(() => {
    setPoll(initialPoll);
    setSelectedOptionId(initialPoll.viewerVote?.optionId ?? '');
    setShowLoginPrompt(false);
    setVoteError(null);

  }, [initialPoll, isLoggedIn]);

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

  return (
    <section className="mx-auto w-full max-w-6xl space-y-6">
      <article className="rounded-lg border border-white/10 bg-black/20 p-4 sm:p-6">
        <header className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className='flex justify-start gap-1.5'>
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

        <div className="mt-6 grid items-strech gap-4 md:grid-cols-[1fr_auto_1fr]">
          <OptionPanel
            option={poll.options[0]}
            isSelected={selectedOptionId === poll.options[0].id}
            isDimmed={Boolean(selectedOptionId && selectedOptionId !== poll.options[0].id)}
            canSeeResults={canSeeResults}
            isVoting={isVoting}
            isClosed={poll.isClosed}
            onSelect={setSelectedOptionId}
          />
          <div className="flex items-center justify-center md:h-full">
            <span className="rounded-full border border-point/40 bg-point/10 px-4 py-2 text-sm font-bold text-point">VS</span>
          </div>
          <OptionPanel
            option={poll.options[1]}
            isSelected={selectedOptionId === poll.options[1].id}
            isDimmed={Boolean(selectedOptionId && selectedOptionId !== poll.options[1].id)}
            canSeeResults={canSeeResults}
            isVoting={isVoting}
            isClosed={poll.isClosed}
            onSelect={setSelectedOptionId}
          />
        </div>

        {voteError ? <p className="mt-4 text-sm text-red-300">{voteError}</p> : null}
        {/* {canSeeResults && poll.results && poll.viewerVote ? (
          <p className="mt-4 text-base text-center text-slate">나의 선택 : {selectedOption?.title ?? '선택됨'}</p>
        ) : null} */}

        {/* <div className="mt-5 grid gap-2 sm:grid-cols-2">
          {poll.options.map((option) => {
            const isSelected = selectedOptionId === option.id;

            return (
              <Button
                key={option.id}
                type="button"
                variant={isSelected ? 'primary' : 'outline'}
                color={isSelected ? 'point' : 'white'}
                icon={isSelected ? <Check className="h-4 w-4" /> : undefined}
                onClick={() => setSelectedOptionId(option.id)}
                disabled={isVoting || poll.isClosed}
                className="min-h-12 w-full"
              >
                {option.title}
              </Button>
            );
          })}
        </div> */}

        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
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

      <CommentSection
        apiEndpoint={`/api/polls/${poll.id}/comments`}
        itemId={poll.id}
        isLoggedIn={isLoggedIn}
        isAdmin={isAdmin}
        viewerUserId={viewerUserId}
        loginHref={loginHref}
        initialComments={poll.comments}
        requireLogin={requireLogin}
        onCommentsCountChange={(commentsCount) =>
          setPoll((current) => ({ ...current, commentsCount }))
        }
        className="rounded-lg border border-white/10 bg-bg2 p-4 sm:p-6"
      />

      <PollCarousel title="이 후보들의 다른 대결은?" items={poll.relatedPolls} navId="related-polls" />

      <PollCarousel title="다른 선택도 해볼까요?" items={poll.otherPolls} navId="other-polls" />

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
              <Button type="button" variant="outline" color="white" size="sm" className='flex-1' onClick={() => setShowLoginPrompt(false)}>
                아니요
              </Button>
              <Button type="button" size="sm" className='flex-1' onClick={() => router.push(loginHref)}>
                예
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
