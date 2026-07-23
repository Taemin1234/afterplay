import type { Metadata } from 'next';
import PollListClient from '@/components/polls/PollListClient';
import { getAuthenticatedUser } from '@/lib/music-list-api';
import prisma from '@/lib/prisma';
import { serializePollListItem, sortPollListItemsOpenFirst } from '@/lib/music-polls';

export const metadata: Metadata = {
  title: 'Peak n Pick',
  description: '여러분의 취향을 골라주세요!',
  alternates: {
    canonical: '/polls',
  },

  openGraph: {
    title: 'Peak n Pick',
    description: '여러분의 취향을 골라주세요!',
    url: '/polls',
    siteName: 'DustpeakClub',
    images: [
      {
        url: '/images/polls-og.png',
        width: 1200,
        height: 630,
        alt: 'DustpeakClub Peak n Pick',
      },
    ],
    type: 'website',
  },

  twitter: {
    card: 'summary_large_image',
    title: 'Peak n Pick',
    description: '여러분의 취향을 골라주세요!',
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
  const sortedItems = sortPollListItemsOpenFirst(items.filter((item) => item !== null));

  return <PollListClient initialPolls={sortedItems} />;
}
