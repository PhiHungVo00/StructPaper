'use client';

import React from 'react';
import { JournalProfile } from '@structpaper/journal-profiles';
import { VNUHCM_COLOR_PALETTE } from '@/lib/templates/journal-storage';
import { Palette, Globe, Tag, BookMarked } from 'lucide-react';

interface JournalGeneralTabProps {
  profile: JournalProfile;
  onChange: (updated: Partial<JournalProfile>) => void;
  isNew?: boolean;
}

export const JournalGeneralTab: React.FC<JournalGeneralTabProps> = ({
  profile,
  onChange,
  isNew,
}) => {
  const brandColor = profile.color || '#1e3a8a';
  const names = profile.names || { vi: '', en: '', short: '' };

  const handleNameChange = (field: 'vi' | 'en' | 'short', val: string) => {
    onChange({
      names: {
        ...names,
        [field]: val,
      },
    });
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* 1. Basic Identifiers */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <BookMarked className="w-4 h-4 text-slate-700" />
          <h3 className="font-extrabold text-sm text-slate-900">
            Tên &amp; Mã Tạp chí (Bilingual Identifiers)
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Tên tiếng Việt <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={names.vi}
              onChange={(e) => handleNameChange('vi', e.target.value)}
              placeholder="VD: Tạp chí Phát triển KH&CN - Khoa học Sức khỏe"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white focus:border-[#78C841] focus:ring-2 focus:ring-[#78C841]/20 outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Tên tiếng Anh (International Name) <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={names.en}
              onChange={(e) => handleNameChange('en', e.target.value)}
              placeholder="VD: Science & Technology Development Journal - Health Sciences"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white focus:border-[#78C841] focus:ring-2 focus:ring-[#78C841]/20 outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Mã viết tắt (Short Code) <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={names.short}
              onChange={(e) => handleNameChange('short', e.target.value)}
              placeholder="VD: VNUHCM-HS hoặc STDJ-HS"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:bg-white focus:border-[#78C841] focus:ring-2 focus:ring-[#78C841]/20 outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Mã định danh hệ thống (Profile ID)
            </label>
            <input
              type="text"
              disabled={!isNew}
              value={profile.id}
              onChange={(e) => isNew && onChange({ id: e.target.value.toLowerCase().trim() })}
              placeholder="VD: hs hoặc ees"
              className="w-full bg-slate-100 disabled:opacity-70 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-600 outline-none"
            />
            {!isNew && (
              <span className="text-[10px] text-slate-400 mt-1 block">
                Mã định danh hệ thống cố định cho các tạp chí chuẩn ĐHQG.
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 2. Brand Palette & Color Swatch */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Palette className="w-4 h-4 text-slate-700" />
          <h3 className="font-extrabold text-sm text-slate-900">
            Màu Sắc Nhận Diện Thương Hiệu
          </h3>
        </div>

        <div className="space-y-3">
          <label className="block text-xs font-bold text-slate-700">
            Bảng màu chuẩn 7 Tạp chí ĐHQG TP.HCM:
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
            {VNUHCM_COLOR_PALETTE.map((pal) => {
              const isSelected = brandColor.toLowerCase() === pal.hex.toLowerCase();
              return (
                <button
                  key={pal.id}
                  type="button"
                  onClick={() => onChange({ color: pal.hex })}
                  className={`p-2 rounded-xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                    isSelected
                      ? 'border-slate-900 bg-slate-50 ring-2 ring-slate-900/10 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <span
                    className="w-6 h-6 rounded-lg shadow-2xs border border-white/60"
                    style={{ backgroundColor: pal.hex }}
                  />
                  <span className="text-[10.5px] font-bold text-slate-800 text-center leading-tight truncate w-full">
                    {pal.id.toUpperCase()}
                  </span>
                  <span className="text-[9.5px] font-mono text-slate-400">
                    {pal.hex}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="pt-2 flex items-center gap-3">
            <span className="text-xs font-bold text-slate-700">Hoặc chọn mã Hex tùy biến:</span>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={brandColor}
                onChange={(e) => onChange({ color: e.target.value })}
                className="w-8 h-8 rounded-lg cursor-pointer border border-slate-200 p-0.5 bg-white"
              />
              <input
                type="text"
                value={brandColor}
                onChange={(e) => onChange({ color: e.target.value })}
                placeholder="#1e3a8a"
                className="w-24 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-mono font-bold text-slate-800 outline-none uppercase"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 3. Supported Languages */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Globe className="w-4 h-4 text-slate-700" />
          <h3 className="font-extrabold text-sm text-slate-900">
            Ngôn Ngữ Bài Viết Chấp Nhận
          </h3>
        </div>

        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
            <input
              type="checkbox"
              checked={profile.languages?.includes('vi')}
              onChange={(e) => {
                const current = profile.languages || ['vi', 'en'];
                const next = e.target.checked
                  ? Array.from(new Set([...current, 'vi']))
                  : current.filter((l) => l !== 'vi');
                onChange({ languages: next as ('vi' | 'en')[] });
              }}
              className="rounded text-[#78C841] focus:ring-[#78C841]"
            />
            <span>Tiếng Việt (vi)</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
            <input
              type="checkbox"
              checked={profile.languages?.includes('en')}
              onChange={(e) => {
                const current = profile.languages || ['vi', 'en'];
                const next = e.target.checked
                  ? Array.from(new Set([...current, 'en']))
                  : current.filter((l) => l !== 'en');
                onChange({ languages: next as ('vi' | 'en')[] });
              }}
              className="rounded text-[#78C841] focus:ring-[#78C841]"
            />
            <span>Tiếng Anh (en)</span>
          </label>
        </div>
      </div>
    </div>
  );
};
