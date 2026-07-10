import type { Metadata } from 'next';
import PollListClient from '@/components/polls/PollListClient';
import { getAuthenticatedUser } from '@/lib/music-list-api';
import prisma from '@/lib/prisma';
import { serializePollListItem } from '@/lib/music-polls';

export const metadata: Metadata = {
  title: '취향선택',
  description: '오늘의 취향은 어느쪽인가요?',
  alternates: {
    canonical: '/polls',
  },

  openGraph: {
    title: '취향선택',
    description: '오늘의 취향은 어느 쪽인가요?',
    url: '/polls',
    siteName: 'DustpeakClub',
    images: [
      {
        url: '/images/polls-og.png',
        width: 1200,
        height: 630,
        alt: 'DustpeakClub 취향선택',
      },
    ],
    type: 'website',
  },

  twitter: {
    card: 'summary_large_image',
    title: '취향선택',
    description: '오늘의 취향은 어느 쪽인가요?',
    images: ['/images/polls-og.png'],
  },
};

export default async function PollsPage() {
  const user = await getAuthenticatedUser();
  const polls = await prisma.musicPoll.findMany({
    where: { deletedAt: null },
    select: { id: true },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
  const items = await Promise.all(polls.map((poll) => serializePollListItem(poll.id, user?.id ?? null)));

  return <PollListClient initialPolls={items.filter((item) => item !== null)} />;
}
