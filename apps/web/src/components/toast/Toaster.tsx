'use client';

import React, { useEffect, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { toastStore, type ToastItem } from './toast-store';
import { LiquidGlassToast } from './LiquidGlassToast';

export const Toaster: React.FC = () => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    const unsubscribe = toastStore.subscribe((newToasts) => {
      setToasts(newToasts);
    });
    return () => unsubscribe();
  }, []);

  const handleDismiss = (id: string) => {
    toastStore.dismissToast(id);
  };

  return (
    <div
      aria-live="polite"
      aria-label="Thông báo hệ thống"
      className="fixed top-0 left-1/2 -translate-x-1/2 z-[99999] pointer-events-none flex flex-col items-center gap-2 w-full max-w-xl px-4 pt-0 select-none"
    >
      <AnimatePresence mode="popLayout">
        {toasts.map((toastItem) => (
          <LiquidGlassToast
            key={toastItem.id}
            toast={toastItem}
            onDismiss={handleDismiss}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};
