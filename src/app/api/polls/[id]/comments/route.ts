import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedUser, upsertDbUser } from '@/lib/music-list-api';
import { handleCommentActions, type MusicDetailActionPayload } from '@/lib/music-detail-route-helpers';
import { serializeCommentThread } from '@/lib/comment-threads';

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
      where: { pollId: id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        content: true,
        parentId: true,
        rootId: true,
        deletedAt: true,
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
        parent: {
          select: {
            id: true,
            user: { select: { id: true, nickname: true } },
          },
        },
        _count: { select: { replies: true } },
      },
    });

    return NextResponse.json(serializeCommentThread(comments));
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
      createComment: async (content, thread) =>
        prisma.musicPollComment.create({
          data: {
            content,
            userId: user.id,
            pollId: id,
            parentId: thread.parentId,
            rootId: thread.rootId,
          },
          select: {
            id: true,
            content: true,
            parentId: true,
            rootId: true,
            deletedAt: true,
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
            parent: {
              select: {
                id: true,
                user: { select: { id: true, nickname: true } },
              },
            },
            _count: { select: { replies: true } },
          },
        }),
      findCommentTarget: async (commentId) =>
        prisma.musicPollComment.findFirst({
          where: {
            id: commentId,
            pollId: id,
          },
          select: {
            id: true,
            userId: true,
            parentId: true,
            rootId: true,
            deletedAt: true,
            user: { select: { id: true, nickname: true } },
            _count: { select: { replies: true } },
          },
        }),
      updateComment: async (commentId, content) =>
        prisma.musicPollComment.update({
          where: { id: commentId },
          data: { content },
          select: {
            id: true,
            content: true,
            parentId: true,
            rootId: true,
            deletedAt: true,
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
            parent: {
              select: {
                id: true,
                user: { select: { id: true, nickname: true } },
              },
            },
            _count: { select: { replies: true } },
          },
        }),
      deleteComment: async (commentId) =>
        prisma.musicPollComment.update({
          where: { id: commentId },
          data: { deletedAt: new Date() },
          select: {
            id: true,
            content: true,
            parentId: true,
            rootId: true,
            deletedAt: true,
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
            parent: {
              select: {
                id: true,
                user: { select: { id: true, nickname: true } },
              },
            },
            _count: { select: { replies: true } },
          },
        }),
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
