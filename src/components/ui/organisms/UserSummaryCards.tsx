import { Eye, Heart, ListMusic, LockOpen, ThumbsUp } from 'lucide-react';
import SummaryCard, { type SummaryCardItem } from '@/components/ui/molecules/SummaryCard';
import type { UserSummaryStats } from '@/lib/dashboard-stats';

interface UserSummaryCardsProps {
  stats: UserSummaryStats;
  className?: string;
}

function formatPercent(value: number): string {
  if (Number.isNaN(value) || !Number.isFinite(value)) return '0%';
  return `${Math.round(value)}%`;
}

export default function UserSummaryCards({ stats, className = '' }: UserSummaryCardsProps) {
  const summaryItems: SummaryCardItem[] = [
    {
      label: '내 플리',
      hint: '직접 만든 플레이리스트 + 앨범리스트',
      value: stats.createdCount.toLocaleString(),
      icon: <ListMusic size={16} />,
    },
    {
      label: '받은 좋아요',
      hint: '내 플리에 받은 전체 좋아요',
      value: stats.totalReceivedLikes.toLocaleString(),
      icon: <Heart size={16} />,
    },
    {
      label: '전체 조회수',
      hint: '내 플리 전체 조회수',
      value: stats.totalViewCount.toLocaleString(),
      icon: <Eye size={16} />,
    },
    {
      label: '조회수/좋아요 비율',
      hint: '조회수/좋아요 비율',
      value: formatPercent(stats.viewLikedRatio),
      icon: <ThumbsUp size={16} />,
    },
    {
      label: '공개 비율',
      hint: `${stats.publicCount.toLocaleString()} / ${stats.createdCount.toLocaleString()}`,
      value: formatPercent(stats.publicRatio),
      icon: <LockOpen size={16} />,
    },
  ];

  return (
    <section className={`mt-6 grid grid-cols-2 gap-3 sm:mt-8 sm:gap-4 xl:grid-cols-5 ${className}`.trim()}>
      {summaryItems.map((item) => (
        <SummaryCard key={item.label} label={item.label} value={item.value} hint={item.hint} icon={item.icon} />
      ))}
    </section>
  );
}
