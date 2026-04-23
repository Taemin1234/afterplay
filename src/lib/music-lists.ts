import prisma from '@/lib/prisma';
import type { FeedKind, ListSortOption, ListType, VisibilityScope } from "@/types";

type FeedCursor = {
  createdAt: string;
  id: string;
};

type QueryOptions = {
  type: ListType;
  sort?: ListSortOption;
  limit: number;
  cursor: FeedCursor | null;
  likesOffset?: number;
  feedUserId?: string;
  authorId?: string;
  visibility: VisibilityScope;
};

type ResponseItem = {
  kind: FeedKind;
  id: string;
  title: string;
  story: string | null;
  visibility: 'PUBLIC' | 'PRIVATE';
  authorId: string;
  authorNickname: string | null;
  createdAt: string;
  likesCount: number;
  commentsCount: number;
  tags: string[];
  previewImages: string[];
};

type ResponsePayload = {
  items: ResponseItem[];
  nextCursor: string | null;
};

type CollectedRef = {
  kind: 'PLAYLIST' | 'ALBUM_LIST';
  refId: string;
  _cursor: FeedCursor;
};

const MAX_LIMIT = 50;
const DEFAULT_LIMIT = 20;

function encodeCursor(cursor: FeedCursor): string {
  return Buffer.from(JSON.stringify(cursor)).toString('base64url');
}

function decodeCursor(raw: string): FeedCursor {
  try {
    const decoded = JSON.parse(Buffer.from(raw, 'base64url').toString('utf8')) as FeedCursor;
    if (!decoded?.createdAt || !decoded?.id) {
      throw new Error('Invalid cursor shape');
    }

    const parsed = new Date(decoded.createdAt);
    if (Number.isNaN(parsed.getTime())) {
      throw new Error('Invalid cursor date');
    }

    return decoded;
  } catch {
    throw new Error('Invalid cursor');
  }
}

function buildAfterWhere(cursor: FeedCursor | null) {
  if (!cursor) return {};

  const createdAt = new Date(cursor.createdAt);
  return {
    OR: [
      { createdAt: { lt: createdAt } },
      { createdAt, id: { lt: cursor.id } },
    ],
  };
}

function toItemKind(type: ListType): FeedKind | null {
  if (type === 'playlist') return 'PLAYLIST';
  if (type === 'albumlist') return 'ALBUM_LIST';
  return null;
}

export function parseListType(raw: string | null): ListType {
  if (!raw) return 'all';
  if (raw === 'all' || raw === 'playlist' || raw === 'albumlist') return raw;
  throw new Error('type must be one of all, playlist, albumlist');
}

export function parseLimit(raw: string | null): number {
  if (!raw) return DEFAULT_LIMIT;

  const n = Number(raw);
  if (!Number.isInteger(n) || n < 1 || n > MAX_LIMIT) {
    throw new Error(`limit must be an integer between 1 and ${MAX_LIMIT}`);
  }

  return n;
}

export function parseCursor(raw: string | null): FeedCursor | null {
  if (!raw) return null;
  return decodeCursor(raw);
}

export function parseListSort(raw: string | null): ListSortOption {
  if (!raw) return 'latest';
  if (raw === 'latest' || raw === 'likes') return raw;
  throw new Error('sort must be one of latest, likes');
}

export function parseLikesCursor(raw: string | null): number {
  if (!raw) return 0;
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 0) {
    throw new Error('likes cursor must be a non-negative integer');
  }
  return n;
}

function encodeLikesCursor(offset: number): string {
  return String(offset);
}

export function parseVisibilityScope(raw: string | null): VisibilityScope {
  if (!raw) return 'all';
  if (raw === 'all' || raw === 'public' || raw === 'private') return raw;
  throw new Error('visibility must be one of all, public, private');
}

function compareByLikesThenRecent(a: ResponseItem, b: ResponseItem): number {
  if (b.likesCount !== a.likesCount) return b.likesCount - a.likesCount;

  const timeDiff = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  if (timeDiff !== 0) return timeDiff;

  return b.id.localeCompare(a.id);
}

async function fetchListItemsByLikes(options: QueryOptions): Promise<ResponsePayload> {
  const playlistWhere: Record<string, unknown> = { deletedAt: null };
  const albumListWhere: Record<string, unknown> = { deletedAt: null };
  const offset = options.likesOffset ?? 0;
  const scopedAuthorId = options.authorId ?? options.feedUserId;

  if (scopedAuthorId) {
    playlistWhere.authorId = scopedAuthorId;
    albumListWhere.authorId = scopedAuthorId;
  }
  if (options.visibility === 'public') {
    playlistWhere.visibility = 'PUBLIC';
    albumListWhere.visibility = 'PUBLIC';
  }
  if (options.visibility === 'private') {
    playlistWhere.visibility = 'PRIVATE';
    albumListWhere.visibility = 'PRIVATE';
  }

  const orderBy = [
    { likes: { _count: 'desc' as const } },
    { createdAt: 'desc' as const },
    { id: 'desc' as const },
  ];

  if (options.type === 'playlist') {
    const rows = await prisma.playlist.findMany({
      where: playlistWhere,
      orderBy,
      skip: offset,
      take: options.limit + 1,
      select: {
        id: true,
        title: true,
        story: true,
        visibility: true,
        authorId: true,
        createdAt: true,
        author: { select: { nickname: true } },
        _count: { select: { likes: true, comments: true } },
        tags: { select: { tag: { select: { name: true } } } },
        tracks: {
          orderBy: { order: 'asc' },
          take: 3,
          select: { track: { select: { albumCover: true } } },
        },
      },
    });

    const hasNext = rows.length > options.limit;
    const page = hasNext ? rows.slice(0, options.limit) : rows;
    return {
      items: page.map((row) => ({
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
        previewImages: row.tracks
          .map((entry) => entry.track.albumCover)
          .filter((image): image is string => Boolean(image)),
      })),
      nextCursor: hasNext ? encodeLikesCursor(offset + options.limit) : null,
    };
  }

  if (options.type === 'albumlist') {
    const rows = await prisma.albumList.findMany({
      where: albumListWhere,
      orderBy,
      skip: offset,
      take: options.limit + 1,
      select: {
        id: true,
        title: true,
        story: true,
        visibility: true,
        authorId: true,
        createdAt: true,
        author: { select: { nickname: true } },
        _count: { select: { likes: true, comments: true } },
        tags: { select: { tag: { select: { name: true } } } },
        albums: {
          orderBy: { order: 'asc' },
          take: 3,
          select: { album: { select: { coverImage: true } } },
        },
      },
    });

    const hasNext = rows.length > options.limit;
    const page = hasNext ? rows.slice(0, options.limit) : rows;
    return {
      items: page.map((row) => ({
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
        previewImages: row.albums
          .map((entry) => entry.album.coverImage)
          .filter((image): image is string => Boolean(image)),
      })),
      nextCursor: hasNext ? encodeLikesCursor(offset + options.limit) : null,
    };
  }

  const mergedTake = offset + options.limit + 1;
  const [playlistRows, albumListRows] = await Promise.all([
    prisma.playlist.findMany({
      where: playlistWhere,
      orderBy,
      take: mergedTake,
      select: {
        id: true,
        title: true,
        story: true,
        visibility: true,
        authorId: true,
        createdAt: true,
        author: { select: { nickname: true } },
        _count: { select: { likes: true, comments: true } },
        tags: { select: { tag: { select: { name: true } } } },
        tracks: {
          orderBy: { order: 'asc' },
          take: 3,
          select: { track: { select: { albumCover: true } } },
        },
      },
    }),
    prisma.albumList.findMany({
      where: albumListWhere,
      orderBy,
      take: mergedTake,
      select: {
        id: true,
        title: true,
        story: true,
        visibility: true,
        authorId: true,
        createdAt: true,
        author: { select: { nickname: true } },
        _count: { select: { likes: true, comments: true } },
        tags: { select: { tag: { select: { name: true } } } },
        albums: {
          orderBy: { order: 'asc' },
          take: 3,
          select: { album: { select: { coverImage: true } } },
        },
      },
    }),
  ]);

  const merged: ResponseItem[] = [
    ...playlistRows.map((row) => ({
      kind: 'PLAYLIST' as const,
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
      previewImages: row.tracks
        .map((entry) => entry.track.albumCover)
        .filter((image): image is string => Boolean(image)),
    })),
    ...albumListRows.map((row) => ({
      kind: 'ALBUM_LIST' as const,
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
      previewImages: row.albums
        .map((entry) => entry.album.coverImage)
        .filter((image): image is string => Boolean(image)),
    })),
  ].sort(compareByLikesThenRecent);

  const pageWithExtra = merged.slice(offset, offset + options.limit + 1);
  const hasNext = pageWithExtra.length > options.limit;
  const page = hasNext ? pageWithExtra.slice(0, options.limit) : pageWithExtra;

  return {
    items: page,
    nextCursor: hasNext ? encodeLikesCursor(offset + options.limit) : null,
  };
}

export async function fetchListItems(options: QueryOptions): Promise<ResponsePayload> {
  const sort = options.sort ?? 'latest';
  if (sort === 'likes') {
    return fetchListItemsByLikes(options);
  }

  const kind = toItemKind(options.type);
  const baseFeedWhere: Record<string, unknown> = {};

  if (options.feedUserId) {
    baseFeedWhere.userId = options.feedUserId;
  }
  if (kind) {
    baseFeedWhere.kind = kind;
  }

  const visibilityPlaylist: Record<string, unknown> = {};
  const visibilityAlbumList: Record<string, unknown> = {};

  if (options.authorId) {
    visibilityPlaylist.authorId = options.authorId;
    visibilityAlbumList.authorId = options.authorId;
  }

  if (options.visibility === 'public') {
    visibilityPlaylist.visibility = 'PUBLIC';
    visibilityAlbumList.visibility = 'PUBLIC';
  }
  if (options.visibility === 'private') {
    visibilityPlaylist.visibility = 'PRIVATE';
    visibilityAlbumList.visibility = 'PRIVATE';
  }

  const collectedRefs: CollectedRef[] = [];
  let scanCursor = options.cursor;

  for (let i = 0; i < 6 && collectedRefs.length < options.limit + 1; i += 1) {
    const needed = options.limit + 1 - collectedRefs.length;
    const take = Math.min(100, Math.max(options.limit + 1, needed * 3));

    const feedRows = await prisma.listFeed.findMany({
      where: { ...baseFeedWhere, ...buildAfterWhere(scanCursor) },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take,
      select: {
        id: true,
        kind: true,
        refId: true,
        createdAt: true,
        userId: true,
      },
    });

    if (feedRows.length === 0) break;

    const lastRow = feedRows[feedRows.length - 1];
    scanCursor = { createdAt: lastRow.createdAt.toISOString(), id: lastRow.id };

    const playlistIds = [...new Set(feedRows.filter((row) => row.kind === 'PLAYLIST').map((row) => row.refId))];
    const albumListIds = [...new Set(feedRows.filter((row) => row.kind === 'ALBUM_LIST').map((row) => row.refId))];

    const [playlists, albumLists] = await Promise.all([
      playlistIds.length
        ? prisma.playlist.findMany({
          where: {
            id: { in: playlistIds },
            deletedAt: null,
            ...visibilityPlaylist,
          },
          select: {
            id: true,
          },
        })
        : [],
      albumListIds.length
        ? prisma.albumList.findMany({
          where: {
            id: { in: albumListIds },
            deletedAt: null,
            ...visibilityAlbumList,
          },
          select: {
            id: true,
          },
        })
        : [],
    ]);

    const playlistIdSet = new Set(playlists.map((playlist) => playlist.id));
    const albumListIdSet = new Set(albumLists.map((albumList) => albumList.id));

    for (const row of feedRows) {
      if (row.kind === 'PLAYLIST' && playlistIdSet.has(row.refId)) {
        collectedRefs.push({
          kind: 'PLAYLIST',
          refId: row.refId,
          _cursor: { createdAt: row.createdAt.toISOString(), id: row.id },
        });
      }

      if (row.kind === 'ALBUM_LIST' && albumListIdSet.has(row.refId)) {
        collectedRefs.push({
          kind: 'ALBUM_LIST',
          refId: row.refId,
          _cursor: { createdAt: row.createdAt.toISOString(), id: row.id },
        });
      }

      if (collectedRefs.length >= options.limit + 1) {
        break;
      }
    }

    if (feedRows.length < take) break;
  }

  const hasNext = collectedRefs.length > options.limit;
  const pageRefs = hasNext ? collectedRefs.slice(0, options.limit) : collectedRefs;
  const pagePlaylistIds = [...new Set(pageRefs.filter((item) => item.kind === 'PLAYLIST').map((item) => item.refId))];
  const pageAlbumListIds = [...new Set(pageRefs.filter((item) => item.kind === 'ALBUM_LIST').map((item) => item.refId))];

  const [playlists, albumLists] = await Promise.all([
    pagePlaylistIds.length
      ? prisma.playlist.findMany({
        where: {
          id: { in: pagePlaylistIds },
          deletedAt: null,
          ...visibilityPlaylist,
        },
        select: {
          id: true,
          title: true,
          story: true,
          visibility: true,
          authorId: true,
          createdAt: true,
          author: { select: { nickname: true } },
          _count: { select: { likes: true, comments: true } },
          tags: { select: { tag: { select: { name: true } } } },
          tracks: {
            orderBy: { order: 'asc' },
            take: 3,
            select: { track: { select: { albumCover: true } } },
          },
        },
      })
      : [],
    pageAlbumListIds.length
      ? prisma.albumList.findMany({
        where: {
          id: { in: pageAlbumListIds },
          deletedAt: null,
          ...visibilityAlbumList,
        },
        select: {
          id: true,
          title: true,
          story: true,
          visibility: true,
          authorId: true,
          createdAt: true,
          author: { select: { nickname: true } },
          _count: { select: { likes: true, comments: true } },
          tags: { select: { tag: { select: { name: true } } } },
          albums: {
            orderBy: { order: 'asc' },
            take: 3,
            select: { album: { select: { coverImage: true } } },
          },
        },
      })
      : [],
  ]);

  const playlistMap = new Map(playlists.map((playlist) => [playlist.id, playlist]));
  const albumListMap = new Map(albumLists.map((albumList) => [albumList.id, albumList]));
  const rendered: Array<{ item: ResponseItem; cursor: FeedCursor }> = [];

  for (const ref of pageRefs) {
    if (ref.kind === 'PLAYLIST') {
      const playlist = playlistMap.get(ref.refId);
      if (!playlist) continue;

      rendered.push({
        item: {
          kind: 'PLAYLIST',
          id: playlist.id,
          title: playlist.title,
          story: playlist.story,
          visibility: playlist.visibility,
          authorId: playlist.authorId,
          authorNickname: playlist.author.nickname,
          createdAt: playlist.createdAt.toISOString(),
          likesCount: playlist._count.likes,
          commentsCount: playlist._count.comments,
          tags: playlist.tags.map((tagRow) => tagRow.tag.name),
          previewImages: playlist.tracks
            .map((entry) => entry.track.albumCover)
            .filter((image): image is string => Boolean(image)),
        },
        cursor: ref._cursor,
      });
      continue;
    }

    const albumList = albumListMap.get(ref.refId);
    if (!albumList) continue;

    rendered.push({
      item: {
        kind: 'ALBUM_LIST',
        id: albumList.id,
        title: albumList.title,
        story: albumList.story,
        visibility: albumList.visibility,
        authorId: albumList.authorId,
        authorNickname: albumList.author.nickname,
        createdAt: albumList.createdAt.toISOString(),
        likesCount: albumList._count.likes,
        commentsCount: albumList._count.comments,
        tags: albumList.tags.map((tagRow) => tagRow.tag.name),
        previewImages: albumList.albums
          .map((entry) => entry.album.coverImage)
          .filter((image): image is string => Boolean(image)),
      },
      cursor: ref._cursor,
    });
  }

  const nextCursor = hasNext && rendered.length > 0 ? encodeCursor(rendered[rendered.length - 1].cursor) : null;

  return {
    items: rendered.map((row) => row.item),
    nextCursor,
  };
}

export type PlaylistDetail = {
  kind: 'PLAYLIST';
  id: string;
  title: string;
  story: string;
  visibility: 'PUBLIC' | 'PRIVATE';
  viewCount: number;
  author: {
    id: string;
    nickname: string | null;
    nicknameSlug: string | null;
    avatarUrl: string | null;
  };
  createdAt: string;
  updatedAt: string;
  tags: string[];
  likesCount: number;
  commentsCount: number;
  bookmarksCount: number;
  viewerHasLiked: boolean;
  viewerHasBookmarked: boolean;
  comments: Array<{
    id: string;
    content: string;
    createdAt: string;
    updatedAt: string;
    user: {
      id: string;
      nickname: string | null;
      avatarUrl: string | null;
      role: 'USER' | 'ADMIN';
    };
  }>;
  musicItems: Array<{
    id: string;
    order: number;
    title: string;
    artist: string;
    albumImageUrl: string;
  }>;
};

export type AlbumListDetail = {
  kind: 'ALBUM_LIST';
  id: string;
  title: string;
  story: string;
  visibility: 'PUBLIC' | 'PRIVATE';
  viewCount: number;
  author: {
    id: string;
    nickname: string | null;
    nicknameSlug: string | null;
    avatarUrl: string | null;
  };
  createdAt: string;
  updatedAt: string;
  tags: string[];
  likesCount: number;
  commentsCount: number;
  bookmarksCount: number;
  viewerHasLiked: boolean;
  viewerHasBookmarked: boolean;
  comments: Array<{
    id: string;
    content: string;
    createdAt: string;
    updatedAt: string;
    user: {
      id: string;
      nickname: string | null;
      avatarUrl: string | null;
      role: 'USER' | 'ADMIN';
    };
  }>;
  musicItems: Array<{
    id: string;
    order: number;
    title: string;
    artist: string;
    albumImageUrl: string;
  }>;
};

export async function fetchPlaylistDetail(id: string, viewerUserId?: string): Promise<PlaylistDetail | null> {
  const playlist = await prisma.playlist.findFirst({
    where: {
      id,
      deletedAt: null,
      ...(viewerUserId
        ? {
          OR: [{ visibility: 'PUBLIC' }, { authorId: viewerUserId }],
        }
        : { visibility: 'PUBLIC' }),
    },
    select: {
      id: true,
      title: true,
      story: true,
      visibility: true,
      viewCount: true,
      authorId: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: {
          likes: true,
        },
      },
      likes: viewerUserId
        ? {
          where: { userId: viewerUserId },
          select: { userId: true },
          take: 1,
        }
        : false,
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
      tags: {
        select: {
          tag: {
            select: {
              name: true,
            },
          },
        },
      },
      tracks: {
        orderBy: { order: 'asc' },
        select: {
          order: true,
          track: {
            select: {
              spotifyId: true,
              title: true,
              artist: true,
              albumCover: true,
            },
          },
        },
      },
    },
  });

  if (!playlist) return null;

  const author = await prisma.user.findUnique({
    where: { id: playlist.authorId },
    select: {
      id: true,
      nickname: true,
      nicknameSlug: true,
      avatarUrl: true,
    },
  });

  return {
    kind: 'PLAYLIST',
    id: playlist.id,
    title: playlist.title,
    story: playlist.story,
    visibility: playlist.visibility,
    viewCount: playlist.viewCount,
    author: {
      id: author?.id ?? playlist.authorId,
      nickname: author?.nickname ?? null,
      nicknameSlug: author?.nicknameSlug ?? null,
      avatarUrl: author?.avatarUrl ?? null,
    },
    createdAt: playlist.createdAt.toISOString(),
    updatedAt: playlist.updatedAt.toISOString(),
    tags: playlist.tags.map((tagRow) => tagRow.tag.name),
    likesCount: playlist._count.likes,
    commentsCount: playlist.comments.length,
    bookmarksCount: 0,
    viewerHasLiked: viewerUserId ? (playlist.likes?.length ?? 0) > 0 : false,
    viewerHasBookmarked: false,
    comments: playlist.comments.map((comment) => ({
      id: comment.id,
      content: comment.content,
      createdAt: comment.createdAt.toISOString(),
      updatedAt: comment.updatedAt.toISOString(),
      user: {
        id: comment.user.id,
        nickname: comment.user.nickname,
        avatarUrl: comment.user.avatarUrl,
        role: comment.user.role,
      },
    })),
    musicItems: playlist.tracks.map((entry) => ({
      id: entry.track.spotifyId,
      order: entry.order,
      title: entry.track.title,
      artist: entry.track.artist,
      albumImageUrl: entry.track.albumCover,
    })),
  };
}

export async function fetchAlbumListDetail(id: string, viewerUserId?: string): Promise<AlbumListDetail | null> {
  const albumList = await prisma.albumList.findFirst({
    where: {
      id,
      deletedAt: null,
      ...(viewerUserId
        ? {
          OR: [{ visibility: 'PUBLIC' }, { authorId: viewerUserId }],
        }
        : { visibility: 'PUBLIC' }),
    },
    select: {
      id: true,
      title: true,
      story: true,
      visibility: true,
      viewCount: true,
      authorId: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: {
          likes: true,
        },
      },
      likes: viewerUserId
        ? {
          where: { userId: viewerUserId },
          select: { userId: true },
          take: 1,
        }
        : false,
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
      tags: {
        select: {
          tag: {
            select: {
              name: true,
            },
          },
        },
      },
      albums: {
        orderBy: { order: 'asc' },
        select: {
          order: true,
          album: {
            select: {
              spotifyId: true,
              title: true,
              artist: true,
              coverImage: true,
            },
          },
        },
      },
    },
  });

  if (!albumList) return null;

  const [author, bookmarksCount, viewerHasBookmarked] = await Promise.all([
    prisma.user.findUnique({
      where: { id: albumList.authorId },
      select: {
        id: true,
        nickname: true,
        nicknameSlug: true,
        avatarUrl: true,
      },
    }),
    prisma.$queryRawUnsafe<Array<{ count: bigint }>>(
      'SELECT COUNT(*)::bigint AS "count" FROM "AlbumListBookmark" WHERE "albumListId" = $1',
      albumList.id
    ),
    viewerUserId
      ? prisma.$queryRawUnsafe<Array<{ count: bigint }>>(
        'SELECT COUNT(*)::bigint AS "count" FROM "AlbumListBookmark" WHERE "albumListId" = $1 AND "userId" = $2',
        albumList.id,
        viewerUserId
      )
      : Promise.resolve([{ count: BigInt(0) }]),
  ]);

  return {
    kind: 'ALBUM_LIST',
    id: albumList.id,
    title: albumList.title,
    story: albumList.story,
    visibility: albumList.visibility,
    viewCount: albumList.viewCount,
    author: {
      id: author?.id ?? albumList.authorId,
      nickname: author?.nickname ?? null,
      nicknameSlug: author?.nicknameSlug ?? null,
      avatarUrl: author?.avatarUrl ?? null,
    },
    createdAt: albumList.createdAt.toISOString(),
    updatedAt: albumList.updatedAt.toISOString(),
    tags: albumList.tags.map((tagRow) => tagRow.tag.name),
    likesCount: albumList._count.likes,
    commentsCount: albumList.comments.length,
    bookmarksCount: Number(bookmarksCount[0]?.count ?? 0),
    viewerHasLiked: viewerUserId ? (albumList.likes?.length ?? 0) > 0 : false,
    viewerHasBookmarked: Number(viewerHasBookmarked[0]?.count ?? 0) > 0,
    comments: albumList.comments.map((comment) => ({
      id: comment.id,
      content: comment.content,
      createdAt: comment.createdAt.toISOString(),
      updatedAt: comment.updatedAt.toISOString(),
      user: {
        id: comment.user.id,
        nickname: comment.user.nickname,
        avatarUrl: comment.user.avatarUrl,
        role: comment.user.role,
      },
    })),
    musicItems: albumList.albums.map((entry) => ({
      id: entry.album.spotifyId,
      order: entry.order,
      title: entry.album.title,
      artist: entry.album.artist,
      albumImageUrl: entry.album.coverImage,
    })),
  };
}

////////////////////////////////////////
// 조회수 카운터
// 본인 조회수는 카운트하지 않음
// 24시간에 1번 적용
// 비로그인 유저면 deviceId로 조회수 카운트
type RegisterListViewOptions = {
  kind: 'playlist' | 'albumlist';
  id: string;
  authorId: string;
  viewerUserId?: string;
  deviceId?: string;
};

// 조회수 쿨다운(24시간)
const VIEW_COUNT_COOLDOWN_MS = 24 * 60 * 60 * 1000;

export async function registerListView({
  kind,
  id,
  authorId,
  viewerUserId,
  deviceId,
}: RegisterListViewOptions): Promise<void> {
  // 카운트 안하는 상황
  // 본인 조회수는 카운트 안함
  if (viewerUserId && viewerUserId === authorId) return;
  // 로그인을 하지 않았고 deviceId도 없으면 카운트 안함
  if (!viewerUserId && !deviceId) return;

  // 현재 시간에서 24시간 전
  // 저장된 최근 조회 시간보다 threshold가 최신이면 조회수 증가
  const threshold = new Date(Date.now() - VIEW_COUNT_COOLDOWN_MS);

  // 플레이리스트 경우
  if (kind === 'playlist') {
    // 로그인 유저인 경우
    if (viewerUserId) {
      await prisma.$transaction(async (tx) => {
        // 해당 유저가 이미 조회를 한 적이 있는지 확인
        const existing = await tx.playlistViewEvent.findUnique({
          where: { playlistId_userId: { playlistId: id, userId: viewerUserId } },
          select: { lastCountedAt: true },
        });

        // 조회를 한 적이 없으면 조회수 증가
        if (!existing) {
          await tx.playlistViewEvent.create({
            data: { playlistId: id, userId: viewerUserId, lastCountedAt: new Date() },
          });
          await tx.playlist.update({ where: { id }, data: { viewCount: { increment: 1 } } });
          return;
        }

        // 조회를 한 적이 있고 최근 조회 시간이 threshold 이전이면 조회수 증가
        if (existing.lastCountedAt <= threshold) {
          await tx.playlistViewEvent.update({
            where: { playlistId_userId: { playlistId: id, userId: viewerUserId } },
            data: { lastCountedAt: new Date() },
          });
          await tx.playlist.update({ where: { id }, data: { viewCount: { increment: 1 } } });
        }
      });
      return;
    }

    if (!deviceId) return;

    await prisma.$transaction(async (tx) => {
      const existing = await tx.playlistViewEvent.findUnique({
        where: { playlistId_deviceId: { playlistId: id, deviceId } },
        select: { lastCountedAt: true },
      });

      if (!existing) {
        await tx.playlistViewEvent.create({
          data: { playlistId: id, deviceId, lastCountedAt: new Date() },
        });
        await tx.playlist.update({ where: { id }, data: { viewCount: { increment: 1 } } });
        return;
      }

      if (existing.lastCountedAt <= threshold) {
        await tx.playlistViewEvent.update({
          where: { playlistId_deviceId: { playlistId: id, deviceId } },
          data: { lastCountedAt: new Date() },
        });
        await tx.playlist.update({ where: { id }, data: { viewCount: { increment: 1 } } });
      }
    });
    return;
  }

  // 앨범리스트 경우
  if (viewerUserId) {
    await prisma.$transaction(async (tx) => {
      const existing = await tx.albumListViewEvent.findUnique({
        where: { albumListId_userId: { albumListId: id, userId: viewerUserId } },
        select: { lastCountedAt: true },
      });

      if (!existing) {
        await tx.albumListViewEvent.create({
          data: { albumListId: id, userId: viewerUserId, lastCountedAt: new Date() },
        });
        await tx.albumList.update({ where: { id }, data: { viewCount: { increment: 1 } } });
        return;
      }

      if (existing.lastCountedAt <= threshold) {
        await tx.albumListViewEvent.update({
          where: { albumListId_userId: { albumListId: id, userId: viewerUserId } },
          data: { lastCountedAt: new Date() },
        });
        await tx.albumList.update({ where: { id }, data: { viewCount: { increment: 1 } } });
      }
    });
    return;
  }

  if (!deviceId) return;

  await prisma.$transaction(async (tx) => {
    const existing = await tx.albumListViewEvent.findUnique({
      where: { albumListId_deviceId: { albumListId: id, deviceId } },
      select: { lastCountedAt: true },
    });

    if (!existing) {
      await tx.albumListViewEvent.create({
        data: { albumListId: id, deviceId, lastCountedAt: new Date() },
      });
      await tx.albumList.update({ where: { id }, data: { viewCount: { increment: 1 } } });
      return;
    }

    if (existing.lastCountedAt <= threshold) {
      await tx.albumListViewEvent.update({
        where: { albumListId_deviceId: { albumListId: id, deviceId } },
        data: { lastCountedAt: new Date() },
      });
      await tx.albumList.update({ where: { id }, data: { viewCount: { increment: 1 } } });
    }
  });
}
