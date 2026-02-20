import { NextResponse } from 'next/server';
import { fetchListItems, parseCursor, parseLimit, parseListType } from '@/lib/music-lists';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const type = parseListType(searchParams.get('type'));
    const limit = parseLimit(searchParams.get('limit'));
    const cursor = parseCursor(searchParams.get('cursor'));

    const result = await fetchListItems({
      type,
      limit,
      cursor,
      visibility: 'public',
    });

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Bad request';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
