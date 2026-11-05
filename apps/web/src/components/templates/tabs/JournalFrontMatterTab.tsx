'use client';

import React from 'react';
import { JournalProfile } from '@structpaper/journal-profiles';
import { FileText, KeyRound, Calendar, Quote, Hash } from 'lucide-react';

interface JournalFrontMatterTabProps {
  profile: JournalProfile;
  onChange: (updated: Partial<JournalProfile>) => void;
}

export const JournalFrontMatterTab: React.FC<JournalFrontMatterTabProps> = ({
  profile,
  onChange,
}) => {
  const frontMatter = profile.frontMatter || {
    abstract: { minWords: 275, maxWords: 500, structured: true },
    keywords: { min: 3, max: 5, separator: ';' },
    dateFormat: 'YYYY-MM-DD',
    doiPattern: '^10\\.32508/.*$',
  };
  const citation = profile.citation || {
    style: 'vancouver',
    inText: 'bracket',
    rangeDash: '-',
  };

  const updateFrontMatter = (patch: Record<string, unknown>) => {
    onChange({
      frontMatter: {
        ...frontMatter,
        ...patch,
      },
    });
  };

  const updateCitation = (patch: Record<string, unknown>) => {
    onChange({
      citation: {
        ...citation,
        ...patch,
      },
    });
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* 1. Abstract Rules */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <FileText className="w-4 h-4 text-slate-700" />
          <h3 className="font-extrabold text-sm text-slate-900">
            Quy định Phần Tóm Tắt (Abstract Guidelines)
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Số từ tối thiểu (minWords)
            </label>
            <input
              type="number"
              min={50}
              max={1000}
              value={frontMatter.abstract?.minWords ?? 275}
              onChange={(e) =>
                updateFrontMatter({
                  abstract: {
                    ...frontMatter.abstract,
                    minWords: parseInt(e.target.value, 10) || 0,
                  },
                })
              }
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:bg-white focus:border-[#78C841] outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Số từ tối đa (maxWords)
            </label>
            <input
              type="number"
              min={100}
              max={2000}
              value={frontMatter.abstract?.maxWords ?? 500}
              onChange={(e) =>
                updateFrontMatter({
                  abstract: {
                    ...frontMatter.abstract,
                    maxWords: parseInt(e.target.value, 10) || 0,
                  },
                })
              }
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:bg-white focus:border-[#78C841] outline-none"
            />
          </div>

          <div className="flex flex-col justify-center pt-3 md:pt-0">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
              <input
                type="checkbox"
                checked={Boolean(frontMatter.abstract?.structured)}
                onChange={(e) =>
                  updateFrontMatter({
                    abstract: {
                      ...frontMatter.abstract,
                      structured: e.target.checked,
                    },
                  })
                }
                className="rounded text-[#78C841] focus:ring-[#78C841]"
              />
              <span>Tóm tắt có cấu trúc (Structured Abstract)</span>
            </label>
            <span className="text-[10px] text-slate-400 mt-0.5">
              Yêu cầu bóc tách rõ: Đặt vấn đề, Phương pháp, Kết quả, Kết luận.
            </span>
          </div>
        </div>
      </div>

      {/* 2. Keywords Rules */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <KeyRound className="w-4 h-4 text-slate-700" />
          <h3 className="font-extrabold text-sm text-slate-900">
            Quy định Từ Khóa (Keywords Guidelines)
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Số lượng tối thiểu (min)
            </label>
            <input
              type="number"
              min={1}
              max={10}
              value={frontMatter.keywords?.min ?? 3}
              onChange={(e) =>
                updateFrontMatter({
                  keywords: {
                    ...frontMatter.keywords,
                    min: parseInt(e.target.value, 10) || 1,
                  },
                })
              }
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:bg-white focus:border-[#78C841] outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Số lượng tối đa (max)
            </label>
            <input
              type="number"
              min={3}
              max={20}
              value={frontMatter.keywords?.max ?? 5}
              onChange={(e) =>
                updateFrontMatter({
                  keywords: {
                    ...frontMatter.keywords,
                    max: parseInt(e.target.value, 10) || 1,
                  },
                })
              }
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:bg-white focus:border-[#78C841] outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Dấu ngăn cách từ khóa
            </label>
            <select
              value={frontMatter.keywords?.separator ?? ';'}
              onChange={(e) =>
                updateFrontMatter({
                  keywords: {
                    ...frontMatter.keywords,
                    separator: e.target.value as ';' | ',',
                  },
                })
              }
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:bg-white focus:border-[#78C841] outline-none"
            >
              <option value=";">Dấu chấm phẩy ( ; ) - Chuẩn ĐHQG</option>
              <option value=",">Dấu phẩy ( , )</option>
            </select>
          </div>
        </div>
      </div>

      {/* 3. Dates, DOI & Citations */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Quote className="w-4 h-4 text-slate-700" />
          <h3 className="font-extrabold text-sm text-slate-900">
            Định dạng Ngày, Mẫu DOI &amp; Trích dẫn (Vancouver)
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Định dạng ngày (Date Format)
            </label>
            <input
              type="text"
              value={frontMatter.dateFormat || 'YYYY-MM-DD'}
              onChange={(e) => updateFrontMatter({ dateFormat: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-800 focus:bg-white focus:border-[#78C841] outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Quy tắc biểu thức DOI (Regex Pattern)
            </label>
            <input
              type="text"
              value={frontMatter.doiPattern || ''}
              onChange={(e) => updateFrontMatter({ doiPattern: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-800 focus:bg-white focus:border-[#78C841] outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Kiểu hiển thị trích dẫn trong văn bản (In-text format)
            </label>
            <select
              value={citation.inText}
              onChange={(e) => updateCitation({ inText: e.target.value as 'bracket' | 'superscript' })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:bg-white focus:border-[#78C841] outline-none"
            >
              <option value="bracket">Ngoặc vuông [1-3] - Chuẩn Vancouver STDJ</option>
              <option value="superscript">Chỉ số trên ¹⁻³</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Ký tự dải số trích dẫn (Range Dash)
            </label>
            <input
              type="text"
              value={citation.rangeDash || '-'}
              onChange={(e) => updateCitation({ rangeDash: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-800 focus:bg-white focus:border-[#78C841] outline-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
