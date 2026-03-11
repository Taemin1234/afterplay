import { NextResponse } from 'next/server';

import prisma from '@/lib/prisma';
import type { MusicListItem } from '@/types';

type SearchUserItem = {
  id: string;
  nickname: string;
  nicknameSlug: string | null;
  avatarUrl: string | null;
};

const MAX_LIMIT = 24;
const DEFAULT_LIMIT = 12;

// URL의 limit값을 안전한 숫자로 변환
function parseLimit(raw: string | null): number {
  if (!raw) return DEFAULT_LIMIT;

  const value = Number(raw);
  if (!Number.isInteger(value) || value < 1 || value > MAX_LIMIT) return DEFAULT_LIMIT;

  return value;
}

type PlaylistRow = {
  id: string;
  title: string;
  story: string;
  visibility: 'PUBLIC' | 'PRIVATE';
  authorId: string;
  author: {
    nickname: string | null;
  };
  createdAt: Date;
  _count: {
    likes: number;
    comments: number;
  };
  tags: Array<{ tag: { name: string } }>;
  tracks: Array<{ track: { albumCover: string } }>;
};

type AlbumListRow = {
  id: string;
  title: string;
  story: string;
  visibility: 'PUBLIC' | 'PRIVATE';
  authorId: string;
  author: {
    nickname: string | null;
  };
  createdAt: Date;
  _count: {
    likes: number;
    comments: number;
  };
  tags: Array<{ tag: { name: string } }>;
  albums: Array<{ album: { coverImage: string } }>;
};

// 검색해서 가져온 플레이리스트/앨범리스트를 사용하는 공통 컴포넌트로 변환
function mapPlaylistToItem(row: PlaylistRow): MusicListItem {
  return {
    kind: 'PLAYLIST',
    id: row.id,
    title: row.title,
    story: row.story,
    visibility: row.visibility,
    authorId: row.authorId,
    authorNickname: row.author.nickname,
    createdAt: row.createdAt.toISOString(),
    likesCount: row._count.likes,
    commentsCount: row._count.comments,
    tags: row.tags.map((tagRow) => tagRow.tag.name),
    previewImages: row.tracks.map((entry) => entry.track.albumCover).filter(Boolean),
  };
}

function mapAlbumListToItem(row: AlbumListRow): MusicListItem {
  return {
    kind: 'ALBUM_LIST',
    id: row.id,
    title: row.title,
    story: row.story,
    visibility: row.visibility,
    authorId: row.authorId,
    authorNickname: row.author.nickname,
    createdAt: row.createdAt.toISOString(),
    likesCount: row._count.likes,
    commentsCount: row._count.comments,
    tags: row.tags.map((tagRow) => tagRow.tag.name),
    previewImages: row.albums.map((entry) => entry.album.coverImage).filter(Boolean),
  };
}

// 최신순 정렬
function sortByCreatedAtDesc(items: MusicListItem[]): MusicListItem[] {
  return [...items].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

function dedupeListItems(items: MusicListItem[]): MusicListItem[] {
  const map = new Map<string, MusicListItem>();

  for (const item of items) {
    map.set(`${item.kind}:${item.id}`, item);
  }

  return [...map.values()];
}

const baseSelect = {
  id: true,
  title: true,
  story: true,
  visibility: true,
  authorId: true,
  author: { select: { nickname: true } },
  createdAt: true,
  _count: { select: { likes: true, comments: true } },
  tags: { select: { tag: { select: { name: true } } } },
} as const;

export async function GET(request: Request) {
  // URL 쿼리 읽기
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q')?.trim() ?? '';
  const limit = parseLimit(searchParams.get('limit'));

  // 2글자 이하 빈배열 반환
  if (query.length < 2) {
    return NextResponse.json({
      content: [] as MusicListItem[],
      tag: [] as MusicListItem[],
      music: [] as MusicListItem[],
      users: [] as SearchUserItem[],
    });
  }

  // 검색 동시 실행
  // 플레이리스트, 앨범리스트 제목/내용
  // 플레이리스트, 앨범리스트 태그
  // 저장된 노래와 앨범
  // 사용자 닉네임
  const [contentPlaylists, contentAlbumLists, tagPlaylists, tagAlbumLists, musicPlaylists, musicAlbumLists, users] =
    await Promise.all([
      prisma.playlist.findMany({
        where: {
          deletedAt: null,
          visibility: 'PUBLIC',
          OR: [{ title: { contains: query, mode: 'insensitive' } }, { story: { contains: query, mode: 'insensitive' } }], // insensitive 대소문자 구분 없음
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        // 검색결과 중 필요한 부분만 가져오기
        select: {
          ...baseSelect,
          tracks: {
            orderBy: { order: 'asc' },
            take: 3,
            select: { track: { select: { albumCover: true } } },
          },
        },
      }),
      prisma.albumList.findMany({
        where: {
          deletedAt: null,
          visibility: 'PUBLIC',
          OR: [{ title: { contains: query, mode: 'insensitive' } }, { story: { contains: query, mode: 'insensitive' } }],
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        select: {
          ...baseSelect,
          albums: {
            orderBy: { order: 'asc' },
            take: 3,
            select: { album: { select: { coverImage: true } } },
          },
        },
      }),
      prisma.playlist.findMany({
        where: {
          deletedAt: null,
          visibility: 'PUBLIC',
          tags: {
            some: {
              tag: { name: { contains: query, mode: 'insensitive' } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        select: {
          ...baseSelect,
          tracks: {
            orderBy: { order: 'asc' },
            take: 3,
            select: { track: { select: { albumCover: true } } },
          },
        },
      }),
      prisma.albumList.findMany({
        where: {
          deletedAt: null,
          visibility: 'PUBLIC',
          tags: {
            some: {
              tag: { name: { contains: query, mode: 'insensitive' } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        select: {
          ...baseSelect,
          albums: {
            orderBy: { order: 'asc' },
            take: 3,
            select: { album: { select: { coverImage: true } } },
          },
        },
      }),
      prisma.playlist.findMany({
        where: {
          deletedAt: null,
          visibility: 'PUBLIC',
          tracks: {
            some: {
              track: {
                OR: [
                  { title: { contains: query, mode: 'insensitive' } },
                  { artist: { contains: query, mode: 'insensitive' } },
                ],
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        select: {
          ...baseSelect,
          tracks: {
            orderBy: { order: 'asc' },
            take: 3,
            select: { track: { select: { albumCover: true } } },
          },
        },
      }),
      prisma.albumList.findMany({
        where: {
          deletedAt: null,
          visibility: 'PUBLIC',
          albums: {
            some: {
              album: {
                OR: [
                  { title: { contains: query, mode: 'insensitive' } },
                  { artist: { contains: query, mode: 'insensitive' } },
                ],
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        select: {
          ...baseSelect,
          albums: {
            orderBy: { order: 'asc' },
            take: 3,
            select: { album: { select: { coverImage: true } } },
          },
        },
      }),
      prisma.user.findMany({
        where: {
          deletedAt: null,
          nickname: {
            contains: query,
            mode: 'insensitive',
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        select: {
          id: true,
          nickname: true,
          nicknameSlug: true,
          avatarUrl: true,
        },
      }),
    ]);

  // 결과 합치기
  const contentItems = sortByCreatedAtDesc([
    ...contentPlaylists.map(mapPlaylistToItem),
    ...contentAlbumLists.map(mapAlbumListToItem),
  ]).slice(0, limit);

  const tagItems = sortByCreatedAtDesc([...tagPlaylists.map(mapPlaylistToItem), ...tagAlbumLists.map(mapAlbumListToItem)]).slice(
    0,
    limit
  );

  const musicItems = sortByCreatedAtDesc(
    dedupeListItems([...musicPlaylists.map(mapPlaylistToItem), ...musicAlbumLists.map(mapAlbumListToItem)])
  ).slice(0, limit);

  // 유저 결과 가공
  const userItems: SearchUserItem[] = users
    .filter((user) => Boolean(user.nickname))
    .map((user) => ({
      id: user.id,
      nickname: user.nickname as string,
      nicknameSlug: user.nicknameSlug,
      avatarUrl: user.avatarUrl,
    }));

  // 프론트로 전송
  return NextResponse.json({
    content: contentItems,
    tag: tagItems,
    music: musicItems,
    users: userItems,
  });
}
