'use client';

import React, { useRef } from 'react';
import Link from 'next/link';
import type { ManuscriptRecord } from '@structpaper/doc-model';
import {
  Clock,
  Pin,
  ChevronLeft,
  ChevronRight,
  Plus,
  Sparkles,
} from 'lucide-react';
import {
  getJournalColor,
  getJournalShortName,
  getManuscriptTitle,
  getWorkflowStatusConfig,
  formatRelativeTime,
} from './types';

interface RecentPapersRowProps {
  papers: ManuscriptRecord[];
  onOpenPaper: (id: string) => void;
  onCreateNew?: () => void;
}

export const RecentPapersRow: React.FC<RecentPapersRowProps> = ({
  papers,
  onOpenPaper,
  onCreateNew,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Take the most recently updated or opened 10 papers
  const recentPapers = [...papers]
    .sort((a, b) => {
      const timeA = new Date(a.info.lastOpenedAt || a.info.updatedAt).getTime();
      const timeB = new Date(b.info.lastOpenedAt || b.info.updatedAt).getTime();
      return timeB - timeA;
    })
    .slice(0, 10);

  const handleScroll = (direction: 'left' | 'right') => {
    if (!scrollContainerRef.current) return;
    const offset = direction === 'left' ? -320 : 320;
    scrollContainerRef.current.scrollBy({ left: offset, behavior: 'smooth' });
  };

  return (
    <div className="space-y-3.5">
      {/* Header with Title and Scroll Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-700">
            <Clock className="w-3.5 h-3.5" />
          </div>
          <h2 className="text-sm font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
            <span>Bài chỉnh sửa gần đây</span>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
              {recentPapers.length}
            </span>
          </h2>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => handleScroll('left')}
            className="w-7 h-7 rounded-xl border border-slate-200/80 bg-white hover:bg-slate-50 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors cursor-pointer shadow-2xs"
            title="Cuộn sang trái"
            aria-label="Cuộn sang trái"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleScroll('right')}
            className="w-7 h-7 rounded-xl border border-slate-200/80 bg-white hover:bg-slate-50 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors cursor-pointer shadow-2xs"
            title="Cuộn sang phải"
            aria-label="Cuộn sang phải"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Horizontal Scrollable Carousel */}
      <div
        ref={scrollContainerRef}
        data-testid="recent-papers-scroll-container"
        className="flex items-stretch gap-3.5 overflow-x-auto pb-2 pt-1 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent snap-x snap-mandatory"
        style={{ scrollbarWidth: 'thin' }}
      >
        {/* Quick New Paper Starter Card */}
        <div
          onClick={onCreateNew}
          className="group cursor-pointer shrink-0 w-36 sm:w-40 snap-start select-none flex flex-col"
        >
          <div className="w-full aspect-[210/297] rounded-2xl bg-white border-2 border-dashed border-emerald-300/80 hover:border-emerald-500 hover:bg-emerald-50/20 flex flex-col items-center justify-center p-3 text-center transition-all duration-200 shadow-2xs group-hover:shadow-md group-hover:scale-[1.02]">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-2.5 transition-transform group-hover:scale-110 shadow-2xs">
              <Plus className="w-5 h-5 stroke-[2.5]" />
            </div>
            <span className="text-xs font-bold text-slate-800 group-hover:text-emerald-800">
              Tạo bài báo mới
            </span>
            <span className="text-[10px] text-slate-400 mt-1 leading-tight">
              Khởi tạo từ mẫu chuẩn VNUHCM
            </span>
          </div>
          <div className="mt-2 text-center">
            <span className="text-[11px] font-semibold text-emerald-700 flex items-center justify-center gap-1">
              <Sparkles className="w-3 h-3" />
              Bắt đầu soạn thảo
            </span>
          </div>
        </div>

        {/* Recent Papers Cards */}
        {recentPapers.map((paper) => {
          const title = getManuscriptTitle(paper);
          const journalColor = getJournalColor(paper.doc.journalId);
          const journalShort = getJournalShortName(paper.doc.journalId);
          const statusConfig = getWorkflowStatusConfig(paper.info.workflowStatus);
          const relativeTime = formatRelativeTime(
            paper.info.lastOpenedAt || paper.info.updatedAt
          );

          return (
            <div
              key={paper.info.id}
              data-testid={`recent-paper-${paper.info.id}`}
              onClick={() => onOpenPaper(paper.info.id)}
              className="group cursor-pointer shrink-0 w-44 sm:w-48 snap-start select-none flex flex-col"
            >
              {/* Mini A4 Simulation Preview Card */}
              <div className="w-full aspect-[210/297] rounded-2xl bg-white border border-slate-200/90 group-hover:border-emerald-500 p-3 flex flex-col justify-between shadow-xs transition-all duration-200 group-hover:shadow-md group-hover:scale-[1.02] overflow-hidden relative">
                {/* Journal Identity Color Top Bar */}
                <div
                  className="absolute top-0 left-0 right-0 h-1.5"
                  style={{ backgroundColor: journalColor }}
                />

                {/* Card Top: Journal short badge & Pinned icon */}
                <div className="pt-1 flex items-center justify-between">
                  <span
                    className="text-[9px] font-extrabold px-1.5 py-0.5 rounded text-white tracking-wide"
                    style={{ backgroundColor: journalColor }}
                  >
                    {journalShort}
                  </span>

                  {paper.info.pinned && (
                    <span
                      className="text-amber-600 flex items-center gap-0.5"
                      title="Đã ghim"
                    >
                      <Pin className="w-3 h-3 fill-amber-500 text-amber-600" />
                    </span>
                  )}
                </div>

                {/* Simulated Article Body Skeleton */}
                <div className="my-auto py-1 space-y-1.5">
                  <div className="h-1.5 w-full rounded bg-slate-800/80" />
                  <div className="h-1.5 w-3/4 rounded bg-slate-600/70" />

                  {/* 2-Column academic layout simulation */}
                  <div className="grid grid-cols-2 gap-1.5 pt-1.5">
                    <div className="space-y-1">
                      <div className="h-1 w-full rounded bg-slate-200" />
                      <div className="h-1 w-full rounded bg-slate-200" />
                      <div className="h-1 w-4/5 rounded bg-slate-200" />
                    </div>
                    <div className="space-y-1">
                      <div className="h-1 w-full rounded bg-slate-200" />
                      <div className="h-1 w-full rounded bg-slate-200" />
                      <div className="h-1 w-2/3 rounded bg-slate-200" />
                    </div>
                  </div>
                </div>

                {/* Card Bottom: Status & Relative Time */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px]">
                  <span
                    className={`font-bold px-1.5 py-0.5 rounded-full text-[9px] ${statusConfig.chipBg} ${statusConfig.chipText}`}
                  >
                    {statusConfig.label}
                  </span>
                  <span className="text-slate-400 font-medium">{relativeTime}</span>
                </div>
              </div>

              {/* Title & Submission Info Below Card */}
              <div className="mt-2 px-1">
                <h3
                  className="text-xs font-bold text-slate-800 group-hover:text-emerald-800 line-clamp-2 leading-snug transition-colors"
                  title={title}
                >
                  {title}
                </h3>
                {paper.info.submissionId && (
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5 truncate">
                    {paper.info.submissionId}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
