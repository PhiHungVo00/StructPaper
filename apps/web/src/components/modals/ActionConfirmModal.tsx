'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { X, Loader2 } from 'lucide-react';
import { ModalPortal } from '@/components/modals/ModalPortal';

export type ActionConfirmVariant = 'danger' | 'warning' | 'info' | 'success';

export interface ActionConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  variant?: ActionConfirmVariant;
  title: string;
  description: React.ReactNode;
  previewCard?: React.ReactNode;
  cancelLabel?: string;
  confirmLabel?: string;
  confirmIcon?: React.ReactNode;
  isLoading?: boolean;
  zIndex?: number;
  testId?: string;
  confirmTestId?: string;
}

const isTest = typeof process !== 'undefined' && process.env.NODE_ENV === 'test';

export const ActionConfirmModal: React.FC<ActionConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  variant = 'warning',
  title,
  description,
  previewCard,
  cancelLabel = 'Hủy bỏ',
  confirmLabel = 'Xác nhận',
  confirmIcon,
  isLoading = false,
  zIndex = 110,
  testId = 'action-confirm-modal',
  confirmTestId = 'action-confirm-submit-btn',
}) => {
  // Render corresponding 3D glossy badge icon based on variant
  const renderGlossyBadge = () => {
    switch (variant) {
      case 'danger':
        return (
          <div className="w-24 h-24 rounded-full bg-gradient-to-b from-red-50 to-red-100/70 ring-8 ring-red-50/60 flex items-center justify-center shadow-inner">
            <svg
              className="w-12 h-12 text-[#FF3B30] drop-shadow-[0_4px_10px_rgba(239,68,68,0.35)]"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient id="dangerRedGlow" x1="12" y1="2" x2="12" y2="22" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#FF453A" />
                  <stop offset="1" stopColor="#D70015" />
                </linearGradient>
                <filter id="softRedGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="0.8" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>
              <path
                d="M12 4.2C10.9 4.2 10.1 5.1 10.2 6.2L10.9 14.2C11 14.8 11.4 15.2 12 15.2C12.6 15.2 13 14.8 13.1 14.2L13.8 6.2C13.9 5.1 13.1 4.2 12 4.2Z"
                fill="url(#dangerRedGlow)"
                filter="url(#softRedGlow)"
              />
              <circle cx="12" cy="18.8" r="1.8" fill="url(#dangerRedGlow)" filter="url(#softRedGlow)" />
            </svg>
          </div>
        );

      case 'info':
        return (
          <div className="w-24 h-24 rounded-full bg-gradient-to-b from-blue-50 to-blue-100/70 ring-8 ring-blue-50/60 flex items-center justify-center shadow-inner">
            <svg
              className="w-12 h-12 text-[#3B82F6] drop-shadow-[0_4px_10px_rgba(59,130,246,0.35)]"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient id="infoBlueGlow" x1="12" y1="2" x2="12" y2="22" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#60A5FA" />
                  <stop offset="1" stopColor="#2563EB" />
                </linearGradient>
              </defs>
              <circle cx="12" cy="5.2" r="1.8" fill="url(#infoBlueGlow)" />
              <path
                d="M12 9.8C10.9 9.8 10.1 10.7 10.2 11.8L10.9 19.8C11 20.4 11.4 20.8 12 20.8C12.6 20.8 13 20.4 13.1 19.8L13.8 11.8C13.9 10.7 13.1 9.8 12 9.8Z"
                fill="url(#infoBlueGlow)"
              />
            </svg>
          </div>
        );

      case 'success':
        return (
          <div className="w-24 h-24 rounded-full bg-gradient-to-b from-lime-50 to-lime-100/70 ring-8 ring-lime-50/60 flex items-center justify-center shadow-inner">
            <svg
              className="w-12 h-12 text-[#78C841] drop-shadow-[0_4px_10px_rgba(120,200,65,0.35)]"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient id="successGreenGlow" x1="12" y1="2" x2="12" y2="22" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#A3E635" />
                  <stop offset="1" stopColor="#65A30D" />
                </linearGradient>
              </defs>
              <path
                d="M5 13L9 17L19 7"
                stroke="url(#successGreenGlow)"
                strokeWidth="3.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        );

      case 'warning':
      default:
        return (
          <div className="w-24 h-24 rounded-full bg-gradient-to-b from-amber-50 to-amber-100/70 ring-8 ring-amber-50/60 flex items-center justify-center shadow-inner">
            <svg
              className="w-12 h-12 text-[#F59E0B] drop-shadow-[0_4px_10px_rgba(245,158,11,0.35)]"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient id="amberExclamationGlow" x1="12" y1="2" x2="12" y2="22" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#FBBF24" />
                  <stop offset="1" stopColor="#D97706" />
                </linearGradient>
                <filter id="softAmberGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="0.8" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>
              <path
                d="M12 4.2C10.9 4.2 10.1 5.1 10.2 6.2L10.9 14.2C11 14.8 11.4 15.2 12 15.2C12.6 15.2 13 14.8 13.1 14.2L13.8 6.2C13.9 5.1 13.1 4.2 12 4.2Z"
                fill="url(#amberExclamationGlow)"
                filter="url(#softAmberGlow)"
              />
              <circle cx="12" cy="18.8" r="1.8" fill="url(#amberExclamationGlow)" filter="url(#softAmberGlow)" />
            </svg>
          </div>
        );
    }
  };

  // Button styling mapping by variant
  const getConfirmButtonClasses = () => {
    switch (variant) {
      case 'danger':
        return 'bg-[#FF3B30] hover:bg-red-600 text-white shadow-lg shadow-red-500/25 hover:shadow-red-500/40';
      case 'info':
        return 'bg-[#3B82F6] hover:bg-blue-600 text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40';
      case 'success':
        return 'bg-[#78C841] hover:bg-[#6cb43a] text-zinc-950 shadow-lg shadow-[#78C841]/25 hover:shadow-[#78C841]/40';
      case 'warning':
      default:
        return 'bg-[#F59E0B] hover:bg-[#D97706] text-white shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40';
    }
  };

  return (
    <ModalPortal isOpen={isOpen} onClose={onClose} zIndex={zIndex}>
      <motion.div
        data-testid={testId}
        initial={isTest ? undefined : { opacity: 0, scale: 0.9, y: 30 }}
        animate={isTest ? undefined : { opacity: 1, scale: 1, y: 0 }}
        exit={
          isTest
            ? undefined
            : {
                opacity: 0,
                scale: 0.9,
                y: 30,
                transition: { duration: 0.22, ease: [0.32, 0, 0.67, 0] },
              }
        }
        transition={isTest ? { duration: 0 } : { type: 'spring', damping: 25, stiffness: 200 }}
        className="bg-white w-full max-w-[440px] rounded-[40px] p-7 shadow-2xl border border-slate-100 flex flex-col items-center relative overflow-hidden select-none"
      >
        {/* Top-Right Round Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
          aria-label="Đóng"
        >
          <X className="w-4 h-4" />
        </button>

        {/* 3D Glossy Icon Centerpiece */}
        <div className="relative mt-2 mb-4 flex items-center justify-center">
          {renderGlossyBadge()}
        </div>

        {/* Modal Heading */}
        <h3 className="text-xl font-black text-slate-900 text-center tracking-tight mb-3">
          {title}
        </h3>

        {/* Optional Preview Card */}
        {previewCard && (
          <div className="w-full mb-3">
            {previewCard}
          </div>
        )}

        {/* Description / Explanation Text */}
        <div className="text-xs text-slate-500 text-center leading-relaxed mb-6 px-2">
          {description}
        </div>

        {/* Action Buttons: Cancel vs Confirm */}
        <div className="w-full grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="w-full py-3 rounded-full text-xs sm:text-sm font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all cursor-pointer disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            data-testid={confirmTestId}
            onClick={onConfirm}
            disabled={isLoading}
            className={`w-full py-3 rounded-full text-xs sm:text-sm font-bold hover:scale-102 active:scale-98 transition-all cursor-pointer inline-flex items-center justify-center gap-1.5 disabled:opacity-50 ${getConfirmButtonClasses()}`}
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              confirmIcon
            )}
            <span>{isLoading ? 'Đang xử lý...' : confirmLabel}</span>
          </button>
        </div>
      </motion.div>
    </ModalPortal>
  );
};
