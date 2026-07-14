import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import PollDetailClient from '@/components/polls/PollDetailClient';
import { getAuthenticatedUser } from '@/lib/music-list-api';
import prisma from '@/lib/prisma';
import { fetchPollMetadata, serializePoll, serializePollListItem } from '@/lib/music-polls';
import { SITE_NAME } from '@/lib/seo';

type PollDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export async function generateMetadata({ params }: PollDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const poll = await fetchPollMetadata(id);

  if (!poll) {
    return {
      title: '투표',
      robots: { index: false, follow: false },
    };
  }

  const [firstOption, secondOption] = poll.optionTitles;
  const fallbackDescription =
    firstOption && secondOption
      ? `${firstOption} vs ${secondOption}. 당신의 취향은 어느 쪽인가요?`
      : '음악 취향 투표에 참여해보세요.';
  const description = poll.description || fallbackDescription;

  return {
    title: poll.title,
    description,
    alternates: {
      canonical: `/polls/${id}`,
    },
    openGraph: {
      title: `${poll.title} | ${SITE_NAME}`,
      description,
      url: `/polls/${id}`,
      type: 'article',
      images: poll.imageUrl ? [{ url: poll.imageUrl, alt: poll.title }] : undefined,
    },
    twitter: {
      title: `${poll.title} | ${SITE_NAME}`,
      description,
      images: poll.imageUrl ? [poll.imageUrl] : undefined,
    },
  };
}

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
  const now = new Date();
  const activePollWhere = {
    status: 'OPEN' as const,
    closedAt: null,
    OR: [{ endsAt: null }, { endsAt: { gt: now } }],
  };

  const relatedPolls = await prisma.musicPoll.findMany({
    where: {
      id: { not: poll.id },
      deletedAt: null,
      ...activePollWhere,
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
      ...activePollWhere,
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
