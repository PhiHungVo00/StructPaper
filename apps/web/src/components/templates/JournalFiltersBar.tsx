'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Search, Plus, X } from 'lucide-react';
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
    <div className="space-y-3">
      {/* Row 1: Eatzy-style Search & Action Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Eatzy Search Input Box */}
        <div className="flex-1 max-w-lg relative group">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2.5 z-10 pointer-events-none">
            <Search className="w-4 h-4 text-zinc-400 group-focus-within:text-[#78C841] transition-colors" />
            <div className="w-px h-3.5 bg-zinc-300" />
          </div>

          <input
            type="text"
            role="searchbox"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Tìm theo mã STDJ-*, tên tiếng Việt hoặc tiếng Anh..."
            className="w-full bg-slate-50 border-2 border-white focus:border-[#78C841]/30 rounded-2xl sm:rounded-3xl py-2.5 pl-12 pr-10 text-xs sm:text-sm font-semibold text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-4 focus:ring-[#78C841]/10 transition-all shadow-[inset_0_0_15px_rgba(0,0,0,0.06)]"
          />

          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-lg bg-zinc-200 hover:bg-zinc-300 flex items-center justify-center transition-all group/close cursor-pointer"
              title="Xóa tìm kiếm"
            >
              <X className="w-3.5 h-3.5 text-zinc-600 group-hover/close:rotate-90 transition-transform duration-300" />
            </button>
          )}
        </div>

        {/* Add new journal button */}
        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/templates/journal/new"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-xs font-extrabold bg-[#78C841] hover:bg-[#6cb43a] text-zinc-950 shadow-2xs transition-all cursor-pointer"
            title="Tạo hồ sơ tạp chí khoa học mới"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Thêm Tạp chí Mới</span>
          </Link>
        </div>
      </div>

      {/* Row 2: Status filter chips (Eatzy style) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none pt-1">
        {statusOptions.map((opt) => {
          const active = statusFilter === opt.value;
          return (
            <motion.button
              key={opt.value}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onStatusFilterChange(opt.value)}
              className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                active
                  ? 'bg-[#1A1A1A] text-white shadow-md shadow-black/10'
                  : 'bg-gray-100 text-zinc-600 hover:text-zinc-900 hover:bg-gray-200/70'
              }`}
            >
              {opt.label}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};
