'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Check, ArrowRight } from 'lucide-react';
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
  const { id, profile } = managed;
  const brandColor = profile.color || '#000099';
  const nameVi = profile.names?.vi || 'Tạp chí ĐHQG-HCM';
  const shortCode = profile.names?.short || id.toUpperCase();
  const citationStyle = profile.citation?.style || 'vancouver';

  return (
    <motion.button
      type="button"
      data-testid={`compact-template-${id}`}
      onClick={() => onSelect(managed)}
      whileHover={isTest ? undefined : { scale: 1.02 }}
      whileTap={isTest ? undefined : { scale: 0.98 }}
      transition={isTest ? { duration: 0 } : { duration: 0.18, ease: 'easeOut' }}
      className={`w-full text-left p-3.5 sm:p-4 rounded-2xl sm:rounded-3xl border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between group ${
        isSelected
          ? 'bg-white border-[#78C841] ring-4 ring-[#78C841]/15 shadow-md shadow-[#78C841]/10'
          : 'bg-white/80 hover:bg-white border-slate-200 hover:border-slate-300 shadow-2xs hover:shadow-md'
      }`}
    >
      {/* Brand Accent top line */}
      <div
        className="absolute top-0 left-0 right-0 h-1"
        style={{ backgroundColor: brandColor }}
      />

      <div className="w-full">
        {/* Top Badges */}
        <div className="flex items-center justify-between mb-2">
          <span
            className="px-2.5 py-0.5 rounded-full text-[10.5px] font-extrabold text-white shadow-3xs"
            style={{ backgroundColor: brandColor }}
          >
            {shortCode}
          </span>

          {isSelected ? (
            <span className="w-5 h-5 rounded-full bg-[#78C841] text-zinc-950 flex items-center justify-center shadow-xs">
              <Check className="w-3 h-3 stroke-[3]" />
            </span>
          ) : (
            <span className="text-[10px] font-bold text-slate-400 capitalize">
              {citationStyle}
            </span>
          )}
        </div>

        {/* Vietnamese Name */}
        <h4 className="text-xs sm:text-sm font-bold text-slate-900 line-clamp-2 leading-snug group-hover:text-black">
          {nameVi}
        </h4>
      </div>

      {/* Footer minimal action */}
      <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold text-slate-500 group-hover:text-[#14532D]">
        <span>Chọn mẫu</span>
        <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform text-[#78C841]" />
      </div>
    </motion.button>
  );
};
