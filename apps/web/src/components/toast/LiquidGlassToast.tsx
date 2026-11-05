'use client';

import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Info,
  Loader2,
  X,
  Sparkles,
} from 'lucide-react';
import type { ToastItem, ToastType } from './toast-store';

interface LiquidGlassToastProps {
  toast: ToastItem;
  onDismiss: (id: string) => void;
}

interface ThemeConfig {
  accent: string;
  badgeBg: string;
  badgeText: string;
  glowShadow: string;
  icon: React.ReactNode;
  defaultBadge: string;
}

const isTest = typeof process !== 'undefined' && process.env.NODE_ENV === 'test';

function getThemeConfig(type: ToastType): ThemeConfig {
  switch (type) {
    case 'success':
      return {
        accent: '#78C841',
        badgeBg: 'bg-[#D9F99D]/70 border border-[#B4E50D]/50',
        badgeText: 'text-[#14532D]',
        glowShadow: 'shadow-[0_12px_32px_rgba(120,200,65,0.22),0_2px_8px_rgba(120,200,65,0.12)]',
        icon: <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.8]" />,
        defaultBadge: 'Thành công',
      };
    case 'error':
      return {
        accent: '#FB4141',
        badgeBg: 'bg-rose-100/80 border border-rose-300/60',
        badgeText: 'text-rose-800',
        glowShadow: 'shadow-[0_12px_32px_rgba(251,65,65,0.20),0_2px_8px_rgba(251,65,65,0.10)]',
        icon: <AlertCircle className="w-3.5 h-3.5 stroke-[2.8]" />,
        defaultBadge: 'Lỗi',
      };
    case 'warning':
      return {
        accent: '#FF9B2F',
        badgeBg: 'bg-amber-100/80 border border-amber-300/60',
        badgeText: 'text-amber-900',
        glowShadow: 'shadow-[0_12px_32px_rgba(255,155,47,0.22),0_2px_8px_rgba(255,155,47,0.12)]',
        icon: <AlertTriangle className="w-3.5 h-3.5 stroke-[2.8]" />,
        defaultBadge: 'Cảnh báo',
      };
    case 'loading':
      return {
        accent: '#78C841',
        badgeBg: 'bg-lime-100/70 border border-lime-300/50',
        badgeText: 'text-lime-900',
        glowShadow: 'shadow-[0_12px_32px_rgba(120,200,65,0.16),0_2px_8px_rgba(0,0,0,0.06)]',
        icon: <Loader2 className="w-3.5 h-3.5 animate-spin text-[#78C841]" />,
        defaultBadge: 'Đang xử lý',
      };
    case 'info':
    case 'default':
    default:
      return {
        accent: '#1A1A1A',
        badgeBg: 'bg-zinc-100/90 border border-zinc-200/80',
        badgeText: 'text-zinc-800',
        glowShadow: 'shadow-[0_12px_32px_rgba(0,0,0,0.10),0_2px_8px_rgba(0,0,0,0.05)]',
        icon: <Sparkles className="w-3.5 h-3.5 stroke-[2.4]" />,
        defaultBadge: 'Thông báo',
      };
  }
}

export const LiquidGlassToast = React.forwardRef<HTMLDivElement, LiquidGlassToastProps>(
  ({ toast, onDismiss }, ref) => {
    const { id, type, title, description, duration = 3500, action, dismissible = true } = toast;
    const isTwoLine = Boolean(description && description.trim().length > 0);
    const theme = getThemeConfig(type);

    const [isHovered, setIsHovered] = useState(false);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const remainingTimeRef = useRef<number>(duration);
    const startTimeRef = useRef<number>(Date.now());

    useEffect(() => {
      if (duration === Infinity || isTest) return;

      const startTimer = () => {
        startTimeRef.current = Date.now();
        timerRef.current = setTimeout(() => {
          onDismiss(id);
        }, remainingTimeRef.current);
      };

      if (!isHovered) {
        startTimer();
      } else {
        if (timerRef.current) {
          clearTimeout(timerRef.current);
          const elapsed = Date.now() - startTimeRef.current;
          remainingTimeRef.current = Math.max(0, remainingTimeRef.current - elapsed);
        }
      }

      return () => {
        if (timerRef.current) clearTimeout(timerRef.current);
      };
    }, [id, duration, isHovered, onDismiss]);

    return (
      <motion.div
        ref={ref}
        layout
        data-liquid-toast
        data-toast-id={id}
        data-toast-type={type}
        initial={isTest ? false : { y: -52, opacity: 0, scale: 0.96 }}
        animate={isTest ? false : { y: 0, opacity: 1, scale: 1 }}
        exit={isTest ? false : { y: -56, opacity: 0, scale: 0.95 }}
        transition={
          isTest
            ? { duration: 0 }
            : {
                type: 'spring',
                stiffness: 440,
                damping: 28,
                mass: 0.7,
              }
        }
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`pointer-events-auto select-none relative overflow-hidden backdrop-blur-xl bg-white/80 dark:bg-zinc-900/85 border-b-2 border-x-2 border-white/80 dark:border-white/10 rounded-b-2xl sm:rounded-b-[26px] rounded-t-none transition-shadow duration-300 ${theme.glowShadow} w-auto min-w-[280px] max-w-[92vw] sm:max-w-lg shadow-[inset_0_1px_1px_rgba(255,255,255,0.95)]`}
      >
        {/* Specular glass highlight reflection at top edge */}
        <div className="absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-white/90 to-transparent pointer-events-none" />

        {/* Main Toast Content Container */}
        <div
          className={`flex items-center justify-between gap-3 px-3.5 transition-all ${
            isTwoLine ? 'py-2.5 sm:py-3' : 'h-10 sm:h-11'
          }`}
        >
          {/* Left: Themed Icon Badge */}
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 shadow-2xs ${theme.badgeBg} ${theme.badgeText}`}
            >
              {theme.icon}
            </div>

            {/* Text Area (Single line vs Two line) */}
            <div className="flex flex-col justify-center min-w-0 flex-1 text-left">
              <div className="flex items-center gap-1.5 min-w-0">
                <span
                  className={`font-extrabold text-xs sm:text-[13px] text-zinc-900 dark:text-zinc-100 truncate tracking-tight leading-tight`}
                >
                  {title}
                </span>
              </div>

              {isTwoLine && (
                <p className="text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 leading-snug mt-0.5 font-medium">
                  {description}
                </p>
              )}
            </div>
          </div>

          {/* Right side: Action Button & Dismiss Button */}
          <div className="flex items-center gap-1.5 shrink-0 ml-1">
            {action && (
              <button
                type="button"
                onClick={() => {
                  action.onClick();
                  onDismiss(id);
                }}
                className="px-2.5 py-1 rounded-xl text-[11px] font-extrabold bg-[#78C841] text-zinc-950 hover:bg-[#6cb43a] transition-colors cursor-pointer shadow-2xs"
              >
                {action.label}
              </button>
            )}

            {dismissible && (
              <button
                type="button"
                data-testid="toast-dismiss-button"
                onClick={() => onDismiss(id)}
                className="w-6 h-6 rounded-full bg-zinc-200/50 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 flex items-center justify-center transition-all cursor-pointer"
                title="Đóng thông báo"
                aria-label="Đóng thông báo"
              >
                <X className="w-3.5 h-3.5 stroke-[2.4]" />
              </button>
            )}
          </div>
        </div>
      </motion.div>
    );
  }
);

LiquidGlassToast.displayName = 'LiquidGlassToast';
