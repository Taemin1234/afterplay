import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/utils/supabase/server';
import {
  fetchListItems,
  parseCursor,
  parseLimit,
  parseLikesCursor,
  parseListSort,
  parseListType,
  parseVisibilityScope,
} from '@/lib/music-lists';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type RouteContext = {
  params: Promise<{
    userId: string;
  }>;
};

export async function GET(request: Request, context: RouteContext) {
  try {
    const { userId } = await context.params;
    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const type = parseListType(searchParams.get('type'));
    const sort = parseListSort(searchParams.get('sort'));
    const limit = parseLimit(searchParams.get('limit'));
    const rawCursor = searchParams.get('cursor');
    const cursor = sort === 'latest' ? parseCursor(rawCursor) : null;
    const likesOffset = sort === 'likes' ? parseLikesCursor(rawCursor) : 0;
    const requestedVisibility = parseVisibilityScope(searchParams.get('visibility'));

    // Public-only requests can skip auth checks.
    if (requestedVisibility === 'public') {
      const result = await fetchListItems({
        type,
        sort,
        limit,
        cursor,
        likesOffset,
        feedUserId: userId,
        authorId: userId,
        visibility: 'public',
      });

      return NextResponse.json({
        ...result,
        visibilityApplied: 'public',
        isOwner: false,
      });
    }

    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // 본인 확인
    const isOwner = user?.id === userId;
    const visibility = isOwner ? requestedVisibility : 'public';

    const result = await fetchListItems({
      type,
      sort,
      limit,
      cursor,
      likesOffset,
      feedUserId: userId,
      authorId: userId,
      visibility,
    });

    return NextResponse.json({
      ...result,
      visibilityApplied: visibility,
      isOwner,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Bad request';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
