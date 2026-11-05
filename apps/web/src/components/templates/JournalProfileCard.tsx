'use client';

import React from 'react';
import Link from 'next/link';
import {
  FileText,
  Sliders,
  Layers,
  Quote,
  Columns,
  Sparkles,
  ExternalLink,
  BookOpen,
} from 'lucide-react';
import { ManagedJournalProfile } from '@/lib/templates/journal-storage';

interface JournalProfileCardProps {
  managed: ManagedJournalProfile;
  onCreatePaper: (managed: ManagedJournalProfile) => void;
}

export const JournalProfileCard: React.FC<JournalProfileCardProps> = ({
  managed,
  onCreatePaper,
}) => {
  const { id, status, profile } = managed;
  const brandColor = profile.color || '#1e3a8a';
  const nameVi = profile.names?.vi || 'Tạp chí ĐHQG-HCM';
  const nameEn = profile.names?.en || 'Science and Technology Development Journal';
  const shortCode = profile.names?.short || id.toUpperCase();
  const articleTypesCount = profile.articleTypes?.length || 8;
  const abstractMin = profile.frontMatter?.abstract?.minWords ?? 275;
  const abstractMax = profile.frontMatter?.abstract?.maxWords ?? 500;
  const keywordsMin = profile.frontMatter?.keywords?.min ?? 3;
  const keywordsMax = profile.frontMatter?.keywords?.max ?? 5;
  const keywordsSep = profile.frontMatter?.keywords?.separator ?? ';';
  const citationStyle = profile.citation?.style ?? 'vancouver';
  const columns = profile.layout?.columns ?? 2;
  const clsName = profile.latex?.cls || `structpaper-${id}.cls`;

  const isPublished = status === 'published';

  return (
    <div className="group bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col justify-between overflow-hidden relative hover:border-slate-300">
      {/* Top Brand Ribbon */}
      <div className="h-2 w-full relative" style={{ backgroundColor: brandColor }}>
        <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent" />
      </div>

      <div className="p-4 sm:p-5 flex-1 flex flex-col">
        {/* Header: Short code badge, Hex color indicator, Status */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="px-2.5 py-1 rounded-xl font-black text-xs tracking-wide shadow-2xs"
              style={{
                backgroundColor: `${brandColor}18`,
                color: brandColor,
                border: `1px solid ${brandColor}40`,
              }}
            >
              {shortCode}
            </span>
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-slate-100 text-[11px] font-mono font-medium text-slate-600">
              <span
                className="w-2.5 h-2.5 rounded-full inline-block shadow-2xs"
                style={{ backgroundColor: brandColor }}
              />
              {brandColor}
            </span>
          </div>

          {/* Status badge */}
          <span
            className={`px-2 py-0.5 rounded-full text-[11px] font-extrabold flex items-center gap-1 ${
              isPublished
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/70'
                : 'bg-amber-50 text-amber-700 border border-amber-200/70'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isPublished ? 'bg-emerald-500' : 'bg-amber-500'
              }`}
            />
            {isPublished ? 'Đang phát hành' : 'Bản nháp'}
          </span>
        </div>

        {/* Bilingual Journal Names */}
        <div className="mb-4">
          <h3 className="font-extrabold text-sm sm:text-base text-slate-900 group-hover:text-slate-950 leading-snug line-clamp-2">
            {nameVi}
          </h3>
          <p className="text-xs text-slate-500 italic mt-0.5 line-clamp-1">{nameEn}</p>
        </div>

        {/* Specification pills grid */}
        <div className="grid grid-cols-2 gap-2 my-auto pt-2 pb-3 border-t border-b border-slate-100 text-[11.5px]">
          <div className="flex items-center gap-1.5 text-slate-600">
            <Layers className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">
              <strong>{articleTypesCount}</strong> Loại bài báo
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-slate-600">
            <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">
              Tóm tắt: <strong>{abstractMin}-{abstractMax}</strong> từ
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-slate-600">
            <Quote className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">
              Trích dẫn: <strong className="capitalize">{citationStyle}</strong>
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-slate-600">
            <Columns className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">
              Bố cục: <strong>A4, {columns} cột</strong>
            </span>
          </div>
        </div>

        {/* Footer specs: Keywords & LaTeX cls */}
        <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-400">
          <span className="truncate">
            Từ khóa: {keywordsMin}-{keywordsMax} từ (dấu &quot;{keywordsSep}&quot;)
          </span>
          <span className="font-mono text-[10px] bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200/60 truncate max-w-[130px]">
            {clsName}
          </span>
        </div>
      </div>

      {/* Card Action Buttons */}
      <div className="p-3 sm:px-4 sm:pb-4 pt-0 bg-slate-50/50 flex items-center gap-2">
        <Link
          href={`/templates/journal/${id}`}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-white hover:bg-slate-100 text-slate-700 hover:text-slate-950 font-bold text-xs rounded-xl border border-slate-200/90 shadow-2xs hover:shadow-xs transition-all cursor-pointer"
        >
          <Sliders className="w-3.5 h-3.5 text-slate-500" />
          <span>Tùy chỉnh & Xem chi tiết</span>
        </Link>

        <button
          onClick={() => onCreatePaper(managed)}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-[#78C841] hover:bg-[#6cb43a] text-zinc-950 font-bold text-xs rounded-xl shadow-2xs hover:shadow-sm transition-all cursor-pointer"
          title="Tạo bài báo mới dựa trên mẫu quy định của tạp chí này"
        >
          <BookOpen className="w-3.5 h-3.5 stroke-[2.5]" />
          <span className="truncate">Tạo bài báo từ mẫu</span>
        </button>
      </div>
    </div>
  );
};
