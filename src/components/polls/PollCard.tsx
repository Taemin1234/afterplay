'use client';

import Image from 'next/image';
import Link from 'next/link';
import { MessageCircle, Vote } from 'lucide-react';
import type { PollListItem } from '@/components/polls/types';

type PollCardProps = {
  poll: PollListItem;
};

function formatDate(value: string | null) {
  if (!value) return '무기한';
  return new Date(value).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function itemTypeLabel(type: PollListItem['itemType']) {
  return type === 'TRACK' ? 'Song' : 'Album';
}

function statusLabel(poll: PollListItem) {
  if (poll.isClosed) return '종료';
  if (!poll.endsAt) return '진행중';
  return `마감 ${formatDate(poll.endsAt)}`;
}

export default function PollCard({ poll }: PollCardProps) {
  const [first, second] = poll.options;

  return (
    <Link
      href={`/polls/${poll.id}`}
      className="group block overflow-hidden h-full rounded-lg border border-white/10 bg-bg2 transition-colors hover:border-point/50"
    >
      <div className="relative grid grid-cols-[1fr_1fr] items-stretch bg-black/30">
        {[first, second].map((option, index) => (
          <div key={option.id} className="min-w-0 p-3">
            <div className="aspect-square overflow-hidden rounded-md bg-black/30">
              <Image
                src={option.imageUrl || '/dpc_icon.png'}
                alt={option.title}
                width={320}
                height={320}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            </div>
            <div className="mt-2 min-w-0">
              <div className='h-15'>
                <p className="line-clamp-2 text-sm font-semibold text-white">{option.title}</p>
                <p className="mt-0.5 truncate text-xs text-slate-400">{option.artist}</p>
              </div>
              {option.result ? (
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full rounded-full bg-point" style={{ width: `${option.result.percentage}%` }} />
                </div>
              ) : <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10"></div>}
            </div>
            <span className="sr-only">후보 {index + 1}</span>
          </div>
        ))}
        <div className="pointer-events-none absolute bottom-1 left-1/2 z-10 -translate-x-1/2 sm:-translate-y-1/2 sm:top-1/2 sm:bottom-auto">
          <span className="rounded-full px-2 py-1 text-xs font-bold text-point">VS</span>
        </div>
      </div>

      <div className="space-y-3 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
         <div className='flex gap-1'>
            <span className="rounded border border-white/10 px-2 py-1 text-slate-300">{itemTypeLabel(poll.itemType)}</span>
            <span className={`rounded px-2 py-1 ${poll.isClosed ? 'bg-gray-500 text-white' : 'bg-point/10 text-point'}`}>
              {statusLabel(poll)}
            </span>
         </div>
          {poll.viewerVote ? <span className="rounded bg-green1 px-2 py-1 text-slate">투표완료</span> : null}
        </div>

        <div>
          <h2 className="line-clamp-2 text-base font-semibold text-white">{poll.title}</h2>
          {/* {poll.description ? <p className="mt-1 line-clamp-2 text-sm text-slate-200">{poll.description}</p> : null} */}
        </div>

        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>\
            {(() => {
              const date = new Date(poll.createdAt);
              const year = date.getFullYear();
              const month = String(date.getMonth() + 1).padStart(2, "0");
              const day = String(date.getDate()).padStart(2, "0");

              return `${year}.${month}.${day}`;
            })()}
          </span>
          <span className="inline-flex items-center gap-3">
            {/* {poll.results ? (
              <span className="inline-flex items-center gap-1">
                <Vote className="h-3.5 w-3.5" />
                {poll.results.totalVotes}
              </span>
            ) : null} */}
            <span className="inline-flex items-center gap-1">
              <MessageCircle className="h-3.5 w-3.5" />
              {poll.commentsCount}
            </span>
          </span>
        </div>
      </div>
    </Link>
  );
}
