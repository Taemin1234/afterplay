'use client';
import { useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Bookmark, Heart, MessageCircle, Pencil, Share2, Trash2, User } from 'lucide-react';
import Tag from '@/components/ui/atoms/tag';
import Button from '@/components/ui/atoms/Button';
import type { AlbumListDetail, PlaylistDetail } from '@/lib/music-lists';

type DetailItem = PlaylistDetail | AlbumListDetail;
type CommentItem = DetailItem['comments'][number];

interface ListDetailClientProps {
  item: DetailItem;
  isLoggedIn: boolean;
  isOwner: boolean;
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
  const [comments, setComments] = useState<CommentItem[]>(item.comments);
  const [commentInput, setCommentInput] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
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

  const handleSubmitComment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!requireLogin() || isSubmittingComment) return;

    const content = commentInput.trim();
    if (!content) return;

    setIsSubmittingComment(true);
    try {
      const res = await fetch(`/api/music/${apiSegment}/${item.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'comment', content }),
      });

      if (!res.ok) throw new Error('failed');
      const data = await res.json();
      setCommentInput('');
      setCommentsCount(data.commentsCount);
      setComments((prev) => [data.comment, ...prev]);
    } catch (error) {
      console.error(error);
      alert('댓글 등록 중 오류가 발생했습니다.');
    } finally {
      setIsSubmittingComment(false);
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
    <section className="mx-auto w-full max-w-5xl space-y-6">
      <article className="overflow-hidden rounded-2xl border border-slate-800/70 bg-gradient-to-b from-[#131c31] to-[#070c18] px-6 py-8 shadow-[0_24px_60px_rgba(0,0,0,0.45)]">
        <header className="space-y-3 border-b border-slate-800/70 pb-4">
          <div>
            <div className="flex items-start justify-between gap-4">
              <h1 className="text-2xl font-bold text-white md:text-3xl flex-1">{item.title}</h1>

              {isOwner && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    icon={<Pencil size={14} />}
                    onClick={handleGoEdit}
                    className="border-white/15 text-gray-200 hover:bg-white/10"
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
                  >
                    삭제
                  </Button>
                </div>
              )}
            </div>

            <p className="mt-8 text-base whitespace-pre-line text-gray-300">{item.story}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2 mt-8">
            {item.tags.map((tag) => (
              <Tag key={tag} variant="neon">
                #{tag}
              </Tag>
            ))}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex flex-wrap items-center gap-4 text-xs text-gray-400">
              <span>작성일 {formatDate(item.createdAt)}</span>
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

            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                rounded="full"
                onClick={handleToggleLike}
                disabled={!isLoggedIn || isLiking}
                icon={viewerHasLiked ? <Heart size={16} fill="red" strokeWidth={0} /> : <Heart size={16} />}
                className={`border-0 bg-white/5 hover:bg-white/10 ${viewerHasLiked ? 'text-red-300' : 'text-gray-300'}`}
              >
                좋아요 {likesCount}
              </Button>

              <Button
                variant="outline"
                size="sm"
                rounded="full"
                onClick={handleToggleBookmark}
                disabled={!isLoggedIn || isBookmarking}
                icon={viewerHasBookmarked ? <Bookmark size={16} fill="#39ff14" strokeWidth={0} /> : <Bookmark size={16} />}
                className={`border-0 bg-white/5 hover:bg-white/10 ${viewerHasBookmarked ? 'text-neon-green' : 'text-gray-300'}`}
              >
                북마크 {bookmarksCount}
              </Button>

              <Button
                variant="outline"
                size="sm"
                rounded="full"
                onClick={goToTarget}
                icon={<MessageCircle size={16} />}
                className="border-0 bg-white/5 text-gray-300 hover:bg-white/10"
              >
                댓글 {commentsCount}
              </Button>

              <Button
                variant="outline"
                size="sm"
                rounded="full"
                onClick={handleShare}
                icon={<Share2 size={16} />}
                className="border-0 bg-white/5 text-gray-300 hover:bg-white/10"
              >
                공유하기
              </Button>
            </div>
          </div>
        </header>

        <ol className="mt-4 space-y-2">
          {item.musicItems.map((music) => (
            <li
              key={`${music.id}-${music.order}`}
              className="flex items-center gap-3 rounded-lg border border-slate-800/70 bg-black/15 p-2"
            >
              <span className="w-6 text-center text-xs text-gray-400">{music.order + 1}</span>
              <Image
                src={music.albumImageUrl}
                width={56}
                height={56}
                alt={music.title}
                className="rounded-md object-cover"
              />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-white">{music.title}</p>
                <p className="truncate text-xs text-gray-400">{music.artist}</p>
              </div>
            </li>
          ))}
        </ol>
      </article>

      <section ref={targetRef} className="rounded-2xl border border-slate-800/70 bg-[#0b1020] p-6">
        <h2 className="text-lg font-semibold text-white">댓글</h2>

        {!isLoggedIn && (
          <p className="mt-2 text-sm text-gray-400">
            댓글 작성은 로그인이 필요합니다.{' '}
            <Link href={loginHref} className="text-neon-green">
              로그인하기
            </Link>
          </p>
        )}

        <form onSubmit={handleSubmitComment} className="mt-4 space-y-2">
          <textarea
            value={commentInput}
            onChange={(e) => setCommentInput(e.target.value)}
            placeholder={isLoggedIn ? '댓글을 입력해주세요.' : '로그인 후 댓글을 작성할 수 있습니다.'}
            disabled={!isLoggedIn || isSubmittingComment}
            maxLength={500}
            className="h-24 w-full resize-none rounded-md border border-slate-700 bg-[#070b16] px-3 py-2 text-sm text-white outline-none focus:border-neon-green disabled:cursor-not-allowed disabled:opacity-60"
          />
          <div className="flex justify-end">
            <Button
              type="submit"
              size="sm"
              disabled={!isLoggedIn || isSubmittingComment || !commentInput.trim()}
              className="font-semibold"
            >
              댓글 등록
            </Button>
          </div>
        </form>

        <ul className="mt-5 space-y-3">
          {comments.map((comment) => (
            <li key={comment.id} className="rounded-lg border border-slate-800/80 bg-black/20 p-3">
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>{comment.user.nickname ?? '익명'}</span>
                <span>{formatDate(comment.createdAt)}</span>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm text-gray-100">{comment.content}</p>
            </li>
          ))}
          {comments.length === 0 && <li className="text-center text-sm text-gray-500">아직 댓글이 없습니다.</li>}
        </ul>
      </section>
    </section>
  );
}
