'use client';

import React from 'react';
import {
  FileText,
  Table as TableIcon,
  Image as ImageIcon,
  Heading,
  AlignLeft,
  Layers,
  Sigma,
} from 'lucide-react';
import type { SectionFilterType } from '../hooks/tab-view-state-store';

export interface SectionActionToolbarProps {
  totalSections: number;
  filterType: SectionFilterType;
  onFilterChange: (filter: SectionFilterType) => void;
  onAddHeading: (level?: 'h1' | 'h2' | 'h3') => void;
  onAddParagraph: () => void;
  onAddTable: () => void;
  onAddFigure: () => void;
  onAddEquation?: () => void;
  counts: {
    all: number;
    headings: number;
    paragraphs: number;
    tables: number;
    figures: number;
    equations?: number;
  };
}

const SectionActionToolbarBase: React.FC<SectionActionToolbarProps> = ({
  totalSections,
  filterType,
  onFilterChange,
  onAddHeading,
  onAddParagraph,
  onAddTable,
  onAddFigure,
  onAddEquation,
  counts,
}) => {
  return (
    <div className="flex flex-col space-y-3 flex-shrink-0">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-zinc-200/80 flex-shrink-0">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-zinc-700" />
          <h3 className="font-extrabold text-sm sm:text-base text-zinc-900">
            Nội dung bài báo ({totalSections})
          </h3>
        </div>

        {/* Quick Add Buttons */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => onAddHeading('h1')}
            className="px-2.5 py-1 rounded-xl bg-white border border-zinc-200 text-zinc-700 hover:text-zinc-900 hover:bg-zinc-50 text-[11px] font-bold flex items-center gap-1 shadow-2xs transition-all cursor-pointer"
            title="Thêm tiêu đề đề mục H1"
          >
            <Heading className="w-3 h-3 text-zinc-500" />
            <span>+ Tiêu đề H1</span>
          </button>

          <button
            type="button"
            onClick={() => onAddParagraph()}
            className="px-2.5 py-1 rounded-xl bg-white border border-zinc-200 text-zinc-700 hover:text-zinc-900 hover:bg-zinc-50 text-[11px] font-bold flex items-center gap-1 shadow-2xs transition-all cursor-pointer"
            title="Thêm đoạn văn bản mới"
          >
            <AlignLeft className="w-3 h-3 text-zinc-500" />
            <span>+ Đoạn văn</span>
          </button>

          <button
            type="button"
            onClick={() => onAddTable()}
            className="px-2.5 py-1 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 text-[11px] font-bold flex items-center gap-1 shadow-2xs transition-all cursor-pointer"
            title="Thêm bảng số liệu"
          >
            <TableIcon className="w-3 h-3 text-indigo-500" />
            <span>+ Bảng</span>
          </button>

          <button
            type="button"
            onClick={() => onAddFigure()}
            className="px-2.5 py-1 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 hover:bg-amber-100 text-[11px] font-bold flex items-center gap-1 shadow-2xs transition-all cursor-pointer"
            title="Thêm hình ảnh minh họa"
          >
            <ImageIcon className="w-3 h-3 text-amber-500" />
            <span>+ Hình</span>
          </button>

          {onAddEquation && (
            <button
              type="button"
              onClick={() => onAddEquation()}
              className="px-2.5 py-1 rounded-xl bg-violet-50 border border-violet-200 text-violet-700 hover:bg-violet-100 text-[11px] font-bold flex items-center gap-1 shadow-2xs transition-all cursor-pointer"
              title="Thêm công thức toán học"
            >
              <Sigma className="w-3 h-3 text-violet-500" />
              <span>+ Công thức</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Chips Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 flex-shrink-0 no-scrollbar select-none text-[11px]">
        <button
          type="button"
          onClick={() => onFilterChange('all')}
          className={`px-3 py-1 rounded-full font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            filterType === 'all'
              ? 'bg-[#1A1A1A] text-white shadow-2xs'
              : 'bg-zinc-200/60 text-zinc-600 hover:bg-zinc-200'
          }`}
        >
          <Layers className="w-3 h-3" />
          <span>Tất cả ({counts.all})</span>
        </button>

        <button
          type="button"
          onClick={() => onFilterChange('heading')}
          className={`px-3 py-1 rounded-full font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            filterType === 'heading'
              ? 'bg-[#1A1A1A] text-white shadow-2xs'
              : 'bg-zinc-200/60 text-zinc-600 hover:bg-zinc-200'
          }`}
        >
          <Heading className="w-3 h-3" />
          <span>Tiêu đề ({counts.headings})</span>
        </button>

        <button
          type="button"
          onClick={() => onFilterChange('paragraph')}
          className={`px-3 py-1 rounded-full font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            filterType === 'paragraph'
              ? 'bg-[#1A1A1A] text-white shadow-2xs'
              : 'bg-zinc-200/60 text-zinc-600 hover:bg-zinc-200'
          }`}
        >
          <AlignLeft className="w-3 h-3" />
          <span>Đoạn văn ({counts.paragraphs})</span>
        </button>

        <button
          type="button"
          onClick={() => onFilterChange('table')}
          className={`px-3 py-1 rounded-full font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            filterType === 'table'
              ? 'bg-[#1A1A1A] text-white shadow-2xs'
              : 'bg-zinc-200/60 text-zinc-600 hover:bg-zinc-200'
          }`}
        >
          <TableIcon className="w-3 h-3" />
          <span>Bảng ({counts.tables})</span>
        </button>

        <button
          type="button"
          onClick={() => onFilterChange('figure')}
          className={`px-3 py-1 rounded-full font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            filterType === 'figure'
              ? 'bg-[#1A1A1A] text-white shadow-2xs'
              : 'bg-zinc-200/60 text-zinc-600 hover:bg-zinc-200'
          }`}
        >
          <ImageIcon className="w-3 h-3" />
          <span>Hình ({counts.figures})</span>
        </button>

        <button
          type="button"
          data-testid="filter-equation"
          onClick={() => onFilterChange('equation')}
          className={`px-3 py-1 rounded-full font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            filterType === 'equation'
              ? 'bg-[#1A1A1A] text-white shadow-2xs'
              : 'bg-zinc-200/60 text-zinc-600 hover:bg-zinc-200'
          }`}
        >
          <Sigma className="w-3 h-3" />
          <span>Công thức ({counts.equations ?? 0})</span>
        </button>
      </div>
    </div>
  );
};

export const SectionActionToolbar = React.memo(SectionActionToolbarBase);
SectionActionToolbar.displayName = 'SectionActionToolbar';
