import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedUser, upsertDbUser } from '@/lib/music-list-api';
import { handleCommentActions, type MusicDetailActionPayload } from '@/lib/music-detail-route-helpers';

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
    const poll = await prisma.musicPoll.findFirst({
      where: { id, deletedAt: null },
      select: { id: true },
    });
    if (!poll) {
      return NextResponse.json({ error: 'Poll not found' }, { status: 404 });
    }

    const comments = await prisma.musicPollComment.findMany({
      where: { pollId: id, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        content: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: {
            id: true,
            nickname: true,
            avatarUrl: true,
            role: true,
          },
        },
      },
    });

    return NextResponse.json(
      comments.map((comment) => ({
        id: comment.id,
        content: comment.content,
        createdAt: comment.createdAt.toISOString(),
        updatedAt: comment.updatedAt.toISOString(),
        user: comment.user,
      }))
    );
  } catch (error) {
    console.error('[api/polls/[id]/comments] GET failed', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = (await request.json()) as MusicDetailActionPayload;
    const [poll, dbUser] = await Promise.all([
      prisma.musicPoll.findFirst({
        where: { id, deletedAt: null },
        select: { id: true },
      }),
      prisma.user.findUnique({
        where: { id: user.id },
        select: { role: true },
      }),
    ]);

    if (!poll) {
      return NextResponse.json({ error: 'Poll not found' }, { status: 404 });
    }
    if (body.action === 'comment' && !dbUser) {
      await upsertDbUser(user);
    }

    const response = await handleCommentActions({
      action: body.action,
      body,
      actor: {
        id: user.id,
        role: dbUser?.role ?? 'USER',
      },
      createComment: async (content) =>
        prisma.musicPollComment.create({
          data: {
            content,
            userId: user.id,
            pollId: id,
          },
          select: {
            id: true,
            content: true,
            createdAt: true,
            updatedAt: true,
            user: {
              select: {
                id: true,
                nickname: true,
                avatarUrl: true,
                role: true,
              },
            },
          },
        }),
      findCommentTarget: async (commentId) =>
        prisma.musicPollComment.findFirst({
          where: {
            id: commentId,
            pollId: id,
            deletedAt: null,
          },
          select: { id: true, userId: true },
        }),
      updateComment: async (commentId, content) =>
        prisma.musicPollComment.update({
          where: { id: commentId },
          data: { content },
          select: {
            id: true,
            content: true,
            createdAt: true,
            updatedAt: true,
            user: {
              select: {
                id: true,
                nickname: true,
                avatarUrl: true,
                role: true,
              },
            },
          },
        }),
      deleteComment: async (commentId) => {
        await prisma.musicPollComment.delete({
          where: { id: commentId },
        });
      },
      countComments: async () =>
        prisma.musicPollComment.count({
          where: {
            pollId: id,
            deletedAt: null,
          },
        }),
    });

    if (response) return response;
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('[api/polls/[id]/comments] POST failed', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
