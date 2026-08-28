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
    const albumList = await prisma.albumList.findFirst({
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
    if (!albumList) return NextResponse.json({ error: 'Album list not found' }, { status: 404 });

    const { searchParams } = new URL(request.url);
    const rootId = searchParams.get('rootId');
    const cursor = searchParams.get('cursor');
    const result = rootId
      ? await fetchReplyPage('albumlist', id, rootId, cursor)
      : await fetchCommentPage('albumlist', id, cursor);
    return NextResponse.json(result);
  } catch (error) {
    console.error('[api/music/albumlist/[id]/comments] GET failed', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
