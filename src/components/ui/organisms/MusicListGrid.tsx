import ListItem from "@/components/ui/molecules/ListItem";
import type { MusicListItem } from "@/types";

interface ListItemProps {
  items: MusicListItem[];
};

export default function MusicListGrid({items}: ListItemProps) {
    return (
        <div>
            <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 p-4">
            {items.map((item) => (
                <ListItem key={item.id} item={item} />
            ))}
            </ul>
        </div>
    )
}