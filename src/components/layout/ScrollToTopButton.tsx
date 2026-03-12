'use client';

import { useEffect, useState } from 'react';
import { ChevronUp } from 'lucide-react';

export default function ScrollToTopButton() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY > 280);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <button
      type="button"
      onClick={scrollToTop}
      aria-label="맨 위로 가기"
      className={`fixed right-4 z-40 inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#39ff14]/40 bg-[#0a0f1c]/85 text-[#39ff14] shadow-[0_12px_30px_rgba(0,0,0,0.45)] backdrop-blur transition-all cursor-pointer hover:bg-[#39ff14]/15 md:bottom-6 md:right-6 ${
        isVisible
          ? 'bottom-[calc(5.5rem+env(safe-area-inset-bottom))] translate-y-0 opacity-100'
          : 'pointer-events-none bottom-[calc(4.5rem+env(safe-area-inset-bottom))] translate-y-3 opacity-0'
      }`}
    >
      <ChevronUp size={20} />
    </button>
  );
}
