import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import ParticleLogoIntro from '@/components/ui/organisms/ParticleLogoIntro';
import MusicListGrid from '@/components/ui/organisms/MusicListGrid';
import PollCard from '@/components/polls/PollCard';
import { fetchListItems } from '@/lib/music-lists';
import { getAuthenticatedUser } from '@/lib/music-list-api';
import { serializePollListItem } from '@/lib/music-polls';
import prisma from '@/lib/prisma';

export const revalidate = 15;

export const metadata: Metadata = {
  title: 'dustpeakclub',
  description: '플레이리스트, 이주의 신곡, 특별게시글과 Peak n Pick을 만나보세요.',
  alternates: { canonical: '/' },
};

type HomeSectionProps = {
  title: string;
  href: string;
  children: React.ReactNode;
};

function HomeSection({ title, href, children }: HomeSectionProps) {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-3">
        <h2 className="font-paperlogy text-xl font-bold text-white sm:text-2xl">{title}</h2>
        <Link
          href={href}
          className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-slate-300 transition-colors hover:text-neon-point"
        >
          더보기
          <ChevronRight size={17} />
        </Link>
      </div>
      {children}
    </section>
  );
}

function EmptyPreview({ message }: { message: string }) {
  return (
    <p className="rounded-xl border border-white/10 bg-bg2 px-4 py-10 text-center text-sm text-slate-400">
      {message}
    </p>
  );
}

export default async function Home() {
  const [user, pollRows, listResult, weeklyResult, featuredResult] = await Promise.all([
    getAuthenticatedUser(),
    prisma.musicPoll.findMany({
      where: { deletedAt: null },
      select: { id: true },
      orderBy: { createdAt: 'desc' },
      take: 4,
    }),
    fetchListItems({
      type: 'all',
      sort: 'latest',
      limit: 4,
      cursor: null,
      visibility: 'public',
      excludeFeaturedSectionKey: 'weekly-new-releases',
    }),
    fetchListItems({
      type: 'all',
      sort: 'latest',
      limit: 4,
      cursor: null,
      visibility: 'public',
      featuredSectionKey: 'weekly-new-releases',
    }),
    fetchListItems({
      type: 'all',
      sort: 'latest',
      limit: 4,
      cursor: null,
      visibility: 'public',
      featuredSectionKey: 'featured',
    }),
  ]);
  const polls = (await Promise.all(
    pollRows.map((poll) => serializePollListItem(poll.id, user?.id ?? null))
  )).filter((poll) => poll !== null);

  return (
    <div className="space-y-10 pb-8 sm:space-y-14">
      <ParticleLogoIntro />

      <HomeSection title="PEAK N PICK" href="/polls">
        {polls.length > 0 ? (
          <ul className="grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-6">
            {polls.map((poll) => (
              <li key={poll.id}>
                <PollCard poll={poll} />
              </li>
            ))}
          </ul>
        ) : (
          <EmptyPreview message="등록된 Peak n Pick이 없습니다." />
        )}
      </HomeSection>

      <HomeSection title="리스트 목록" href="/lists">
        {listResult.items.length > 0
          ? <MusicListGrid items={listResult.items} preview />
          : <EmptyPreview message="등록된 리스트가 없습니다." />}
      </HomeSection>

      <HomeSection title="이주의 신곡" href="/weekly-new-releases">
        {weeklyResult.items.length > 0
          ? <MusicListGrid items={weeklyResult.items} preview />
          : <EmptyPreview message="선정된 이주의 신곡이 없습니다." />}
      </HomeSection>

      <HomeSection title="특별게시글" href="/featured">
        {featuredResult.items.length > 0
          ? <MusicListGrid items={featuredResult.items} preview />
          : <EmptyPreview message="선정된 특별게시글이 없습니다." />}
      </HomeSection>
    </div>
  );
}
