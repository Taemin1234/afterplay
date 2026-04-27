import { NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import { fetchListItems, parseCursor, parseLimit, parseLikesCursor, parseListSort, parseListType } from '@/lib/music-lists';

export const runtime = 'nodejs';
export const revalidate = 15;

const fetchPublicListItemsCached = unstable_cache(
  async (
    type: 'all' | 'playlist' | 'albumlist',
    sort: 'latest' | 'likes',
    limit: number,
    rawCursor: string | null
  ) => {
    const cursor = sort === 'latest' ? parseCursor(rawCursor) : null;
    const likesOffset = sort === 'likes' ? parseLikesCursor(rawCursor) : 0;

    return fetchListItems({
      type,
      sort,
      limit,
      cursor,
      likesOffset,
      visibility: 'public',
    });
  },
  ['api-music-lists-public-v1'],
  { revalidate: 15 }
);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const type = parseListType(searchParams.get('type'));
    const sort = parseListSort(searchParams.get('sort'));
    const limit = parseLimit(searchParams.get('limit'));
    const rawCursor = searchParams.get('cursor');
    const result = await fetchPublicListItemsCached(type, sort, limit, rawCursor);

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Bad request';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
