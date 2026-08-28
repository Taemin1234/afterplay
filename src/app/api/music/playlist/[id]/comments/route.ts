import { NextResponse } from 'next/server';
import { fetchCommentPage, fetchReplyPage } from '@/lib/comment-pagination';
import { getAuthenticatedUser } from '@/lib/music-list-api';
import prisma from '@/lib/prisma';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const user = await getAuthenticatedUser();
    const dbUser = user
      ? await prisma.user.findUnique({ where: { id: user.id }, select: { role: true } })
      : null;
    const playlist = await prisma.playlist.findFirst({
      where: {
        id,
        deletedAt: null,
        ...(dbUser?.role === 'ADMIN'
          ? {}
          : user
            ? { OR: [{ visibility: 'PUBLIC' }, { authorId: user.id }] }
            : { visibility: 'PUBLIC' }),
      },
      select: { id: true },
    });
    if (!playlist) return NextResponse.json({ error: 'Playlist not found' }, { status: 404 });

    const { searchParams } = new URL(request.url);
    const rootId = searchParams.get('rootId');
    const cursor = searchParams.get('cursor');
    const result = rootId
      ? await fetchReplyPage('playlist', id, rootId, cursor)
      : await fetchCommentPage('playlist', id, cursor);
    return NextResponse.json(result);
  } catch (error) {
    console.error('[api/music/playlist/[id]/comments] GET failed', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
