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
    rawCursor: string | null,
    featuredSectionKey: string | undefined,
    excludeFeaturedSectionKey: string | undefined
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
      featuredSectionKey,
      excludeFeaturedSectionKey,
    });
  },
  ['api-music-lists-public-v2'],
  { revalidate: 15 }
);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const type = parseListType(searchParams.get('type'));
    const sort = parseListSort(searchParams.get('sort'));
    const limit = parseLimit(searchParams.get('limit'));
    const rawCursor = searchParams.get('cursor');
    const section = searchParams.get('section');
    const excludeSection = searchParams.get('excludeSection');
    const featuredSectionKey = section === 'weekly-new-releases' || section === 'featured' ? section : undefined;
    const excludeFeaturedSectionKey = excludeSection === 'weekly-new-releases' ? excludeSection : undefined;

    if (section && !featuredSectionKey) {
      return NextResponse.json({ error: 'Invalid section' }, { status: 400 });
    }
    if (excludeSection && !excludeFeaturedSectionKey) {
      return NextResponse.json({ error: 'Invalid excluded section' }, { status: 400 });
    }
    if (featuredSectionKey && excludeFeaturedSectionKey) {
      return NextResponse.json({ error: 'section and excludeSection cannot be combined' }, { status: 400 });
    }

    const result = await fetchPublicListItemsCached(
      type,
      sort,
      limit,
      rawCursor,
      featuredSectionKey,
      excludeFeaturedSectionKey
    );

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Bad request';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
