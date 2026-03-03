import ListItem from '@/components/ui/molecules/ListItem';
import type { MusicListItem } from '@/types';

type MusicListGridProps = {
  items: MusicListItem[];
};

export default function MusicListGrid({ items }: MusicListGridProps) {
  return (
    <ul className="grid grid-cols-1 gap-6 p-4 md:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => (
        <ListItem key={item.id} item={item} />
      ))}
    </ul>
  );
}
