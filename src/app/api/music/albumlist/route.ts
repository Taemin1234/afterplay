import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/utils/supabase/server';
import prisma from '@/lib/prisma';

interface MusicItem {
    id: string;
    name: string;
    artist: string;
    albumImageUrl: string;
}

export async function POST(req: Request) {
  try {
    // Supabase를 통해 현재 로그인한 유저 확인
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: '인증되지 않은 사용자입니다.' }, { status: 401 });
    }

    // 클라이언트에서 보낸 데이터 받아오기
    const body = await req.json();
    const { title, story, visibility, type, musicItems, tags } = body as {
        title: string;
        story: string;
        visibility: "PRIVATE" | "PUBLIC";
        type: "track" | "album";
        musicItems: MusicItem[];
        tags: string[];
      };

    // 기본 검증
    if (!title?.trim() || !story?.trim()) {
        return NextResponse.json({ error: "title/story가 필요합니다." }, { status: 400 });
    }
    if (!Array.isArray(musicItems) || musicItems.length === 0) {
        return NextResponse.json({ error: "musicItems가 필요합니다." }, { status: 400 });
    }
    if (type !== "album") {
        return NextResponse.json({ error: "현재 route는 album만 처리합니다." }, { status: 400 });
    }

    // 중복 곡 제거(클라에서 막아도 서버에서 한번 더 방어)
    const uniqueItems = Array.from(
    new Map(musicItems.map((m) => [m.id, m])).values()
    );

    // 태그 정리: trim + 빈값 제거 + 중복 제거 + 최대 5개
    const cleanedTags = Array.isArray(tags)
     ? [...new Set(tags.map((t) => t.trim()).filter(Boolean))].slice(0, 5)
     : [];

    const result = await prisma.$transaction(async (tx) => {
        // 1) Albumlist 생성
        const albumlist = await tx.albumList.create({
            data: {
                title: title.trim(),
                story: story.trim(),
                visibility: visibility,
                authorId: user.id,
                // AlbumEntry 생성 + Album connectOrCreate + order 저장
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
                                    coverImage: item.albumImageUrl ?? "",
                                }
                            }
                        }
                    }))
                },
                // AlbumlistTag 생성 + Tag connectOrCreate
                tags: {
                    create: cleanedTags.map((tagName) => ({
                    tag: {
                        connectOrCreate: {
                        where: { name: tagName },
                        create: { name: tagName },
                        },
                    },
                    })),
                },
            }
        });
  
        return albumlist;
      });
  
      return NextResponse.json({ ok: true, albumlistId: result.id }, { status: 201 });

  } catch (error) {
    console.error('Albumlist Save Error:', error);
    return NextResponse.json(
      { error: '서버 오류로 인해 저장에 실패했습니다.' },
      { status: 500 }
    );
  }
}