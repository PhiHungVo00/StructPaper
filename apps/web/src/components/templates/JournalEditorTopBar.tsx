'use client';

import React from 'react';
import { JournalProfile } from '@structpaper/journal-profiles';
import { JournalStatus } from '@/lib/templates/journal-storage';

interface JournalEditorTopBarProps {
  profile: JournalProfile;
  status: JournalStatus;
  isNew?: boolean;
}

export const JournalEditorTopBar: React.FC<JournalEditorTopBarProps> = ({
  profile,
  status,
  isNew = false,
}) => {
  const brandColor = profile.color || '#000099';
  const nameVi = profile.names?.vi || (isNew ? 'Hồ sơ Tạp chí Mới' : 'Tạp chí');
  const nameEn = profile.names?.en || 'Academic Scientific Journal';
  const shortCode = profile.names?.short || profile.id?.toUpperCase() || 'JOURNAL';

  return (
    <div className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-200/80">
      <div>
        <div className="flex items-center gap-2.5 flex-wrap">
          <h1 className="text-base sm:text-xl font-black text-slate-900 tracking-tight leading-tight">
            {nameVi}
          </h1>
          <span
            className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold text-white shadow-2xs tracking-wide"
            style={{ backgroundColor: brandColor }}
          >
            {shortCode}
          </span>
        </div>
        <p className="text-xs text-slate-700 font-semibold mt-1 not-italic">
          {nameEn}
        </p>
      </div>
    </div>
  );
};
