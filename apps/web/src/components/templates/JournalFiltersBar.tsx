'use client';

import React from 'react';
import Link from 'next/link';
import { Search, Plus, LayoutTemplate, X, Filter } from 'lucide-react';
import { JournalStatus } from '@/lib/templates/journal-storage';

interface JournalFiltersBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  statusFilter: 'all' | JournalStatus;
  onStatusFilterChange: (status: 'all' | JournalStatus) => void;
  totalCount: number;
  filteredCount: number;
}

export const JournalFiltersBar: React.FC<JournalFiltersBarProps> = ({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  totalCount,
  filteredCount,
}) => {
  const statusOptions: { value: 'all' | JournalStatus; label: string }[] = [
    { value: 'all', label: 'Tất cả' },
    { value: 'published', label: 'Đang phát hành' },
    { value: 'draft', label: 'Bản nháp' },
  ];

  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-white/70 backdrop-blur-md p-3 rounded-2xl border border-slate-200/80 shadow-xs">
      {/* Left: Search input */}
      <div className="flex flex-1 items-center gap-2">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            role="searchbox"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Tìm theo mã STDJ-*, tên tiếng Việt hoặc tiếng Anh..."
            className="w-full bg-slate-50/70 border border-slate-200/90 rounded-xl pl-9 pr-8 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#78C841] focus:bg-white focus:ring-2 focus:ring-[#78C841]/20 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full"
              title="Xóa tìm kiếm"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Status filter pills */}
        <div className="flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl text-xs font-semibold">
          <Filter className="w-3.5 h-3.5 text-slate-400 ml-1.5 mr-0.5 hidden sm:inline-block" />
          {statusOptions.map((opt) => {
            const active = statusFilter === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => onStatusFilterChange(opt.value)}
                className={`px-2.5 py-1 rounded-lg text-xs transition-all cursor-pointer select-none ${
                  active
                    ? 'bg-white text-slate-900 font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Right: Quick actions */}
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-[11px] text-slate-400 hidden xl:inline-block font-medium">
          Hiển thị {filteredCount}/{totalCount} tạp chí
        </span>

        {/* Builder button */}
        <Link
          href="/templates/builder"
          className="flex items-center gap-1.5 px-3 py-2 bg-slate-100/90 hover:bg-slate-200/90 text-slate-700 hover:text-slate-950 rounded-xl text-xs font-bold transition-all cursor-pointer"
          title="Mở trình dựng bố cục layout tùy biến"
        >
          <LayoutTemplate className="w-3.5 h-3.5 text-slate-600" />
          <span>Thiết kế Layout Mẫu</span>
        </Link>

        {/* Add new journal button */}
        <Link
          href="/templates/journal/new"
          className="flex items-center gap-1.5 px-3.5 py-2 bg-[#78C841] hover:bg-[#6cb43a] text-zinc-950 rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer hover:shadow-sm"
          title="Tạo hồ sơ tạp chí khoa học mới"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Thêm Tạp chí Mới</span>
        </Link>
      </div>
    </div>
  );
};
