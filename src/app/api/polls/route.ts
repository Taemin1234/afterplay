import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/music-list-api';
import { serializePollListItem } from '@/lib/music-polls';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const user = await getAuthenticatedUser();
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q')?.trim();
    const status = searchParams.get('status');
    const itemType = searchParams.get('itemType');
    const take = Math.min(Math.max(Number(searchParams.get('take') ?? 30), 1), 50);

    const polls = await prisma.musicPoll.findMany({
      where: {
        deletedAt: null,
        ...(status === 'OPEN' || status === 'CLOSED' ? { status } : {}),
        ...(itemType === 'TRACK' || itemType === 'ALBUM' ? { itemType } : {}),
        ...(query
          ? {
              options: {
                some: {
                  OR: [
                    { titleSnapshot: { contains: query, mode: 'insensitive' } },
                    { artistSnapshot: { contains: query, mode: 'insensitive' } },
                  ],
                },
              },
            }
          : {}),
      },
      select: { id: true },
      orderBy: { createdAt: 'desc' },
      take,
    });

    const items = await Promise.all(polls.map((poll) => serializePollListItem(poll.id, user?.id ?? null)));
    return NextResponse.json(items.filter(Boolean));
  } catch (error) {
    console.error('[api/polls] GET failed', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
