import Image from "next/image";
import Link from "next/link";
import Tag from "@/components/ui/atoms/tag";
import { Hash, PlayCircle, MessageCircle, Heart } from 'lucide-react';
import type { MusicListItem } from "@/types";

interface ListItemProps {
    item: MusicListItem;
};

export default function ListItem ({ item }: ListItemProps) {
    const coverImage = item.previewImages?.[0] ?? null;

    return (
        <li
            className="list-none rounded-xl border border-slate-800/70 bg-gradient-to-b from-[#101729] to-[#050816] p-4 shadow-[0_18px_45px_rgba(0,0,0,0.55)] transition-transform transition-colors duration-300 hover:-translate-y-1 hover:border-neon-green/40"
          >
            {/* 1. Link 연결: 종류에 따라 상세 페이지 주소 분기 */}
            <Link
              href={item.kind === 'PLAYLIST' ? `/playlist/${item.id}` : `/album/${item.id}`}
              className="group block relative"
            >
              <Tag variant="subtle">
                {item.kind === 'PLAYLIST' ? 'PLAYLIST' : 'ALBUMLIST'}
              </Tag>
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
                  {coverImage ? (
                    <Image src={coverImage} width={150} height={150} alt={item.title} className="rounded-xl object-cover aspect-square border-2 border-white/5" />
                  ) : (
                    <div className="flex h-[150px] w-[150px] items-center justify-center rounded-xl border-2 border-white/5 bg-white/5 text-xs text-gray-400">
                      NO IMAGE
                    </div>
                  )}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity rounded-xl group-hover:opacity-100">
                    <PlayCircle className="h-12 w-12 text-neon-green" />
                  </div>
                </div>
              </div>

              {/* --- 텍스트 정보 영역 --- */}
              <div className="space-y-3">
                <h3 className="truncate text-xl font-semibold text-white group-hover:text-neon-green transition-colors">
                  {item.title}
                </h3>
                <p className="line-clamp-2 text-lg leading-relaxed text-gray-400">
                  {item.story ?? ""}
                </p>

                {/* 태그 영역 */}
                <div className="flex flex-wrap gap-2 pt-1">
                  {item.tags?.map((tag: string) => (
                    <Tag key={tag} variant="neon" icon={<Hash size={10} className="mr-0.5" />}>
                      {tag}
                    </Tag>
                  ))}
                </div>

                <div className="flex items-center justify-between text-[11px] text-gray-500">
                  <span  className="text-xs">{new Date(item.createdAt).toLocaleDateString('ko-KR', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <Heart size={16}/>
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
    )
}
