import ListItem from '@/components/ui/molecules/ListItem';
import type { MusicListItem } from '@/types';

type MusicListGridProps = {
  items: MusicListItem[];
};

export default function MusicListGrid({ items }: MusicListGridProps) {
  if (items.length === 0) return null;

  return (
    <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 lg:gap-6 xl:grid-cols-4">
      {items.map((item) => (
        <ListItem key={item.id} item={item} />
      ))}
    </ul>
  );
}
