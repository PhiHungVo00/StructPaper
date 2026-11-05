'use client';

import React from 'react';
import Link from 'next/link';
import {
  Search,
  LayoutGrid,
  List,
  UploadCloud,
  Sparkles,
  Filter,
} from 'lucide-react';
import {
  ALL_JOURNAL_IDS,
  JOURNAL_DEFINITIONS,
} from '@structpaper/journal-profiles';
import {
  type FilterWorkflowStatus,
  type FilterJournal,
  type SortOption,
  type ViewMode,
  WORKFLOW_STATUS_CONFIG,
} from './types';

interface PaperFiltersBarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  statusFilter: FilterWorkflowStatus;
  onStatusFilterChange: (s: FilterWorkflowStatus) => void;
  journalFilter: FilterJournal;
  onJournalFilterChange: (j: FilterJournal) => void;
  sortBy: SortOption;
  onSortChange: (s: SortOption) => void;
  viewMode: ViewMode;
  onViewModeChange: (v: ViewMode) => void;
  countsByStatus?: Partial<Record<FilterWorkflowStatus, number>>;
  onCreateFromTemplate?: () => void;
}

const STATUS_TABS: Array<{ id: FilterWorkflowStatus; label: string }> = [
  { id: 'all', label: 'Tất cả' },
  { id: 'draft', label: WORKFLOW_STATUS_CONFIG.draft.label },
  { id: 'in-review', label: WORKFLOW_STATUS_CONFIG['in-review'].label },
  { id: 'proofing', label: WORKFLOW_STATUS_CONFIG.proofing.label },
  { id: 'ready', label: WORKFLOW_STATUS_CONFIG.ready.label },
  { id: 'published', label: WORKFLOW_STATUS_CONFIG.published.label },
];

export const PaperFiltersBar: React.FC<PaperFiltersBarProps> = ({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  journalFilter,
  onJournalFilterChange,
  sortBy,
  onSortChange,
  viewMode,
  onViewModeChange,
  countsByStatus,
  onCreateFromTemplate,
}) => {
  return (
    <div className="space-y-3.5">
      {/* Row 1: Search, Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Search Input Box */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            data-testid="paper-search-input"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Tìm theo tên bài, mã bài, tác giả, từ khóa..."
            className="w-full bg-white border border-slate-200/90 rounded-2xl pl-9 pr-8 py-2 text-xs text-slate-900 placeholder:text-slate-400 outline-none focus:border-[#78C841] focus:ring-2 focus:ring-[#78C841]/20 shadow-2xs transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 font-bold cursor-pointer"
              title="Xóa tìm kiếm"
            >
              ✕
            </button>
          )}
        </div>

        {/* Action CTAs: Upload DOCX & Create from Template */}
        <div className="flex items-center gap-2">
          <Link
            href="/upload"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-200/90 hover:border-slate-300 text-slate-700 hover:text-slate-900 shadow-2xs transition-all"
          >
            <UploadCloud className="w-3.5 h-3.5 text-blue-600" />
            <span>Tải file DOCX mới</span>
          </Link>

          {onCreateFromTemplate ? (
            <button
              onClick={onCreateFromTemplate}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-extrabold bg-[#78C841] hover:bg-[#6cb43a] text-zinc-950 shadow-2xs transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Tạo từ mẫu</span>
            </button>
          ) : (
            <Link
              href="/templates"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-extrabold bg-[#78C841] hover:bg-[#6cb43a] text-zinc-950 shadow-2xs transition-all"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Tạo từ mẫu</span>
            </Link>
          )}
        </div>
      </div>

      {/* Row 2: Status Filter Chips & Right Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-1">
        {/* Status Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {STATUS_TABS.map((tab) => {
            const isActive = statusFilter === tab.id;
            const count = countsByStatus?.[tab.id];

            return (
              <button
                key={tab.id}
                data-testid={`filter-chip-${tab.id}`}
                onClick={() => onStatusFilterChange(tab.id)}
                className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'bg-white border border-slate-200/80 text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <span>{tab.label}</span>
                {typeof count === 'number' && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Right side: Journal Filter, Sort Dropdown, View Toggle */}
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          {/* Journal Dropdown */}
          <div className="flex items-center gap-1 bg-white border border-slate-200/80 rounded-xl px-2.5 py-1 text-xs shadow-2xs">
            <Filter className="w-3 h-3 text-slate-400" />
            <select
              data-testid="filter-journal-select"
              value={journalFilter}
              onChange={(e) => onJournalFilterChange(e.target.value as FilterJournal)}
              className="bg-transparent text-slate-700 font-medium outline-none cursor-pointer text-xs"
            >
              <option value="all">Tất cả tạp chí</option>
              {ALL_JOURNAL_IDS.map((jid) => (
                <option key={jid} value={jid}>
                  {JOURNAL_DEFINITIONS[jid]?.names?.short || jid.toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          {/* Sort Dropdown */}
          <select
            data-testid="sort-by-select"
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value as SortOption)}
            className="bg-white border border-slate-200/80 text-slate-700 text-xs font-medium rounded-xl px-2.5 py-1.5 outline-none cursor-pointer shadow-2xs"
          >
            <option value="newest">Sắp xếp: Mới nhất</option>
            <option value="title">Sắp xếp: Tên A-Z</option>
            <option value="status">Sắp xếp: Trạng thái</option>
          </select>

          {/* View Mode Toggle: Grid vs Table */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200/60">
            <button
              data-testid="view-mode-grid"
              onClick={() => onViewModeChange('grid')}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-400 hover:text-slate-700'
              }`}
              title="Dạng lưới"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              data-testid="view-mode-table"
              onClick={() => onViewModeChange('table')}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-400 hover:text-slate-700'
              }`}
              title="Dạng bảng"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
