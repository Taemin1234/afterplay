import Link from 'next/link';
import { redirect } from 'next/navigation';
import ProfileInfo from '@/components/ui/organisms/ProfileInfo';
import MusicListBrowser from '@/components/ui/organisms/MusicListBrowser';
import MusicListGrid from '@/components/ui/organisms/MusicListGrid';
import prisma from '@/lib/prisma';
import { createSupabaseServerClient } from '@/utils/supabase/server';
import type { MusicListItem } from '@/types';

interface TabProps {
  searchParams: Promise<{ tab?: string }>;
}

function formatPercent(value: number): string {
  if (Number.isNaN(value) || !Number.isFinite(value)) return '0%';
  return `${Math.round(value)}%`;
}

export default async function MyPage({ searchParams }: TabProps) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login?next=/mypage');
  }

  const me = await prisma.user.findUnique({
    where: { id: user.id },
    select: { id: true, nickname: true },
  });

  const googleName = user.user_metadata?.full_name || user.user_metadata?.name;
  const initialNickname = me?.nickname || googleName || '익명';

  const [
    playlistTotalCount,
    albumListTotalCount,
    publicPlaylistCount,
    publicAlbumListCount,
    receivedPlaylistLikeCount,
    receivedAlbumListLikeCount,
    likedPlaylistRows,
    likedAlbumListRows,
    bookmarkedPlaylistRows,
    bookmarkedAlbumListRows,
  ] = await Promise.all([
    prisma.playlist.count({
      where: { authorId: user.id, deletedAt: null },
    }),
    prisma.albumList.count({
      where: { authorId: user.id, deletedAt: null },
    }),
    prisma.playlist.count({
      where: { authorId: user.id, deletedAt: null, visibility: 'PUBLIC' },
    }),
    prisma.albumList.count({
      where: { authorId: user.id, deletedAt: null, visibility: 'PUBLIC' },
    }),
    prisma.playlistLike.count({
      where: { playlist: { authorId: user.id, deletedAt: null } },
    }),
    prisma.albumListLike.count({
      where: { albumList: { authorId: user.id, deletedAt: null } },
    }),
    prisma.playlistLike.findMany({
      where: {
        userId: user.id,
        playlist: {
          deletedAt: null,
          OR: [{ visibility: 'PUBLIC' }, { authorId: user.id }],
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 12,
      select: {
        createdAt: true,
        playlist: {
          select: {
            id: true,
            title: true,
            story: true,
            visibility: true,
            authorId: true,
            createdAt: true,
            _count: {
              select: {
                likes: true,
                comments: true,
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
              take: 3,
              select: {
                track: {
                  select: {
                    albumCover: true,
                  },
                },
              },
            },
            author: {
              select: {
                nickname: true,
              },
            },
          },
        },
      },
    }),
    prisma.albumListLike.findMany({
      where: {
        userId: user.id,
        albumList: {
          deletedAt: null,
          OR: [{ visibility: 'PUBLIC' }, { authorId: user.id }],
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 12,
      select: {
        createdAt: true,
        albumList: {
          select: {
            id: true,
            title: true,
            story: true,
            visibility: true,
            authorId: true,
            createdAt: true,
            _count: {
              select: {
                likes: true,
                comments: true,
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
              take: 3,
              select: {
                album: {
                  select: {
                    coverImage: true,
                  },
                },
              },
            },
            author: {
              select: {
                nickname: true,
              },
            },
          },
        },
      },
    }),
    prisma.playlistBookmark.findMany({
      where: {
        userId: user.id,
        playlist: {
          deletedAt: null,
          OR: [{ visibility: 'PUBLIC' }, { authorId: user.id }],
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 12,
      select: {
        createdAt: true,
        playlist: {
          select: {
            id: true,
            title: true,
            story: true,
            visibility: true,
            authorId: true,
            createdAt: true,
            _count: {
              select: {
                likes: true,
                comments: true,
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
              take: 3,
              select: {
                track: {
                  select: {
                    albumCover: true,
                  },
                },
              },
            },
            author: {
              select: {
                nickname: true,
              },
            },
          },
        },
      },
    }),
    prisma.albumListBookmark.findMany({
      where: {
        userId: user.id,
        albumList: {
          deletedAt: null,
          OR: [{ visibility: 'PUBLIC' }, { authorId: user.id }],
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 12,
      select: {
        createdAt: true,
        albumList: {
          select: {
            id: true,
            title: true,
            story: true,
            visibility: true,
            authorId: true,
            createdAt: true,
            _count: {
              select: {
                likes: true,
                comments: true,
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
              take: 3,
              select: {
                album: {
                  select: {
                    coverImage: true,
                  },
                },
              },
            },
            author: {
              select: {
                nickname: true,
              },
            },
          },
        },
      },
    }),
  ]);

  const createdCount = playlistTotalCount + albumListTotalCount;
  const publicCount = publicPlaylistCount + publicAlbumListCount;
  const publicRatio = createdCount > 0 ? (publicCount / createdCount) * 100 : 0;
  const totalReceivedLikes = receivedPlaylistLikeCount + receivedAlbumListLikeCount;

  const likedPlaylists = likedPlaylistRows.map(
    (row): MusicListItem & { likedAt: string } => ({
      kind: 'PLAYLIST',
      id: row.playlist.id,
      title: row.playlist.title,
      story: row.playlist.story,
      visibility: row.playlist.visibility,
      authorId: row.playlist.authorId,
      authorNickname: row.playlist.author.nickname,
      createdAt: row.playlist.createdAt.toISOString(),
      likesCount: row.playlist._count.likes,
      commentsCount: row.playlist._count.comments,
      tags: row.playlist.tags.map((tagRow) => tagRow.tag.name),
      previewImages: row.playlist.tracks
        .map((entry) => entry.track.albumCover)
        .filter((image): image is string => Boolean(image)),
      likedAt: row.createdAt.toISOString(),
    })
  );

  const likedAlbumLists = likedAlbumListRows.map(
    (row): MusicListItem & { likedAt: string } => ({
      kind: 'ALBUM_LIST',
      id: row.albumList.id,
      title: row.albumList.title,
      story: row.albumList.story,
      visibility: row.albumList.visibility,
      authorId: row.albumList.authorId,
      authorNickname: row.albumList.author.nickname,
      createdAt: row.albumList.createdAt.toISOString(),
      likesCount: row.albumList._count.likes,
      commentsCount: row.albumList._count.comments,
      tags: row.albumList.tags.map((tagRow) => tagRow.tag.name),
      previewImages: row.albumList.albums
        .map((entry) => entry.album.coverImage)
        .filter((image): image is string => Boolean(image)),
      likedAt: row.createdAt.toISOString(),
    })
  );

  const likedItems = [...likedPlaylists, ...likedAlbumLists]
    .sort((a, b) => new Date(b.likedAt).getTime() - new Date(a.likedAt).getTime())
    .slice(0, 16)
    .map((item) => ({
      kind: item.kind,
      id: item.id,
      title: item.title,
      story: item.story,
      visibility: item.visibility,
      authorId: item.authorId,
      authorNickname: item.authorNickname,
      createdAt: item.createdAt,
      likesCount: item.likesCount,
      commentsCount: item.commentsCount,
      tags: item.tags,
      previewImages: item.previewImages,
    }));

  const bookmarkedPlaylists = bookmarkedPlaylistRows.map(
    (row): MusicListItem & { bookmarkedAt: string } => ({
      kind: 'PLAYLIST',
      id: row.playlist.id,
      title: row.playlist.title,
      story: row.playlist.story,
      visibility: row.playlist.visibility,
      authorId: row.playlist.authorId,
      authorNickname: row.playlist.author.nickname,
      createdAt: row.playlist.createdAt.toISOString(),
      likesCount: row.playlist._count.likes,
      commentsCount: row.playlist._count.comments,
      tags: row.playlist.tags.map((tagRow) => tagRow.tag.name),
      previewImages: row.playlist.tracks
        .map((entry) => entry.track.albumCover)
        .filter((image): image is string => Boolean(image)),
      bookmarkedAt: row.createdAt.toISOString(),
    })
  );

  const bookmarkedAlbumLists = bookmarkedAlbumListRows.map(
    (row): MusicListItem & { bookmarkedAt: string } => ({
      kind: 'ALBUM_LIST',
      id: row.albumList.id,
      title: row.albumList.title,
      story: row.albumList.story,
      visibility: row.albumList.visibility,
      authorId: row.albumList.authorId,
      authorNickname: row.albumList.author.nickname,
      createdAt: row.albumList.createdAt.toISOString(),
      likesCount: row.albumList._count.likes,
      commentsCount: row.albumList._count.comments,
      tags: row.albumList.tags.map((tagRow) => tagRow.tag.name),
      previewImages: row.albumList.albums
        .map((entry) => entry.album.coverImage)
        .filter((image): image is string => Boolean(image)),
      bookmarkedAt: row.createdAt.toISOString(),
    })
  );

  const bookmarkedItems = [...bookmarkedPlaylists, ...bookmarkedAlbumLists]
    .sort((a, b) => new Date(b.bookmarkedAt).getTime() - new Date(a.bookmarkedAt).getTime())
    .slice(0, 16)
    .map((item) => ({
      kind: item.kind,
      id: item.id,
      title: item.title,
      story: item.story,
      visibility: item.visibility,
      authorId: item.authorId,
      authorNickname: item.authorNickname,
      createdAt: item.createdAt,
      likesCount: item.likesCount,
      commentsCount: item.commentsCount,
      tags: item.tags,
      previewImages: item.previewImages,
    }));

  const { tab } = await searchParams;
  const activeTab = tab === 'liked' || tab === 'bookmarked' ? tab : 'created';
  const createdTabHref = '/mypage?tab=created';
  const likedTabHref = '/mypage?tab=liked';
  const bookmarkedTabHref = '/mypage?tab=bookmarked';

  return (
    <section className="mx-auto max-w-7xl">
      <ProfileInfo initialNickname={initialNickname} isOwner />

      <section className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
        <SummaryCard label="내 플리" value={createdCount.toLocaleString()} hint="직접 만든 플레이리스트 + 앨범리스트" />
        <SummaryCard label="받은 좋아요" value={totalReceivedLikes.toLocaleString()} hint="내 플리에 받은 전체 좋아요" />
        <SummaryCard label="공개 비율" value={formatPercent(publicRatio)} hint={`${publicCount.toLocaleString()} / ${createdCount.toLocaleString()}`} />
      </section>

      <section className="mt-10">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-2">
          <nav className="flex items-center gap-6">
            <Link
              href={createdTabHref}
              scroll={false}
              className={`pb-2 text-base transition-colors ${
                activeTab === 'created'
                  ? 'border-b-2 border-neon-green font-semibold text-neon-green'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              내가 만든 플리
            </Link>
            <Link
              href={likedTabHref}
              scroll={false}
              className={`pb-2 text-base transition-colors ${
                activeTab === 'liked'
                  ? 'border-b-2 border-neon-green font-semibold text-neon-green'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              좋아요한 플리
            </Link>
            <Link
              href={bookmarkedTabHref}
              scroll={false}
              className={`pb-2 text-base transition-colors ${
                activeTab === 'bookmarked'
                  ? 'border-b-2 border-neon-green font-semibold text-neon-green'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              북마크한 플리
            </Link>
          </nav>
          <Link
            href="/createList"
            className="inline-flex items-center rounded-md bg-neon-green px-3 py-2 text-sm font-semibold text-black transition-opacity hover:opacity-90"
          >
            새 플리 만들기
          </Link>
        </div>

        {activeTab === 'created' ? (
          createdCount > 0 ? (
            <MusicListBrowser userId={user.id} initialType="all" limit={16} visibility="all" />
          ) : (
            <EmptyState
              title="만든 플리가 아직 없어요"
              description="여러분의 취향을 드러내는 플리를 만들어보세요."
              ctaHref="/createList"
              ctaLabel="플리 만들기"
            />
          )
        ) : null}

        {activeTab === 'liked' ? (
          likedItems.length > 0 ? (
            <MusicListGrid items={likedItems} />
          ) : (
            <EmptyState
              title="좋아요한 플리가 아직 없어요"
              description="둘러보다가 마음에 드는 플리에 좋아요를 눌러보세요."
              ctaHref="/"
              ctaLabel="플리 둘러보기"
            />
          )
        ) : null}

        {activeTab === 'bookmarked' ? (
          bookmarkedItems.length > 0 ? (
            <MusicListGrid items={bookmarkedItems} />
          ) : (
            <EmptyState
              title="북마크한 플리가 아직 없어요"
              description="나중에 다시 보고 싶은 플리를 북마크해보세요."
              ctaHref="/"
              ctaLabel="플리 둘러보기"
            />
          )
        ) : null}
      </section>
    </section>
  );
}

function SummaryCard({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <article className="rounded-xl border border-slate-800 bg-slate-900/40 p-5">
      <p className="text-sm text-gray-400">{label}</p>
      <p className="mt-2 text-2xl font-bold text-white">{value}</p>
      <p className="mt-2 text-xs text-gray-500">{hint}</p>
    </article>
  );
}

function EmptyState({
  title,
  description,
  ctaHref,
  ctaLabel,
}: {
  title: string;
  description: string;
  ctaHref: string;
  ctaLabel: string;
}) {
  return (
    <div className="rounded-xl border border-dashed border-slate-700 bg-slate-900/30 px-6 py-14 text-center">
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      <p className="mt-2 text-sm text-gray-400">{description}</p>
      <Link
        href={ctaHref}
        className="mt-5 inline-flex items-center rounded-md border border-neon-green/60 px-4 py-2 text-sm font-medium text-neon-green transition-colors hover:bg-neon-green/10"
      >
        {ctaLabel}
      </Link>
    </div>
  );
}
