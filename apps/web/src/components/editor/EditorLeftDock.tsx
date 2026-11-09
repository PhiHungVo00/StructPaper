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
  Save,
  RefreshCw,
  FileText,
  FileCheck,
  Archive,
  Maximize2,
  CheckCircle2,
  Download,
} from 'lucide-react';

interface DockIconButtonProps {
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

const DockIconButton: React.FC<DockIconButtonProps> = ({
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
      className="relative flex items-center justify-center"
    >
      <button
        id={id}
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
          <div className="absolute left-[62px] top-1/2 -translate-y-1/2 z-50 pointer-events-none whitespace-nowrap">
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
  onDownloadTypst?: () => void;
  isExportingTypst?: boolean;
}

export const EditorLeftDock: React.FC<EditorLeftDockProps> = ({
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
  onDownloadTypst,
  isExportingTypst = false,
}) => {
  let router: any = null;
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    router = useRouter();
  } catch {
    // Fallback for headless testing environments where AppRouter is not mounted
  }
  const [isDownloadOpen, setIsDownloadOpen] = useState(false);
  const downloadBtnRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

  const toggleDownloadMenu = () => {
    if (!isDownloadOpen && downloadBtnRef.current) {
      const rect = downloadBtnRef.current.getBoundingClientRect();
      const menuHeight = 230;
      let top = rect.top + rect.height / 2 - menuHeight / 2;
      top = Math.max(16, Math.min(top, window.innerHeight - menuHeight - 16));
      const left = rect.right + 12;
      setMenuPos({ top, left });
      setIsDownloadOpen(true);
    } else {
      setIsDownloadOpen(false);
    }
  };

  useEffect(() => {
    if (!isDownloadOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        downloadBtnRef.current &&
        !downloadBtnRef.current.contains(e.target as Node)
      ) {
        setIsDownloadOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsDownloadOpen(false);
      }
    };

    window.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isDownloadOpen]);

  const isAnyExporting = isExportingDocx || isExportingZip || isExportingPdf || isExportingTypst;

  return (
    <aside
      className="hidden sm:flex flex-col items-center justify-between h-full w-12 sm:w-14 py-2 px-1 flex-shrink-0 select-none relative z-40"
      aria-label="Thanh công cụ trình biên tập"
    >
      {/* TOP SECTION: BACK BUTTON */}
      <div className="relative z-10 flex flex-col items-center gap-2.5">
        <DockIconButton
          onClick={() => {
            if (homeHref && homeHref !== '/upload') {
              if (router) router.push(homeHref);
              else if (typeof window !== 'undefined') window.location.href = homeHref;
            } else {
              if (router) router.back();
              else if (typeof window !== 'undefined' && window.history) window.history.back();
            }
          }}
          label="Quay lại trang trước"
          icon={<ArrowLeft className="w-5 h-5 text-zinc-700" strokeWidth={2.4} />}
        />
      </div>

      {/* MIDDLE SECTION: FEATURE CLUSTER + ACTION CLUSTER */}
      <div className="relative z-10 flex flex-col items-center gap-2.5">
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
          label={saveSuccess ? 'Đã lưu thành công!' : 'Lưu thay đổi bản thảo'}
          icon={<Save className="w-4 h-4 text-zinc-700" strokeWidth={2.4} />}
          badge={
            saveSuccess ? (
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-[#78C841] border-2 border-white flex items-center justify-center shadow-2xs">
                <CheckCircle2 className="w-2.5 h-2.5 text-white" />
              </span>
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
              strokeWidth={2.4}
            />
          }
        />

        {/* Action 3: Tải xuống bản thảo (Word, PDF, ZIP) - Popup Context Menu */}
        <DockIconButton
          id="download-dock-btn"
          containerRef={downloadBtnRef}
          onClick={toggleDownloadMenu}
          active={isDownloadOpen}
          suppressTooltip={isDownloadOpen}
          label={
            isExportingDocx
              ? 'Đang xuất Word...'
              : isExportingPdf
                ? 'Đang xuất PDF...'
                : isExportingZip
                  ? 'Đang nén ZIP...'
                  : 'Tải xuống bản thảo (Word, PDF, ZIP)'
          }
          icon={
            isAnyExporting ? (
              <RefreshCw className="w-4 h-4 animate-spin text-zinc-700" />
            ) : (
              <Download className="w-4 h-4 text-zinc-700" strokeWidth={2.4} />
            )
          }
        />

        {/* Action 4: Maximize / Fullscreen PDF */}
        {compiledPdfUrl && (
          <DockIconButton
            onClick={() => {
              if (typeof window !== 'undefined') {
                window.open(compiledPdfUrl, '_blank', 'noreferrer');
              }
            }}
            label="Mở PDF toàn màn hình trong tab mới"
            icon={<Maximize2 className="w-4 h-4 text-zinc-700" strokeWidth={2.4} />}
          />
        )}
      </div>

      {/* BOTTOM SECTION: MANUSCRIPT QUALITY PERCENTAGE SCORE */}
      <div className="relative z-10 flex flex-col items-center pt-1 w-full">
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

      {/* POPUP TÙY CHỌN TẢI XUỐNG - STYLE ĐỒNG NHẤT CONTEXT MENU EXCEL */}
      {isDownloadOpen &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            id="download-popup-menu"
            ref={menuRef}
            style={{
              position: 'fixed',
              top: menuPos.top,
              left: menuPos.left,
              zIndex: 10000005,
            }}
            onClick={(e) => e.stopPropagation()}
            onContextMenu={(e) => e.preventDefault()}
            className="w-64 bg-white/98 backdrop-blur-xl border border-zinc-200/90 rounded-2xl shadow-2xl p-1.5 text-xs text-zinc-800 space-y-0.5 animate-fadeIn select-none"
          >
            <div className="px-2.5 py-1 text-[10px] font-bold text-zinc-400 uppercase tracking-wider select-none">
              Tùy chọn tải xuống
            </div>

            {/* 1. Tải Word (.docx) */}
            <button
              id="download-docx-btn"
              type="button"
              onClick={() => {
                setIsDownloadOpen(false);
                onDownloadDocx();
              }}
              disabled={isExportingDocx}
              className="w-full px-2.5 py-2 rounded-xl hover:bg-lime-50 hover:text-lime-900 flex items-center gap-2.5 font-semibold text-left cursor-pointer transition-colors group"
            >
              <FileText className="w-4 h-4 text-blue-600 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-zinc-800 group-hover:text-lime-950">
                    Tài liệu Word
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 bg-blue-50 text-blue-700 font-bold rounded">
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
              className="w-full px-2.5 py-2 rounded-xl hover:bg-lime-50 hover:text-lime-900 flex items-center gap-2.5 font-semibold text-left cursor-pointer transition-colors group"
            >
              <FileCheck className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-zinc-800 group-hover:text-lime-950">
                    Bản in PDF
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 bg-rose-50 text-rose-700 font-bold rounded">
                    .pdf
                  </span>
                </div>
                <p className="text-[10px] text-zinc-500 font-normal truncate">
                  PDF XeLaTeX xuất bản chất lượng cao
                </p>
              </div>
              {isExportingPdf && <RefreshCw className="w-3.5 h-3.5 animate-spin text-rose-600 flex-shrink-0" />}
            </button>

            <div className="border-t border-zinc-200/80 my-1" />

            {/* 3. Tải gói nén ZIP (.tex + .bib + ảnh) */}
            <button
              id="download-zip-btn"
              type="button"
              onClick={() => {
                setIsDownloadOpen(false);
                onDownloadZip();
              }}
              disabled={isExportingZip}
              className="w-full px-2.5 py-2 rounded-xl hover:bg-lime-50 hover:text-lime-900 flex items-center gap-2.5 font-semibold text-left cursor-pointer transition-colors group"
            >
              <Archive className="w-4 h-4 text-indigo-600 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-zinc-800 group-hover:text-lime-950">
                    Gói nén ZIP
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 bg-indigo-50 text-indigo-700 font-bold rounded">
                    .zip
                  </span>
                </div>
                <p className="text-[10px] text-zinc-500 font-normal truncate">
                  Mã nguồn LaTeX (.tex, .bib, hình ảnh)
                </p>
              </div>
              {isExportingZip && <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-600 flex-shrink-0" />}
            </button>

            {/* 4. Tải file Typst (.typ) nếu ở chế độ Typst */}
            {onDownloadTypst && (
              <button
                id="download-typst-btn"
                type="button"
                onClick={() => {
                  setIsDownloadOpen(false);
                  onDownloadTypst();
                }}
                disabled={isExportingTypst}
                className="w-full px-2.5 py-2 rounded-xl hover:bg-lime-50 hover:text-lime-900 flex items-center gap-2.5 font-semibold text-left cursor-pointer transition-colors group"
              >
                <div className="w-4 h-4 rounded bg-[#78C841] text-white flex items-center justify-center font-bold text-[9px] flex-shrink-0">
                  T
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-zinc-800 group-hover:text-lime-950">
                      Bản thảo Typst
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 bg-emerald-50 text-emerald-700 font-bold rounded">
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
          </div>,
          document.body
        )}
    </aside>
  );
};
