'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  RotateCcw,
  CheckCircle2,
  FileEdit,
  RefreshCw,
  Save,
} from 'lucide-react';
import { JournalStatus } from '@/lib/templates/journal-storage';

interface DockIconButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  active?: boolean;
  disabled?: boolean;
  badge?: React.ReactNode;
}

const DockIconButton: React.FC<DockIconButtonProps> = ({
  icon,
  label,
  onClick,
  active,
  disabled,
  badge,
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const hoverTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    hoverTimerRef.current = setTimeout(() => {
      setShowTooltip(true);
    }, 700);
  };

  const handleMouseLeave = () => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
    setShowTooltip(false);
  };

  useEffect(() => {
    return () => {
      if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    };
  }, []);

  return (
    <div
      className="relative flex items-center justify-center"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        aria-label={label}
        title={label}
        className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-200 cursor-pointer relative ${
          disabled
            ? 'opacity-40 cursor-not-allowed'
            : active
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-zinc-600 hover:text-zinc-950 hover:bg-white hover:shadow-2xs active:scale-95'
        }`}
      >
        {icon}
        {badge}
      </button>

      {/* Tooltip */}
      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -6 }}
            transition={{ duration: 0.15 }}
            className="absolute left-full ml-3 px-2.5 py-1.5 rounded-xl bg-zinc-900 text-white text-[11px] font-bold whitespace-nowrap shadow-xl z-50 pointer-events-none"
          >
            {label}
            <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-zinc-900" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export interface JournalEditorDockProps {
  status: JournalStatus;
  onToggleStatus: () => void;
  onReset: () => void;
  onRecompile: () => void;
  isCompiling: boolean;
  onSave: () => void;
  isSaving: boolean;
  isDirty?: boolean;
  saveSuccess?: boolean;
}

export const JournalEditorDock: React.FC<JournalEditorDockProps> = ({
  status,
  onToggleStatus,
  onReset,
  onRecompile,
  isCompiling,
  onSave,
  isSaving,
  isDirty = false,
  saveSuccess = false,
}) => {
  const router = useRouter();
  const isPublished = status === 'published';

  return (
    <aside
      className="hidden sm:flex flex-col items-center justify-between h-full w-12 sm:w-14 py-3 px-1 flex-shrink-0 select-none relative z-40 bg-zinc-200/50 rounded-2xl border border-zinc-200/60"
      aria-label="Thanh công cụ trình biên tập mẫu tạp chí"
    >
      {/* TOP SECTION: BACK BUTTON */}
      <div className="flex flex-col items-center gap-2">
        <DockIconButton
          onClick={() => router.back()}
          label="Quay lại danh mục mẫu tạp chí"
          icon={<ArrowLeft className="w-5 h-5 text-zinc-700" strokeWidth={2.4} />}
        />
      </div>

      {/* MIDDLE SECTION: CORE ACTIONS */}
      <div className="flex flex-col items-center gap-2.5">
        {/* Action 1: Reset to Base */}
        <DockIconButton
          onClick={onReset}
          label="Khôi phục cấu hình Base mặc định"
          icon={<RotateCcw className="w-4 h-4 text-zinc-700" strokeWidth={2.4} />}
        />

        {/* Action 2: Toggle Status (Draft vs Published) */}
        <DockIconButton
          onClick={onToggleStatus}
          label={
            isPublished
              ? 'Đang phát hành (Nhấn để chuyển thành Bản nháp)'
              : 'Bản nháp (Nhấn để chuyển thành Đang phát hành)'
          }
          icon={
            isPublished ? (
              <CheckCircle2 className="w-4 h-4 text-[#78C841]" strokeWidth={2.4} />
            ) : (
              <FileEdit className="w-4 h-4 text-amber-600" strokeWidth={2.4} />
            )
          }
          badge={
            <span
              className={`absolute top-1.5 right-1.5 w-2 h-2 rounded-full ${
                isPublished ? 'bg-[#78C841]' : 'bg-amber-500'
              }`}
            />
          }
        />

        {/* Action 3: Recompile Preview */}
        <DockIconButton
          onClick={onRecompile}
          disabled={isCompiling}
          label={isCompiling ? 'Đang biên dịch lại PDF...' : 'Biên dịch lại xem thử (Recompile)'}
          icon={
            <RefreshCw
              className={`w-4 h-4 text-zinc-700 ${isCompiling ? 'animate-spin text-[#78C841]' : ''}`}
              strokeWidth={2.4}
            />
          }
        />

        {/* Subtle Separator */}
        <div className="w-6 h-[1px] bg-zinc-300 my-1" />

        {/* Action 4: Save Changes */}
        <DockIconButton
          onClick={onSave}
          disabled={isSaving}
          label={saveSuccess ? 'Đã lưu thành công!' : isSaving ? 'Đang lưu...' : 'Lưu Thay Đổi'}
          icon={<Save className="w-4 h-4 text-zinc-700" strokeWidth={2.4} />}
          badge={
            saveSuccess ? (
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-[#78C841] border-2 border-white flex items-center justify-center shadow-2xs">
                <CheckCircle2 className="w-2.5 h-2.5 text-white" />
              </span>
            ) : isDirty ? (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-amber-500 border border-white" />
            ) : null
          }
        />
      </div>

      {/* BOTTOM SECTION: STATUS BADGE PILL */}
      <div className="flex flex-col items-center">
        <span
          className={`text-[9.5px] font-extrabold uppercase px-1.5 py-0.5 rounded-md ${
            isPublished
              ? 'bg-[#E4F8D5] text-[#14532D]'
              : 'bg-amber-100 text-amber-900'
          }`}
        >
          {isPublished ? 'PUB' : 'DRAFT'}
        </span>
      </div>
    </aside>
  );
};
