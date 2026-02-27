"use client";

import Image from "next/image";
import Link from "next/link";
import Tag from "@/components/ui/atoms/tag";
import { PlayCircle, MessageCircle, Heart } from 'lucide-react';
import type { MusicListItem } from "@/types";

interface ListItemProps {
  item: MusicListItem;
}

export default function ListItem({ item }: ListItemProps) {
  const href = item.kind === 'PLAYLIST' ? `/playlist/${item.id}` : `/albumlist/${item.id}`;
  const coverImage = item.previewImages?.[0] ?? null;

  const MAX = 4;
  const tags = item.tags ?? [];
  const visible = tags.slice(0, MAX);
  const rest = tags.length - visible.length;

  const handleNavigate = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const isMobileViewport = window.matchMedia('(max-width: 767px)').matches;
    if (!isMobileViewport) return;

    e.preventDefault();
    window.location.assign(href);
  };

  return (
    <li className="list-none rounded-xl border border-slate-800/70 bg-gradient-to-b from-[#101729] to-[#050816] p-4 shadow-[0_18px_45px_rgba(0,0,0,0.55)] transition-transform transition-colors duration-300 hover:-translate-y-1 hover:border-neon-green/40">
      <Link href={href} onClick={handleNavigate} className="group relative flex h-full flex-col justify-between gap-2">
        <div>
          <Tag variant="subtle">
            {item.kind === 'PLAYLIST' ? 'PLAYLIST' : 'ALBUMLIST'}
          </Tag>

          <div className="relative mb-4 flex h-48 items-center justify-center">
            {item.previewImages[2] && (
              <div className="absolute left-1/2 z-0 translate-x-3 scale-80 opacity-40 blur-[1px] transition-transform duration-500 group-hover:translate-x-5">
                <Image src={item.previewImages[2]} width={130} height={130} alt="stack-3" className="aspect-square rounded-lg object-cover shadow-2xl" />
              </div>
            )}
            {item.previewImages[1] && (
              <div className="absolute left-1/2 z-10 -translate-x-6 scale-90 transition-transform duration-500 group-hover:translate-x-0">
                <Image src={item.previewImages[1]} width={140} height={140} alt="stack-2" className="aspect-square rounded-lg object-cover shadow-xl" />
              </div>
            )}
            <div className="relative z-20 transition-transform duration-500 group-hover:scale-105">
              {coverImage ? (
                <Image src={coverImage} width={150} height={150} alt={item.title} className="aspect-square rounded-xl border-2 border-white/5 object-cover" />
              ) : (
                <div className="flex h-[150px] w-[150px] items-center justify-center rounded-xl border-2 border-white/5 bg-white/5 text-xs text-gray-400">
                  NO IMAGE
                </div>
              )}
              <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                <PlayCircle className="h-12 w-12 text-neon-green" />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="line-clamp-2 text-lg font-semibold text-white transition-colors group-hover:text-neon-green">
              {item.title}
            </h3>
            <p className="mt-1 line-clamp-2 min-h-[45px] text-sm leading-relaxed text-gray-400">
              {item.story ?? ""}
            </p>
          </div>
        </div>

        <div>
          <div className="mt-1 flex flex-wrap gap-2">
            {visible.map((tag) => (
              <Tag key={tag} variant="neon">
                #{tag}
              </Tag>
            ))}
            {rest > 0 && <Tag variant="subtle">+{rest}</Tag>}
          </div>

          <div className="mt-2 pt-2 flex items-center justify-between text-[11px] text-gray-500 border-t border-slate-800/70">
            <span className="text-xs">
              {new Date(item.createdAt).toLocaleDateString('ko-KR', { year: 'numeric', month: 'short', day: 'numeric' })}
            </span>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <Heart size={16} />
                <span className="text-sm">{item.likesCount.toLocaleString()}</span>
              </div>
              <span>·</span>
              <div className="flex items-center gap-1">
                <MessageCircle size={16} />
                <span className="text-sm">{item.commentsCount.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </li>
  );
}
