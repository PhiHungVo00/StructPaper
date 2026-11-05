'use client';

import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
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
  containerBg: string;
  containerBorder: string;
  innerShadow: string;
  badgeBg: string;
  badgeText: string;
  icon: React.ReactNode;
}

const isTest = typeof process !== 'undefined' && process.env.NODE_ENV === 'test';

// Common neutral outer shadow for all themes
const COMMON_OUTER_SHADOW = '0 12px 28px rgba(0, 0, 0, 0.09), 0 2px 6px rgba(0, 0, 0, 0.04)';

function getThemeConfig(type: ToastType): ThemeConfig {
  switch (type) {
    case 'success':
      return {
        accent: '#78C841',
        containerBg: 'bg-[#ECFCCB]',
        containerBorder: 'border-b-2 border-x-2 border-[#B4E50D]/80',
        innerShadow: 'inset 0 0 20px rgba(101, 163, 13, 0.28)',
        badgeBg: 'bg-[#78C841]',
        badgeText: 'text-white',
        icon: <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.8]" />,
      };
    case 'error':
      return {
        accent: '#FB4141',
        containerBg: 'bg-[#FEE2E2]',
        containerBorder: 'border-b-2 border-x-2 border-rose-300',
        innerShadow: 'inset 0 0 20px rgba(225, 29, 72, 0.22)',
        badgeBg: 'bg-[#FB4141]',
        badgeText: 'text-white',
        icon: <AlertCircle className="w-3.5 h-3.5 stroke-[2.8]" />,
      };
    case 'warning':
      return {
        accent: '#FF9B2F',
        containerBg: 'bg-[#FEF3C7]',
        containerBorder: 'border-b-2 border-x-2 border-amber-300',
        innerShadow: 'inset 0 0 20px rgba(217, 119, 6, 0.24)',
        badgeBg: 'bg-[#FF9B2F]',
        badgeText: 'text-white',
        icon: <AlertTriangle className="w-3.5 h-3.5 stroke-[2.8]" />,
      };
    case 'loading':
      return {
        accent: '#78C841',
        containerBg: 'bg-[#ECFCCB]',
        containerBorder: 'border-b-2 border-x-2 border-[#B4E50D]/80',
        innerShadow: 'inset 0 0 20px rgba(101, 163, 13, 0.28)',
        badgeBg: 'bg-[#78C841]',
        badgeText: 'text-white',
        icon: <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />,
      };
    case 'info':
    case 'default':
    default:
      return {
        accent: '#1A1A1A',
        containerBg: 'bg-gray-200/50',
        containerBorder: 'border-b-2 border-x-2 border-gray-300/80',
        innerShadow: 'inset 0 0 20px rgba(0, 0, 0, 0.09)',
        badgeBg: 'bg-zinc-800',
        badgeText: 'text-white',
        icon: <Sparkles className="w-3.5 h-3.5 stroke-[2.4]" />,
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

    const combinedBoxShadow = `${theme.innerShadow}, ${COMMON_OUTER_SHADOW}`;

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
        style={{ boxShadow: combinedBoxShadow }}
        className={`pointer-events-auto select-none relative overflow-hidden backdrop-blur-md ${theme.containerBg} ${theme.containerBorder} rounded-b-2xl sm:rounded-b-[26px] rounded-t-none transition-[background-color,border-color] duration-300 w-auto min-w-[280px] max-w-[92vw] sm:max-w-lg`}
      >
        {/* Specular glass highlight reflection at top edge */}
        <div className="absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-white/80 to-transparent pointer-events-none" />

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

            {/* Text Area: Title in Black, Description in Gray */}
            <div className="flex flex-col justify-center min-w-0 flex-1 text-left">
              <div className="flex items-center gap-1.5 min-w-0">
                <span
                  className="font-extrabold text-xs sm:text-[13px] text-zinc-950 truncate tracking-tight leading-tight"
                >
                  {title}
                </span>
              </div>

              {isTwoLine && (
                <p className="text-[11px] sm:text-xs text-zinc-600 line-clamp-2 leading-snug mt-0.5 font-medium">
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
                className="px-2.5 py-1 rounded-xl text-[11px] font-extrabold bg-zinc-950 text-white hover:bg-zinc-800 transition-colors cursor-pointer shadow-2xs"
              >
                {action.label}
              </button>
            )}

            {dismissible && (
              <button
                type="button"
                data-testid="toast-dismiss-button"
                onClick={() => onDismiss(id)}
                className="w-6 h-6 rounded-full bg-black/5 hover:bg-black/10 text-zinc-500 hover:text-zinc-950 flex items-center justify-center transition-all cursor-pointer"
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
