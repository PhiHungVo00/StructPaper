'use client';

import React from 'react';
import { JournalProfileCard } from './JournalProfileCard';
import { ManagedJournalProfile } from '@/lib/templates/journal-storage';
import { AlertCircle, RotateCcw } from 'lucide-react';

interface JournalProfilesListProps {
  journals: ManagedJournalProfile[];
  onCreatePaper: (managed: ManagedJournalProfile) => void;
  onResetFilters?: () => void;
}

export const JournalProfilesList: React.FC<JournalProfilesListProps> = ({
  journals,
  onCreatePaper,
  onResetFilters,
}) => {
  if (journals.length === 0) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center flex flex-col items-center justify-center space-y-3 shadow-xs my-6">
        <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h4 className="font-extrabold text-base text-slate-800">
          Không tìm thấy tạp chí phù hợp
        </h4>
        <p className="text-xs text-slate-500 max-w-md">
          Không có tạp chí nào khớp với từ khóa tìm kiếm hoặc bộ lọc trạng thái hiện tại.
          Vui lòng thử điều chỉnh lại bộ lọc.
        </p>
        {onResetFilters && (
          <button
            onClick={onResetFilters}
            className="mt-2 flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Xóa bộ lọc & Hiển thị tất cả</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
      {journals.map((journal) => (
        <JournalProfileCard
          key={journal.id}
          managed={journal}
          onCreatePaper={onCreatePaper}
        />
      ))}
    </div>
  );
};
