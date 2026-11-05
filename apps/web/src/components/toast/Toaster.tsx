'use client';

import React, { useEffect, useState, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import { toastStore, type ToastItem } from './toast-store';
import { LiquidGlassToast } from './LiquidGlassToast';

export const Toaster: React.FC = () => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [isAnyHovered, setIsAnyHovered] = useState(false);
  const [hoverResetKey, setHoverResetKey] = useState(0);
  const [toastHeights, setToastHeights] = useState<Record<string, number>>({});
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

  const handleHeightChange = (id: string, h: number) => {
    setToastHeights((prev) => (prev[id] === h ? prev : { ...prev, [id]: h }));
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
    }, 150);
  };

  return (
    <div
      aria-live="polite"
      aria-label="Thông báo hệ thống"
      className="fixed top-0 left-1/2 -translate-x-1/2 z-[99999] pointer-events-none flex flex-col items-center gap-2 w-full max-w-xl px-4 pt-0 select-none"
    >
      <AnimatePresence mode="popLayout">
        {toasts.map((toastItem, index) => {
          let collapsedY = 0;
          if (index === 1) {
            const h1 = toastHeights[toastItem.id] || 44;
            collapsedY = -(h1 + 8) + 12;
          } else if (index === 2) {
            const h1 = toastHeights[toasts[1]?.id] || 44;
            const h2 = toastHeights[toastItem.id] || 44;
            collapsedY = -(h1 + h2 + 16) + 22;
          } else if (index >= 3) {
            const h1 = toastHeights[toasts[1]?.id] || 44;
            const h2 = toastHeights[toasts[2]?.id] || 44;
            collapsedY = -(h1 + h2 + 16) + 28;
          }

          return (
            <LiquidGlassToast
              key={toastItem.id}
              toast={toastItem}
              index={index}
              isTop={index === 0}
              isExpanded={isAnyHovered}
              collapsedY={collapsedY}
              isPaused={isAnyHovered}
              resetKey={hoverResetKey}
              onHoverStart={handleHoverStart}
              onHoverEnd={handleHoverEnd}
              onHeightChange={handleHeightChange}
              onDismiss={handleDismiss}
            />
          );
        })}
      </AnimatePresence>
    </div>
  );
};
