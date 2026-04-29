import { NextResponse } from 'next/server';

import prisma from '@/lib/prisma';
import type { MusicListItem } from '@/types';

type SearchUserItem = {
  id: string;
  nickname: string;
  nicknameSlug: string | null;
  avatarUrl: string | null;
};

type SearchTab = 'content' | 'tag' | 'music' | 'user';
type SearchResponse = {
  content: MusicListItem[];
  tag: MusicListItem[];
  music: MusicListItem[];
  users: SearchUserItem[];
};

const MAX_LIMIT = 24;
const DEFAULT_LIMIT = 12;

function emptySearchResponse(): SearchResponse {
  return {
    content: [],
    tag: [],
    music: [],
    users: [],
  };
}

// URL의 limit값을 안전한 숫자로 변환
function parseLimit(raw: string | null): number {
  if (!raw) return DEFAULT_LIMIT;

  const value = Number(raw);
  if (!Number.isInteger(value) || value < 1 || value > MAX_LIMIT) return DEFAULT_LIMIT;

  return value;
}

function parseTab(raw: string | null): SearchTab | null {
  if (raw === 'content' || raw === 'tag' || raw === 'music' || raw === 'user') return raw;
  return null;
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

// 공백제거(중간 공백을 하나의 공백으로 통일)
function normalizeTerm(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

// 소문자로 통일
function compactTerm(value: string): string {
  return normalizeTerm(value).replace(/\s+/g, '').toLowerCase();
}

// 공백 제거 버전과 원문 둘다 set으로 저장
function pushTerms(set: Set<string>, ...values: Array<string | null | undefined>) {
  // 받은 values를 순회하며 정규화한 문자열과 공백을 제거한 compact를 set에 추가
  for (const value of values) {
    if (!value) continue;
    const normalized = normalizeTerm(value);
    if (normalized.length === 0) continue;
    set.add(normalized);
    const compact = normalized.replace(/\s+/g, '');
    if (compact.length > 0) {
      set.add(compact);
    }
  }
}

export async function GET(request: Request) {
  // URL 쿼리 읽기
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q')?.trim() ?? '';
  const limit = parseLimit(searchParams.get('limit'));
  const tab = parseTab(searchParams.get('tab'));
  const shouldSearchContent = tab === null || tab === 'content';
  const shouldSearchTag = tab === null || tab === 'tag';
  const shouldSearchMusic = tab === null || tab === 'music';
  const shouldSearchUsers = tab === null || tab === 'user';

  // 2글자 이하 빈배열 반환
  if (query.length < 2) {
    return NextResponse.json(emptySearchResponse());
  }

  // 원본과 별칭에서 일치하는 검색어 가져오기
  // track, album 검색어 따로 저장
  const trackTerms = new Set<string>([normalizeTerm(query)]);
  const albumTerms = new Set<string>([normalizeTerm(query)]);

  if (shouldSearchMusic) {
    // alias 테이블 조회
    const aliasRows = await prisma.musicSearchAlias.findMany({
      select: {
        type: true,
        canonical: true,
        alias: true,
      },
      take: 1000,
    });

    const compactQuery = compactTerm(query);
    const matchedAliasRows = aliasRows.filter((row) => {
      const canonicalCompact = compactTerm(row.canonical);
      const aliasCompact = compactTerm(row.alias);
      return canonicalCompact.includes(compactQuery) || aliasCompact.includes(compactQuery);
    });

    for (const row of matchedAliasRows) {
      // 아티스트 별칭은 트랙/앨범 검색에 공통으로 확장
      if (row.type === 'TRACK_ARTIST' || row.type === 'ALBUM_ARTIST') {
        pushTerms(trackTerms, row.canonical, row.alias);
        pushTerms(albumTerms, row.canonical, row.alias);
        continue;
      }

      if (row.type === 'TRACK_TITLE') {
        pushTerms(trackTerms, row.canonical, row.alias);
        continue;
      }

      if (row.type === 'ALBUM_TITLE') {
        pushTerms(albumTerms, row.canonical, row.alias);
      }
    }
  }

  // 검색어 개수 제한
  const trackSearchTerms = [...trackTerms].slice(0, 20);
  const albumSearchTerms = [...albumTerms].slice(0, 20);

  // 검색 동시 실행
  // 플레이리스트, 앨범리스트 제목/내용
  // 플레이리스트, 앨범리스트 태그
  // 저장된 노래와 앨범
  // 사용자 닉네임
  const [contentPlaylists, contentAlbumLists, tagPlaylists, tagAlbumLists, musicPlaylists, musicAlbumLists, users] =
    await Promise.all([
      shouldSearchContent
        ? prisma.playlist.findMany({
            where: {
              deletedAt: null,
              visibility: 'PUBLIC',
              OR: [
                { title: { contains: query, mode: 'insensitive' } },
                { story: { contains: query, mode: 'insensitive' } },
              ], // insensitive 대소문자 구분 없음
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
          })
        : Promise.resolve([]),
      shouldSearchContent
        ? prisma.albumList.findMany({
            where: {
              deletedAt: null,
              visibility: 'PUBLIC',
              OR: [
                { title: { contains: query, mode: 'insensitive' } },
                { story: { contains: query, mode: 'insensitive' } },
              ],
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
          })
        : Promise.resolve([]),
      shouldSearchTag
        ? prisma.playlist.findMany({
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
          })
        : Promise.resolve([]),
      shouldSearchTag
        ? prisma.albumList.findMany({
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
          })
        : Promise.resolve([]),
      shouldSearchMusic
        ? prisma.playlist.findMany({
            where: {
              deletedAt: null,
              visibility: 'PUBLIC',
              tracks: {
                some: {
                  track: {
                    OR: [
                      ...trackSearchTerms.map((term) => ({ title: { contains: term, mode: 'insensitive' as const } })),
                      ...trackSearchTerms.map((term) => ({ artist: { contains: term, mode: 'insensitive' as const } })),
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
          })
        : Promise.resolve([]),
      shouldSearchMusic
        ? prisma.albumList.findMany({
            where: {
              deletedAt: null,
              visibility: 'PUBLIC',
              albums: {
                some: {
                  album: {
                    OR: [
                      ...albumSearchTerms.map((term) => ({ title: { contains: term, mode: 'insensitive' as const } })),
                      ...albumSearchTerms.map((term) => ({ artist: { contains: term, mode: 'insensitive' as const } })),
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
          })
        : Promise.resolve([]),
      shouldSearchUsers
        ? prisma.user.findMany({
            where: {
              deletedAt: null,
              isDeletedPlaceholder: false,
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
          })
        : Promise.resolve([]),
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

