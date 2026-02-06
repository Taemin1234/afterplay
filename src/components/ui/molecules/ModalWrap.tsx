"use client"

import { useEffect } from "react";

interface ModalWrapProps {
  children: React.ReactNode;
  onClose?: () => void;
}

export default function ModalWrap({ children, onClose }: ModalWrapProps) {

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div onClick={(e) => e.stopPropagation()} className="relative">
        {children}
      </div>
    </div>
    
  );
}