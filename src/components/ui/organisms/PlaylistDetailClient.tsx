'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Bookmark, Heart, MessageCircle, Pencil, Trash2, User } from 'lucide-react';
import Tag from '@/components/ui/atoms/tag';
import type { PlaylistDetail } from '@/lib/music-lists';

interface PlaylistDetailClientProps {
  playlist: PlaylistDetail;
  isLoggedIn: boolean;
  isOwner: boolean;
}

type CommentItem = PlaylistDetail['comments'][number];

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function PlaylistDetailClient({ playlist, isLoggedIn, isOwner }: PlaylistDetailClientProps) {
  const router = useRouter();
  const [likesCount, setLikesCount] = useState(playlist.likesCount);
  const [bookmarksCount, setBookmarksCount] = useState(playlist.bookmarksCount);
  const [commentsCount, setCommentsCount] = useState(playlist.commentsCount);
  const [viewerHasLiked, setViewerHasLiked] = useState(playlist.viewerHasLiked);
  const [viewerHasBookmarked, setViewerHasBookmarked] = useState(playlist.viewerHasBookmarked);
  const [comments, setComments] = useState<CommentItem[]>(playlist.comments);
  const [commentInput, setCommentInput] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [isBookmarking, setIsBookmarking] = useState(false);

  const loginHref = useMemo(
    () => `/auth/login?next=${encodeURIComponent(`/playlist/${playlist.id}`)}`,
    [playlist.id]
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
      const res = await fetch(`/api/music/playlist/${playlist.id}`, {
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
      const res = await fetch(`/api/music/playlist/${playlist.id}`, {
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
      const res = await fetch(`/api/music/playlist/${playlist.id}`, {
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
      const res = await fetch(`/api/music/playlist/${playlist.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('failed');
      alert('플레이리스트가 삭제되었습니다.');
      router.push('/');
      router.refresh();
    } catch (error) {
      console.error(error);
      alert('삭제 중 오류가 발생했습니다.');
      setIsDeleting(false);
    }
  };

  return (
    <section className="mx-auto w-full max-w-5xl space-y-6 pb-10">
      <article className="overflow-hidden rounded-2xl border border-slate-800/70 bg-gradient-to-b from-[#131c31] to-[#070c18] p-6 shadow-[0_24px_60px_rgba(0,0,0,0.45)]">
        <header className="space-y-3 border-b border-slate-800/70 pb-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white md:text-3xl">{playlist.title}</h1>
              <p className="mt-2 text-sm text-gray-400">{playlist.story}</p>
            </div>
            {isOwner && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="inline-flex items-center gap-1 rounded-md border border-white/15 px-3 py-1.5 text-sm text-gray-200"
                  disabled
                  title="수정 기능은 추후 연결 예정입니다."
                >
                  <Pencil size={14} />
                  수정
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="inline-flex items-center gap-1 rounded-md border border-red-400/40 px-3 py-1.5 text-sm text-red-300"
                >
                  <Trash2 size={14} />
                  삭제
                </button>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {playlist.tags.map((tag) => (
              <Tag key={tag} variant="neon">
                #{tag}
              </Tag>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs text-gray-400">
            <span>작성일 {formatDate(playlist.createdAt)}</span>
            <span className="inline-flex items-center gap-1">
              <User size={14} />
              {playlist.author.nickname ?? '익명'}
            </span>
          </div>
        </header>

        <div className="mt-4 flex flex-wrap items-center gap-2 border-b border-slate-800/70 pb-4">
          <button
            type="button"
            onClick={handleToggleLike}
            disabled={!isLoggedIn || isLiking}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm transition-colors bg-white/5 text-gray-300 hover:bg-white/10 ${!isLoggedIn ? 'cursor-not-allowed opacity-50' : ''}`}
          >
           {viewerHasLiked ? <Heart size={16} fill='red' strokeWidth={0} /> : <Heart size={16} />}
            좋아요 {likesCount}
          </button>

          <button
            type="button"
            onClick={handleToggleBookmark}
            disabled={!isLoggedIn || isBookmarking}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm transition-colors bg-white/5 text-gray-300 hover:bg-white/10 ${!isLoggedIn ? 'cursor-not-allowed opacity-50' : ''}`}
          >
            {viewerHasBookmarked ? <Bookmark size={16} fill='text-neon-green' strokeWidth={0} />  : <Bookmark size={16} />}
            북마크 {bookmarksCount}
          </button>

          <div className="inline-flex items-center gap-2 rounded-full bg-white/5 px-4 py-2 text-sm text-gray-300">
            <MessageCircle size={16} />
            댓글 {commentsCount}
          </div>
        </div>

        <ol className="mt-4 space-y-2">
          {playlist.musicItems.map((music) => (
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

      <section className="rounded-2xl border border-slate-800/70 bg-[#0b1020] p-6">
        <h2 className="text-lg font-semibold text-white">댓글</h2>

        {!isLoggedIn && (
          <p className="mt-2 text-sm text-gray-400">
            댓글 작성은 로그인 후 가능합니다. <Link href={loginHref} className="text-neon-green">로그인하기</Link>
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
            <button
              type="submit"
              disabled={!isLoggedIn || isSubmittingComment || !commentInput.trim()}
              className="rounded-md bg-neon-green px-4 py-2 text-sm font-semibold text-black disabled:cursor-not-allowed disabled:opacity-50"
            >
              댓글 등록
            </button>
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
          {comments.length === 0 && <li className="text-sm text-gray-500">아직 댓글이 없습니다.</li>}
        </ul>
      </section>
    </section>
  );
}
