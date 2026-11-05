'use client';

import React from 'react';
import Link from 'next/link';
import { FolderArchive, Sparkles, UploadCloud, RotateCcw } from 'lucide-react';

interface EmptyPapersStateProps {
  isFiltered?: boolean;
  onResetFilters?: () => void;
  onCreateFromTemplate?: () => void;
}

export const EmptyPapersState: React.FC<EmptyPapersStateProps> = ({
  isFiltered = false,
  onResetFilters,
  onCreateFromTemplate,
}) => {
  return (
    <div
      data-testid="empty-papers-state"
      className="bg-white rounded-3xl border border-dashed border-slate-300/90 p-12 text-center flex flex-col items-center justify-center space-y-4 shadow-2xs"
    >
      <div className="w-16 h-16 rounded-3xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 shadow-2xs">
        <FolderArchive className="w-8 h-8 stroke-[1.5]" />
      </div>

      <div className="max-w-md space-y-1">
        <h3 className="text-base font-bold text-slate-800">
          {isFiltered
            ? 'Không tìm thấy bài báo phù hợp'
            : 'Chưa có bài báo nào trong danh sách'}
        </h3>
        <p className="text-xs text-slate-400">
          {isFiltered
            ? 'Hãy thử thay đổi từ khóa tìm kiếm hoặc đặt lại các bộ lọc trạng thái và tạp chí.'
            : 'Bắt đầu soạn thảo bài báo khoa học đầu tiên của bạn từ mẫu chuẩn hoặc tải tệp Word (.docx) lên.'}
        </p>
      </div>

      <div className="flex items-center gap-2.5 pt-2 flex-wrap justify-center">
        {isFiltered && onResetFilters && (
          <button
            onClick={onResetFilters}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Đặt lại bộ lọc</span>
          </button>
        )}

        <Link
          href="/upload"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-200 hover:border-slate-300 text-slate-700 hover:text-slate-900 shadow-2xs transition-all"
        >
          <UploadCloud className="w-3.5 h-3.5 text-blue-600" />
          <span>Tải file DOCX mới</span>
        </Link>

        {onCreateFromTemplate ? (
          <button
            onClick={onCreateFromTemplate}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Tạo từ mẫu</span>
          </button>
        ) : (
          <Link
            href="/templates"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs transition-all"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Tạo từ mẫu</span>
          </Link>
        )}
      </div>
    </div>
  );
};
