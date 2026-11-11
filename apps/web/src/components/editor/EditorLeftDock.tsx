'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home,
  ArrowLeft,
  Layers,
  Sliders,
  FileEdit,
  Save,
  RefreshCw,
  FileText,
  FileCheck,
  Archive,
  Maximize2,
  CheckCircle2,
  Download,
  Tag,
  Check,
  X,
} from 'lucide-react';
import { usePlatform } from '@structpaper/platform';
import {
  WORKFLOW_STATUS_CONFIG,
  getWorkflowStatusConfig,
  type WorkflowStatus,
} from '@/components/papers/types';

export interface DockIconButtonProps {
  id?: string;
  icon?: React.ReactNode;
  label: string;
  onClick?: () => void;
  href?: string;
  active?: boolean;
  disabled?: boolean;
  badge?: React.ReactNode;
  customContent?: React.ReactNode;
  containerRef?: React.Ref<HTMLDivElement>;
  suppressTooltip?: boolean;
}

export const DockIconButton: React.FC<DockIconButtonProps> = ({
  id,
  icon,
  label,
  onClick,
  href,
  active,
  disabled,
  badge,
  customContent,
  containerRef,
  suppressTooltip,
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const hoverTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    // 1.2 seconds delay before tooltip appears smoothly
    hoverTimerRef.current = setTimeout(() => {
      setShowTooltip(true);
    }, 1000);
  };

  const handleMouseLeave = () => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
    setShowTooltip(false);
  };

  useEffect(() => {
    return () => {
      if (hoverTimerRef.current) {
        clearTimeout(hoverTimerRef.current);
      }
    };
  }, []);

  const buttonInner = (
    <div
      ref={containerRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`relative flex items-center justify-center ${showTooltip ? 'z-[100]' : ''}`}
    >
      <button
        id={id}
        data-testid={id}
        type="button"
        onClick={onClick}
        disabled={disabled}
        className={`w-[52px] h-[52px] rounded-full flex items-center justify-center transition-all duration-200 select-none cursor-pointer relative ${active
          ? 'bg-white/90 text-zinc-950 font-bold shadow-[inset_0_0_14px_6px_rgba(255,255,255,0.95),0_0_16px_rgba(0,0,0,0.10),0_0_4px_rgba(0,0,0,0.06)] border border-white scale-105'
          : 'bg-white/60 hover:bg-white/90 backdrop-blur-md shadow-[inset_0_0_14px_6px_rgba(255,255,255,0.85),0_0_12px_rgba(0,0,0,0.04),0_0_4px_rgba(0,0,0,0.03)] hover:shadow-[inset_0_0_16px_8px_rgba(255,255,255,0.95),0_0_18px_rgba(0,0,0,0.10),0_0_6px_rgba(0,0,0,0.05)] text-zinc-700 hover:text-zinc-950 hover:scale-105 active:scale-95'
          } ${disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`}
        aria-label={label}
      >
        {customContent || icon}
        {badge}
      </button>

      {/* Liquid Glass Tooltip matching the former "Quay lại trang chủ" button style */}
      <AnimatePresence>
        {showTooltip && !suppressTooltip && !active && (
          <div className="absolute left-[62px] top-1/2 -translate-y-1/2 z-[100] pointer-events-none whitespace-nowrap">
            <motion.div
              initial={{ opacity: 0, x: -8, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -8, scale: 0.95 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="h-10 px-3.5 rounded-3xl flex items-center gap-2 bg-white/85 backdrop-blur-sm border border-white/80 shadow-[inset_0_0_14px_6px_rgba(255,255,255,0.85),0_4px_20px_rgba(0,0,0,0.08),0_1px_6px_rgba(0,0,0,0.04)] text-zinc-800 font-extrabold text-xs tracking-tight drop-shadow-xl"
            >
              {label}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="outline-none" tabIndex={-1}>
        {buttonInner}
      </Link>
    );
  }

  return buttonInner;
};

interface EditorLeftDockProps {
  onOpenQuickEdit?: () => void;
  onOpenExtractedDrawer: () => void;
  onOpenLayoutSettings: () => void;
  onSave: () => void;
  saveSuccess: boolean;
  isDirty?: boolean;
  onRecompile: () => void;
  isCompiling: boolean;
  onDownloadDocx: () => void;
  isExportingDocx: boolean;
  onDownloadZip: () => void;
  isExportingZip: boolean;
  onDownloadPdf?: () => void;
  isExportingPdf?: boolean;
  compiledPdfUrl: string | null;
  qcScore: number;
  hasErrors?: boolean;
  hasWarnings?: boolean;
  errorCount?: number;
  warningCount?: number;
  onOpenQCTab?: () => void;
  homeHref?: string;
  onBackClick?: () => void;
  autosaveStatus?: 'idle' | 'saving' | 'saved' | 'error';
  onDownloadTypst?: () => void;
  isExportingTypst?: boolean;
  workflowStatus?: WorkflowStatus | string;
  onUpdateWorkflowStatus?: (newStatus: WorkflowStatus) => void;
  onOpenFullscreenPdf?: () => void;
  paperId?: string;
}

export const EditorLeftDock: React.FC<EditorLeftDockProps> = ({
  onOpenQuickEdit,
  onOpenExtractedDrawer,
  onOpenLayoutSettings,
  onSave,
  saveSuccess,
  isDirty,
  onRecompile,
  isCompiling,
  onDownloadDocx,
  isExportingDocx,
  onDownloadZip,
  isExportingZip,
  onDownloadPdf,
  isExportingPdf = false,
  compiledPdfUrl,
  qcScore,
  hasErrors = false,
  hasWarnings = false,
  errorCount = 0,
  warningCount = 0,
  onOpenQCTab,
  homeHref = '/upload',
  onBackClick,
  autosaveStatus = 'idle',
  onDownloadTypst,
  isExportingTypst = false,
  workflowStatus = 'draft',
  onUpdateWorkflowStatus,
  onOpenFullscreenPdf,
  paperId,
}) => {
  let router: any = null;
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    router = useRouter();
  } catch {
    // Fallback for headless testing environments where AppRouter is not mounted
  }

  let isDesktop = false;
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const platform = usePlatform();
    isDesktop = platform.capabilities.kind === 'desktop';
  } catch {
    isDesktop = false;
  }

  const isTest = typeof process !== 'undefined' && process.env.NODE_ENV === 'test';
  const [isDownloadOpen, setIsDownloadOpen] = useState(false);
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const downloadMenuRef = useRef<HTMLDivElement>(null);
  const statusMenuRef = useRef<HTMLDivElement>(null);

  const currentStatusConfig = getWorkflowStatusConfig(workflowStatus);

  const WORKFLOW_STATUS_THEMES: Record<WorkflowStatus, { innerShadow: string; border: string }> = {
    draft: {
      innerShadow: 'inset 0 0 20px rgba(100, 116, 139, 0.28)',
      border: 'border-slate-300/70',
    },
    'in-review': {
      innerShadow: 'inset 0 0 20px rgba(217, 119, 6, 0.32)',
      border: 'border-amber-300/70',
    },
    proofing: {
      innerShadow: 'inset 0 0 20px rgba(2, 132, 199, 0.32)',
      border: 'border-sky-300/70',
    },
    ready: {
      innerShadow: 'inset 0 0 20px rgba(101, 163, 13, 0.35)',
      border: 'border-[#78C841]/70',
    },
    published: {
      innerShadow: 'inset 0 0 20px rgba(99, 102, 241, 0.32)',
      border: 'border-indigo-300/70',
    },
  };

  const currentStatusTheme =
    WORKFLOW_STATUS_THEMES[workflowStatus as WorkflowStatus] || WORKFLOW_STATUS_THEMES.draft;

  const springTransition = isTest
    ? { duration: 0 }
    : {
        type: 'spring' as const,
        stiffness: 150,
        damping: 18,
        mass: 0.8,
      };

  useEffect(() => {
    if (!isDownloadOpen && !isStatusOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        isDownloadOpen &&
        downloadMenuRef.current &&
        !downloadMenuRef.current.contains(target)
      ) {
        const triggerBtn = document.getElementById('download-dock-btn');
        if (!triggerBtn || !triggerBtn.contains(target)) {
          setIsDownloadOpen(false);
        }
      }
      if (
        isStatusOpen &&
        statusMenuRef.current &&
        !statusMenuRef.current.contains(target)
      ) {
        const triggerBtn = document.getElementById('status-dock-btn');
        if (!triggerBtn || !triggerBtn.contains(target)) {
          setIsStatusOpen(false);
        }
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsDownloadOpen(false);
        setIsStatusOpen(false);
      }
    };

    window.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isDownloadOpen, isStatusOpen]);

  const isAnyExporting = isExportingDocx || isExportingZip || isExportingPdf || isExportingTypst;

  return (
    <aside
      className="hidden sm:flex flex-col items-center justify-between h-full w-12 sm:w-14 py-2 px-1 flex-shrink-0 select-none relative z-50"
      aria-label="Thanh công cụ trình biên tập"
    >
      {/* TOP SECTION: BACK BUTTON */}
      <div className="relative flex flex-col items-center gap-2.5">
        <DockIconButton
          onClick={() => {
            if (onBackClick) {
              onBackClick();
              return;
            }
            const destination = homeHref || '/papers';
            if (router) router.push(destination);
            else if (typeof window !== 'undefined') window.location.href = destination;
          }}
          label="Quay lại danh sách bài báo"
          icon={<ArrowLeft className="w-5 h-5 text-zinc-700" strokeWidth={2.4} />}
        />
      </div>

      {/* MIDDLE SECTION: FEATURE CLUSTER + ACTION CLUSTER */}
      <div className="relative flex flex-col items-center gap-2.5">
        {/* Feature 0: Quick Edit Paper Info Modal */}
        {onOpenQuickEdit && (
          <DockIconButton
            onClick={onOpenQuickEdit}
            label="Sửa thông tin bài báo"
            icon={<FileEdit className="w-5 h-5 text-zinc-700" strokeWidth={2.4} />}
          />
        )}

        {/* Feature 1: Extracted Content Drawer */}
        <DockIconButton
          onClick={onOpenExtractedDrawer}
          label="Nội dung trích xuất bản thảo"
          icon={<Layers className="w-5 h-5 text-zinc-700" strokeWidth={2.4} />}
        />

        {/* Feature 2: PDF Layout Settings Drawer */}
        <DockIconButton
          onClick={onOpenLayoutSettings}
          label="Cài đặt dàn trang PDF"
          icon={<Sliders className="w-5 h-5 text-zinc-700" strokeWidth={2.4} />}
        />

        {/* Subtle Separator */}
        <div className="w-8 h-[1px] my-3" />

        {/* Action 1: Save Changes */}
        <DockIconButton
          onClick={onSave}
          label={
            saveSuccess || autosaveStatus === 'saved'
              ? 'Đã lưu thành công!'
              : autosaveStatus === 'saving'
                ? 'Đang tự động lưu...'
                : autosaveStatus === 'error'
                  ? 'Lỗi tự động lưu'
                  : isDirty
                    ? 'Lưu thay đổi bản thảo (Ctrl+S)'
                    : 'Lưu thay đổi bản thảo'
          }
          icon={<Save className="w-4 h-4 text-zinc-700" strokeWidth={2.8} />}
          badge={
            saveSuccess || autosaveStatus === 'saved' ? (
              <span className="absolute -top-2 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-[#78C841] border-2 border-white flex items-center justify-center shadow-sm">
                <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
              </span>
            ) : autosaveStatus === 'saving' ? (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-indigo-500 border border-white animate-pulse" />
            ) : autosaveStatus === 'error' ? (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-rose-500 border border-white" />
            ) : isDirty ? (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-amber-500 border border-white" />
            ) : null
          }
        />

        {/* Action 2: Recompile */}
        <DockIconButton
          onClick={onRecompile}
          disabled={isCompiling}
          label={isCompiling ? 'Đang biên dịch LaTeX...' : 'Biên dịch lại PDF'}
          icon={
            <RefreshCw
              className={`w-4 h-4 text-zinc-700 ${isCompiling ? 'animate-spin text-[#78C841]' : ''}`}
              strokeWidth={2.8}
            />
          }
        />

        {/* Action 3: Tải xuống bản thảo (Word, PDF, ZIP) - Spring Shared Element Morph */}
        <div className="w-[52px] h-[52px] relative flex items-center justify-center">
          <AnimatePresence>
            {!isDownloadOpen ? (
              <motion.button
                key="download-trigger-btn"
                layoutId="dock-download-menu"
                id="download-dock-btn"
                data-testid="download-dock-btn"
                type="button"
                onClick={() => {
                  setIsStatusOpen(false);
                  setIsDownloadOpen(true);
                }}
                initial={isTest ? false : undefined}
                transition={springTransition}
                aria-label={
                  isExportingDocx
                    ? 'Đang xuất Word...'
                    : isExportingPdf
                      ? 'Đang xuất PDF...'
                      : isExportingZip
                        ? 'Đang nén ZIP...'
                        : 'Tải xuống bản thảo (Word, PDF, ZIP)'
                }
                title={
                  isExportingDocx
                    ? 'Đang xuất Word...'
                    : isExportingPdf
                      ? 'Đang xuất PDF...'
                      : isExportingZip
                        ? 'Đang nén ZIP...'
                        : 'Tải xuống bản thảo (Word, PDF, ZIP)'
                }
                className="w-[52px] h-[52px] rounded-full flex items-center justify-center transition-colors duration-150 select-none cursor-pointer relative bg-white/60 hover:bg-white/90 backdrop-blur-md shadow-[inset_0_0_14px_6px_rgba(255,255,255,0.85),0_0_12px_rgba(0,0,0,0.04),0_0_4px_rgba(0,0,0,0.03)] hover:shadow-[inset_0_0_16px_8px_rgba(255,255,255,0.95),0_0_18px_rgba(0,0,0,0.10),0_0_6px_rgba(0,0,0,0.05)] text-zinc-700 hover:text-zinc-950"
              >
                {isAnyExporting ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-zinc-700" strokeWidth={2.8} />
                ) : (
                  <Download className="w-4 h-4 text-zinc-700" strokeWidth={2.8} />
                )}
              </motion.button>
            ) : (
              <motion.div
                key="download-popup-menu"
                layoutId="dock-download-menu"
                ref={downloadMenuRef}
                id="download-popup-menu"
                data-testid="download-popup-menu"
                initial={isTest ? false : undefined}
                transition={springTransition}
                onClick={(e) => e.stopPropagation()}
                className="absolute left-[64px] top-0 z-[100] w-64 bg-white/98 backdrop-blur-xl border border-zinc-200/90 rounded-3xl shadow-2xl p-1.5 text-xs text-zinc-800 space-y-0.5 select-none overflow-hidden"
                style={{ transformOrigin: 'top left' }}
              >
                <div className="flex items-center justify-between px-2 py-1 select-none">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                    Tùy chọn tải xuống
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsDownloadOpen(false);
                    }}
                    className="w-5 h-5 rounded-full hover:bg-zinc-100 flex items-center justify-center text-zinc-400 hover:text-zinc-700 cursor-pointer"
                    title="Đóng menu"
                    aria-label="Đóng menu"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>

                <div className="border-t border-zinc-200/80 my-0.5" />

                {/* 1. Tải Word (.docx) */}
                <button
                  id="download-docx-btn"
                  type="button"
                  onClick={() => {
                    setIsDownloadOpen(false);
                    onDownloadDocx();
                  }}
                  disabled={isExportingDocx}
                  className="w-full px-2.5 py-1.5 rounded-xl hover:bg-blue-50/70 hover:text-blue-900 flex items-center gap-2 font-medium text-left cursor-pointer transition-colors group"
                >
                  <FileText className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-zinc-800 group-hover:text-blue-950">
                        Tài liệu Word
                      </span>
                      <span className="text-[10px] px-1.5 py-0.2 bg-blue-50 text-blue-700 font-bold rounded">
                        .docx
                      </span>
                    </div>
                    <p className="text-[10px] text-zinc-500 font-normal truncate">
                      Bản thảo chỉnh sửa Microsoft Word
                    </p>
                  </div>
                  {isExportingDocx && <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-600 flex-shrink-0" />}
                </button>

                {/* 2. Tải bản in PDF (.pdf) */}
                <button
                  id="download-pdf-btn"
                  type="button"
                  onClick={() => {
                    setIsDownloadOpen(false);
                    if (onDownloadPdf) {
                      onDownloadPdf();
                    } else if (compiledPdfUrl) {
                      const a = document.createElement('a');
                      a.href = compiledPdfUrl;
                      a.download = 'article.pdf';
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                    }
                  }}
                  disabled={isExportingPdf}
                  className="w-full px-2.5 py-1.5 rounded-xl hover:bg-rose-50/70 hover:text-rose-900 flex items-center gap-2 font-medium text-left cursor-pointer transition-colors group"
                >
                  <FileCheck className="w-4 h-4 text-rose-600 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-zinc-800 group-hover:text-rose-950">
                        Bản in PDF
                      </span>
                      <span className="text-[10px] px-1.5 py-0.2 bg-rose-50 text-rose-700 font-bold rounded">
                        .pdf
                      </span>
                    </div>
                    <p className="text-[10px] text-zinc-500 font-normal truncate">
                      PDF XeLaTeX xuất bản chất lượng cao
                    </p>
                  </div>
                  {isExportingPdf && <RefreshCw className="w-3.5 h-3.5 animate-spin text-rose-600 flex-shrink-0" />}
                </button>

                <div className="border-t border-zinc-200/80 my-0.5" />

                {/* 3. Tải gói nén ZIP (.tex + .bib + ảnh) */}
                <button
                  id="download-zip-btn"
                  type="button"
                  onClick={() => {
                    setIsDownloadOpen(false);
                    onDownloadZip();
                  }}
                  disabled={isExportingZip}
                  className="w-full px-2.5 py-1.5 rounded-xl hover:bg-indigo-50/70 hover:text-indigo-900 flex items-center gap-2 font-medium text-left cursor-pointer transition-colors group"
                >
                  <Archive className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-zinc-800 group-hover:text-indigo-950">
                        Gói nén ZIP
                      </span>
                      <span className="text-[10px] px-1.5 py-0.2 bg-indigo-50 text-indigo-700 font-bold rounded">
                        .zip
                      </span>
                    </div>
                    <p className="text-[10px] text-zinc-500 font-normal truncate">
                      Mã nguồn LaTeX (.tex, .bib, hình ảnh)
                    </p>
                  </div>
                  {isExportingZip && <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-600 flex-shrink-0" />}
                </button>

                {/* 4. Tải file Typst (.typ) */}
                {onDownloadTypst && (
                  <button
                    id="download-typst-btn"
                    type="button"
                    onClick={() => {
                      setIsDownloadOpen(false);
                      onDownloadTypst();
                    }}
                    disabled={isExportingTypst}
                    className="w-full px-2.5 py-1.5 rounded-xl hover:bg-emerald-50/70 hover:text-emerald-900 flex items-center gap-2 font-medium text-left cursor-pointer transition-colors group"
                  >
                    <div className="w-4 h-4 rounded bg-[#78C841] text-white flex items-center justify-center font-bold text-[9px] flex-shrink-0">
                      T
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-zinc-800 group-hover:text-emerald-950">
                          Bản thảo Typst
                        </span>
                        <span className="text-[10px] px-1.5 py-0.2 bg-emerald-50 text-emerald-700 font-bold rounded">
                          .typ
                        </span>
                      </div>
                      <p className="text-[10px] text-zinc-500 font-normal truncate">
                        Mã nguồn Typst dàn trang hiện đại
                      </p>
                    </div>
                    {isExportingTypst && <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#78C841] flex-shrink-0" />}
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Action 3.5: Trạng thái bản thảo (Bản nháp, Đang duyệt, Hiệu đính, Sẵn sàng, Đã xuất bản) - Spring Shared Element Morph */}
        <div className="w-[52px] h-[52px] relative flex items-center justify-center">
          <AnimatePresence>
            {!isStatusOpen ? (
              <motion.button
                key="status-trigger-btn"
                layoutId="dock-status-menu"
                id="status-dock-btn"
                data-testid="status-dock-btn"
                type="button"
                onClick={() => {
                  setIsDownloadOpen(false);
                  setIsStatusOpen(true);
                }}
                initial={isTest ? false : undefined}
                transition={springTransition}
                aria-label={`Trạng thái bản thảo: ${currentStatusConfig.label}`}
                title={`Trạng thái bản thảo: ${currentStatusConfig.label}`}
                className={`w-[52px] h-[52px] rounded-full flex items-center justify-center transition-colors duration-150 select-none cursor-pointer relative bg-white/60 hover:bg-white/90 backdrop-blur-md text-zinc-700 hover:text-zinc-950 border ${currentStatusTheme.border}`}
                style={{
                  boxShadow: `${currentStatusTheme.innerShadow}, inset 0 0 14px 6px rgba(255,255,255,0.85), 0 0 12px rgba(0,0,0,0.04), 0 0 4px rgba(0,0,0,0.03)`,
                }}
              >
                <Tag className="w-4 h-4 text-zinc-700" strokeWidth={2.8} />
              </motion.button>
            ) : (
              <motion.div
                key="status-popup-menu"
                layoutId="dock-status-menu"
                ref={statusMenuRef}
                id="status-popup-menu"
                data-testid="status-popup-menu"
                initial={isTest ? false : undefined}
                transition={springTransition}
                onClick={(e) => e.stopPropagation()}
                className="absolute left-[64px] top-0 z-[100] w-56 bg-white/98 backdrop-blur-xl border border-zinc-200/90 rounded-3xl shadow-2xl p-1.5 text-xs text-zinc-800 space-y-0.5 select-none overflow-hidden"
                style={{ transformOrigin: 'top left' }}
              >
                <div className="flex items-center justify-between px-2 py-1 select-none">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                    Trạng thái bài báo
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsStatusOpen(false);
                    }}
                    className="w-5 h-5 rounded-full hover:bg-zinc-100 flex items-center justify-center text-zinc-400 hover:text-zinc-700 cursor-pointer"
                    title="Đóng menu"
                    aria-label="Đóng menu"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>

                <div className="border-t border-zinc-200/80 my-0.5" />

                {(['draft', 'in-review', 'proofing', 'ready', 'published'] as const).map((st) => {
                  const cfg = WORKFLOW_STATUS_CONFIG[st];
                  const isSelected = (workflowStatus || 'draft') === st;
                  return (
                    <button
                      key={st}
                      type="button"
                      data-testid={`status-option-${st}`}
                      onClick={() => {
                        setIsStatusOpen(false);
                        onUpdateWorkflowStatus?.(st);
                      }}
                      className={`w-full px-2.5 py-1.5 rounded-xl flex items-center justify-between text-left font-medium cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-zinc-100 text-zinc-950 font-bold'
                          : 'hover:bg-zinc-50 text-zinc-700 hover:text-zinc-900'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`w-2.5 h-2.5 rounded-full ${cfg.dotBg} shrink-0`} />
                        <span className="text-xs truncate">{cfg.label}</span>
                      </div>
                      {isSelected && <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                    </button>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Action 4: Maximize / Fullscreen PDF */}
        {compiledPdfUrl && (
          <DockIconButton
            id="maximize-pdf-dock-btn"
            onClick={() => {
              if (onOpenFullscreenPdf) {
                onOpenFullscreenPdf();
              } else if (isDesktop) {
                const destination = paperId ? `/preview?id=${paperId}` : '/preview';
                if (router) router.push(destination);
                else if (typeof window !== 'undefined') window.location.href = destination;
              } else {
                if (typeof window !== 'undefined') {
                  window.open(compiledPdfUrl, '_blank', 'noreferrer');
                }
              }
            }}
            label={isDesktop ? 'Mở PDF toàn màn hình' : 'Mở PDF toàn màn hình trong tab mới'}
            icon={<Maximize2 className="w-4 h-4 text-zinc-700" strokeWidth={2.8} />}
          />
        )}
      </div>

      {/* BOTTOM SECTION: MANUSCRIPT QUALITY PERCENTAGE SCORE */}
      <div className="relative flex flex-col items-center pt-1 w-full">
        <div className="w-6 h-[1px] mb-2" />
        <DockIconButton
          onClick={onOpenQCTab}
          label={`Chất lượng bản thảo: ${qcScore}%${
            hasErrors
              ? ` (${errorCount} lỗi cần xử lý)`
              : hasWarnings
                ? ` (${warningCount} cảnh báo)`
                : ' (Đạt tiêu chuẩn)'
          }`}
          badge={
            hasErrors ? (
              <span className="absolute top-2.5 right-2.5 flex items-center justify-center pointer-events-none">
                <motion.span
                  className="w-2 h-2 rounded-full bg-[#FB4141] ring-1.5 ring-white/90 shadow-[0_1px_3px_rgba(251,65,65,0.4)]"
                  animate={{
                    opacity: [1, 0.45, 1],
                  }}
                  transition={{
                    duration: 2.2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                />
              </span>
            ) : null
          }
          customContent={
            <div className="flex flex-col items-center justify-center">
              <span
                className={`text-[11px] font-extrabold leading-none tracking-tight transition-colors duration-200 ${
                  hasErrors
                    ? 'text-[#FB4141]'
                    : hasWarnings
                      ? 'text-[#FF9B2F]'
                      : 'text-[#14532D]'
                }`}
              >
                {qcScore}%
              </span>
            </div>
          }
          active
        />
      </div>
    </aside>
  );
};
