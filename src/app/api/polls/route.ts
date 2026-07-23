import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/music-list-api';
import { serializePollListItem, sortPollListItemsOpenFirst } from '@/lib/music-polls';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function normalizeTerm(value: string) {
  return value.trim().replace(/\s+/g, ' ');
}

function compactTerm(value: string) {
  return normalizeTerm(value).replace(/\s+/g, '').toLowerCase();
}

function addSearchTerms(terms: Set<string>, ...values: string[]) {
  for (const value of values) {
    const normalized = normalizeTerm(value);
    if (!normalized) continue;

    terms.add(normalized);

    const compact = normalized.replace(/\s+/g, '');
    if (compact) terms.add(compact);
  }
}

export async function GET(request: Request) {
  try {
    const user = await getAuthenticatedUser();
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q')?.trim();
    const status = searchParams.get('status');
    const itemType = searchParams.get('itemType');
    const take = Math.min(Math.max(Number(searchParams.get('take') ?? 30), 1), 50);

    const titleSearchTerms = new Set<string>();
    const artistSearchTerms = new Set<string>();

    if (query) {
      addSearchTerms(titleSearchTerms, query);
      addSearchTerms(artistSearchTerms, query);

      const aliasRows = await prisma.musicSearchAlias.findMany({
        select: {
          type: true,
          canonical: true,
          alias: true,
        },
      });
      const compactQuery = compactTerm(query);

      for (const row of aliasRows) {
        const matchesQuery =
          compactTerm(row.canonical).includes(compactQuery) || compactTerm(row.alias).includes(compactQuery);
        if (!matchesQuery) continue;

        const isArtistAlias =
          row.type === 'TRACK_ARTIST' || row.type === 'ALBUM_ARTIST' || row.type === 'ARTIST_NAME';
        if (isArtistAlias) {
          addSearchTerms(artistSearchTerms, row.canonical, row.alias);
          continue;
        }

        const appliesToTrackTitle = itemType !== 'ALBUM' && row.type === 'TRACK_TITLE';
        const appliesToAlbumTitle = itemType !== 'TRACK' && row.type === 'ALBUM_TITLE';

        if (appliesToTrackTitle || appliesToAlbumTitle) {
          addSearchTerms(titleSearchTerms, row.canonical, row.alias);
        }
      }
    }

    const optionSearchConditions = [
      ...[...titleSearchTerms].map((term) => ({
        titleSnapshot: { contains: term, mode: 'insensitive' as const },
      })),
      ...[...artistSearchTerms].map((term) => ({
        artistSnapshot: { contains: term, mode: 'insensitive' as const },
      })),
    ];

    const polls = await prisma.musicPoll.findMany({
      where: {
        deletedAt: null,
        ...(status === 'OPEN' || status === 'CLOSED' ? { status } : {}),
        ...(itemType === 'TRACK' || itemType === 'ALBUM' ? { itemType } : {}),
        ...(query
          ? {
              options: {
                some: {
                  OR: optionSearchConditions,
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
    return NextResponse.json(sortPollListItemsOpenFirst(items.filter((item) => item !== null)));
  } catch (error) {
    console.error('[api/polls] GET failed', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
