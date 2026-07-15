import MusicListBrowser from '@/components/ui/organisms/MusicListBrowser';
import MusicListGrid from '@/components/ui/organisms/MusicListGrid';
import { fetchListItems } from '@/lib/music-lists';

type ListCollectionPageProps = {
  title: string;
  description: string;
  featuredSectionKey?: string;
  excludeFeaturedSectionKey?: string;
};

export default async function ListCollectionPage({
  title,
  description,
  featuredSectionKey,
  excludeFeaturedSectionKey,
}: ListCollectionPageProps) {
  const { items, nextCursor } = await fetchListItems({
    type: 'all',
    sort: 'latest',
    limit: 16,
    cursor: null,
    visibility: 'public',
    featuredSectionKey,
    excludeFeaturedSectionKey,
  });

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-white sm:text-3xl">{title}</h1>
        <p className="mt-2 text-sm text-slate-400">{description}</p>
      </header>
      <MusicListBrowser
        initialItems={items}
        initialNextCursor={nextCursor}
        initialType="all"
        limit={16}
        featuredSectionKey={featuredSectionKey}
        excludeFeaturedSectionKey={excludeFeaturedSectionKey}
      >
        <MusicListGrid items={items} />
      </MusicListBrowser>
    </section>
  );
}
