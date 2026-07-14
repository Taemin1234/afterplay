import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/music-list-api';
import { serializePoll, serializePollListItem } from '@/lib/music-polls';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const user = await getAuthenticatedUser();

    const poll = await serializePoll(id, user?.id ?? null);
    if (!poll) {
      return NextResponse.json({ error: 'Poll not found' }, { status: 404 });
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

    return NextResponse.json({
      ...poll,
      relatedPolls: related.filter(Boolean),
      otherPolls: others.filter(Boolean),
    });
  } catch (error) {
    console.error('[api/polls/[id]] GET failed', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
