import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/utils/supabase/server';
import { fetchAlbumListDetail } from '@/lib/music-lists';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const albumList = await fetchAlbumListDetail(id, user?.id);
    if (!albumList) {
      return NextResponse.json({ error: 'Album list not found' }, { status: 404 });
    }

    return NextResponse.json(albumList);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Bad request';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
