import { NextResponse } from 'next/server';
import { getAdminUserOrNull } from '@/lib/admin-auth';
import prisma from '@/lib/prisma';
import {
  serializePollListItem,
  upsertPollMusicItems,
  validateAndNormalizePollPayload,
  type PollPayloadInput,
} from '@/lib/music-polls';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const admin = await getAdminUserOrNull();
    if (!admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

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

    const items = await Promise.all(polls.map((poll) => serializePollListItem(poll.id, admin.id)));
    return NextResponse.json(items.filter(Boolean));
  } catch (error) {
    console.error('[api/admin/polls] GET failed', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const admin = await getAdminUserOrNull();
    if (!admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = (await request.json()) as PollPayloadInput;
    const parsed = validateAndNormalizePollPayload(body, { requireOptions: true });
    if (!parsed.data) {
      return NextResponse.json({ error: parsed.error ?? 'Bad request' }, { status: 400 });
    }

    const { title, description, itemType, options, startsAt, endsAt } = parsed.data;
    const musicIdBySpotifyId = await upsertPollMusicItems(itemType, options);

    const poll = await prisma.musicPoll.create({
      data: {
        title,
        description,
        itemType,
        startsAt,
        endsAt,
        createdById: admin.id,
        options: {
          create: options.map((option, index) => {
            const musicId = musicIdBySpotifyId.get(option.musicItem.id);
            if (!musicId) throw new Error(`Missing cached music item: ${option.musicItem.id}`);

            return {
              order: index,
              spotifyId: option.musicItem.id,
              titleSnapshot: option.musicItem.name,
              artistSnapshot: option.musicItem.artist,
              imageUrlSnapshot: option.musicItem.albumImageUrl,
              releaseDateSnapshot: option.musicItem.releaseDate ?? null,
              ...(itemType === 'TRACK' ? { trackId: musicId } : { albumId: musicId }),
            };
          }),
        },
      },
      select: { id: true },
    });

    const item = await serializePollListItem(poll.id, admin.id);
    return NextResponse.json({ ok: true, poll: item }, { status: 201 });
  } catch (error) {
    console.error('[api/admin/polls] POST failed', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
