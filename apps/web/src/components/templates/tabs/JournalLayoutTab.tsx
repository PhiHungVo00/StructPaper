'use client';

import React from 'react';
import { JournalProfile } from '@structpaper/journal-profiles';
import { Layout, Columns, Type, FileCode, Check } from 'lucide-react';

interface JournalLayoutTabProps {
  profile: JournalProfile;
  onChange: (updated: Partial<JournalProfile>) => void;
}

export const JournalLayoutTab: React.FC<JournalLayoutTabProps> = ({
  profile,
  onChange,
}) => {
  const layout = profile.layout || {
    paperSize: 'A4',
    columns: 2,
    columnGap: 6.0,
    margins: { top: 20, bottom: 20, left: 20, right: 20, unit: 'mm' },
  };

  const latex = profile.latex || {
    cls: 'structpaper.cls',
    engine: 'xelatex',
    fonts: { main: 'Times New Roman', sans: 'Arial', mono: 'Courier New' },
  };

  const styleMap = profile.styleMap || {};
  const styleEntries = Object.entries(styleMap).slice(0, 8);

  const updateLayout = (patch: Record<string, unknown>) => {
    onChange({ layout: { ...layout, ...patch } });
  };

  const updateLatex = (patch: Record<string, unknown>) => {
    onChange({ latex: { ...latex, ...patch } });
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* 1. Page & Columns */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Columns className="w-4 h-4 text-slate-700" />
          <h3 className="font-extrabold text-sm text-slate-900">
            Dàn Trang &amp; Bố Cục Bản In (Page &amp; Column Grid)
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Khổ giấy</label>
            <select
              value={layout.paperSize || 'A4'}
              onChange={(e) => updateLayout({ paperSize: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:bg-white focus:border-[#78C841] outline-none"
            >
              <option value="A4">A4 (210 x 297 mm) - Chuẩn Quốc tế</option>
              <option value="Letter">US Letter</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Số cột nội dung</label>
            <select
              value={layout.columns || 2}
              onChange={(e) => updateLayout({ columns: parseInt(e.target.value, 10) || 2 })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:bg-white focus:border-[#78C841] outline-none"
            >
              <option value={1}>1 Cột (Single column)</option>
              <option value={2}>2 Cột (Double column - Chuẩn VNUHCM)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Khoảng cách cột (mm)</label>
            <input
              type="number"
              step={0.5}
              value={layout.columnGap ?? 6.0}
              onChange={(e) => updateLayout({ columnGap: parseFloat(e.target.value) || 0 })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-800 focus:bg-white focus:border-[#78C841] outline-none"
            />
          </div>
        </div>

        {/* Margins */}
        <div className="pt-2">
          <label className="block text-xs font-bold text-slate-700 mb-2">Lề trang (Margins - mm):</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {(['top', 'bottom', 'left', 'right'] as const).map((side) => (
              <div key={side}>
                <span className="text-[10.5px] text-slate-500 font-semibold uppercase">{side}:</span>
                <input
                  type="number"
                  value={layout.margins?.[side] ?? 20}
                  onChange={(e) =>
                    updateLayout({
                      margins: {
                        ...layout.margins,
                        [side]: parseFloat(e.target.value) || 0,
                      },
                    })
                  }
                  className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-mono font-bold text-slate-800 focus:bg-white focus:border-[#78C841] outline-none"
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 2. LaTeX & Fonts Engine */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <FileCode className="w-4 h-4 text-slate-700" />
          <h3 className="font-extrabold text-sm text-slate-900">
            Cấu hình Trình Biên Dịch LaTeX &amp; Typst
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Document Class (.cls)
            </label>
            <input
              type="text"
              value={latex.cls || ''}
              onChange={(e) => updateLatex({ cls: e.target.value })}
              placeholder="VD: structpaper-hs.cls"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-800 focus:bg-white focus:border-[#78C841] outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">LaTeX Engine</label>
            <select
              value={latex.engine || 'xelatex'}
              onChange={(e) => updateLatex({ engine: e.target.value as 'xelatex' | 'lualatex' })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:bg-white focus:border-[#78C841] outline-none"
            >
              <option value="xelatex">XeLaTeX (Hỗ trợ Unicode tiếng Việt đầy đủ)</option>
              <option value="lualatex">LuaLaTeX</option>
            </select>
          </div>
        </div>
      </div>

      {/* 3. Word Style Mapping Overview */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Type className="w-4 h-4 text-slate-700" />
          <h3 className="font-extrabold text-sm text-slate-900">
            Ánh xạ Style Microsoft Word (Ingest StyleMap)
          </h3>
        </div>
        <p className="text-xs text-slate-500">
          Hệ thống tự động nhận diện Word Style tương ứng khi tác giả tải file DOCX lên:
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
          {styleEntries.map(([docxStyle, semanticType]) => (
            <div
              key={docxStyle}
              className="p-2 bg-slate-50 rounded-xl border border-slate-200/80 text-[11px]"
            >
              <span className="font-bold text-slate-700 block truncate">{docxStyle}</span>
              <span className="font-mono text-emerald-700 text-[10px] block truncate">
                &rarr; {semanticType}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
