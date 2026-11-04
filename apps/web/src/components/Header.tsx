'use client';

import React from 'react';
import { BookOpen, Sparkles, FileText, Layers, CheckCircle2, Download, FileCode } from 'lucide-react';
import { JOURNAL_TEMPLATES } from '@/lib/templates';
import { Select, SelectOption } from './ui/Select';

interface HeaderProps {
  currentJournal: string;
  onSelectJournal: (id: string) => void;
  activeTab: string;
  onSelectTab: (tab: string) => void;
  paperTitle?: string;
  qualityScore?: number;
}

const HEADER_JOURNAL_OPTIONS: SelectOption[] = Object.values(JOURNAL_TEMPLATES).map((tmpl) => ({
  value: tmpl.id,
  label: tmpl.shortName,
  description: tmpl.name,
  color: tmpl.color,
  badge: tmpl.id.replace('VNUHCM-', ''),
}));

export const Header: React.FC<HeaderProps> = ({
  currentJournal,
  onSelectJournal,
  activeTab,
  onSelectTab,
  qualityScore = 95,
}) => {
  const activeTemplate = JOURNAL_TEMPLATES[currentJournal] || JOURNAL_TEMPLATES['VNUHCM-HS'];

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100/80 px-4 lg:px-8 py-3">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Logo and Journal Info */}
        <div className="flex items-center gap-3">
          <div
            className="w-11 h-11 rounded-2xl flex items-center justify-center text-white shadow-sm flex-shrink-0"
            style={{ backgroundColor: activeTemplate.color || '#78C841' }}
          >
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-lg text-[#1A1A1A] tracking-tight">
                Struct<span className="text-[#78C841]">Paper</span>
              </h1>
              <span className="pill-badge bg-[#D9F99D] text-[#14532D] text-xs py-0.5">VNUHCM AI</span>
            </div>
            <p className="text-xs text-zinc-500 truncate max-w-[280px] sm:max-w-md">
              {activeTemplate.name}
            </p>
          </div>
        </div>

        {/* Center / Navigation Pills (Desktop) */}
        <div className="hidden lg:flex items-center bg-gray-100/80 p-1 rounded-full border border-gray-200/60">
          <button
            onClick={() => onSelectTab('upload')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'upload' ? 'bg-white text-[#1A1A1A] shadow-xs' : 'text-zinc-500 hover:text-zinc-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5" /> Tải file DOCX
          </button>
          <button
            onClick={() => onSelectTab('extracted')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'extracted' ? 'bg-white text-[#1A1A1A] shadow-xs' : 'text-zinc-500 hover:text-zinc-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" /> Nội dung trích xuất
          </button>
          <button
            onClick={() => onSelectTab('editor')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'editor' ? 'bg-white text-[#1A1A1A] shadow-xs' : 'text-zinc-500 hover:text-zinc-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" /> Biên tập & QC
          </button>
          <button
            onClick={() => onSelectTab('preview')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'preview' ? 'bg-[#1A1A1A] text-white shadow-xs' : 'text-zinc-500 hover:text-zinc-900'
            }`}
          >
            <Download className="w-3.5 h-3.5" /> Xuất bản PDF (2 Cột)
          </button>
        </div>

        {/* Right: Test Render LaTeX button, Template Selector & Preflight Score */}
        <div className="flex items-center gap-2 flex-wrap">
          <a
            href="/test-render-latex"
            className="btn-pill-subtle text-xs py-1.5 px-3 bg-white text-zinc-700 border-gray-200 font-bold hover:bg-gray-50 flex items-center gap-1.5 shadow-2xs"
            title="Trang kiểm tra lấy trực tiếp file LaTeX mẫu và render lên màn hình"
          >
            <Layers className="w-3.5 h-3.5 text-zinc-700" />
            <span>Test Render LaTeX</span>
          </a>

          <a
            href="/test-render-html"
            className="btn-pill-subtle text-xs py-1.5 px-3 bg-white text-zinc-700 border-gray-200 font-bold hover:bg-gray-50 flex items-center gap-1.5 shadow-2xs"
            title="Trang kiểm tra lấy trực tiếp file HTML mẫu demo và render lên màn hình"
          >
            <FileCode className="w-3.5 h-3.5 text-zinc-700" />
            <span>Test Render HTML</span>
          </a>

          {/* Quality badge */}
          <div className="hidden sm:flex items-center gap-1.5 bg-[#D9F99D] text-[#14532D] px-3 py-1.5 rounded-full text-xs font-extrabold shadow-2xs">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Đạt chuẩn {qualityScore}%</span>
          </div>
          {/* Journal Template selector */}
          <div className="w-48 sm:w-56">
            <Select
              value={currentJournal}
              onChange={onSelectJournal}
              options={HEADER_JOURNAL_OPTIONS}
              variant="pill"
              size="sm"
              dropdownClassName="w-64 -right-2 sm:right-0"
            />
          </div>
        </div>
      </div>
    </header>
  );
};
