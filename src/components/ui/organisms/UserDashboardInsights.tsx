import Link from 'next/link';
import type { UserDashboardStats } from '@/lib/dashboard-stats';

interface UserDashboardInsightsProps {
  stats: UserDashboardStats;
  className?: string;
}

function formatDiff(value: number) {
  if (value > 0) return `+${value}`;
  return `${value}`;
}

function formatRate(value: number | null) {
  if (value === null) return '-';
  const rounded = Math.round(value * 10) / 10;
  return `${rounded > 0 ? '+' : ''}${rounded}%`;
}

function WeeklyMetricCard({
  title,
  current,
  previous,
  diff,
  diffRate,
}: {
  title: string;
  current: number;
  previous: number;
  diff: number;
  diffRate: number | null;
}) {
  const trendClass =
    diff > 0 ? 'text-green-300' : diff < 0 ? 'text-red-300' : 'text-slate-300';

  return (
    <article className="rounded-xl border border-slate-800 bg-slate-900/35 p-4">
      <p className="text-xs text-slate-400">{title}</p>
      <p className="mt-2 text-2xl font-bold text-white">{current.toLocaleString()}</p>
      <p className={`mt-2 text-xs ${trendClass}`}>
        지난주 {previous.toLocaleString()} · {formatDiff(diff)} ({formatRate(diffRate)})
      </p>
    </article>
  );
}

function PopularPlaylistCard({
  title,
  playlistTitle,
  metricLabel,
  metricValue,
  href,
}: {
  title: string;
  playlistTitle: string;
  metricLabel: string;
  metricValue: number;
  href: string;
}) {
  return (
    <article className="rounded-xl border border-slate-800 bg-slate-900/35 p-4">
      <p className="text-xs text-slate-400">{title}</p>
      <Link href={href} className="mt-2 block truncate text-sm font-semibold text-white hover:text-neon-green">
        {playlistTitle}
      </Link>
      <p className="mt-2 text-xs text-slate-300">
        {metricLabel}: {metricValue.toLocaleString()}
      </p>
    </article>
  );
}

function TopAppearingItem({ label, name, count }: { label: string; name: string; count: number }) {
  return (
    <li className="flex items-center justify-between gap-2 text-sm">
      <span className="text-slate-400">{label}</span>
      <span className="min-w-0 truncate text-right text-white">
        {name} ({count})
      </span>
    </li>
  );
}

export default function UserDashboardInsights({ stats, className = '' }: UserDashboardInsightsProps) {
  return (
    <section className={`space-y-4 ${className}`.trim()}>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <WeeklyMetricCard title="이번주 조회수" {...stats.weekly.views} />
        <WeeklyMetricCard title="이번주 좋아요" {...stats.weekly.likes} />
        <WeeklyMetricCard title="이번주 작성 플레이리스트" {...stats.weekly.createdPlaylists} />
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {stats.popular.mostLikedPlaylist ? (
          <PopularPlaylistCard
            title="좋아요 최다 플레이리스트"
            playlistTitle={stats.popular.mostLikedPlaylist.title}
            metricLabel="좋아요"
            metricValue={stats.popular.mostLikedPlaylist.likesCount}
            href={`/playlist/${stats.popular.mostLikedPlaylist.id}`}
          />
        ) : (
          <article className="rounded-xl border border-slate-800 bg-slate-900/35 p-4 text-sm text-slate-400">
            좋아요 집계 가능한 플레이리스트가 없습니다.
          </article>
        )}

        {stats.popular.mostViewedPlaylist ? (
          <PopularPlaylistCard
            title="조회수 최다 플레이리스트"
            playlistTitle={stats.popular.mostViewedPlaylist.title}
            metricLabel="조회수"
            metricValue={stats.popular.mostViewedPlaylist.viewCount}
            href={`/playlist/${stats.popular.mostViewedPlaylist.id}`}
          />
        ) : (
          <article className="rounded-xl border border-slate-800 bg-slate-900/35 p-4 text-sm text-slate-400">
            조회수 집계 가능한 플레이리스트가 없습니다.
          </article>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <article className="rounded-xl border border-slate-800 bg-slate-900/35 p-4">
          <p className="text-xs text-slate-400">내가 공유한 음악/앨범</p>
          <div className="mt-2 flex items-center gap-4 text-sm text-white">
            <span>음악 {stats.shared.tracksCount.toLocaleString()}개</span>
            <span>앨범 {stats.shared.albumsCount.toLocaleString()}개</span>
          </div>
        </article>

        <article className="rounded-xl border border-slate-800 bg-slate-900/35 p-4">
          <p className="text-xs text-slate-400">가장 많이 등장한 항목</p>
          <ul className="mt-2 space-y-2">
            {stats.topAppearing.artist ? (
              <TopAppearingItem label="아티스트" name={stats.topAppearing.artist.name} count={stats.topAppearing.artist.count} />
            ) : null}
            {stats.topAppearing.track ? (
              <TopAppearingItem label="곡" name={stats.topAppearing.track.name} count={stats.topAppearing.track.count} />
            ) : null}
            {stats.topAppearing.album ? (
              <TopAppearingItem label="앨범" name={stats.topAppearing.album.name} count={stats.topAppearing.album.count} />
            ) : null}
            {!stats.topAppearing.artist && !stats.topAppearing.track && !stats.topAppearing.album ? (
              <li className="text-sm text-slate-400">집계 가능한 데이터가 없습니다.</li>
            ) : null}
          </ul>
        </article>
      </div>
    </section>
  );
}
