'use client';

import { useEffect, useState } from 'react';
import { ChevronUp } from 'lucide-react';

export default function ScrollToTopButton() {
  const [isVisible, setIsVisible] = useState(false);
  const [isFooterVisible, setIsFooterVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY > 280);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const footer = document.querySelector('[data-site-footer]');
    if (!footer) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsFooterVisible(Boolean(entry?.isIntersecting));
      },
      { threshold: 0.05 }
    );

    observer.observe(footer);
    return () => observer.disconnect();
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const visiblePosition = isFooterVisible
    ? 'bottom-[calc(7.25rem+env(safe-area-inset-bottom))] md:bottom-28'
    : 'bottom-[calc(5.5rem+env(safe-area-inset-bottom))] md:bottom-6';
  const hiddenPosition = isFooterVisible
    ? 'bottom-[calc(6.25rem+env(safe-area-inset-bottom))] md:bottom-24'
    : 'bottom-[calc(4.5rem+env(safe-area-inset-bottom))] md:bottom-6';

  return (
    <button
      type="button"
      onClick={scrollToTop}
      aria-label="맨 위로 가기"
      className={`fixed right-4 z-40 inline-flex h-11 w-11 items-center justify-center rounded-full border border-point/40 bg-app-bg/85 text-point shadow-[0_12px_30px_rgba(0,0,0,0.45)] backdrop-blur transition-all cursor-pointer hover:bg-point/15 md:right-6 ${
        isVisible
          ? `${visiblePosition} translate-y-0 opacity-100`
          : `pointer-events-none ${hiddenPosition} translate-y-3 opacity-0`
      }`}
    >
      <ChevronUp size={20} />
    </button>
  );
}
