'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Navigation } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';
import PollCard from '@/components/polls/PollCard';
import type { PollListItem } from '@/components/polls/types';

import 'swiper/css';
import 'swiper/css/navigation';

type PollCarouselProps = {
  title: string;
  items: PollListItem[];
  navId: string;
};

export default function PollCarousel({ title, items, navId }: PollCarouselProps) {
  if (items.length === 0) return null;

  const previousClass = `${navId}-prev`;
  const nextClass = `${navId}-next`;

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-white">{title}</h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className={`${previousClass} inline-flex h-9 w-9 items-center justify-center rounded-md border border-white/10 bg-bg2 text-slate-200 transition-colors hover:border-point/50 hover:text-point disabled:cursor-not-allowed disabled:opacity-40`}
            aria-label={`${title} 이전`}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            className={`${nextClass} inline-flex h-9 w-9 items-center justify-center rounded-md border border-white/10 bg-bg2 text-slate-200 transition-colors hover:border-point/50 hover:text-point disabled:cursor-not-allowed disabled:opacity-40`}
            aria-label={`${title} 다음`}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <Swiper
        modules={[Navigation]}
        navigation={{
          prevEl: `.${previousClass}`,
          nextEl: `.${nextClass}`,
        }}
        slidesPerView={1.2}
        spaceBetween={14}
        watchOverflow
        preventClicks
        preventClicksPropagation
        breakpoints={{
          640: {
            slidesPerView: 2.2,
            spaceBetween: 16,
          },
          1024: {
            slidesPerView: 3,
            spaceBetween: 18,
          },
        }}
        className="overflow-hidden!"
      >
        {items.map((item) => (
          <SwiperSlide key={item.id} className="h-auto">
            <PollCard poll={item} />
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  );
}
