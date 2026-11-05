'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  getManagedJournals,
  ManagedJournalProfile,
  createNewPaperFromJournal,
  JournalStatus,
} from '@/lib/templates/journal-storage';
import { JournalFiltersBar } from './JournalFiltersBar';
import { JournalProfilesList } from './JournalProfilesList';
import { toast } from '@/components/DynamicIslandToast';
import { BookOpen, Layers, CheckCircle2, ShieldCheck } from 'lucide-react';

export const JournalHubView: React.FC = () => {
  const router = useRouter();
  const [journals, setJournals] = useState<ManagedJournalProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | JournalStatus>('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const data = getManagedJournals();
      setJournals(data);
    } catch (err) {
      console.error('Failed to load managed journals:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleCreatePaper = (managed: ManagedJournalProfile) => {
    try {
      const newPaper = createNewPaperFromJournal(managed);
      toast.success(
        'Đã khởi tạo bản thảo',
        `Đã tạo bài báo mới theo chuẩn mẫu "${managed.profile.names?.short || managed.id.toUpperCase()}"`
      );
      router.push(`/papers/editor?id=${encodeURIComponent(newPaper.id)}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi không xác định';
      toast.error('Không thể tạo bài báo', msg);
    }
  };

  const filteredJournals = journals.filter((j) => {
    // 1. Status filter
    if (statusFilter !== 'all' && j.status !== statusFilter) {
      return false;
    }

    // 2. Search query
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    const idMatch = j.id.toLowerCase().includes(q);
    const shortMatch = j.profile.names?.short?.toLowerCase().includes(q);
    const viMatch = j.profile.names?.vi?.toLowerCase().includes(q);
    const enMatch = j.profile.names?.en?.toLowerCase().includes(q);

    return idMatch || shortMatch || viMatch || enMatch;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-16">
      {/* 1. Header Hero Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-2">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-[#78C841]" />
              <span>Quản Lý Mẫu &amp; Tạp Chí Khoa Học</span>
            </h1>
            <span className="text-[11px] px-2.5 py-0.5 rounded-full font-black bg-blue-50 text-blue-700 border border-blue-200/80">
              7 Tạp chí ĐHQG-HCM
            </span>
            <span className="text-[11px] px-2.5 py-0.5 rounded-full font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
              Quy chuẩn 3-Tier
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
            Tùy biến cấu hình quy định học thuật, tóm tắt, từ khóa, trích dẫn Vancouver và dàn trang Typst/LaTeX cho 7 Tạp chí Phát triển KH&amp;CN thuộc ĐHQG TP.HCM.
          </p>
        </div>

        {/* Highlight Stats Badges */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="px-3.5 py-2 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex items-center gap-2 text-xs">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <div>
              <div className="text-[10px] text-slate-400 font-semibold leading-tight">Quy chuẩn</div>
              <div className="font-extrabold text-slate-800">Chuẩn IMRaD</div>
            </div>
          </div>
          <div className="px-3.5 py-2 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex items-center gap-2 text-xs">
            <Layers className="w-4 h-4 text-blue-600" />
            <div>
              <div className="text-[10px] text-slate-400 font-semibold leading-tight">Chuyên mục</div>
              <div className="font-extrabold text-slate-800">8 Loại bài</div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Top Filter and Action Bar */}
      <JournalFiltersBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        totalCount={journals.length}
        filteredCount={filteredJournals.length}
      />

      {/* 3. Journal Profiles Grid */}
      {isLoading ? (
        <div className="h-64 flex items-center justify-center text-slate-400 text-xs font-bold animate-pulse">
          Đang nạp danh mục tạp chí...
        </div>
      ) : (
        <JournalProfilesList
          journals={filteredJournals}
          onCreatePaper={handleCreatePaper}
          onResetFilters={() => {
            setSearchQuery('');
            setStatusFilter('all');
          }}
        />
      )}
    </div>
  );
};
