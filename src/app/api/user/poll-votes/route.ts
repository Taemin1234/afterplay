import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/music-list-api';
import { serializePollListItem } from '@/lib/music-polls';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const take = Math.min(Math.max(Number(searchParams.get('take') ?? 30), 1), 50);

    const votes = await prisma.musicPollVote.findMany({
      where: {
        userId: user.id,
        poll: {
          deletedAt: null,
        },
      },
      select: {
        optionId: true,
        createdAt: true,
        updatedAt: true,
        poll: {
          select: { id: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
      take,
    });

    const polls = await Promise.all(votes.map((vote) => serializePollListItem(vote.poll.id, user.id)));
    const voteByPollId = new Map(votes.map((vote) => [vote.poll.id, vote]));

    return NextResponse.json(
      polls.filter(Boolean).map((poll) => {
        const vote = poll ? voteByPollId.get(poll.id) : null;
        return {
          ...poll,
          myVote: vote
            ? {
                optionId: vote.optionId,
                createdAt: vote.createdAt.toISOString(),
                updatedAt: vote.updatedAt.toISOString(),
              }
            : null,
        };
      })
    );
  } catch (error) {
    console.error('[api/user/poll-votes] GET failed', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
