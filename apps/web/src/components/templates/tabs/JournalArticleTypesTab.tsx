'use client';

import React, { useState } from 'react';
import {
  JournalProfile,
  JournalArticleType,
  ALL_ARTICLE_TYPES,
} from '@structpaper/journal-profiles';
import { Layers, CheckCircle2, ShieldAlert, Sparkles, BookOpen } from 'lucide-react';

interface JournalArticleTypesTabProps {
  profile: JournalProfile;
  onChange: (updated: Partial<JournalProfile>) => void;
}

const SECTION_OPTIONS = [
  { id: 'heading.abstract', label: 'Tóm tắt (Abstract)' },
  { id: 'h1', label: 'Nội dung chính (H1/IMRaD)' },
  { id: 'heading.references', label: 'Tài liệu tham khảo (References)' },
  { id: 'back.ethics', label: 'Tuyên bố đạo đức (Ethics)' },
  { id: 'back.conflict', label: 'Xung đột lợi ích (Conflict)' },
];

export const JournalArticleTypesTab: React.FC<JournalArticleTypesTabProps> = ({
  profile,
  onChange,
}) => {
  const currentTypes: JournalArticleType[] = profile.articleTypes && profile.articleTypes.length > 0
    ? profile.articleTypes
    : ALL_ARTICLE_TYPES;

  const [selectedTypeId, setSelectedTypeId] = useState<string>(currentTypes[0]?.id || 'research');

  const selectedType = currentTypes.find((t) => t.id === selectedTypeId) || currentTypes[0];

  const handleUpdateType = (typeId: string, patch: Partial<JournalArticleType>) => {
    const updated = currentTypes.map((t) => {
      if (t.id === typeId) {
        return { ...t, ...patch };
      }
      return t;
    });
    onChange({ articleTypes: updated });
  };

  const handleToggleSection = (typeId: string, secId: string) => {
    if (!selectedType) return;
    const exists = selectedType.requiredSections.includes(secId);
    const nextSections = exists
      ? selectedType.requiredSections.filter((s) => s !== secId)
      : [...selectedType.requiredSections, secId];
    handleUpdateType(typeId, { requiredSections: nextSections });
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Overview Banner */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-center justify-between gap-4">
        <div>
          <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-600" />
            <span>8 Chuyên Mục &amp; Loại Bài Báo Học Thuật</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Cấu hình các yêu cầu kiểm duyệt cấu trúc bắt buộc (IMRaD vs Tự do) cho từng thể loại bài báo theo quy định tạp chí.
          </p>
        </div>
        <span className="text-xs font-mono font-bold bg-blue-50 text-blue-700 px-3 py-1 rounded-xl shrink-0">
          {currentTypes.length} Thể loại
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
        {/* Left column: List of 8 Article Types */}
        <div className="md:col-span-5 bg-white rounded-2xl border border-slate-200/80 p-2 space-y-1 shadow-xs">
          {currentTypes.map((type) => {
            const isSelected = type.id === selectedTypeId;
            const hasAbstract = type.requiredSections.includes('heading.abstract');
            return (
              <button
                key={type.id}
                type="button"
                onClick={() => setSelectedTypeId(type.id)}
                className={`w-full text-left p-3 rounded-xl transition-all cursor-pointer flex items-center justify-between ${
                  isSelected
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="min-w-0 pr-2">
                  <div className="text-xs font-extrabold truncate">
                    {type.label?.vi || type.id}
                  </div>
                  <div
                    className={`text-[10.5px] truncate ${
                      isSelected ? 'text-slate-300' : 'text-slate-400'
                    }`}
                  >
                    {type.label?.en || type.id}
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-1.5">
                  {hasAbstract ? (
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                        isSelected ? 'bg-emerald-500/30 text-emerald-300' : 'bg-emerald-50 text-emerald-700'
                      }`}
                    >
                      Abstract
                    </span>
                  ) : (
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                        isSelected ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      No Abs
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Right column: Detail & Section Requirements for Selected Type */}
        {selectedType && (
          <div className="md:col-span-7 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-5">
            <div className="border-b border-slate-100 pb-3">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                Cấu hình cho thể loại
              </span>
              <h4 className="font-black text-sm text-slate-900 mt-0.5">
                {selectedType.label?.vi || selectedType.id}
              </h4>
              <p className="text-xs text-slate-500 italic">{selectedType.label?.en}</p>
            </div>

            {/* Bilingual Labels Editing */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Nhãn tiếng Việt
                </label>
                <input
                  type="text"
                  value={selectedType.label?.vi || ''}
                  onChange={(e) =>
                    handleUpdateType(selectedType.id, {
                      label: { ...selectedType.label, vi: e.target.value },
                    })
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 focus:bg-white focus:border-[#78C841] outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Nhãn tiếng Anh
                </label>
                <input
                  type="text"
                  value={selectedType.label?.en || ''}
                  onChange={(e) =>
                    handleUpdateType(selectedType.id, {
                      label: { ...selectedType.label, en: e.target.value },
                    })
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 focus:bg-white focus:border-[#78C841] outline-none"
                />
              </div>
            </div>

            {/* Required Sections Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-2">
                Các khối nội dung bắt buộc (Preflight QC Rules):
              </label>
              <div className="space-y-2">
                {SECTION_OPTIONS.map((sec) => {
                  const isChecked = selectedType.requiredSections.includes(sec.id);
                  return (
                    <label
                      key={sec.id}
                      className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                        isChecked
                          ? 'border-emerald-200 bg-emerald-50/50 text-slate-900'
                          : 'border-slate-200/80 hover:bg-slate-50 text-slate-600'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleSection(selectedType.id, sec.id)}
                        className="rounded text-[#78C841] focus:ring-[#78C841]"
                      />
                      <span className="font-semibold flex-1">{sec.label}</span>
                      <span className="font-mono text-[10px] text-slate-400">{sec.id}</span>
                    </label>
                  );
                })}
              </div>
              <p className="text-[10.5px] text-slate-400 mt-2">
                Hệ thống QC Engine sẽ kiểm tra sự hiện diện của các phần này trước khi xuất bản bản thảo.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
