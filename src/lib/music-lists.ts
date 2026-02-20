import prisma from '@/lib/prisma';

export type ListType = 'all' | 'playlist' | 'albumlist';
export type VisibilityScope = 'all' | 'public' | 'private';
type FeedKind = 'PLAYLIST' | 'ALBUM_LIST';

type FeedCursor = {
  createdAt: string;
  id: string;
};

type QueryOptions = {
  type: ListType;
  limit: number;
  cursor: FeedCursor | null;
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
  createdAt: string;
};

type ResponsePayload = {
  items: ResponseItem[];
  nextCursor: string | null;
};

type CollectedItem = ResponseItem & {
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

export function parseVisibilityScope(raw: string | null): VisibilityScope {
  if (!raw) return 'all';
  if (raw === 'all' || raw === 'public' || raw === 'private') return raw;
  throw new Error('visibility must be one of all, public, private');
}

export async function fetchListItems(options: QueryOptions): Promise<ResponsePayload> {
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

  const collected: CollectedItem[] = [];
  let scanCursor = options.cursor;

  for (let i = 0; i < 6 && collected.length < options.limit + 1; i += 1) {
    const needed = options.limit + 1 - collected.length;
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

    const playlistIds = feedRows.filter((row) => row.kind === 'PLAYLIST').map((row) => row.refId);
    const albumListIds = feedRows.filter((row) => row.kind === 'ALBUM_LIST').map((row) => row.refId);

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
              title: true,
              story: true,
              visibility: true,
              authorId: true,
              createdAt: true,
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
              title: true,
              story: true,
              visibility: true,
              authorId: true,
              createdAt: true,
            },
          })
        : [],
    ]);

    const playlistMap = new Map(playlists.map((playlist) => [playlist.id, playlist]));
    const albumListMap = new Map(albumLists.map((albumList) => [albumList.id, albumList]));

    for (const row of feedRows) {
      if (row.kind === 'PLAYLIST') {
        const playlist = playlistMap.get(row.refId);
        if (!playlist) continue;

        collected.push({
          kind: 'PLAYLIST',
          id: playlist.id,
          title: playlist.title,
          story: playlist.story,
          visibility: playlist.visibility,
          authorId: playlist.authorId,
          createdAt: playlist.createdAt.toISOString(),
          _cursor: { createdAt: row.createdAt.toISOString(), id: row.id },
        });
        continue;
      }

      const albumList = albumListMap.get(row.refId);
      if (!albumList) continue;

      collected.push({
        kind: 'ALBUM_LIST',
        id: albumList.id,
        title: albumList.title,
        story: albumList.story,
        visibility: albumList.visibility,
        authorId: albumList.authorId,
        createdAt: albumList.createdAt.toISOString(),
        _cursor: { createdAt: row.createdAt.toISOString(), id: row.id },
      });
    }

    if (feedRows.length < take) break;
  }

  const hasNext = collected.length > options.limit;
  const page = hasNext ? collected.slice(0, options.limit) : collected;

  const nextCursor = hasNext ? encodeCursor(page[page.length - 1]._cursor) : null;

  return {
    items: page.map((item) => ({
      kind: item.kind,
      id: item.id,
      title: item.title,
      story: item.story,
      visibility: item.visibility,
      authorId: item.authorId,
      createdAt: item.createdAt,
    })),
    nextCursor,
  };
}
