import type { Metadata } from 'next';
import PollListClient from '@/components/polls/PollListClient';
import { getAuthenticatedUser } from '@/lib/music-list-api';
import prisma from '@/lib/prisma';
import { serializePollListItem } from '@/lib/music-polls';

export const metadata: Metadata = {
  title: '투표',
  description: '두 곡 또는 두 앨범 중 마음이 가는 쪽에 투표해보세요.',
  alternates: {
    canonical: '/polls',
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
