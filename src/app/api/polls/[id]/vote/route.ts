import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedUser, upsertDbUser } from '@/lib/music-list-api';
import { isPollClosed, serializePoll } from '@/lib/music-polls';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type VotePayload = {
  optionId?: string;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = (await request.json()) as VotePayload;
    const optionId = body.optionId?.trim();
    if (!optionId) {
      return NextResponse.json({ error: 'optionId is required' }, { status: 400 });
    }

    const poll = await prisma.musicPoll.findFirst({
      where: { id, deletedAt: null },
      select: {
        id: true,
        status: true,
        endsAt: true,
        closedAt: true,
        options: {
          where: { id: optionId },
          select: { id: true },
        },
      },
    });
    if (!poll) {
      return NextResponse.json({ error: 'Poll not found' }, { status: 404 });
    }
    if (isPollClosed(poll)) {
      return NextResponse.json({ error: 'Poll is closed' }, { status: 400 });
    }
    if (poll.options.length !== 1) {
      return NextResponse.json({ error: 'Option not found' }, { status: 404 });
    }

    await upsertDbUser(user);
    await prisma.musicPollVote.upsert({
      where: { pollId_userId: { pollId: id, userId: user.id } },
      update: { optionId },
      create: {
        pollId: id,
        optionId,
        userId: user.id,
      },
    });

    const serialized = await serializePoll(id, user.id);
    return NextResponse.json({
      ok: true,
      poll: serialized,
    });
  } catch (error) {
    console.error('[api/polls/[id]/vote] POST failed', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
