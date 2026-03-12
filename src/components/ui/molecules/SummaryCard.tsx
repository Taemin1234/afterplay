import type { ReactNode } from 'react';

export interface SummaryCardItem {
  label: string;
  value: string;
  hint: string;
  icon: ReactNode;
}

type SummaryCardProps = SummaryCardItem;

export default function SummaryCard({ label, value, hint, icon }: SummaryCardProps) {
  return (
    <article className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 sm:p-5">
      <p className="flex items-center gap-1 text-xs text-gray-400 sm:text-sm">
        {icon}
        {label}
      </p>
      <p className="mt-2 text-xl font-bold text-white sm:text-2xl">{value}</p>
      <p className="mt-2 text-xs text-gray-500">{hint}</p>
    </article>
  );
}
