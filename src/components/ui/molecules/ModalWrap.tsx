"use client"

import { useEffect } from "react";

interface ModalWrapProps {
  children: React.ReactNode;
  onClose?: () => void;
}

export default function ModalWrap({ children, onClose }: ModalWrapProps) {

  useEffect(() => {
    document.body.style.overflow = 'hidden';

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = 'auto';
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
    >
      <div onClick={(e) => e.stopPropagation()} className="relative h-full max-w-2/3 w-full py-8">
        {children}
      </div>
    </div>

  );
}