import Link from 'next/link';
import { Suspense } from "react";
import { redirect } from 'next/navigation';
import ProfileInfo from '@/components/ui/organisms/ProfileInfo';
import MusicListBrowser from '@/components/ui/organisms/MusicListBrowser';
import MusicListGrid from '@/components/ui/organisms/MusicListGrid';
import MusicListGridSkeleton from '@/components/layout/MusicListGridSkeleton';
import AccountDeletionButton from '@/components/ui/organisms/AccountDeletionButton';
import prisma from '@/lib/prisma';
import { getUserSummaryStats } from '@/lib/dashboard-stats';
import { createSupabaseServerClient } from '@/utils/supabase/server';
import type { MusicListItem } from '@/types';
import { ArrowUpRight } from 'lucide-react'

interface TabProps {
  searchParams: Promise<{ tab?: string }>;
}

export default async function MyPage({ searchParams }: TabProps) {
  const { tab } = await searchParams;
  const activeTab = tab === 'liked' || tab === 'bookmarked' ? tab : 'created';

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login?next=/mypage');
  }

  const me = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      nickname: true,
      avatarUrl: true,
      _count: {
        select: {
          followers: true,
          following: true,
        },
      },
    },
  });

  const metadataName = user.user_metadata?.full_name || user.user_metadata?.name;
  const initialNickname = me?.nickname || metadataName || '익명';
  const summaryStats = await getUserSummaryStats(user.id);
  const createdCount = summaryStats.createdCount;

  const createdTabHref = '/mypage?tab=created';
  const likedTabHref = '/mypage?tab=liked';
  const bookmarkedTabHref = '/mypage?tab=bookmarked';

  return (
    <section className="mx-auto w-full max-w-7xl">
      <ProfileInfo
        profileUserId={user.id}
        initialNickname={initialNickname}
        isOwner
        viewerUserId={user.id}
        initialFollowerCount={me?._count.followers ?? 0}
        initialFollowingCount={me?._count.following ?? 0}
        initialIsFollowing={false}
      />
      <div className='flex flex-col gap-4 mt-4 sm:flex-row md:justify-between'>
        <Link
          href="/mypage/dashboard"
          className="group inline-flex justify-center w-full items-center gap-1 rounded-lg border border-neon-green/35 bg-[#0b1020] px-3.5 py-2.5 text-sm font-semibold text-neon-green shadow-[0_10px_24px_rgba(0,0,0,0.35)] transition-all duration-300 hover:-translate-y-0.5 hover:border-neon-green/60 hover:bg-[#11192e] md:w-fit"
        >
          <span>대시보드</span>
          <ArrowUpRight className='h-4 w-4' />
        </Link>
        <AccountDeletionButton />
      </div>
      <section className="mt-8 sm:mt-10">
        <div className="mb-5 border-b border-slate-800 pb-3 sm:mb-6 sm:pb-2">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <nav className="-mx-1 flex items-center gap-4 overflow-x-auto px-1 pb-1 sm:mx-0 sm:gap-6 sm:overflow-visible sm:px-0 sm:pb-0">
            <Link
              href={createdTabHref}
              scroll={false}
              className={`shrink-0 whitespace-nowrap pb-2 text-sm transition-colors sm:text-base ${
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
              className={`shrink-0 whitespace-nowrap pb-2 text-sm transition-colors sm:text-base ${
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
              className={`shrink-0 whitespace-nowrap pb-2 text-sm transition-colors sm:text-base ${
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
              className="hidden text-center rounded-md bg-neon-green px-3 py-2 text-sm font-semibold text-black transition-opacity hover:opacity-90 sm:w-auto sm:inline-block"
            >
              새 플리 만들기
            </Link>
          </div>
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
          <Suspense fallback={<MusicListGridSkeleton count={4} />}>
            <LikedListsSection userId={user.id} />
          </Suspense>
        ) : null}

        {activeTab === 'bookmarked' ? (
          <Suspense fallback={<MusicListGridSkeleton count={4} />}>
            <BookmarkedListsSection userId={user.id} />
          </Suspense>
        ) : null}
      </section>
    </section>
  );
}

async function LikedListsSection({ userId }: { userId: string }) {
  const likedItems = await fetchLikedItems(userId);

  if (likedItems.length === 0) {
    return (
      <EmptyState
        title="좋아요한 플리가 아직 없어요"
        description="둘러보다가 마음에 드는 플리에 좋아요를 눌러보세요."
        ctaHref="/"
        ctaLabel="플리 둘러보기"
      />
    );
  }

  return <MusicListGrid items={likedItems} />;
}

async function BookmarkedListsSection({ userId }: { userId: string }) {
  const bookmarkedItems = await fetchBookmarkedItems(userId);

  if (bookmarkedItems.length === 0) {
    return (
      <EmptyState
        title="북마크한 플리가 아직 없어요"
        description="나중에 다시 보고 싶은 플리를 북마크해보세요."
        ctaHref="/"
        ctaLabel="플리 둘러보기"
      />
    );
  }

  return <MusicListGrid items={bookmarkedItems} />;
}

async function fetchLikedItems(userId: string): Promise<MusicListItem[]> {
  const [likedPlaylistRows, likedAlbumListRows] = await Promise.all([
    prisma.playlistLike.findMany({
      where: {
        userId,
        playlist: {
          deletedAt: null,
          OR: [{ visibility: 'PUBLIC' }, { authorId: userId }],
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
        userId,
        albumList: {
          deletedAt: null,
          OR: [{ visibility: 'PUBLIC' }, { authorId: userId }],
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

  return [...likedPlaylists, ...likedAlbumLists]
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
}

async function fetchBookmarkedItems(userId: string): Promise<MusicListItem[]> {
  const [bookmarkedPlaylistRows, bookmarkedAlbumListRows] = await Promise.all([
    prisma.playlistBookmark.findMany({
      where: {
        userId,
        playlist: {
          deletedAt: null,
          OR: [{ visibility: 'PUBLIC' }, { authorId: userId }],
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
        userId,
        albumList: {
          deletedAt: null,
          OR: [{ visibility: 'PUBLIC' }, { authorId: userId }],
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

  return [...bookmarkedPlaylists, ...bookmarkedAlbumLists]
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
}

function EmptyState({title, description, ctaHref, ctaLabel,}: { title: string; description: string; ctaHref: string; ctaLabel: string;}) {
  return (
    <div className="rounded-xl border border-dashed border-slate-700 bg-slate-900/30 px-4 py-10 text-center sm:px-6 sm:py-14">
      <h3 className="text-base font-semibold text-white sm:text-lg">{title}</h3>
      <p className="mt-2 text-sm text-gray-400">{description}</p>
      <Link
        href={ctaHref}
        className="mt-5 inline-flex w-full items-center justify-center rounded-md border border-neon-green/60 px-4 py-2 text-sm font-medium text-neon-green transition-colors hover:bg-neon-green/10 sm:w-auto"
      >
        {ctaLabel}
      </Link>
    </div>
  );
}
