'use client';

import React, { useEffect, useState, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import { toastStore, type ToastItem } from './toast-store';
import { LiquidGlassToast } from './LiquidGlassToast';

export const Toaster: React.FC = () => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [isAnyHovered, setIsAnyHovered] = useState(false);
  const [hoverResetKey, setHoverResetKey] = useState(0);
  const hoverEndTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const unsubscribe = toastStore.subscribe((newToasts) => {
      setToasts(newToasts);
    });
    return () => unsubscribe();
  }, []);

  const handleDismiss = (id: string) => {
    toastStore.dismissToast(id);
  };

  const handleHoverStart = () => {
    if (hoverEndTimeoutRef.current) {
      clearTimeout(hoverEndTimeoutRef.current);
      hoverEndTimeoutRef.current = null;
    }
    setIsAnyHovered(true);
    // When hovering on any notification, reset the countdown timer for all active toasts
    setHoverResetKey((prev) => prev + 1);
  };

  const handleHoverEnd = () => {
    if (hoverEndTimeoutRef.current) clearTimeout(hoverEndTimeoutRef.current);
    hoverEndTimeoutRef.current = setTimeout(() => {
      setIsAnyHovered(false);
    }, 120);
  };

  return (
    <div
      aria-live="polite"
      aria-label="Thông báo hệ thống"
      className="fixed top-0 left-1/2 -translate-x-1/2 z-[99999] pointer-events-none flex flex-col items-center gap-2 w-full max-w-xl px-4 pt-0 select-none"
    >
      <AnimatePresence mode="popLayout">
        {toasts.map((toastItem, index) => (
          <LiquidGlassToast
            key={toastItem.id}
            toast={toastItem}
            isTop={index === 0}
            isPaused={isAnyHovered}
            resetKey={hoverResetKey}
            onHoverStart={handleHoverStart}
            onHoverEnd={handleHoverEnd}
            onDismiss={handleDismiss}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};
