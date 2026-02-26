import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/utils/supabase/server';
import prisma from '@/lib/prisma';

interface MusicItem {
  id: string;
  name: string;
  artist: string;
  albumImageUrl: string;
}

interface AlbumListBody {
  title: string;
  story: string;
  visibility: 'PRIVATE' | 'PUBLIC';
  type: 'track' | 'album';
  musicItems: MusicItem[];
  tags: string[];
}

export async function POST(req: Request) {
  try {
    // Supabase를 통해 현재 로그인한 유저 확인
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: '인증되지 않은 사용자입니다.' }, { status: 401 });
    }

    const email = user.email?.trim();
    if (!email) {
      return NextResponse.json({ error: '이메일이 필요합니다.' }, { status: 400 });
    }

    // FK로 연결된 레코드를 생성하기 전에, Prisma의 User 테이블에 해당 사용자 행(row)이 존재하는지 확인하라(없으면 먼저 만들어라).
    await prisma.user.upsert({
      where: { id: user.id },
      update: {
        email,
        avatarUrl: user.user_metadata?.avatar_url ?? null,
      },
      create: {
        id: user.id,
        email,
        avatarUrl: user.user_metadata?.avatar_url ?? null,
        nickname: null,
      },
    });

    // 클라이언트에서 보낸 데이터 받아오기
    const body = (await req.json()) as AlbumListBody;
    const { title, story, visibility, type, musicItems, tags } = body;

    // 기본 검증
    if (!title?.trim() || !story?.trim()) {
      return NextResponse.json({ error: 'title/story가 필요합니다.' }, { status: 400 });
    }
    if (!Array.isArray(musicItems) || musicItems.length === 0) {
      return NextResponse.json({ error: 'musicItems가 필요합니다.' }, { status: 400 });
    }
    if (type !== 'album') {
      return NextResponse.json({ error: '현재 route는 album만 처리합니다.' }, { status: 400 });
    }
    if (visibility !== 'PUBLIC' && visibility !== 'PRIVATE') {
      return NextResponse.json({ error: 'visibility 값이 올바르지 않습니다.' }, { status: 400 });
    }

    // 중복곡 제거(클라이언트 서버 이중 방어)
    const uniqueItems = Array.from(new Map(musicItems.map((m) => [m.id, m])).values());

    // 태그 정리 : trim + 빈값 제거 + 중복제거 + 최대 10개
    const cleanedTags = Array.isArray(tags)
      ? [...new Set(tags.map((t) => t.trim()).filter(Boolean))].slice(0, 10) : [];

    const tagRows =
      cleanedTags.length > 0
        ? await Promise.all(
            cleanedTags.map((name) =>
              prisma.tag.upsert({
                where: { name },
                update: {},
                create: { name },
                select: { id: true },
              })
            )
          )
        : [];

    const result = await prisma.$transaction(async (tx) => {
      const albumlist = await tx.albumList.create({
        data: {
          title: title.trim(),
          story: story.trim(),
          visibility,
          authorId: user.id,
          albums: {
            create: uniqueItems.map((item, i) => ({
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
            albumListId: albumlist.id,
            tagId: tag.id,
          })),
          skipDuplicates: true,
        });
      }

      await tx.listFeed.create({
        data: {
          userId: user.id,
          kind: 'ALBUM_LIST',
          refId: albumlist.id,
          createdAt: albumlist.createdAt,
        },
      });

      return albumlist;
    }, { timeout: 15000, maxWait: 10000 });

    return NextResponse.json({ ok: true, albumlistId: result.id }, { status: 201 });
  } catch (error) {
    console.error('앨범 리스트 저장에 실패했습니다:', error);
    const detail = error instanceof Error ? error.message : '알 수 없는 에러';

    return NextResponse.json(
      {
        error: '저장에 실패했습니다.',
        ...(process.env.NODE_ENV !== 'production' ? { detail } : {}),
      },
      { status: 500 }
    );
  }
}