'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Check, ArrowRight, BookOpen } from 'lucide-react';
import { ManagedJournalProfile } from '@/lib/templates/journal-storage';

interface CompactTemplateCardProps {
  managed: ManagedJournalProfile;
  isSelected?: boolean;
  onSelect: (managed: ManagedJournalProfile) => void;
}

const isTest = typeof process !== 'undefined' && process.env.NODE_ENV === 'test';

export const CompactTemplateCard: React.FC<CompactTemplateCardProps> = ({
  managed,
  isSelected = false,
  onSelect,
}) => {
  const { id, status, profile } = managed;
  const brandColor = profile.color || '#000099';
  const nameVi = profile.names?.vi || 'Tạp chí ĐHQG-HCM';
  const nameEn = profile.names?.en || 'Science and Technology Development Journal';
  const shortCode = profile.names?.short || id.toUpperCase();
  const articleTypesCount = profile.articleTypes?.length || 8;
  const citationStyle = profile.citation?.style ?? 'vancouver';
  const columns = profile.layout?.columns ?? 2;
  const isPublished = status === 'published';

  return (
    <motion.div
      data-testid={`compact-template-${id}`}
      onClick={() => onSelect(managed)}
      whileHover={isTest ? undefined : { scale: 1.015 }}
      whileTap={isTest ? undefined : { scale: 0.985 }}
      transition={isTest ? { duration: 0 } : { duration: 0.18, ease: 'easeOut' }}
      className={`w-full text-left p-4 rounded-[28px] transition-all duration-200 cursor-pointer flex flex-col justify-between relative overflow-hidden select-none group ${
        isSelected
          ? 'bg-white border-4 border-[#78C841] ring-4 ring-[#78C841]/25 shadow-[0_8px_30px_rgba(120,200,65,0.18)]'
          : 'bg-gray-200/40 border-4 border-gray-200 hover:bg-white hover:border-gray-300 hover:shadow-[0_8px_25px_rgba(0,0,0,0.08)]'
      }`}
    >
      {/* Subtle thick watermark icon in top right - signature template card identity */}
      <BookOpen
        className="absolute -right-2.5 -top-2.5 w-20 h-20 stroke-[2.2] pointer-events-none text-zinc-900/[0.04] group-hover:text-zinc-900/[0.07] transition-colors"
      />

      <div>
        {/* Top Badges row matching /templates */}
        <div className="flex items-center justify-between mb-2">
          <span
            className="px-2.5 py-0.5 rounded-full text-[10.5px] font-black text-white shadow-2xs"
            style={{ backgroundColor: brandColor }}
          >
            {shortCode}
          </span>

          {isSelected ? (
            <span className="inline-flex items-center gap-1 text-[9.5px] font-extrabold text-[#14532D] bg-[#D9F99D] px-2.5 py-0.5 rounded-full shadow-2xs">
              <Check className="w-3 h-3 stroke-[3]" />
              <span>Đang chọn</span>
            </span>
          ) : (
            <span className="text-[9.5px] font-extrabold text-[#14532D] bg-[#D9F99D]/75 px-2 py-0.5 rounded-full">
              {isPublished ? 'Đang phát hành' : 'Bản nháp'}
            </span>
          )}
        </div>

        {/* Bilingual Journal Names */}
        <h4 className="font-bold text-xs sm:text-[13px] text-[#1A1A1A] line-clamp-2 mb-0.5 leading-snug group-hover:text-black">
          {nameVi}
        </h4>
        <p className="text-[10.5px] text-zinc-500 line-clamp-1 mb-2 italic">
          {nameEn}
        </p>

        {/* Specification Stats matching /templates specification row */}
        <div className="flex items-center gap-1.5 text-[9.5px] text-zinc-400 font-semibold mb-2 flex-wrap">
          <span>{articleTypesCount} Loại bài</span>
          <span>• Trích dẫn: <strong className="capitalize text-zinc-600">{citationStyle}</strong></span>
          <span>• {columns} cột</span>
        </div>
      </div>

      {/* Action Footer */}
      <div className="mt-2.5 pt-2 border-t border-gray-200/60 flex items-center justify-between text-[11px] font-bold">
        <span
          className={`transition-colors ${
            isSelected ? 'text-[#14532D] font-black' : 'text-zinc-500 group-hover:text-zinc-900'
          }`}
        >
          {isSelected ? 'Đã chọn mẫu này' : 'Chọn mẫu này'}
        </span>
        <ArrowRight
          className={`w-3.5 h-3.5 transition-transform ${
            isSelected
              ? 'text-[#78C841] translate-x-0.5'
              : 'text-zinc-400 group-hover:text-zinc-800 group-hover:translate-x-1'
          }`}
        />
      </div>
    </motion.div>
  );
};
