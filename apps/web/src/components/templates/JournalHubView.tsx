'use client';

import React from 'react';
import { useManagedJournals } from '@/hooks';
import { JournalFiltersBar } from './JournalFiltersBar';
import { JournalProfilesList } from './JournalProfilesList';
import { JournalProfileCardShimmer } from './JournalProfileCardShimmer';
import { BookOpen, CheckCircle2 } from 'lucide-react';

export const JournalHubView: React.FC = () => {
  const {
    journals,
    filteredJournals,
    isLoading,
    searchQuery,
    statusFilter,
    setSearchQuery,
    setStatusFilter,
    createPaperFromTemplate,
  } = useManagedJournals();

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 pb-16 px-4 sm:px-6">
      {/* 1. Header Hero Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-2">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-[#78C841]" strokeWidth={3} />
              <span>Quản Lý Mẫu &amp; Tạp Chí Khoa Học</span>
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#E4F8D5] text-[#14532D]">
              7 Tạp chí ĐHQG-HCM
            </span>
          </div>
        </div>
      </div>

      {/* 2. Top Sticky Filter Toolbar matching Eatzy */}
      <div className="sticky top-0 z-30 -mx-4 px-4 sm:-mx-6 sm:px-6 py-3 pb-5 transition-all duration-300">
        <div className="absolute inset-0 bg-[#F8F9FA]/70 backdrop-blur-sm pointer-events-none -z-10 [mask-image:linear-gradient(to_bottom,black_90%,transparent)]" />
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
        <div className="w-full grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
          <JournalProfileCardShimmer cardCount={7} />
        </div>
      ) : (
        <JournalProfilesList
          journals={filteredJournals}
          onCreatePaper={createPaperFromTemplate}
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
