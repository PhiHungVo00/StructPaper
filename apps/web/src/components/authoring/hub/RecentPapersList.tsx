'use client';

import React, { useState } from 'react';
import { CompletePaper } from '@/types/paper';
import {
  FolderArchive,
  Search,
  LayoutGrid,
  List,
  Edit3,
  Copy,
  Download,
  Trash2,
  Calendar,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';

interface RecentPapersListProps {
  papers: CompletePaper[];
  onOpenPaper: (paper: CompletePaper) => void;
  onDuplicatePaper: (id: string) => void;
  onDeletePaper: (id: string) => void;
  onExportTypst: (paper: CompletePaper) => void;
}

export const RecentPapersList: React.FC<RecentPapersListProps> = ({
  papers,
  onOpenPaper,
  onDuplicatePaper,
  onDeletePaper,
  onExportTypst,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'ready' | 'draft' | 'review'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'updated' | 'title'>('updated');

  const filteredPapers = papers
    .filter((p) => {
      const matchSearch =
        p.metadata.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.metadata.authors.some((a) => a.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (p.templateName || '').toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchSearch) return false;

      if (statusFilter !== 'all') {
        const paperStatus = p.status || 'draft';
        return paperStatus === statusFilter;
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'title') {
        return a.metadata.title.localeCompare(b.metadata.title);
      }
      const timeA = new Date(a.updatedAt || 0).getTime();
      const timeB = new Date(b.updatedAt || 0).getTime();
      return timeB - timeA;
    });

  const formatRelativeTime = (iso?: string) => {
    if (!iso) return 'Gần đây';
    try {
      const date = new Date(iso);
      return date.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return 'Gần đây';
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'ready':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>Sẵn sàng xuất</span>
          </span>
        );
      case 'review':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3 h-3 text-amber-600" />
            <span>Đang phản biện</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
            <Edit3 className="w-3 h-3 text-slate-500" />
            <span>Bản nháp</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-4 pt-4 border-t border-slate-200/60">
      {/* Header with Search and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <FolderArchive className="w-4 h-4 text-slate-700" />
          <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
            Bài báo đã làm gần đây
          </h2>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
            {filteredPapers.length} bài
          </span>
        </div>

        {/* Filter & View toggles */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm bài báo, tác giả..."
              className="pl-8 pr-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/70 focus:bg-white border border-transparent focus:border-[#78C841] text-xs font-medium text-slate-800 outline-none w-48 sm:w-56 transition-all"
            />
          </div>

          {/* Status Pills */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl gap-1">
            {[
              { id: 'all', label: 'Tất cả' },
              { id: 'ready', label: 'Sẵn sàng' },
              { id: 'draft', label: 'Bản nháp' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id as any)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  statusFilter === tab.id
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* View Toggle */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'grid' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-400 hover:text-slate-600'
              }`}
              title="Dạng lưới"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'list' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-400 hover:text-slate-600'
              }`}
              title="Dạng danh sách"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Empty State */}
      {filteredPapers.length === 0 ? (
        <div className="p-10 text-center border-2 border-dashed border-slate-200 rounded-3xl bg-white space-y-3">
          <FileText className="w-8 h-8 text-slate-400 mx-auto" />
          <div className="text-sm font-bold text-slate-800">Không tìm thấy bài báo nào</div>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Hãy chọn một mẫu bài báo ở hàng trên để bắt đầu tạo và biên soạn bài báo khoa học đầu tiên của bạn.
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        /* Grid View */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 sm:gap-4">
          {filteredPapers.map((paper) => (
            <div
              key={paper.id}
              onClick={() => onOpenPaper(paper)}
              className="group bg-white rounded-2xl border border-slate-200/90 hover:border-[#78C841] p-4 flex flex-col justify-between shadow-2xs hover:shadow-md transition-all cursor-pointer hover:scale-[1.01]"
            >
              <div className="space-y-2.5">
                {/* Top Row: Template Tag & Status Badge */}
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-mono truncate max-w-[160px]">
                    {paper.templateName || paper.templateId || 'Typst Paper'}
                  </span>
                  {getStatusBadge(paper.status)}
                </div>

                {/* Title */}
                <h3 className="font-extrabold text-sm text-slate-900 group-hover:text-[#14532D] line-clamp-2 leading-snug">
                  {paper.metadata.title || 'Bài báo chưa đặt tên'}
                </h3>

                {/* Authors */}
                <p className="text-xs text-slate-500 truncate">
                  {paper.metadata.authors.map((a) => a.name).join(', ') || 'Chưa có tác giả'}
                </p>

                {/* Journal & Dates */}
                <div className="text-[11px] text-slate-400 flex items-center gap-1.5 pt-1 border-t border-slate-100">
                  <Calendar className="w-3 h-3 text-slate-400" />
                  <span>Cập nhật: {formatRelativeTime(paper.updatedAt)}</span>
                  <span>•</span>
                  <span>{paper.sections?.length || 0} mục</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100 gap-1">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenPaper(paper);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-black text-white text-xs font-bold flex items-center gap-1 shadow-2xs transition-all active:scale-95"
                >
                  <Edit3 className="w-3 h-3 text-[#78C841]" />
                  <span>Soạn thảo</span>
                </button>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onExportTypst(paper);
                    }}
                    className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors"
                    title="Tải file mã nguồn Typst (.typ)"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDuplicatePaper(paper.id);
                    }}
                    className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors"
                    title="Nhân bản bài báo này"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeletePaper(paper.id);
                    }}
                    className="p-1.5 rounded-xl hover:bg-rose-50 text-rose-500 hover:text-rose-700 transition-colors"
                    title="Xóa bài báo này"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* List View */
        <div className="bg-white rounded-2xl border border-slate-200/90 divide-y divide-slate-100 overflow-hidden shadow-2xs">
          {filteredPapers.map((paper) => (
            <div
              key={paper.id}
              onClick={() => onOpenPaper(paper)}
              className="group p-3.5 hover:bg-slate-50/80 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer"
            >
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-[#78C841]/15 group-hover:text-[#14532D] transition-colors">
                  <FileText className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-extrabold text-sm text-slate-900 group-hover:text-[#14532D] truncate max-w-md">
                      {paper.metadata.title || 'Bài báo chưa đặt tên'}
                    </h3>
                    {getStatusBadge(paper.status)}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-2 flex-wrap">
                    <span>{paper.metadata.authors.map((a) => a.name).join(', ') || 'Chưa có tác giả'}</span>
                    <span>•</span>
                    <span className="font-mono text-[11px] text-slate-400">
                      {paper.templateName || paper.templateId}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                <div className="text-right text-[11px] text-slate-400 font-mono hidden md:block">
                  {formatRelativeTime(paper.updatedAt)}
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenPaper(paper);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-black text-white text-xs font-bold flex items-center gap-1 shadow-2xs transition-all active:scale-95"
                  >
                    <Edit3 className="w-3 h-3 text-[#78C841]" />
                    <span>Soạn thảo</span>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onExportTypst(paper);
                    }}
                    className="p-1.5 rounded-xl hover:bg-slate-200 text-slate-600 transition-colors"
                    title="Tải file Typst (.typ)"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDuplicatePaper(paper.id);
                    }}
                    className="p-1.5 rounded-xl hover:bg-slate-200 text-slate-600 transition-colors"
                    title="Nhân bản"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeletePaper(paper.id);
                    }}
                    className="p-1.5 rounded-xl hover:bg-rose-50 text-rose-500 transition-colors"
                    title="Xóa"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
