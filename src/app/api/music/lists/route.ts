import { NextResponse } from 'next/server';
import { fetchListItems, parseCursor, parseLimit, parseLikesCursor, parseListSort, parseListType } from '@/lib/music-lists';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const type = parseListType(searchParams.get('type'));
    const sort = parseListSort(searchParams.get('sort'));
    const limit = parseLimit(searchParams.get('limit'));
    const rawCursor = searchParams.get('cursor');
    const cursor = sort === 'latest' ? parseCursor(rawCursor) : null;
    const likesOffset = sort === 'likes' ? parseLikesCursor(rawCursor) : 0;

    const result = await fetchListItems({
      type,
      sort,
      limit,
      cursor,
      likesOffset,
      visibility: 'public',
    });

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Bad request';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
