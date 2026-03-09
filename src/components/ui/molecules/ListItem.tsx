"use client";

import Image from "next/image";
import Link from "next/link";
import Tag from "@/components/ui/atoms/tag";
import { PlayCircle, MessageCircle, Heart, LockKeyhole } from "lucide-react";
import type { MusicListItem } from "@/types";

interface ListItemProps {
  item: MusicListItem;
}

export default function ListItem({ item }: ListItemProps) {
  const href = item.kind === "PLAYLIST" ? `/playlist/${item.id}` : `/albumlist/${item.id}`;
  const coverImage = item.previewImages?.[0] ?? null;

  const MAX = 4;
  const tags = item.tags ?? [];
  const visible = tags.slice(0, MAX);
  const rest = tags.length - visible.length;

  const handleNavigate = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const isMobileViewport = window.matchMedia("(max-width: 767px)").matches;
    if (!isMobileViewport) return;

    e.preventDefault();
    window.location.assign(href);
  };

  return (
    <li className="list-none rounded-xl border border-slate-800/70 bg-gradient-to-b from-[#101729] to-[#050816] p-3 shadow-[0_18px_45px_rgba(0,0,0,0.55)] transition-transform transition-colors duration-300 hover:border-neon-green/40 sm:p-4 md:hover:-translate-y-1">
      <Link href={href} onClick={handleNavigate} className="group relative flex h-full flex-col justify-between gap-3">
        <div>
          <div className="flex items-center justify-between gap-2">
            <Tag variant="subtle">{item.kind === "PLAYLIST" ? "PLAYLIST" : "ALBUMLIST"}</Tag>
            <div className="flex min-w-0 items-center gap-1.5 sm:gap-2">
              <span className="max-w-[8rem] truncate text-xs text-gray-400 sm:max-w-[10rem] sm:text-sm">
                By {item.authorNickname ?? "익명"}
              </span>
              {item.visibility === "PRIVATE" ? (
                <div className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-slate-600/60 bg-slate-700/70 text-white">
                  <LockKeyhole size={11} className="text-slate-300/80" />
                </div>
              ) : null}
            </div>
          </div>

          <div className="relative my-4 flex h-40 items-center justify-center sm:mb-4 sm:h-48">
            {item.previewImages[2] && (
              <div className="absolute left-1/2 z-0 translate-x-3 scale-75 opacity-40 blur-[1px] transition-transform duration-500 group-hover:translate-x-5 sm:scale-80">
                <Image
                  src={item.previewImages[2]}
                  width={130}
                  height={130}
                  alt="stack-3"
                  className="rounded-lg object-cover shadow-2xl sm:h-[130px] sm:w-[130px]"
                />
              </div>
            )}
            {item.previewImages[1] && (
              <div className="absolute left-1/2 z-10 -translate-x-4 scale-90 transition-transform duration-500 group-hover:translate-x-0 sm:-translate-x-6">
                <Image
                  src={item.previewImages[1]}
                  width={140}
                  height={140}
                  alt="stack-2"
                  className="rounded-lg object-cover shadow-xl sm:h-[140px] sm:w-[140px]"
                />
              </div>
            )}
            <div className="relative z-20 transition-transform duration-500 group-hover:scale-105">
              {coverImage ? (
                <Image
                  src={coverImage}
                  width={150}
                  height={150}
                  alt={item.title}
                  className="rounded-xl border-2 border-white/5 object-cover sm:h-[150px] sm:w-[150px]"
                />
              ) : (
                <div className="flex h-[150px] w-[150px] items-center justify-center rounded-xl border-2 border-white/5 bg-white/5 text-xs text-gray-400 sm:h-[150px] sm:w-[150px]">
                  NO IMAGE
                </div>
              )}
              <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                <PlayCircle className="h-10 w-10 text-neon-green sm:h-12 sm:w-12" />
              </div>
            </div>
          </div>

          <div className="space-y-2.5 sm:space-y-3">
            <h3 className="line-clamp-2 text-base font-semibold text-white transition-colors group-hover:text-neon-green sm:text-lg">
              {item.title}
            </h3>
            <p className="mt-1 line-clamp-2 min-h-[40px] text-sm leading-relaxed text-gray-400 sm:min-h-[45px]">
              {item.story ?? ""}
            </p>
          </div>
        </div>

        <div>
          <div className="mt-1 flex flex-wrap gap-1.5 sm:gap-2">
            {visible.map((tag) => (
              <Tag key={tag} variant="neon">
                #{tag}
              </Tag>
            ))}
            {rest > 0 && <Tag variant="subtle">+{rest}</Tag>}
          </div>

          <div className="mt-2 flex items-center justify-between border-t border-slate-800/70 pt-2 text-[11px] text-gray-500">
            <span className="text-xs">
              {new Date(item.createdAt).toLocaleDateString("ko-KR", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </span>
            <div className="flex items-center gap-2.5">
              <div className="flex items-center gap-1">
                <Heart size={15} />
                <span className="text-xs sm:text-sm">{item.likesCount.toLocaleString()}</span>
              </div>
              <span className="text-gray-600">|</span>
              <div className="flex items-center gap-1">
                <MessageCircle size={15} />
                <span className="text-xs sm:text-sm">{item.commentsCount.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </li>
  );
}
