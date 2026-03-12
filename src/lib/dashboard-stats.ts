import prisma from '@/lib/prisma';

type DateRange = {
  start: Date;
  end: Date;
};

type WeeklyComparison = {
  current: number;
  previous: number;
  diff: number;
  diffRate: number | null;
};

type PopularPlaylist = {
  id: string;
  title: string;
  likesCount: number;
  viewCount: number;
};

type NamedCount = {
  name: string;
  count: number;
};

export interface UserSummaryStats {
  createdCount: number;
  publicCount: number;
  totalReceivedLikes: number;
  totalViewCount: number;
  publicRatio: number;
  viewLikedRatio: number;
}

export interface UserDashboardStats {
  summary: UserSummaryStats;
  weekly: {
    views: WeeklyComparison;
    likes: WeeklyComparison;
    createdPlaylists: WeeklyComparison;
  };
  popular: {
    mostLikedPlaylist: PopularPlaylist | null;
    mostViewedPlaylist: PopularPlaylist | null;
  };
  shared: {
    tracksCount: number;
    albumsCount: number;
  };
  topAppearing: {
    artist: NamedCount | null;
    track: NamedCount | null;
    album: NamedCount | null;
  };
}

export async function getUserSummaryStats(userId: string): Promise<UserSummaryStats> {
  const [
    playlistTotalCount,
    albumListTotalCount,
    publicPlaylistCount,
    publicAlbumListCount,
    receivedPlaylistLikeCount,
    receivedAlbumListLikeCount,
    playlistViewCount,
    albumListViewCount,
  ] = await Promise.all([
    prisma.playlist.count({
      where: { authorId: userId, deletedAt: null },
    }),
    prisma.albumList.count({
      where: { authorId: userId, deletedAt: null },
    }),
    prisma.playlist.count({
      where: { authorId: userId, deletedAt: null, visibility: 'PUBLIC' },
    }),
    prisma.albumList.count({
      where: { authorId: userId, deletedAt: null, visibility: 'PUBLIC' },
    }),
    prisma.playlistLike.count({
      where: { playlist: { authorId: userId, deletedAt: null } },
    }),
    prisma.albumListLike.count({
      where: { albumList: { authorId: userId, deletedAt: null } },
    }),
    prisma.playlistViewEvent.count({
      where: { playlist: { authorId: userId, deletedAt: null } },
    }),
    prisma.albumListViewEvent.count({
      where: { albumList: { authorId: userId, deletedAt: null } },
    }),
  ]);

  const createdCount = playlistTotalCount + albumListTotalCount;
  const publicCount = publicPlaylistCount + publicAlbumListCount;
  const totalReceivedLikes = receivedPlaylistLikeCount + receivedAlbumListLikeCount;
  const totalViewCount = playlistViewCount + albumListViewCount;

  const publicRatio = createdCount > 0 ? (publicCount / createdCount) * 100 : 0;
  const viewLikedRatio = totalViewCount > 0 ? (totalReceivedLikes / totalViewCount) * 100 : 0;

  return {
    createdCount,
    publicCount,
    totalReceivedLikes,
    totalViewCount,
    publicRatio,
    viewLikedRatio,
  };
}

function startOfWeek(date: Date) {
  const value = new Date(date);
  const weekday = (value.getDay() + 6) % 7;
  value.setHours(0, 0, 0, 0);
  value.setDate(value.getDate() - weekday);
  return value;
}

function addDays(date: Date, days: number) {
  const value = new Date(date);
  value.setDate(value.getDate() + days);
  return value;
}

function toWeeklyComparison(current: number, previous: number): WeeklyComparison {
  const diff = current - previous;
  const diffRate = previous > 0 ? (diff / previous) * 100 : current > 0 ? 100 : 0;

  return {
    current,
    previous,
    diff,
    diffRate,
  };
}

function getTopFromMap(counter: Map<string, number>): NamedCount | null {
  let top: NamedCount | null = null;

  counter.forEach((count, name) => {
    if (!top || count > top.count) {
      top = { name, count };
    }
  });

  return top;
}

async function getRangeCounts(userId: string, range: DateRange) {
  const [playlistViews, albumListViews, playlistLikes, albumListLikes, playlistCreated] = await Promise.all([
    prisma.playlistViewEvent.count({
      where: {
        playlist: { authorId: userId, deletedAt: null },
        lastCountedAt: { gte: range.start, lt: range.end },
      },
    }),
    prisma.albumListViewEvent.count({
      where: {
        albumList: { authorId: userId, deletedAt: null },
        lastCountedAt: { gte: range.start, lt: range.end },
      },
    }),
    prisma.playlistLike.count({
      where: {
        playlist: { authorId: userId, deletedAt: null },
        createdAt: { gte: range.start, lt: range.end },
      },
    }),
    prisma.albumListLike.count({
      where: {
        albumList: { authorId: userId, deletedAt: null },
        createdAt: { gte: range.start, lt: range.end },
      },
    }),
    prisma.playlist.count({
      where: {
        authorId: userId,
        deletedAt: null,
        createdAt: { gte: range.start, lt: range.end },
      },
    }),
  ]);

  return {
    views: playlistViews + albumListViews,
    likes: playlistLikes + albumListLikes,
    createdPlaylists: playlistCreated,
  };
}

export async function getUserDashboardStats(userId: string): Promise<UserDashboardStats> {
  const now = new Date();
  const currentWeekStart = startOfWeek(now);
  const previousWeekStart = addDays(currentWeekStart, -7);

  const currentRange: DateRange = { start: currentWeekStart, end: now };
  const previousRange: DateRange = { start: previousWeekStart, end: currentWeekStart };

  const [
    currentCounts,
    previousCounts,
    playlists,
    tracksCount,
    albumsCount,
    trackRows,
    albumRows,
    summary,
  ] = await Promise.all([
      getRangeCounts(userId, currentRange),
      getRangeCounts(userId, previousRange),
      prisma.playlist.findMany({
        where: { authorId: userId, deletedAt: null },
        select: {
          id: true,
          title: true,
          viewCount: true,
          _count: {
            select: { likes: true },
          },
        },
      }),
      prisma.playlistTrack.count({
        where: {
          playlist: {
            authorId: userId,
            deletedAt: null,
            visibility: 'PUBLIC',
          },
        },
      }),
      prisma.albumEntry.count({
        where: {
          albumList: {
            authorId: userId,
            deletedAt: null,
            visibility: 'PUBLIC',
          },
        },
      }),
      prisma.playlistTrack.findMany({
        where: {
          playlist: { authorId: userId, deletedAt: null },
        },
        select: {
          track: {
            select: {
              title: true,
              artist: true,
            },
          },
        },
      }),
      prisma.albumEntry.findMany({
        where: {
          albumList: { authorId: userId, deletedAt: null },
        },
        select: {
          album: {
            select: {
              title: true,
              artist: true,
            },
          },
        },
      }),
      getUserSummaryStats(userId),
    ]);

  let mostLikedPlaylist: PopularPlaylist | null = null;
  let mostViewedPlaylist: PopularPlaylist | null = null;

  for (const playlist of playlists) {
    const data: PopularPlaylist = {
      id: playlist.id,
      title: playlist.title,
      likesCount: playlist._count.likes,
      viewCount: playlist.viewCount,
    };

    if (!mostLikedPlaylist || data.likesCount > mostLikedPlaylist.likesCount) {
      mostLikedPlaylist = data;
    }

    if (!mostViewedPlaylist || data.viewCount > mostViewedPlaylist.viewCount) {
      mostViewedPlaylist = data;
    }
  }

  const artistCounter = new Map<string, number>();
  const trackCounter = new Map<string, number>();
  const albumCounter = new Map<string, number>();

  for (const row of trackRows) {
    const artist = row.track.artist.trim();
    const title = row.track.title.trim();
    artistCounter.set(artist, (artistCounter.get(artist) ?? 0) + 1);
    trackCounter.set(title, (trackCounter.get(title) ?? 0) + 1);
  }

  for (const row of albumRows) {
    const artist = row.album.artist.trim();
    const title = row.album.title.trim();
    artistCounter.set(artist, (artistCounter.get(artist) ?? 0) + 1);
    albumCounter.set(title, (albumCounter.get(title) ?? 0) + 1);
  }

  return {
    summary,
    weekly: {
      views: toWeeklyComparison(currentCounts.views, previousCounts.views),
      likes: toWeeklyComparison(currentCounts.likes, previousCounts.likes),
      createdPlaylists: toWeeklyComparison(currentCounts.createdPlaylists, previousCounts.createdPlaylists),
    },
    popular: {
      mostLikedPlaylist,
      mostViewedPlaylist,
    },
    shared: {
      tracksCount,
      albumsCount,
    },
    topAppearing: {
      artist: getTopFromMap(artistCounter),
      track: getTopFromMap(trackCounter),
      album: getTopFromMap(albumCounter),
    },
  };
}
