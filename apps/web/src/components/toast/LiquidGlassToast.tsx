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
  index?: number;
  isTop?: boolean;
  isExpanded?: boolean;
  collapsedY?: number;
  isPaused?: boolean;
  resetKey?: number;
  onHoverStart?: () => void;
  onHoverEnd?: () => void;
  onHeightChange?: (id: string, height: number) => void;
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

const THEME_CONFIGS: Record<string, ThemeConfig> = {
  success: {
    accent: '#78C841', containerBg: 'bg-[#ECFCCB]/70', containerBorder: 'border-b-2 border-x-2 border-white/10',
    innerShadow: 'inset 0 0 20px rgba(101, 163, 13, 0.28)', badgeBg: 'bg-[#78C841]', badgeText: 'text-white',
    icon: <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.8] block shrink-0" />,
  },
  error: {
    accent: '#FB4141', containerBg: 'bg-[#FEE2E2]/70', containerBorder: 'border-b-2 border-x-2 border-white/10',
    innerShadow: 'inset 0 0 20px rgba(225, 29, 72, 0.22)', badgeBg: 'bg-[#FB4141]', badgeText: 'text-white',
    icon: <AlertCircle className="w-3.5 h-3.5 stroke-[2.8] block shrink-0" />,
  },
  warning: {
    accent: '#FF9B2F', containerBg: 'bg-[#FEF3C7]/70', containerBorder: 'border-b-2 border-x-2 border-white/10',
    innerShadow: 'inset 0 0 20px rgba(217, 119, 6, 0.24)', badgeBg: 'bg-[#FF9B2F]', badgeText: 'text-white',
    icon: <AlertTriangle className="w-3.5 h-3.5 stroke-[2.8] block shrink-0" />,
  },
  loading: {
    accent: '#0284C7', containerBg: 'bg-[#E0F2FE]/70', containerBorder: 'border-b-2 border-x-2 border-white/10',
    innerShadow: 'inset 0 0 20px rgba(2, 132, 199, 0.25)', badgeBg: 'bg-[#0284C7]', badgeText: 'text-white',
    icon: <Loader2 className="w-3.5 h-3.5 animate-spin text-white block shrink-0" />,
  },
  default: {
    accent: '#1A1A1A', containerBg: 'bg-gray-200/70', containerBorder: 'border-b-2 border-x-2 border-gray-300/80',
    innerShadow: 'inset 0 0 20px rgba(0, 0, 0, 0.09)', badgeBg: 'bg-zinc-800', badgeText: 'text-white',
    icon: <Sparkles className="w-3.5 h-3.5 stroke-[2.4] block shrink-0" />,
  },
};

function getThemeConfig(type: ToastType): ThemeConfig {
  return THEME_CONFIGS[type] || THEME_CONFIGS.default;
}

export const LiquidGlassToast = React.forwardRef<HTMLDivElement, LiquidGlassToastProps>(
  (
    {
      toast,
      index = 0,
      isTop = true,
      isExpanded = false,
      collapsedY,
      isPaused = false,
      resetKey = 0,
      onHoverStart,
      onHoverEnd,
      onHeightChange,
      onDismiss,
    },
    ref
  ) => {
    const { id, type, title, description, duration = 3500, action, dismissible = true } = toast;
    const isInline = Boolean(toast.inline && description && description.trim().length > 0);
    const isTwoLine = Boolean(!isInline && description && description.trim().length > 0);
    const isSingleLine = !isTwoLine;
    const cleanTitle = title.endsWith(':') ? title.slice(0, -1).trim() : title;
    const theme = getThemeConfig(type);

    const [isHovered, setIsHovered] = useState(false);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const remainingTimeRef = useRef<number>(duration);
    const startTimeRef = useRef<number>(Date.now());
    const containerRef = useRef<HTMLDivElement | null>(null);

    // Sonner-style stacking: purely vertical offset, scale stays 100% natural so it never narrows
    const isStacked = !isExpanded && index > 0;
    const targetY = isStacked ? (collapsedY ?? (index === 1 ? -40 : -80)) : 0;
    const targetOpacity = isStacked ? (index === 1 ? 0.94 : index === 2 ? 0.8 : 0) : 1;
    const toastZIndex = isStacked ? (index === 1 ? 40 : index === 2 ? 30 : 20) : 50 - index;

    // Check if inline description exceeds horizontal limit before hovering
    const descRef = useRef<HTMLSpanElement | null>(null);
    const [isOverflowing, setIsOverflowing] = useState(false);

    useEffect(() => {
      if (!isInline) return;

      if (isTest) {
        setIsOverflowing((cleanTitle.length + (description?.length || 0)) > 60);
        return;
      }

      const checkOverflow = () => {
        if (descRef.current && !isHovered) {
          const hasOverflow = descRef.current.scrollWidth > descRef.current.clientWidth + 1;
          setIsOverflowing(hasOverflow);
        }
      };

      const raf = requestAnimationFrame(checkOverflow);
      window.addEventListener('resize', checkOverflow);
      return () => {
        cancelAnimationFrame(raf);
        window.removeEventListener('resize', checkOverflow);
      };
    }, [isInline, isHovered, cleanTitle, description]);

    const shouldWrapInline = isInline && isHovered && isOverflowing;

    const springConfig = isTest
      ? { duration: 0 }
      : {
          type: 'spring' as const,
          stiffness: 150,
          damping: 18,
          mass: 0.7,
        };

    // Report height back to parent so collapsed stack offsets are mathematically exact
    useEffect(() => {
      if (containerRef.current) {
        const h = containerRef.current.offsetHeight;
        if (h > 0) onHeightChange?.(id, h);
      }
    }, [id, onHeightChange, isSingleLine, shouldWrapInline, title, description]);

    // When resetKey changes (hovering on ANY toast in the stack), reset timer back to full duration
    useEffect(() => {
      remainingTimeRef.current = duration;
      startTimeRef.current = Date.now();
    }, [resetKey, duration]);

    useEffect(() => {
      if (duration === Infinity) return;

      const shouldPause = isPaused || isHovered;

      if (!shouldPause) {
        startTimeRef.current = Date.now();
        timerRef.current = setTimeout(() => {
          onDismiss(id);
        }, remainingTimeRef.current);
      } else {
        if (timerRef.current) {
          clearTimeout(timerRef.current);
          timerRef.current = null;
          const elapsed = Date.now() - startTimeRef.current;
          remainingTimeRef.current = Math.max(0, remainingTimeRef.current - elapsed);
        }
      }

      return () => {
        if (timerRef.current) {
          clearTimeout(timerRef.current);
          timerRef.current = null;
        }
      };
    }, [id, duration, isPaused, isHovered, resetKey, onDismiss]);

    const combinedBoxShadow = `${theme.innerShadow}, ${COMMON_OUTER_SHADOW}`;
    const roundedClasses = isTop
      ? 'rounded-b-2xl sm:rounded-b-[26px] rounded-t-none'
      : 'rounded-2xl sm:rounded-[26px]';
    const borderClasses = isTop
      ? theme.containerBorder
      : theme.containerBorder.replace('border-b-2 border-x-2', 'border-2');
    const maxWClasses = isHovered
      ? 'max-w-[94vw] sm:max-w-xl md:max-w-2xl'
      : 'max-w-[92vw] sm:max-w-lg';
    const containerPadding = isSingleLine
      ? shouldWrapInline
        ? 'min-h-[40px] sm:min-h-[44px] py-2 sm:py-2.5'
        : 'h-10 sm:h-11'
      : 'py-2.5 sm:py-3';

    return (
      <motion.div
        ref={(node) => {
          if (typeof ref === 'function') ref(node);
          else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
          containerRef.current = node;
        }}
        layout
        data-liquid-toast
        data-toast-id={id}
        data-toast-type={type}
        data-toast-hovered={isHovered ? 'true' : undefined}
        data-toast-stacked={isStacked ? 'true' : undefined}
        initial={isTest ? false : { y: -64, opacity: 0 }}
        animate={
          isTest
            ? false
            : {
                y: targetY,
                opacity: targetOpacity,
              }
        }
        exit={isTest ? false : { y: -64, opacity: 0 }}
        transition={springConfig}
        onMouseEnter={() => {
          setIsHovered(true);
          onHoverStart?.();
        }}
        onMouseLeave={() => {
          setIsHovered(false);
          onHoverEnd?.();
        }}
        style={{
          boxShadow: combinedBoxShadow,
          zIndex: toastZIndex,
          pointerEvents: isStacked && index >= 3 ? 'none' : 'auto',
        }}
        className={`relative select-none overflow-hidden backdrop-blur-sm ${theme.containerBg} ${borderClasses} ${roundedClasses} transition-[background-color,border-color,border-radius] duration-300 w-auto min-w-[280px] ${maxWClasses}`}
      >
        {/* Main Toast Content Container */}
        <div
          className={`flex items-center justify-between gap-3 px-3.5 ${containerPadding}`}
        >
          {/* Left: Themed Icon Badge */}
          <div
            className={`flex gap-2.5 min-w-0 flex-1 ${
              isHovered && isTwoLine ? 'items-start pt-0.5' : 'items-center'
            }`}
          >
            <motion.div
              layout="position"
              className={`w-6 h-6 rounded-full grid place-items-center shrink-0 shadow-2xs leading-none p-0 m-0 ${theme.badgeBg} ${theme.badgeText}`}
            >
              {theme.icon}
            </motion.div>

            {/* Text Area: Single Line Inline vs Two-Line vs Title-Only */}
            <motion.div
              layout="position"
              className="flex flex-col justify-center min-w-0 flex-1 text-left"
            >
              {isInline ? (
                <motion.div
                  layout
                  transition={springConfig}
                  className={`min-w-0 ${
                    shouldWrapInline
                      ? 'flex flex-col gap-0.5'
                      : 'flex items-center gap-1.5 truncate'
                  }`}
                >
                  <motion.span
                    layout="position"
                    layoutId={`toast-inline-title-${id}`}
                    transition={springConfig}
                    className="font-extrabold text-xs sm:text-[13px] text-zinc-950 shrink-0 inline-block leading-tight"
                  >
                    {cleanTitle}:
                  </motion.span>
                  <motion.span
                    ref={descRef}
                    layout="position"
                    layoutId={`toast-inline-desc-${id}`}
                    transition={springConfig}
                    className={`text-[11px] sm:text-xs text-zinc-500 font-semibold leading-snug ${
                      shouldWrapInline
                        ? 'whitespace-normal break-words block'
                        : 'truncate inline-block'
                    }`}
                  >
                    {description}
                  </motion.span>
                </motion.div>
              ) : (
                <>
                  <div className="flex items-center gap-1.5 min-w-0">
                    <motion.span
                      layout="position"
                      layoutId={`toast-title-${id}`}
                      transition={springConfig}
                      className={`font-extrabold text-xs sm:text-[13px] text-zinc-950 tracking-tight leading-tight ${
                        isHovered ? 'whitespace-normal break-words' : 'truncate'
                      }`}
                    >
                      {title}
                    </motion.span>
                  </div>

                  {isTwoLine && (
                    <motion.p
                      layout="position"
                      layoutId={`toast-desc-${id}`}
                      transition={springConfig}
                      className={`text-[11px] sm:text-xs text-zinc-500 leading-snug mt-0.5 font-semibold ${
                        isHovered
                          ? 'line-clamp-none whitespace-normal break-words'
                          : 'line-clamp-2'
                      }`}
                    >
                      {description}
                    </motion.p>
                  )}
                </>
              )}
            </motion.div>
          </div>

          {/* Right side: Action Button & Dismiss Button */}
          <motion.div
            layout="position"
            className={`flex items-center gap-1.5 shrink-0 ml-1 ${
              isHovered && isTwoLine ? 'self-start pt-0.5' : ''
            }`}
          >
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
          </motion.div>
        </div>
      </motion.div>
    );
  }
);

LiquidGlassToast.displayName = 'LiquidGlassToast';
