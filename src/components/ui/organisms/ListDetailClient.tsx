'use client';
import { useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Bookmark, Heart, MessageCircle, Pencil, Share2, Star, Trash2, User, LockKeyhole } from 'lucide-react';
import Tag from '@/components/ui/atoms/tag';
import Button from '@/components/ui/atoms/Button';
import CommentSection from '@/components/ui/molecules/CommentSection';
import type { AlbumListDetail, FeaturedSectionOption, PlaylistDetail } from '@/lib/music-lists';

type DetailItem = PlaylistDetail | AlbumListDetail;

interface ListDetailClientProps {
  item: DetailItem;
  isLoggedIn: boolean;
  isOwner: boolean;
  isAdmin?: boolean;
  featuredSections?: FeaturedSectionOption[];
  viewerUserId?: string | null;
  isModalContext?: boolean;
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function ListDetailClient({
  item,
  isLoggedIn,
  isOwner,
  isAdmin = false,
  featuredSections = [],
  viewerUserId = null,
  isModalContext = false,
}: ListDetailClientProps) {
  const router = useRouter();
  const apiSegment = item.kind === 'PLAYLIST' ? 'playlist' : 'albumlist';
  const listLabel = item.kind === 'PLAYLIST' ? '플레이리스트' : '앨범리스트';
  const targetRef = useRef<HTMLElement | null>(null);

  const [likesCount, setLikesCount] = useState(item.likesCount);
  const [bookmarksCount, setBookmarksCount] = useState(item.bookmarksCount);
  const [commentsCount, setCommentsCount] = useState(item.commentsCount);
  const [viewerHasLiked, setViewerHasLiked] = useState(item.viewerHasLiked);
  const [viewerHasBookmarked, setViewerHasBookmarked] = useState(item.viewerHasBookmarked);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [isBookmarking, setIsBookmarking] = useState(false);
  const [featuredSectionIds, setFeaturedSectionIds] = useState(item.featuredSectionIds);
  const [selectedFeaturedSectionId, setSelectedFeaturedSectionId] = useState(featuredSections[0]?.id ?? '');
  const [isUpdatingFeatured, setIsUpdatingFeatured] = useState(false);
  const canDelete = isOwner || isAdmin;
  const selectedFeaturedSection = featuredSections.find((section) => section.id === selectedFeaturedSectionId);
  const isSelectedSectionFeatured = selectedFeaturedSectionId
    ? featuredSectionIds.includes(selectedFeaturedSectionId)
    : false;

  const loginHref = useMemo(
    () => `/auth/login?next=${encodeURIComponent(`/${apiSegment}/${item.id}`)}`,
    [apiSegment, item.id]
  );

  const requireLogin = () => {
    if (isLoggedIn) return true;
    alert('로그인이 필요한 기능입니다.');
    router.push(loginHref);
    return false;
  };

  const handleToggleLike = async () => {
    if (!requireLogin() || isLiking) return;
    const previousViewerHasLiked = viewerHasLiked;
    const previousLikesCount = likesCount;
    const nextViewerHasLiked = !previousViewerHasLiked;

    setIsLiking(true);
    setViewerHasLiked(nextViewerHasLiked);
    setLikesCount((count) => Math.max(0, count + (nextViewerHasLiked ? 1 : -1)));

    try {
      const res = await fetch(`/api/music/${apiSegment}/${item.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle-like' }),
      });

      if (!res.ok) throw new Error('failed');
      const data = await res.json();
      setLikesCount(data.likesCount);
      setViewerHasLiked(data.viewerHasLiked);
    } catch (error) {
      setViewerHasLiked(previousViewerHasLiked);
      setLikesCount(previousLikesCount);
      console.error(error);
      alert('좋아요 처리 중 오류가 발생했습니다.');
    } finally {
      setIsLiking(false);
    }
  };

  const handleToggleBookmark = async () => {
    if (!requireLogin() || isBookmarking) return;
    const previousViewerHasBookmarked = viewerHasBookmarked;
    const previousBookmarksCount = bookmarksCount;
    const nextViewerHasBookmarked = !previousViewerHasBookmarked;

    setIsBookmarking(true);
    setViewerHasBookmarked(nextViewerHasBookmarked);
    setBookmarksCount((count) => Math.max(0, count + (nextViewerHasBookmarked ? 1 : -1)));

    try {
      const res = await fetch(`/api/music/${apiSegment}/${item.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle-bookmark' }),
      });

      if (!res.ok) throw new Error('failed');
      const data = await res.json();
      setBookmarksCount(data.bookmarksCount);
      setViewerHasBookmarked(data.viewerHasBookmarked);
    } catch (error) {
      setViewerHasBookmarked(previousViewerHasBookmarked);
      setBookmarksCount(previousBookmarksCount);
      console.error(error);
      alert('북마크 처리 중 오류가 발생했습니다.');
    } finally {
      setIsBookmarking(false);
    }
  };

  const handleDelete = async () => {
    if (!canDelete || isDeleting) return;

    const confirmation = prompt(`삭제하려면 게시물 제목을 정확히 입력하세요.\n\n${item.title}`);
    if (confirmation !== item.title) {
      if (confirmation !== null) alert('제목이 일치하지 않아 삭제하지 않았습니다.');
      return;
    }

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/music/${apiSegment}/${item.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmationTitle: confirmation }),
      });
      if (!res.ok) throw new Error('failed');

      alert(`${listLabel}가 삭제되었습니다.`);
      router.push('/');
      router.refresh();
    } catch (error) {
      console.error(error);
      alert('삭제 중 오류가 발생했습니다.');
      setIsDeleting(false);
    }
  };

  const handleToggleFeatured = async () => {
    if (!isAdmin || !selectedFeaturedSectionId || isUpdatingFeatured) return;
    if (item.visibility !== 'PUBLIC') {
      alert('비공개 게시물은 특별게시물로 설정할 수 없습니다.');
      return;
    }

    const previousFeaturedSectionIds = featuredSectionIds;
    const nextEnabled = !isSelectedSectionFeatured;
    setIsUpdatingFeatured(true);
    setFeaturedSectionIds((current) =>
      nextEnabled
        ? [...new Set([...current, selectedFeaturedSectionId])]
        : current.filter((sectionId) => sectionId !== selectedFeaturedSectionId)
    );

    try {
      const res = await fetch(`/api/music/${apiSegment}/${item.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'toggle-featured',
          sectionId: selectedFeaturedSectionId,
          enabled: nextEnabled,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? 'failed');
      }

      const data = await res.json();
      setFeaturedSectionIds(data.featuredSectionIds);
    } catch (error) {
      setFeaturedSectionIds(previousFeaturedSectionIds);
      console.error(error);
      alert(error instanceof Error ? error.message : '특별게시물 설정 중 오류가 발생했습니다.');
    } finally {
      setIsUpdatingFeatured(false);
    }
  };

  const goToTarget = () => {
    targetRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleGoEdit = () => {
    const editPath = `/${apiSegment}/${item.id}/edit`;
    if (isModalContext) {
      window.location.assign(editPath);
      return;
    }
    router.push(editPath);
  };

  const handleShare = async () => {
    const url = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({ title: document.title, url });
        return;
      } catch {
        // no-op
      }
    }

    await navigator.clipboard.writeText(url);
    alert('링크가 복사되었습니다.');
  };

  const authorHref = isOwner
    ? '/mypage'
    : item.author.nicknameSlug
      ? `/profile/${encodeURIComponent(item.author.nicknameSlug)}`
      : null;

  return (
    <section className="mx-auto w-full max-w-5xl space-y-4 sm:space-y-6">
      <article className="overflow-hidden rounded-2xl border border-slate-800/70 bg-gradient-to-b from-[#131c31] to-[#070c18] px-4 py-6 shadow-[0_24px_60px_rgba(0,0,0,0.45)] sm:px-6 sm:py-8">
        <header className="space-y-4 border-b border-slate-800/70 pb-4 sm:space-y-5">
          <div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
              <div className="flex min-w-0 flex-1 items-start gap-2.5 sm:gap-3">
                {item.visibility === 'PRIVATE' ? (
                  <div className="mt-0.5 shrink-0">
                    <LockKeyhole size={22} className="sm:h-7 sm:w-7" />
                  </div>
                ) : null}
                <h1 className="min-w-0 flex-1 text-xl font-bold text-white sm:text-2xl md:text-3xl">
                  {item.title}
                </h1>
              </div>

              {canDelete && (
                <div className="flex items-center justify-end gap-2 sm:w-auto sm:shrink-0">
                  {isOwner ? (
                    <Button
                      variant="outline"
                      size="sm"
                      icon={<Pencil size={14} />}
                      onClick={handleGoEdit}
                      className="justify-center border-white/15 text-gray-200 hover:bg-white/10 sm:w-auto"
                    >
                      수정
                    </Button>
                  ) : null}

                  <Button
                    variant="danger"
                    size="sm"
                    icon={<Trash2 size={14} />}
                    onClick={handleDelete}
                    disabled={isDeleting}
                    title="삭제 버튼"
                    className="justify-center sm:w-auto"
                  >
                    삭제
                  </Button>
                </div>
              )}
            </div>

            {isAdmin ? (
              <div className="mt-4 rounded-lg border border-amber-300/20 bg-amber-300/5 p-3">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="min-w-0">
                    <p className="inline-flex items-center gap-1.5 text-sm font-semibold text-amber-200">
                      <Star size={15} />
                      특별게시물 설정
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      {item.visibility === 'PRIVATE'
                        ? '비공개 게시물은 특별게시물로 설정할 수 없습니다.'
                        : selectedFeaturedSection
                          ? `${selectedFeaturedSection.name} 섹션에 노출됩니다.`
                          : '사용 가능한 추천 섹션이 없습니다.'}
                    </p>
                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <select
                      value={selectedFeaturedSectionId}
                      onChange={(event) => setSelectedFeaturedSectionId(event.target.value)}
                      disabled={featuredSections.length === 0 || item.visibility !== 'PUBLIC' || isUpdatingFeatured}
                      className="h-9 rounded-md border border-white/10 bg-slate-950 px-3 text-sm text-white outline-none disabled:cursor-not-allowed disabled:opacity-50"
                      aria-label="특별게시물 섹션 선택"
                    >
                      {featuredSections.map((section) => (
                        <option key={section.id} value={section.id}>
                          {section.name}
                        </option>
                      ))}
                    </select>

                    <Button
                      variant={isSelectedSectionFeatured ? 'danger' : 'outline'}
                      size="sm"
                      icon={<Star size={14} fill={isSelectedSectionFeatured ? '#f59e0b' : 'none'} />}
                      onClick={handleToggleFeatured}
                      disabled={
                        item.visibility !== 'PUBLIC'
                        || featuredSections.length === 0
                        || !selectedFeaturedSectionId
                        || isUpdatingFeatured
                      }
                      className="justify-center sm:w-auto"
                    >
                      {isSelectedSectionFeatured ? '해제' : '등록'}
                    </Button>
                  </div>
                </div>
              </div>
            ) : null}

            <p className="mt-5 whitespace-pre-line text-sm text-gray-300 sm:mt-6 sm:text-base">{item.story}</p>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-2 sm:mt-8">
            {item.tags.map((tag) => (
              <Tag key={tag} variant="neon">
                #{tag}
              </Tag>
            ))}
          </div>

          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-gray-400 sm:text-sm">
              <span>작성일 {formatDate(item.createdAt)}</span>
              {/* <span>조회수 {item.viewCount.toLocaleString()}</span> */}
              {authorHref ? (
                <Link href={authorHref} className="inline-flex items-center gap-1 underline">
                  <User size={14} />
                  {item.author.nickname ?? '탈퇴한 사용자'}
                </Link>
              ) : (
                <span className="inline-flex items-center gap-1">
                  <User size={14} />
                  {item.author.nickname ?? '탈퇴한 사용자'}
                </span>
              )}
            </div>

            <div className="flex gap-2 sm:w-auto sm:flex-wrap sm:items-center">
              <Button
                variant="outline"
                size="sm"
                rounded="full"
                onClick={handleToggleLike}
                disabled={!isLoggedIn || isLiking}
                icon={viewerHasLiked ? <Heart size={16} fill="red" strokeWidth={0} /> : <Heart size={16} />}
                className={`justify-center border-0 bg-white/5 text-xs hover:bg-white/10 sm:w-auto sm:text-sm ${viewerHasLiked ? 'text-red-300' : 'text-gray-300'}`}
              >
                <span className='hidden sm:inline-block'>좋아요</span> {likesCount}
              </Button>

              <Button
                variant="outline"
                size="sm"
                rounded="full"
                onClick={handleToggleBookmark}
                disabled={!isLoggedIn || isBookmarking}
                icon={viewerHasBookmarked ? <Bookmark size={16} fill="#39ff14" strokeWidth={0} /> : <Bookmark size={16} />}
                className={`justify-center border-0 bg-white/5 text-xs hover:bg-white/10 sm:w-auto sm:text-sm ${viewerHasBookmarked ? 'text-neon-green' : 'text-gray-300'}`}
              >
                <span className='hidden sm:inline-block'>북마크</span> {bookmarksCount}
              </Button>

              <Button
                variant="outline"
                size="sm"
                rounded="full"
                onClick={goToTarget}
                icon={<MessageCircle size={16} />}
                className="justify-center border-0 bg-white/5 text-xs text-gray-300 hover:bg-white/10 sm:w-auto sm:text-sm"
              >
                <span className='hidden sm:inline-block'>댓글</span> {commentsCount}
              </Button>

              <Button
                variant="outline"
                size="sm"
                rounded="full"
                onClick={handleShare}
                icon={<Share2 size={16} />}
                className="justify-center border-0 bg-white/5 text-xs text-gray-300 hover:bg-white/10 sm:w-auto sm:text-sm"
              >
                <span className='hidden sm:inline-block'>공유하기</span>
              </Button>
            </div>
          </div>
        </header>

        <ol className="mt-4 space-y-2 sm:mt-5">
          {item.musicItems.map((music) => (
            <li
              key={`${music.id}-${music.order}`}
              className="flex items-center gap-2 rounded-lg border border-slate-800/70 bg-black/15 p-2 sm:gap-3 sm:p-2.5"
            >
              <span className="w-5 shrink-0 text-center text-xs text-gray-400 sm:w-6">{music.order + 1}</span>
              <Image
                src={music.albumImageUrl}
                width={48}
                height={48}
                alt={music.title}
                className="h-12 w-12 shrink-0 rounded-md object-cover sm:h-14 sm:w-14"
              />
              <div className="min-w-0">
                <p className="text-sm font-medium text-white">{music.title}</p>
                <p className="text-xs text-gray-400">{music.artist}</p>
              </div>
            </li>
          ))}
        </ol>
      </article>

      <CommentSection
        apiSegment={apiSegment}
        itemId={item.id}
        isLoggedIn={isLoggedIn}
        viewerUserId={viewerUserId}
        loginHref={loginHref}
        initialComments={item.comments}
        requireLogin={requireLogin}
        targetRef={targetRef}
        onCommentsCountChange={setCommentsCount}
      />
    </section>
  );
}
