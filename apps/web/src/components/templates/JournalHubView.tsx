'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePaper } from '@/context/PaperContext';
import { createEmptyPaper } from '@/types/paper';
import {
  getManagedJournals,
  ManagedJournalProfile,
  JournalStatus,
} from '@/lib/templates/journal-storage';
import { JournalFiltersBar } from './JournalFiltersBar';
import { JournalProfilesList } from './JournalProfilesList';
import { toast } from '@/components/DynamicIslandToast';
import { BookOpen, CheckCircle2 } from 'lucide-react';

export const JournalHubView: React.FC = () => {
  const router = useRouter();
  const { setPaper, setCurrentJournal } = usePaper();
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
      const journalCode = `VNUHCM-${managed.id.toUpperCase()}`;
      const emptyPaper = createEmptyPaper(journalCode);
      emptyPaper.metadata.journalName = managed.profile.names?.vi || managed.profile.names?.en || managed.id;
      emptyPaper.metadata.journalAbbv = managed.profile.names?.short || managed.id.toUpperCase();
      setPaper(emptyPaper);
      setCurrentJournal(journalCode);

      toast.success(
        'Đã khởi tạo bản thảo',
        `Đã tạo bài báo mới theo chuẩn mẫu "${managed.profile.names?.short || managed.id.toUpperCase()}"`
      );
      router.push('/editor');
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
              <BookOpen className="w-6 h-6 text-[#78C841]" strokeWidth={3} />
              <span>Quản Lý Mẫu &amp; Tạp Chí Khoa Học</span>
            </h1>
          </div>
        </div>
      </div>

      {/* 2. Top Sticky Filter Toolbar matching Eatzy */}
      <div className="sticky top-0 z-30 -mx-4 px-4 sm:-mx-6 sm:px-6 py-3 pb-5 transition-all duration-300">
        {/* Frosted Glass Backdrop with soft bottom fade mask */}
        <div className="absolute inset-0 bg-[#F7F7F7]/70 backdrop-blur-sm pointer-events-none -z-10 [mask-image:linear-gradient(to_bottom,black_85%,transparent)]" />

        <JournalFiltersBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          totalCount={journals.length}
          filteredCount={filteredJournals.length}
        />
      </div>

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

      {/* 4. End of list indicator matching Eatzy */}
      {!isLoading && filteredJournals.length > 0 && (
        <div className="py-10 flex items-center justify-center gap-4 opacity-50 select-none">
          <div className="h-[1px] bg-gradient-to-r from-transparent via-zinc-300 to-transparent w-24" />
          <div className="flex flex-col items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-zinc-500" />
            <span className="text-[12px] font-bold text-zinc-500 uppercase tracking-wider">
              Bạn đã xem hết danh sách mẫu tạp chí
            </span>
          </div>
          <div className="h-[1px] bg-gradient-to-r from-transparent via-zinc-300 to-transparent w-24" />
        </div>
      )}
    </div>
  );
};

export default JournalHubView;
