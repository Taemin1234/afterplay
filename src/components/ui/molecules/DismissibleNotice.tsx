'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';

type NoticeVariant = 'success' | 'error';

interface DismissibleNoticeProps {
  children: React.ReactNode;
  autoHideMs?: number;
  variant?: NoticeVariant;
}

const variantStyles: Record<NoticeVariant, string> = {
  success: 'border-[#1DB954]/30 bg-[#1DB954]/10 text-[#1DB954]',
  error: 'border-red-500/40 bg-red-500/10 text-red-200',
};

export default function DismissibleNotice({
  children,
  autoHideMs,
  variant = 'success',
}: DismissibleNoticeProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (!autoHideMs) return;

    const timer = window.setTimeout(() => {
      setIsVisible(false);
    }, autoHideMs);

    return () => window.clearTimeout(timer);
  }, [autoHideMs]);

  if (!isVisible) return null;

  return (
    <div
      className={`mt-3 flex items-center justify-between gap-3 rounded-md border px-3 py-2 text-sm ${variantStyles[variant]}`}
    >
      <p>{children}</p>
      <button
        type="button"
        onClick={() => setIsVisible(false)}
        className="inline-flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded-md transition-colors hover:bg-white/10"
        aria-label="알림 닫기"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
