"use client";

import { useEffect, useState } from "react";
import MusicListGrid from "@/components/ui/organisms/MusicListGrid";
import type { MusicListItem, MusicListResponse } from "@/types";

export default function Home() {
  const [items, setItems] = useState<MusicListItem[]>([]);

  const type = "all"; // "playlist" | "albumlist" | "all"

  const loadFirst = async () => {
    try {
      const res = await fetch(`/api/music/lists?type=${type}&limit=16`, { cache: "no-store" });
      if (!res.ok) throw new Error("Fetch failed");
      const data: MusicListResponse = await res.json();

      setItems(data.items);
    } catch (error) {
      console.error("Failed to load list items:", error);
    } 
  };

  useEffect(() => {
    loadFirst();
    // type이 바뀌면 다시 불러오고 싶으면 dependency에 type 넣기
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <MusicListGrid items={items}/>
    </>
  )
}
