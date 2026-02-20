import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/utils/supabase/server';
import {
  fetchListItems,
  parseCursor,
  parseLimit,
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
    const limit = parseLimit(searchParams.get('limit'));
    const cursor = parseCursor(searchParams.get('cursor'));
    const requestedVisibility = parseVisibilityScope(searchParams.get('visibility'));

    // 로그인 유저 가져오기
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // 본인 확인
    const isOwner = user?.id === userId;
    const visibility = isOwner ? requestedVisibility : 'public';

    const result = await fetchListItems({
      type,
      limit,
      cursor,
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