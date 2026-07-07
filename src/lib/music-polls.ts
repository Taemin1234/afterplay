import prisma from '@/lib/prisma';

export type PollItemTypeValue = 'TRACK' | 'ALBUM';
export type PollStatusValue = 'OPEN' | 'CLOSED';

export type PollMusicItemPayload = {
  id: string;
  name: string;
  artist: string;
  albumImageUrl: string;
  releaseDate?: string | null;
};

export type PollOptionPayload = {
  id?: string;
  musicItem: PollMusicItemPayload;
};

export type PollPayloadInput = {
  title?: string;
  description?: string | null;
  itemType?: PollItemTypeValue;
  options?: PollOptionPayload[];
  startsAt?: string | null;
  endsAt?: string | null;
};

type NormalizedPollPayload = {
  title: string;
  description: string | null;
  itemType: PollItemTypeValue;
  options: [PollOptionPayload, PollOptionPayload];
  startsAt: Date | null;
  endsAt: Date | null;
};

type PollResultRow = {
  optionId: string;
  votesCount: number;
  percentage: number;
};

const POLL_TITLE_MAX_LENGTH = 120;
const POLL_DESCRIPTION_MAX_LENGTH = 500;

export function isPollClosed(poll: { status: PollStatusValue; endsAt: Date | null; closedAt?: Date | null }) {
  return poll.status === 'CLOSED' || Boolean(poll.closedAt) || (poll.endsAt !== null && poll.endsAt <= new Date());
}

export function validateAndNormalizePollPayload(
  body: PollPayloadInput,
  options: { requireOptions: boolean }
): { data?: NormalizedPollPayload; error?: string } {
  const title = body.title?.trim();
  const description = body.description?.trim() || null;

  if (!title) return { error: 'title is required' };
  if (title.length > POLL_TITLE_MAX_LENGTH) return { error: `title must be ${POLL_TITLE_MAX_LENGTH} characters or less` };
  if (description && description.length > POLL_DESCRIPTION_MAX_LENGTH) {
    return { error: `description must be ${POLL_DESCRIPTION_MAX_LENGTH} characters or less` };
  }
  if (body.itemType !== 'TRACK' && body.itemType !== 'ALBUM') {
    return { error: 'itemType must be TRACK or ALBUM' };
  }

  const startsAt = parseOptionalDate(body.startsAt, 'startsAt');
  if ('error' in startsAt) return { error: startsAt.error };

  const endsAt = parseOptionalDate(body.endsAt, 'endsAt');
  if ('error' in endsAt) return { error: endsAt.error };

  if (startsAt.value && endsAt.value && startsAt.value >= endsAt.value) {
    return { error: 'endsAt must be after startsAt' };
  }

  if (options.requireOptions) {
    if (!Array.isArray(body.options) || body.options.length !== 2) {
      return { error: 'exactly two options are required' };
    }

    const normalizedOptions = body.options.map(normalizePollOption);
    const invalid = normalizedOptions.find((option) => 'error' in option);
    if (invalid && 'error' in invalid) return { error: invalid.error };

    const optionData = normalizedOptions as [PollOptionPayload, PollOptionPayload];
    if (optionData[0].musicItem.id === optionData[1].musicItem.id) {
      return { error: 'options must be different' };
    }

    return {
      data: {
        title,
        description,
        itemType: body.itemType,
        options: optionData,
        startsAt: startsAt.value,
        endsAt: endsAt.value,
      },
    };
  }

  return {
    data: {
      title,
      description,
      itemType: body.itemType,
      options: [] as unknown as [PollOptionPayload, PollOptionPayload],
      startsAt: startsAt.value,
      endsAt: endsAt.value,
    },
  };
}

function parseOptionalDate(value: string | null | undefined, label: string): { value: Date | null } | { error: string } {
  if (!value) return { value: null };
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return { error: `${label} must be a valid date` };
  return { value: date };
}

function normalizePollOption(option: PollOptionPayload): PollOptionPayload | { error: string } {
  const item = option.musicItem;
  if (!item || typeof item !== 'object') return { error: 'option musicItem is required' };

  const id = item.id?.trim();
  const name = item.name?.trim();
  const artist = item.artist?.trim();
  const albumImageUrl = item.albumImageUrl?.trim() ?? '';
  const releaseDate = item.releaseDate?.trim() || null;

  if (!id || !name || !artist) {
    return { error: 'option id, name, and artist are required' };
  }

  return {
    id: option.id,
    musicItem: {
      id,
      name,
      artist,
      albumImageUrl,
      releaseDate,
    },
  };
}

export async function upsertPollMusicItems(itemType: PollItemTypeValue, options: [PollOptionPayload, PollOptionPayload]) {
  if (itemType === 'TRACK') {
    await Promise.all(
      options.map((option) =>
        prisma.track.upsert({
          where: { spotifyId: option.musicItem.id },
          update: {
            title: option.musicItem.name,
            artist: option.musicItem.artist,
            albumCover: option.musicItem.albumImageUrl,
          },
          create: {
            spotifyId: option.musicItem.id,
            title: option.musicItem.name,
            artist: option.musicItem.artist,
            albumCover: option.musicItem.albumImageUrl,
          },
          select: { id: true },
        })
      )
    );

    const tracks = await prisma.track.findMany({
      where: { spotifyId: { in: options.map((option) => option.musicItem.id) } },
      select: { id: true, spotifyId: true },
    });
    return new Map(tracks.map((track) => [track.spotifyId, track.id]));
  }

  await Promise.all(
    options.map((option) =>
      prisma.album.upsert({
        where: { spotifyId: option.musicItem.id },
        update: {
          title: option.musicItem.name,
          artist: option.musicItem.artist,
          coverImage: option.musicItem.albumImageUrl,
        },
        create: {
          spotifyId: option.musicItem.id,
          title: option.musicItem.name,
          artist: option.musicItem.artist,
          coverImage: option.musicItem.albumImageUrl,
        },
        select: { id: true },
      })
    )
  );

  const albums = await prisma.album.findMany({
    where: { spotifyId: { in: options.map((option) => option.musicItem.id) } },
    select: { id: true, spotifyId: true },
  });
  return new Map(albums.map((album) => [album.spotifyId, album.id]));
}

export async function getPollResults(pollId: string): Promise<{ totalVotes: number; options: PollResultRow[] }> {
  const [options, groupedVotes] = await Promise.all([
    prisma.musicPollOption.findMany({
      where: { pollId },
      select: { id: true },
      orderBy: { order: 'asc' },
    }),
    prisma.musicPollVote.groupBy({
      by: ['optionId'],
      where: { pollId },
      _count: { optionId: true },
    }),
  ]);

  const countByOptionId = new Map(groupedVotes.map((row) => [row.optionId, row._count.optionId]));
  const totalVotes = Array.from(countByOptionId.values()).reduce((sum, count) => sum + count, 0);

  return {
    totalVotes,
    options: options.map((option) => {
      const votesCount = countByOptionId.get(option.id) ?? 0;
      return {
        optionId: option.id,
        votesCount,
        percentage: totalVotes === 0 ? 0 : Math.round((votesCount / totalVotes) * 1000) / 10,
      };
    }),
  };
}

export async function serializePoll(pollId: string, viewerUserId?: string | null) {
  const poll = await prisma.musicPoll.findFirst({
    where: { id: pollId, deletedAt: null },
    include: {
      createdBy: {
        select: { id: true, nickname: true, role: true },
      },
      options: {
        orderBy: { order: 'asc' },
      },
      comments: {
        where: { deletedAt: null },
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
      },
      _count: {
        select: {
          comments: { where: { deletedAt: null } },
        },
      },
    },
  });

  if (!poll) return null;

  const viewerVote = viewerUserId
    ? await prisma.musicPollVote.findUnique({
        where: { pollId_userId: { pollId: poll.id, userId: viewerUserId } },
        select: { id: true, optionId: true, createdAt: true, updatedAt: true },
      })
    : null;
  const canSeeResults = Boolean(viewerVote);
  const results = await getPollResults(poll.id);

  return {
    id: poll.id,
    title: poll.title,
    description: poll.description,
    itemType: poll.itemType,
    status: poll.status,
    isClosed: isPollClosed(poll),
    startsAt: poll.startsAt?.toISOString() ?? null,
    endsAt: poll.endsAt?.toISOString() ?? null,
    closedAt: poll.closedAt?.toISOString() ?? null,
    createdAt: poll.createdAt.toISOString(),
    updatedAt: poll.updatedAt.toISOString(),
    createdBy: poll.createdBy,
    options: poll.options.map((option) => {
      const result = results.options.find((row) => row.optionId === option.id);
      return {
        id: option.id,
        order: option.order,
        spotifyId: option.spotifyId,
        title: option.titleSnapshot,
        artist: option.artistSnapshot,
        imageUrl: option.imageUrlSnapshot,
        releaseDate: option.releaseDateSnapshot,
        trackId: option.trackId,
        albumId: option.albumId,
        result: canSeeResults
          ? {
              votesCount: result?.votesCount ?? 0,
              percentage: result?.percentage ?? 0,
            }
          : null,
      };
    }),
    viewerVote: viewerVote
      ? {
          id: viewerVote.id,
          optionId: viewerVote.optionId,
          createdAt: viewerVote.createdAt.toISOString(),
          updatedAt: viewerVote.updatedAt.toISOString(),
        }
      : null,
    results: canSeeResults ? { totalVotes: results.totalVotes } : null,
    comments: poll.comments.map((comment) => ({
      id: comment.id,
      content: comment.content,
      createdAt: comment.createdAt.toISOString(),
      updatedAt: comment.updatedAt.toISOString(),
      user: comment.user,
    })),
    commentsCount: poll._count.comments,
  };
}

export async function serializePollListItem(pollId: string, viewerUserId?: string | null) {
  const poll = await serializePoll(pollId, viewerUserId);
  if (!poll) return null;

  return {
    id: poll.id,
    title: poll.title,
    description: poll.description,
    itemType: poll.itemType,
    status: poll.status,
    isClosed: poll.isClosed,
    startsAt: poll.startsAt,
    endsAt: poll.endsAt,
    closedAt: poll.closedAt,
    createdAt: poll.createdAt,
    options: poll.options.map((option) => ({
      id: option.id,
      order: option.order,
      spotifyId: option.spotifyId,
      title: option.title,
      artist: option.artist,
      imageUrl: option.imageUrl,
      releaseDate: option.releaseDate,
      result: option.result,
    })),
    viewerVote: poll.viewerVote,
    results: poll.results,
    commentsCount: poll.commentsCount,
  };
}
