'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Trash2 } from 'lucide-react';
import type { ManuscriptRecord } from '@structpaper/doc-model';
import { ModalPortal } from '@/components/modals/ModalPortal';
import {
  getJournalColor,
  getJournalShortName,
  getManuscriptTitle,
} from './types';

interface PaperDeleteConfirmModalProps {
  paper: ManuscriptRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (id: string) => Promise<void> | void;
  isDeleting?: boolean;
}

const isTest = typeof process !== 'undefined' && process.env.NODE_ENV === 'test';

export const PaperDeleteConfirmModal: React.FC<PaperDeleteConfirmModalProps> = ({
  paper,
  isOpen,
  onClose,
  onConfirm,
  isDeleting = false,
}) => {
  const [cachedPaper, setCachedPaper] = useState<ManuscriptRecord | null>(paper);

  useEffect(() => {
    if (paper) {
      setCachedPaper(paper);
    }
  }, [paper]);

  const activePaper = paper || cachedPaper;
  if (!activePaper) return null;

  const { info, doc } = activePaper;
  const title = getManuscriptTitle(activePaper);
  const journalColor = getJournalColor(doc.journalId);
  const journalShort = getJournalShortName(doc.journalId);

  const handleConfirm = async () => {
    await onConfirm(info.id);
    onClose();
  };

  return (
    <ModalPortal isOpen={isOpen} onClose={onClose}>
      <motion.div
        data-testid="paper-delete-modal"
        initial={isTest ? undefined : { opacity: 0, scale: 0.9, y: 30 }}
        animate={isTest ? undefined : { opacity: 1, scale: 1, y: 0 }}
        exit={isTest ? undefined : { opacity: 0, scale: 0.9, y: 30 }}
        transition={isTest ? { duration: 0 } : { type: 'spring', damping: 25, stiffness: 200 }}
        className="bg-white w-full max-w-[420px] rounded-[40px] p-7 shadow-2xl border border-slate-100 flex flex-col items-center relative overflow-hidden select-none"
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

        {/* 3D Glossy Warning Exclamation Icon Badge */}
        <div className="relative mt-2 mb-4 flex items-center justify-center">
          <div className="w-24 h-24 rounded-full bg-gradient-to-b from-rose-50 to-rose-100/70 ring-8 ring-rose-50/60 flex items-center justify-center shadow-inner">
            {/* 3D Glossy Exclamation SVG Icon */}
            <svg
              className="w-12 h-12 text-[#FF3B30] drop-shadow-[0_4px_10px_rgba(255,59,48,0.35)]"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient id="exclamationGlow" x1="12" y1="2" x2="12" y2="22" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#FF6B5A" />
                  <stop offset="1" stopColor="#E0241A" />
                </linearGradient>
                <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="0.8" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>
              <path
                d="M12 4.2C10.9 4.2 10.1 5.1 10.2 6.2L10.9 14.2C11 14.8 11.4 15.2 12 15.2C12.6 15.2 13 14.8 13.1 14.2L13.8 6.2C13.9 5.1 13.1 4.2 12 4.2Z"
                fill="url(#exclamationGlow)"
                filter="url(#softGlow)"
              />
              <circle
                cx="12"
                cy="18.8"
                r="1.8"
                fill="url(#exclamationGlow)"
                filter="url(#softGlow)"
              />
            </svg>
          </div>
        </div>

        {/* Heading */}
        <h3 className="text-xl font-black text-slate-900 text-center tracking-tight mb-3">
          Xóa bài báo này?
        </h3>

        {/* Paper Info Preview Card */}
        <div className="w-full bg-slate-50 border border-slate-200/70 rounded-2xl p-3.5 mb-3 flex items-center gap-3 shadow-inner">
          <span
            className="shrink-0 px-2.5 py-1 rounded-xl text-[10.5px] font-extrabold text-white shadow-2xs"
            style={{ backgroundColor: journalColor }}
          >
            {journalShort}
          </span>
          <div className="min-w-0 flex-1">
            <h4 className="text-xs font-bold text-slate-900 truncate">
              {title}
            </h4>
            <p className="text-[10.5px] text-slate-400 font-mono mt-0.5 truncate">
              ID: {info.submissionId || info.id.slice(0, 12)}
            </p>
          </div>
        </div>

        {/* Subtitle / Confirmation Warning */}
        <p className="text-xs text-slate-500 text-center leading-relaxed mb-6 px-2">
          Bài báo và toàn bộ dữ liệu cấu trúc bản thảo liên quan sẽ bị xóa khỏi máy của bạn. Bạn không thể hoàn tác hành động này.
        </p>

        {/* Action Buttons: Cancel vs Delete */}
        <div className="w-full grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="w-full py-3 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm transition-all cursor-pointer"
          >
            Hủy
          </button>
          <button
            type="button"
            data-testid="confirm-delete-btn"
            onClick={handleConfirm}
            disabled={isDeleting}
            className="w-full py-3 rounded-full bg-[#FF3B30] hover:bg-red-600 text-white font-bold text-sm shadow-lg shadow-red-500/25 hover:shadow-red-500/40 hover:scale-102 active:scale-98 transition-all cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Trash2 className="w-4 h-4" />
            <span>{isDeleting ? 'Đang xóa...' : 'Xóa bài báo'}</span>
          </button>
        </div>
      </motion.div>
    </ModalPortal>
  );
};
