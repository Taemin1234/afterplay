'use client';
import { useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Bookmark, Heart, MessageCircle, Pencil, Share2, Trash2, User, LockKeyhole } from 'lucide-react';
import Tag from '@/components/ui/atoms/tag';
import Button from '@/components/ui/atoms/Button';
import CommentSection from '@/components/ui/molecules/CommentSection';
import type { AlbumListDetail, PlaylistDetail } from '@/lib/music-lists';

type DetailItem = PlaylistDetail | AlbumListDetail;

interface ListDetailClientProps {
  item: DetailItem;
  isLoggedIn: boolean;
  isOwner: boolean;
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
    setIsLiking(true);

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
      console.error(error);
      alert('좋아요 처리 중 오류가 발생했습니다.');
    } finally {
      setIsLiking(false);
    }
  };

  const handleToggleBookmark = async () => {
    if (!requireLogin() || isBookmarking) return;
    setIsBookmarking(true);

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
      console.error(error);
      alert('북마크 처리 중 오류가 발생했습니다.');
    } finally {
      setIsBookmarking(false);
    }
  };

  const handleDelete = async () => {
    if (!isOwner || isDeleting) return;

    const ok = confirm('정말 삭제하시겠습니까?');
    if (!ok) return;

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/music/${apiSegment}/${item.id}`, { method: 'DELETE' });
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

              {isOwner && (
                <div className="flex items-center justify-end gap-2 sm:w-auto sm:shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    icon={<Pencil size={14} />}
                    onClick={handleGoEdit}
                    className="justify-center border-white/15 text-gray-200 hover:bg-white/10 sm:w-auto"
                  >
                    수정
                  </Button>

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
                  {item.author.nickname ?? '익명'}
                </Link>
              ) : (
                <span className="inline-flex items-center gap-1">
                  <User size={14} />
                  {item.author.nickname ?? '익명'}
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
