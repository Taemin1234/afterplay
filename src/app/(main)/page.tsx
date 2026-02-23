"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Hash, PlayCircle } from 'lucide-react';

type FeedKind = "PLAYLIST" | "ALBUM_LIST";
type ListItem = {
  kind: FeedKind;
  id: string;
  title: string;
  story: string;
  visibility: "PUBLIC" | "PRIVATE";
  createdAt: string;
  likesCount: number;
  commentsCount: number;
  tags: string[];
  previewImages: string[];
};

type ApiResponse = {
  items: ListItem[];
  nextCursor: string | null;
};

export default function Home() {
  const [items, setItems] = useState<ListItem[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const type = "all"; // "playlist" | "albumlist" | "all"

  const loadFirst = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/music/lists?type=${type}&limit=8`, { cache: "no-store" });
      if (!res.ok) throw new Error("Fetch failed");
      const data: ApiResponse = await res.json();

      setItems(data.items);
      setNextCursor(data.nextCursor);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFirst();
    // type이 바뀌면 다시 불러오고 싶으면 dependency에 type 넣기
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  console.log(items)

  return (
    <>
      <h1 className="text-red-300">Home</h1>
      <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 p-4">
        {items.map((item) => (
          <li
            key={item.id}
            className="list-none rounded-xl border border-slate-800/70 bg-gradient-to-b from-[#101729] to-[#050816] p-4 shadow-[0_18px_45px_rgba(0,0,0,0.55)] transition-transform transition-colors duration-300 hover:-translate-y-1 hover:border-neon-green/40"
          >
            {/* 1. Link 연결: 종류에 따라 상세 페이지 주소 분기 */}
            <Link
              href={item.kind === 'PLAYLIST' ? `/playlist/${item.id}` : `/album/${item.id}`}
              className="group block relative"
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-medium tracking-wide text-gray-300">
                  {item.kind === 'PLAYLIST' ? 'PLAYLIST' : 'ALBUMLIST'}
                </span>
              </div>
              {/* --- 이미지 스택 영역 --- */}
              <div className="relative h-48 mb-4 flex items-center justify-center">
                {item.previewImages[2] && (
                  <div className="absolute left-1/2 -translate-x-1/2 translate-x-4 scale-80 opacity-40 blur-[1px] z-0 group-hover:translate-x-5 transition-transform duration-500">
                    <Image src={item.previewImages[2]} width={130} height={130} alt="stack-3" className="rounded-lg shadow-2xl object-cover aspect-square" />
                  </div>
                )}
                {item.previewImages[1] && (
                  <div className="absolute left-1/2 -translate-x-1/2 translate-x-0 scale-85 z-10 group-hover:translate-x-2 transition-transform duration-500">
                    <Image src={item.previewImages[1]} width={140} height={140} alt="stack-2" className="rounded-lg shadow-xl object-cover aspect-square" />
                  </div>
                )}
                <div className="relative z-20 group-hover:scale-105 transition-transform duration-500">
                  <Image src={item.previewImages[0]} width={150} height={150} alt={item.title} className="rounded-xl object-cover aspect-square border-2 border-white/5" />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl">
                    <PlayCircle className="text-neon-green w-12 h-12" />
                  </div>
                </div>
              </div>

              {/* --- 텍스트 정보 영역 --- */}
              <div className="space-y-3">
                <h3 className="truncate text-base font-semibold text-white group-hover:text-neon-green transition-colors">
                  {item.title}
                </h3>
                <p className="line-clamp-2 min-h-[40px] text-sm leading-relaxed text-gray-400">
                  {item.story}
                </p>

                {/* 태그 영역 */}
                <div className="flex flex-wrap gap-2 pt-1">
                  {item.tags?.map((tag: string) => (
                    <span key={tag} className="flex items-center text-xs text-neon-green/70 bg-neon-green/5 px-2 py-1 rounded-md">
                      <Hash size={10} className="mr-0.5" />
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="flex items-center justify-between text-[11px] text-gray-500">
                  <span>{new Date(item.createdAt).toLocaleDateString('ko-KR', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                  <div className="flex items-center gap-2">
                    <span>👍 {item.likesCount.toLocaleString()}</span>
                    <span>·</span>
                    <span>💬 {item.commentsCount.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </>
  )
}
