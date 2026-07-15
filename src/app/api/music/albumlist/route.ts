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
      expectedType: 'album',
      requireType: true,
    });
    if (!parsed.data) {
      return NextResponse.json({ error: parsed.error ?? 'Bad request' }, { status: 400 });
    }

    const { title, story, visibility, musicItems, tags, featuredSectionIds } = parsed.data;

    if (featuredSectionIds.length > 0) {
      const dbUser = await prisma.user.findUnique({ where: { id: user.id }, select: { role: true } });
      if (dbUser?.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      if (visibility !== 'PUBLIC') {
        return NextResponse.json({ error: '비공개 게시물은 특별게시물로 설정할 수 없습니다.' }, { status: 400 });
      }
      const activeSections = await prisma.featuredSection.count({
        where: { id: { in: featuredSectionIds }, isActive: true },
      });
      if (activeSections !== featuredSectionIds.length) {
        return NextResponse.json({ error: 'Featured section not found' }, { status: 400 });
      }
    }

    const tagRows = await upsertTags(tags);

    const result = await prisma.$transaction(
      async (tx) => {
        const albumList = await tx.albumList.create({
          data: {
            title,
            story,
            visibility,
            authorId: user.id,
            albums: {
              create: musicItems.map((item, i) => ({
                order: i,
                album: {
                  connectOrCreate: {
                    where: { spotifyId: item.id },
                    create: {
                      spotifyId: item.id,
                      title: item.name,
                      artist: item.artist,
                      coverImage: item.albumImageUrl ?? '',
                    },
                  },
                },
              })),
            },
          },
        });

        if (tagRows.length > 0) {
          await tx.albumListTag.createMany({
            data: tagRows.map((tag) => ({
              albumListId: albumList.id,
              tagId: tag.id,
            })),
            skipDuplicates: true,
          });
        }

        await tx.listFeed.create({
          data: {
            userId: user.id,
            kind: 'ALBUM_LIST',
            refId: albumList.id,
            createdAt: albumList.createdAt,
          },
        });

        if (featuredSectionIds.length > 0) {
          await tx.featuredItem.createMany({
            data: featuredSectionIds.map((sectionId) => ({
              sectionId,
              kind: 'ALBUM_LIST',
              refId: albumList.id,
              setByUserId: user.id,
            })),
            skipDuplicates: true,
          });
        }

        return albumList;
      },
      { timeout: 15000, maxWait: 10000 }
    );

    return NextResponse.json({ ok: true, albumlistId: result.id }, { status: 201 });
  } catch (error) {
    console.error('Failed to create album list:', error);
    const detail = error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json(
      {
        error: 'Failed to create album list.',
        ...(process.env.NODE_ENV !== 'production' ? { detail } : {}),
      },
      { status: 500 }
    );
  }
}
