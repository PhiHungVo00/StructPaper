'use client';

/**
 * Liquid Glass Dynamic Island Notification System
 * Drop-in replacement for legacy Sileo toast with 100% backward compatibility
 */
export {
  toast,
  sileo,
  toastStore,
  type ToastType,
  type ToastItem,
  type ToastOptions,
  type ToastAction,
} from './toast/toast-store';

export { Toaster } from './toast/Toaster';
export { LiquidGlassToast } from './toast/LiquidGlassToast';
