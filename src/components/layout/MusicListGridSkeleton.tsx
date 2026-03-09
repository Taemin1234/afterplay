type MusicListGridSkeletonProps = {
  count?: number;
};

function SkeletonCard() {
  return (
    <li className="list-none rounded-xl border border-slate-800/70 bg-gradient-to-b from-[#101729] to-[#050816] p-3 shadow-[0_18px_45px_rgba(0,0,0,0.55)] sm:p-4">
      <div className="flex h-full flex-col justify-between gap-4 animate-pulse">
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div className="h-6 w-24 rounded-full bg-white/10" />
            <div className="h-4 w-20 rounded bg-white/10" />
          </div>
          <div className="h-40 rounded-xl border border-white/5 bg-white/5 sm:h-48" />
          <div className="space-y-2">
            <div className="h-5 w-3/4 rounded bg-white/10" />
            <div className="h-4 w-full rounded bg-white/10" />
            <div className="h-4 w-2/3 rounded bg-white/10" />
          </div>
        </div>
        <div className="space-y-3">
          <div className="flex gap-2">
            <div className="h-5 w-14 rounded-full bg-white/10" />
            <div className="h-5 w-16 rounded-full bg-white/10" />
          </div>
          <div className="h-6 rounded border-t border-slate-800/70 bg-white/5" />
        </div>
      </div>
    </li>
  );
}

export default function MusicListGridSkeleton({ count = 8 }: MusicListGridSkeletonProps) {
  return (
    <ul
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 lg:gap-6 xl:grid-cols-4"
      aria-label="Loading music lists"
    >
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonCard key={`music-list-skeleton-${index}`} />
      ))}
    </ul>
  );
}
