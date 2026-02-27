import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import {
  getAuthenticatedUser,
  type ListPayloadInput,
  upsertDbUser,
  upsertTags,
  validateAndNormalizeListPayload,
} from '@/lib/music-list-api';

export async function POST(req: Request) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await upsertDbUser(user);

    const body = (await req.json()) as ListPayloadInput;
    const parsed = validateAndNormalizeListPayload(body, {
      expectedType: 'track',
      requireType: true,
    });
    if (!parsed.data) {
      return NextResponse.json({ error: parsed.error ?? 'Bad request' }, { status: 400 });
    }

    const { title, story, visibility, musicItems, tags } = parsed.data;
    const tagRows = await upsertTags(tags);

    const result = await prisma.$transaction(
      async (tx) => {
        const playlist = await tx.playlist.create({
          data: {
            title,
            story,
            visibility,
            authorId: user.id,
            tracks: {
              create: musicItems.map((item, i) => ({
                order: i,
                track: {
                  connectOrCreate: {
                    where: { spotifyId: item.id },
                    create: {
                      spotifyId: item.id,
                      title: item.name,
                      artist: item.artist,
                      albumCover: item.albumImageUrl ?? '',
                    },
                  },
                },
              })),
            },
          },
        });

        if (tagRows.length > 0) {
          await tx.playlistTag.createMany({
            data: tagRows.map((tag) => ({
              playlistId: playlist.id,
              tagId: tag.id,
            })),
            skipDuplicates: true,
          });
        }

        await tx.listFeed.create({
          data: {
            userId: user.id,
            kind: 'PLAYLIST',
            refId: playlist.id,
            createdAt: playlist.createdAt,
          },
        });

        return playlist;
      },
      { timeout: 15000, maxWait: 10000 }
    );

    return NextResponse.json({ ok: true, playlistId: result.id }, { status: 201 });
  } catch (error) {
    console.error('Failed to create playlist:', error);
    const detail = error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json(
      {
        error: 'Failed to create playlist.',
        ...(process.env.NODE_ENV !== 'production' ? { detail } : {}),
      },
      { status: 500 }
    );
  }
}
