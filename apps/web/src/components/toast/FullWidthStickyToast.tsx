'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Loader2,
  Info,
  Sparkles,
  X,
} from 'lucide-react';
import type { ToastItem, ToastType } from './toast-store';

export interface FullWidthStickyToastProps {
  toast: ToastItem;
  onDismiss: (id: string) => void;
}

interface ThemeConfig {
  accent: string;
  containerBg: string;
  badgeBg: string;
  badgeText: string;
  textColor: string;
  descColor: string;
  icon: React.ReactNode;
}

const isTest = typeof process !== 'undefined' && process.env.NODE_ENV === 'test';

const THEME_CONFIGS: Record<string, ThemeConfig> = {
  success: {
    accent: '#78C841',
    containerBg: 'bg-[#ECFCCB]/85 dark:bg-[#142908]/90',
    badgeBg: 'bg-[#78C841]',
    badgeText: 'text-white',
    textColor: 'text-zinc-950 dark:text-lime-100',
    descColor: 'text-zinc-700 dark:text-lime-200/80',
    icon: <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.8] block shrink-0" />,
  },
  error: {
    accent: '#FB4141',
    containerBg: 'bg-[#FEE2E2]/85 dark:bg-[#340b0b]/90',
    badgeBg: 'bg-[#FB4141]',
    badgeText: 'text-white',
    textColor: 'text-zinc-950 dark:text-red-100',
    descColor: 'text-zinc-700 dark:text-red-200/80',
    icon: <AlertCircle className="w-3.5 h-3.5 stroke-[2.8] block shrink-0" />,
  },
  warning: {
    accent: '#FF9B2F',
    containerBg: 'bg-[#FEF3C7]/85 dark:bg-[#351e06]/90',
    badgeBg: 'bg-[#FF9B2F]',
    badgeText: 'text-white',
    textColor: 'text-zinc-950 dark:text-amber-100',
    descColor: 'text-zinc-700 dark:text-amber-200/80',
    icon: <AlertTriangle className="w-3.5 h-3.5 stroke-[2.8] block shrink-0" />,
  },
  loading: {
    accent: '#0284C7',
    containerBg: 'bg-[#E0F2FE]/85 dark:bg-[#08283d]/90',
    badgeBg: 'bg-[#0284C7]',
    badgeText: 'text-white',
    textColor: 'text-zinc-950 dark:text-sky-100',
    descColor: 'text-zinc-700 dark:text-sky-200/80',
    icon: <Loader2 className="w-3.5 h-3.5 animate-spin text-white block shrink-0" />,
  },
  info: {
    accent: '#0284C7',
    containerBg: 'bg-[#E0F2FE]/85 dark:bg-[#08283d]/90',
    badgeBg: 'bg-[#0284C7]',
    badgeText: 'text-white',
    textColor: 'text-zinc-950 dark:text-sky-100',
    descColor: 'text-zinc-700 dark:text-sky-200/80',
    icon: <Info className="w-3.5 h-3.5 stroke-[2.6] block shrink-0" />,
  },
  default: {
    accent: '#1A1A1A',
    containerBg: 'bg-white/85 dark:bg-zinc-900/90',
    badgeBg: 'bg-zinc-800 dark:bg-zinc-700',
    badgeText: 'text-white',
    textColor: 'text-zinc-950 dark:text-zinc-100',
    descColor: 'text-zinc-600 dark:text-zinc-300',
    icon: <Sparkles className="w-3.5 h-3.5 stroke-[2.4] block shrink-0" />,
  },
};

function getThemeConfig(type: ToastType): ThemeConfig {
  return THEME_CONFIGS[type] || THEME_CONFIGS.default;
}

export const FullWidthStickyToast = React.forwardRef<HTMLDivElement, FullWidthStickyToastProps>(
  ({ toast, onDismiss }, ref) => {
    const { id, type, title, description, action, dismissible = true } = toast;
    const cleanTitle = title.endsWith(':') ? title.slice(0, -1).trim() : title;
    const theme = getThemeConfig(type);

    return (
      <motion.div
        ref={ref}
        role="alert"
        data-sticky-toast
        data-toast-id={id}
        data-toast-type={type}
        data-toast-variant="full-width-sticky"
        initial={isTest ? false : { y: -48, opacity: 0 }}
        animate={isTest ? undefined : { y: 0, opacity: 1 }}
        exit={isTest ? undefined : { y: -48, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        className={`w-full h-10 sm:h-11 backdrop-blur-md ${theme.containerBg} border-b border-black/10 dark:border-white/10 shadow-xs flex items-center justify-between px-3.5 sm:px-6 relative select-none pointer-events-auto`}
      >
        {/* Left: Themed Icon Badge & Single-Line Text */}
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div
            className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full grid place-items-center shrink-0 shadow-2xs leading-none p-0 m-0 ${theme.badgeBg} ${theme.badgeText}`}
          >
            {theme.icon}
          </div>

          <div className="flex items-center gap-2 min-w-0 flex-1 truncate text-left">
            <span
              className={`font-extrabold text-xs sm:text-[13px] tracking-tight shrink-0 leading-tight ${theme.textColor}`}
            >
              {cleanTitle}
            </span>

            {description && (
              <>
                <span className="text-zinc-400 dark:text-zinc-500 text-xs shrink-0 select-none">
                  ·
                </span>
                <span
                  className={`text-[11px] sm:text-xs font-medium truncate leading-tight ${theme.descColor}`}
                >
                  {description}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Right: Action Button & Dismiss Button */}
        <div className="flex items-center gap-2 shrink-0 ml-2">
          {action && (
            <button
              type="button"
              onClick={() => {
                action.onClick();
                onDismiss(id);
              }}
              className="px-2.5 py-1 rounded-lg text-[11px] font-extrabold bg-zinc-950 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200 transition-colors cursor-pointer shadow-2xs"
            >
              {action.label}
            </button>
          )}

          {dismissible && (
            <button
              type="button"
              data-testid="sticky-toast-dismiss-button"
              onClick={() => onDismiss(id)}
              className="w-6 h-6 rounded-full bg-black/5 hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/20 text-zinc-600 hover:text-zinc-950 dark:text-zinc-300 dark:hover:text-white flex items-center justify-center transition-all cursor-pointer"
              title="Đóng thông báo"
              aria-label="Đóng thông báo"
            >
              <X className="w-3.5 h-3.5 stroke-[2.4]" />
            </button>
          )}
        </div>
      </motion.div>
    );
  }
);

FullWidthStickyToast.displayName = 'FullWidthStickyToast';
