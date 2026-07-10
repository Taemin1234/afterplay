import { NextResponse } from 'next/server';
import { getAdminUserOrNull } from '@/lib/admin-auth';
import prisma from '@/lib/prisma';
import { parseYouTubeVideoId, serializePoll, type PollPayloadInput } from '@/lib/music-polls';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const POLL_TITLE_MAX_LENGTH = 120;
const POLL_DESCRIPTION_MAX_LENGTH = 500;

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type AdminPollPatchPayload = PollPayloadInput & {
  status?: 'OPEN' | 'CLOSED';
  closeInDays?: number;
  optionYouTubeUrls?: Array<{
    optionId: string;
    youtubeUrl?: string | null;
  }>;
};

function parseOptionalDate(value: string | null | undefined, label: string): { value: Date | null } | { error: string } {
  if (!value) return { value: null };
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return { error: `${label} must be a valid date` };
  return { value: date };
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const admin = await getAdminUserOrNull();
    if (!admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await context.params;
    const poll = await serializePoll(id, admin.id);
    if (!poll) {
      return NextResponse.json({ error: 'Poll not found' }, { status: 404 });
    }

    return NextResponse.json(poll);
  } catch (error) {
    console.error('[api/admin/polls/[id]] GET failed', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const admin = await getAdminUserOrNull();
    if (!admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await context.params;
    const existing = await prisma.musicPoll.findFirst({
      where: { id, deletedAt: null },
      select: { id: true },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Poll not found' }, { status: 404 });
    }

    const body = (await request.json()) as AdminPollPatchPayload;
    const updateData: {
      title?: string;
      description?: string | null;
      startsAt?: Date | null;
      endsAt?: Date | null;
      status?: 'OPEN' | 'CLOSED';
      closedAt?: Date | null;
    } = {};

    if (body.title !== undefined) {
      const title = body.title.trim();
      if (!title) return NextResponse.json({ error: 'title is required' }, { status: 400 });
      if (title.length > POLL_TITLE_MAX_LENGTH) {
        return NextResponse.json({ error: `title must be ${POLL_TITLE_MAX_LENGTH} characters or less` }, { status: 400 });
      }
      updateData.title = title;
    }

    if (body.description !== undefined) {
      const description = body.description?.trim() || null;
      if (description && description.length > POLL_DESCRIPTION_MAX_LENGTH) {
        return NextResponse.json(
          { error: `description must be ${POLL_DESCRIPTION_MAX_LENGTH} characters or less` },
          { status: 400 }
        );
      }
      updateData.description = description;
    }

    if (body.startsAt !== undefined) {
      const startsAt = parseOptionalDate(body.startsAt, 'startsAt');
      if ('error' in startsAt) return NextResponse.json({ error: startsAt.error }, { status: 400 });
      updateData.startsAt = startsAt.value;
    }

    if (body.endsAt !== undefined) {
      const endsAt = parseOptionalDate(body.endsAt, 'endsAt');
      if ('error' in endsAt) return NextResponse.json({ error: endsAt.error }, { status: 400 });
      updateData.endsAt = endsAt.value;
    }

    if (updateData.startsAt && updateData.endsAt && updateData.startsAt >= updateData.endsAt) {
      return NextResponse.json({ error: 'endsAt must be after startsAt' }, { status: 400 });
    }

    const status = body.status === 'OPEN' || body.status === 'CLOSED' ? body.status : undefined;
    const closeInDays = typeof body.closeInDays === 'number' ? body.closeInDays : null;
    if (closeInDays !== null && (!Number.isInteger(closeInDays) || closeInDays < 1 || closeInDays > 365)) {
      return NextResponse.json({ error: 'closeInDays must be an integer between 1 and 365' }, { status: 400 });
    }

    const closeInDaysEnd = closeInDays === null ? null : new Date(Date.now() + closeInDays * 24 * 60 * 60 * 1000);
    if (closeInDaysEnd) updateData.endsAt = closeInDaysEnd;
    if (status) {
      updateData.status = status;
      updateData.closedAt = status === 'CLOSED' ? new Date() : null;
    }

    const optionYouTubeUpdates = Array.isArray(body.optionYouTubeUrls) ? body.optionYouTubeUrls : [];
    const normalizedOptionUpdates = optionYouTubeUpdates.map((option) => {
      const youtubeVideoId = parseYouTubeVideoId(option.youtubeUrl);
      if (option.youtubeUrl?.trim() && !youtubeVideoId) {
        return { error: 'youtubeUrl must be a valid YouTube URL' } as const;
      }
      return { optionId: option.optionId, youtubeVideoId } as const;
    });
    const invalidOptionUpdate = normalizedOptionUpdates.find((option) => 'error' in option);
    if (invalidOptionUpdate && 'error' in invalidOptionUpdate) {
      return NextResponse.json({ error: invalidOptionUpdate.error }, { status: 400 });
    }
    const validNormalizedOptionUpdates = normalizedOptionUpdates.filter(
      (option): option is { optionId: string; youtubeVideoId: string | null } => 'optionId' in option
    );

    const pollOptionIds =
      validNormalizedOptionUpdates.length > 0
        ? await prisma.musicPollOption.findMany({
            where: { pollId: id },
            select: { id: true },
          })
        : [];
    const validPollOptionIds = new Set(pollOptionIds.map((option) => option.id));
    const hasUnknownOption = validNormalizedOptionUpdates.some((option) => !validPollOptionIds.has(option.optionId));
    if (hasUnknownOption) {
      return NextResponse.json({ error: 'optionId does not belong to this poll' }, { status: 400 });
    }

    await prisma.$transaction([
      prisma.musicPoll.update({
        where: { id },
        data: updateData,
      }),
      ...validNormalizedOptionUpdates.map((option) =>
        prisma.musicPollOption.update({
          where: { id: option.optionId },
          data: { youtubeVideoId: option.youtubeVideoId },
        })
      ),
    ]);

    const poll = await serializePoll(id, admin.id);
    return NextResponse.json({ ok: true, poll });
  } catch (error) {
    console.error('[api/admin/polls/[id]] PATCH failed', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const admin = await getAdminUserOrNull();
    if (!admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await context.params;
    const existing = await prisma.musicPoll.findFirst({
      where: { id, deletedAt: null },
      select: { id: true },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Poll not found' }, { status: 404 });
    }

    await prisma.musicPoll.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        status: 'CLOSED',
        closedAt: new Date(),
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[api/admin/polls/[id]] DELETE failed', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
