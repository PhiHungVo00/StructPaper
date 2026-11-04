'use client';

import React, { useRef, useEffect } from 'react';
import { MetadataTabProps } from './types';
import { Select, SelectOption, DatePicker } from '../ui';
import { FileText, Calendar } from 'lucide-react';

// Health Sciences (VNUHCM-HS) has 8 distinct article types per requirements
export const HS_ARTICLE_TYPE_OPTIONS: SelectOption[] = [
  { value: 'Bài báo nghiên cứu', label: 'Bài báo nghiên cứu', badge: 'Research Articles', description: 'Nghiên cứu nguyên bản thực nghiệm/lâm sàng' },
  { value: 'Bài tổng quan', label: 'Bài tổng quan', badge: 'Reviews', description: 'Tổng quan hệ thống, tài liệu y khoa' },
  { value: 'Báo cáo ca lâm sàng', label: 'Báo cáo ca lâm sàng', badge: 'Case Reports', description: 'Báo cáo ca bệnh điển hình lâm sàng' },
  { value: 'Phương pháp luận', label: 'Phương pháp luận', badge: 'Methodologies', description: 'Phương pháp & kỹ thuật nghiên cứu y sinh' },
  { value: 'Bình luận & Ý kiến', label: 'Bình luận & Ý kiến', badge: 'Commentaries', description: 'Bình luận, trao đổi học thuật chuyên môn' },
  { value: 'Đính chính', label: 'Đính chính', badge: 'Corrections', description: 'Đính chính thông tin công bố khoa học' },
  { value: 'Bài xã luận', label: 'Bài xã luận', badge: 'Editorials', description: 'Xã luận từ Ban biên tập tạp chí' },
  { value: 'Thư gửi tòa soạn', label: 'Thư gửi tòa soạn', badge: 'Letters', description: 'Thư góp ý & thảo luận học thuật gửi tòa soạn' },
];

// All other journals only have 1 single article type: Research Article
export const STANDARD_ARTICLE_TYPE_OPTIONS: SelectOption[] = [
  { value: 'Bài báo nghiên cứu', label: 'Bài báo nghiên cứu', badge: 'Research Article', description: 'Công trình nghiên cứu khoa học nguyên bản' },
];

export const MetadataTab: React.FC<MetadataTabProps> = ({ metadata, onChange }) => {
  const titleViRef = useRef<HTMLTextAreaElement>(null);
  const titleEnRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea to fit content without any maximum height limit
  const autoResize = (element: HTMLTextAreaElement | null) => {
    if (!element) return;
    element.style.height = 'auto';
    element.style.height = `${element.scrollHeight}px`;
  };

  useEffect(() => {
    autoResize(titleViRef.current);
  }, [metadata.title]);

  useEffect(() => {
    autoResize(titleEnRef.current);
  }, [metadata.titleEn]);

  // Determine available article types based on journal ID
  // Only VNUHCM-HS has 8 multiple article types; all others only have 'Bài báo nghiên cứu'
  const isHealthSciences = !metadata.journalId || metadata.journalId === 'VNUHCM-HS' || metadata.journalId.includes('HS');
  const articleOptions = isHealthSciences ? HS_ARTICLE_TYPE_OPTIONS : STANDARD_ARTICLE_TYPE_OPTIONS;

  // Auto-normalize if an unsupported article type is selected for a non-HS journal
  useEffect(() => {
    if (!isHealthSciences && metadata.articleType && metadata.articleType !== 'Bài báo nghiên cứu') {
      onChange({ ...metadata, articleType: 'Bài báo nghiên cứu' });
    }
  }, [isHealthSciences, metadata.articleType]);

  return (
    <div className="h-full flex flex-col min-h-0 overflow-y-auto p-4 sm:p-5 pb-12 space-y-4">
      {/* Header Title */}
      <div className="flex items-center gap-2 pb-2 border-b border-zinc-200/60">
        <FileText className="w-4 h-4 text-zinc-700" />
        <h3 className="font-extrabold text-sm sm:text-base text-zinc-900">
          Thông tin cơ bản bài báo & Xuất bản
        </h3>
      </div>

      {/* Vietnamese Title - Auto expands to fit content without any maximum height limit */}
      <div>
        <label className="text-xs font-bold text-zinc-700 block mb-1.5">
          Tựa đề bài báo (Tiếng Việt):
        </label>
        <textarea
          ref={titleViRef}
          value={metadata.title}
          onChange={(e) => {
            onChange({ ...metadata, title: e.target.value });
            autoResize(e.target);
          }}
          spellCheck={false}
          autoCorrect="off"
          autoCapitalize="off"
          style={{ resize: 'none', overflow: 'hidden' }}
          className="w-full min-h-[56px] p-3 rounded-2xl border border-zinc-200 text-sm font-semibold text-zinc-900 bg-white focus:outline-none focus:ring-4 focus:ring-blue-200 focus:border-blue-300 transition-all leading-snug shadow-2xs"
          placeholder="Nhập tựa đề bài báo tiếng Việt..."
        />
      </div>

      {/* English Title - Auto expands to fit content without any maximum height limit */}
      <div>
        <label className="text-xs font-bold text-zinc-700 block mb-1.5">
          Tựa đề bài báo (Tiếng Anh - nếu có):
        </label>
        <textarea
          ref={titleEnRef}
          value={metadata.titleEn || ''}
          onChange={(e) => {
            onChange({ ...metadata, titleEn: e.target.value });
            autoResize(e.target);
          }}
          spellCheck={false}
          autoCorrect="off"
          autoCapitalize="off"
          style={{ resize: 'none', overflow: 'hidden' }}
          className="w-full min-h-[56px] p-3 rounded-2xl border border-zinc-200 text-sm italic text-zinc-800 bg-white focus:outline-none focus:ring-4 focus:ring-blue-200 focus:border-blue-300 transition-all leading-snug shadow-2xs"
          placeholder="Article Title in English..."
        />
      </div>

      {/* Article Type & DOI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <div>
          <Select
            label="Loại bài báo (Article Type):"
            value={metadata.articleType || 'Bài báo nghiên cứu'}
            onChange={(val) => onChange({ ...metadata, articleType: val })}
            options={articleOptions}
            size="md"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-zinc-600 block mb-1.5">
            Mã định danh DOI:
          </label>
          <div className="relative">
            <input
              type="text"
              value={metadata.doi || ''}
              onChange={(e) => onChange({ ...metadata, doi: e.target.value })}
              spellCheck={false}
              autoCorrect="off"
              autoCapitalize="off"
              className="w-full p-2.5 rounded-2xl border border-zinc-200 text-xs font-mono text-zinc-900 bg-white focus:outline-none focus:ring-4 focus:ring-blue-200 focus:border-blue-300 shadow-2xs"
              placeholder="10.32508/stdj..."
            />
          </div>
        </div>
      </div>

      {/* Publication Dates */}
      <div className="pt-2">
        <label className="text-xs font-bold text-zinc-700 flex items-center gap-1.5 mb-2">
          <Calendar className="w-3.5 h-3.5 text-zinc-500" />
          Các mốc thời gian xuất bản (Tòa soạn):
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <DatePicker
            label="Ngày nhận:"
            value={metadata.dates?.received || ''}
            onChange={(val) =>
              onChange({
                ...metadata,
                dates: { ...metadata.dates, received: val },
              })
            }
            placeholder="02-10-2026"
          />

          <DatePicker
            label="Ngày sửa đổi:"
            value={metadata.dates?.revised || ''}
            onChange={(val) =>
              onChange({
                ...metadata,
                dates: { ...metadata.dates, revised: val },
              })
            }
            placeholder="05-10-2026"
          />

          <DatePicker
            label="Ngày chấp nhận:"
            value={metadata.dates?.accepted || ''}
            onChange={(val) =>
              onChange({
                ...metadata,
                dates: { ...metadata.dates, accepted: val },
              })
            }
            placeholder="08-10-2026"
          />

          <DatePicker
            label="Ngày xuất bản:"
            value={metadata.dates?.published || ''}
            onChange={(val) =>
              onChange({
                ...metadata,
                dates: { ...metadata.dates, published: val },
              })
            }
            placeholder="10-10-2026"
          />
        </div>
      </div>
    </div>
  );
};
