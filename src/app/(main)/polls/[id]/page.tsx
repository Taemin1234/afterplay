import { notFound } from 'next/navigation';
import PollDetailClient from '@/components/polls/PollDetailClient';
import { getAuthenticatedUser } from '@/lib/music-list-api';
import prisma from '@/lib/prisma';
import { serializePoll, serializePollListItem } from '@/lib/music-polls';

type PollDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function PollDetailPage({ params }: PollDetailPageProps) {
  const { id } = await params;
  const user = await getAuthenticatedUser();
  const poll = await serializePoll(id, user?.id ?? null);

  if (!poll) {
    notFound();
  }

  const optionTargetWhere = {
    OR: poll.options.map((option) =>
      poll.itemType === 'TRACK' ? { trackId: option.trackId } : { albumId: option.albumId }
    ),
  };

  const relatedPolls = await prisma.musicPoll.findMany({
    where: {
      id: { not: poll.id },
      deletedAt: null,
      itemType: poll.itemType,
      options: {
        some: optionTargetWhere,
      },
    },
    select: { id: true },
    orderBy: { createdAt: 'desc' },
    take: 6,
  });

  const relatedIds = relatedPolls.map((item) => item.id);
  const otherPolls = await prisma.musicPoll.findMany({
    where: {
      id: { notIn: [poll.id, ...relatedIds] },
      deletedAt: null,
      NOT: {
        options: {
          some: optionTargetWhere,
        },
      },
    },
    select: { id: true },
    orderBy: { createdAt: 'desc' },
    take: 3,
  });

  const [related, others] = await Promise.all([
    Promise.all(relatedPolls.map((item) => serializePollListItem(item.id, user?.id ?? null))),
    Promise.all(otherPolls.map((item) => serializePollListItem(item.id, user?.id ?? null))),
  ]);

  return (
    <PollDetailClient
      initialPoll={{
        ...poll,
        relatedPolls: related.filter((item) => item !== null),
        otherPolls: others.filter((item) => item !== null),
      }}
      isLoggedIn={Boolean(user)}
      viewerUserId={user?.id ?? null}
    />
  );
}
