import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import ParticleLogoIntro from '@/components/ui/organisms/ParticleLogoIntro';
import MusicListGrid from '@/components/ui/organisms/MusicListGrid';
import PollCard from '@/components/polls/PollCard';
import { fetchListItems } from '@/lib/music-lists';
import { getAuthenticatedUser } from '@/lib/music-list-api';
import { serializePollListItem } from '@/lib/music-polls';
import prisma from '@/lib/prisma';
import { buildUrl, SITE_DESCRIPTION, SITE_NAME_KO } from '@/lib/seo';

export const revalidate = 15;

export const metadata: Metadata = {
  title: { absolute: `${SITE_NAME_KO}(DustpeakClub) | 음악 취향 커뮤니티` },
  description: SITE_DESCRIPTION,
  alternates: { canonical: '/' },
};

const websiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: SITE_NAME_KO,
  alternateName: ['DustpeakClub', 'Dust Peak Club'],
  url: buildUrl('/'),
  inLanguage: 'ko-KR',
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
        <h2 className="font-paperlogy text-lg font-bold text-white sm:text-2xl">{title}</h2>
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
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd).replace(/</g, '\\u003c') }}
      />
       <ParticleLogoIntro />
      <div className="space-y-10 pb-8 sm:space-y-14">
        <div className="relative flex min-h-[150px] items-center overflow-hidden p-8">
          <Image
            src="/dot_deco.webp"
            alt=""
            width={1254}
            height={1254}
            preload
            sizes="(min-width: 960px) 400px, 41.7vw"
            className="pointer-events-none absolute right-0 top-[calc(50%+20px)] h-[clamp(150px,41.7dvw,400px)] w-auto -translate-y-1/2 object-contain"
          />
          <div className="pointer-events-none absolute inset-0 bg-black/50" aria-hidden="true" />
          <h1 className='relative z-10 mt-3.5 text-xl font-bold sm:text-2xl md:text-3xl'>
            {SITE_NAME_KO}, 취향의 수집과 음악의 대화<br />
            여러분의 취향을 공유해주세요.
          </h1>
        </div>
        <HomeSection title="PEAK N PICK" href="/polls">
          {polls.length > 0 ? (
            <ul className="grid grid-cols-2 items-stretch gap-4 lg:grid-cols-4 lg:gap-6">
              {polls.map((poll) => (
                <li key={poll.id}>
                  <PollCard poll={poll} />
                </li>
              ))}
            </ul>
          ) : (
            <EmptyPreview message="등록된 Peak n Pick이 없어요." />
          )}
        </HomeSection>

        <HomeSection title="뮤직 컬렉션" href="/lists">
          {listResult.items.length > 0
            ? <MusicListGrid items={listResult.items} preview />
            : <EmptyPreview message="등록된 컬렉션이 없어요." />}
        </HomeSection>

        <HomeSection title="이주의 신곡" href="/weekly-new-releases">
          {weeklyResult.items.length > 0
            ? <MusicListGrid items={weeklyResult.items} preview />
            : <EmptyPreview message="선정된 이주의 신곡이 없어요." />}
        </HomeSection>

        {/* <HomeSection title="스페셜 세트" href="/featured">
          {featuredResult.items.length > 0
            ? <MusicListGrid items={featuredResult.items} preview />
            : <EmptyPreview message="선정된 스페셜 세트가 없어요." />}
        </HomeSection> */}
      </div>
    </>
  );
}
