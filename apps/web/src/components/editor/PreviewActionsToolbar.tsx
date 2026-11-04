'use client';

import React from 'react';
import { RefreshCw, FileText, Archive, Maximize2 } from 'lucide-react';
import { CompileStats } from './types';

interface PreviewActionsToolbarProps {
  isCompiling: boolean;
  onRecompile: () => void;
  onDownloadDocx: () => void;
  onDownloadZip: () => void;
  compiledPdfUrl: string | null;
  compileStats: CompileStats | null;
  isExportingDocx: boolean;
  isExportingZip: boolean;
}

export const PreviewActionsToolbar: React.FC<PreviewActionsToolbarProps> = ({
  isCompiling,
  onRecompile,
  onDownloadDocx,
  onDownloadZip,
  compiledPdfUrl,
  compileStats,
  isExportingDocx,
  isExportingZip,
}) => {
  return (
    <div className="p-2.5 sm:p-3 bg-white border border-[#E8E8EE] rounded-2xl flex flex-wrap items-center justify-between gap-2.5 shadow-2xs">
      {/* Left: Compile status & stats */}
      <div className="flex items-center gap-2">
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
        <span className="font-extrabold text-xs text-zinc-900">Bản In XeLaTeX 2 Cột</span>
        {compileStats && (
          <span className="text-[11px] text-zinc-400 hidden sm:inline">
            • {compileStats.sizeKb} KB ({compileStats.durationMs}ms)
          </span>
        )}
      </div>

      {/* Right: Action Buttons */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {/* Biên dịch lại */}
        <button
          type="button"
          onClick={onRecompile}
          disabled={isCompiling}
          className="btn-pill-subtle text-xs py-1.5 px-3 bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-800 font-bold flex items-center gap-1.5 shadow-2xs cursor-pointer transition-all disabled:opacity-50"
          title="Biên dịch lại từ mã LaTeX mới nhất"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-zinc-600 ${isCompiling ? 'animate-spin' : ''}`} />
          <span>{isCompiling ? 'Đang dịch...' : 'Biên dịch lại'}</span>
        </button>

        {/* Xuất Word */}
        <button
          type="button"
          onClick={onDownloadDocx}
          disabled={isExportingDocx}
          className="btn-pill-subtle text-xs py-1.5 px-2.5 text-zinc-600 hover:text-zinc-900 border border-zinc-200 hover:bg-zinc-50 font-bold hidden md:flex items-center gap-1"
          title="Xuất bản ra Word (.docx)"
        >
          <FileText className="w-3.5 h-3.5" />
          <span>{isExportingDocx ? 'Đang xuất...' : 'Word'}</span>
        </button>

        {/* Gói ZIP */}
        <button
          type="button"
          onClick={onDownloadZip}
          disabled={isExportingZip}
          className="btn-pill-subtle text-xs py-1.5 px-2.5 text-zinc-700 bg-zinc-100/90 border border-zinc-200/80 hover:bg-zinc-200 font-bold hidden lg:flex items-center gap-1"
          title="Tải trọn gói ZIP LaTeX (.tex + .bib)"
        >
          <Archive className="w-3.5 h-3.5" />
          <span>{isExportingZip ? 'Đang nén...' : 'ZIP'}</span>
        </button>

        {/* Toàn màn hình / Mở tab mới */}
        {compiledPdfUrl && (
          <a
            href={compiledPdfUrl}
            target="_blank"
            rel="noreferrer"
            className="p-1.5 rounded-xl text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 transition-colors"
            title="Mở toàn màn hình trong tab mới"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </a>
        )}
      </div>
    </div>
  );
};
