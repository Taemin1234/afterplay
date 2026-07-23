import ListItem from '@/components/ui/molecules/ListItem';
import type { MusicListItem } from '@/types';

type MusicListGridProps = {
  items: MusicListItem[];
  preview?: boolean;
};

export default function MusicListGrid({ items, preview = false }: MusicListGridProps) {
  if (items.length === 0) return null;

  return (
    <ul className={`grid grid-cols-2 gap-4 items-stretch lg:gap-6 ${preview ? 'lg:grid-cols-4' : 'lg:grid-cols-3 xl:grid-cols-4'}`}>
      {items.map((item, index) => (
        <ListItem key={`${item.kind}:${item.id}`} item={item} priority={index === 0} />
      ))}
    </ul>
  );
}
