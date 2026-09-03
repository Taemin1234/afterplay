import type { Prisma } from '../../generated/prisma/client';

const PUBLIC_POLL_POLICY = {
  visibility: 'PUBLIC',
  deletedAt: null,
} satisfies Prisma.MusicPollWhereInput;

export function publicPollWhere(
  conditions: Prisma.MusicPollWhereInput = {},
): Prisma.MusicPollWhereInput {
  return {
    AND: [PUBLIC_POLL_POLICY, conditions],
  };
}
