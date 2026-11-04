'use client';

import React from 'react';
import { PreflightQCTabProps, EditorTabKey } from './types';
import {
  ShieldCheck,
  AlertCircle,
  AlertTriangle,
  Info,
  CheckCircle2,
  ArrowRight,
  FileText,
  UserCheck,
  BookOpen,
  Sliders,
  Building,
  Quote,
} from 'lucide-react';

export const PreflightQCTab: React.FC<PreflightQCTabProps> = ({ preflight, onNavigateTab }) => {
  return (
    <div className="h-full flex flex-col min-h-0 space-y-4 p-4 sm:p-5 sm:pt-4 sm:pb-1">
      {/* Header Summary directly on background */}
      <div className="flex-shrink-0 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-zinc-200/80">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-extrabold text-base sm:text-lg text-zinc-900">
              Kiểm Định Cấu Trúc & Tiêu Chuẩn
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">
              Điểm chuẩn hóa
            </span>
          </div>
          <span
            className={`text-2xl font-black ${preflight.score >= 85
              ? 'text-[#14532D]'
              : preflight.score >= 70
                ? 'text-amber-700'
                : 'text-red-700'
              }`}
          >
            {preflight.score}
            <span className="text-xs font-normal text-zinc-400">/100</span>
          </span>
        </div>
      </div>

      {/* Internal Scrollable Content */}
      <div className="flex-1 min-h-0 overflow-y-auto pr-1 space-y-6">

        {/* Issues list */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-xs uppercase tracking-wider text-zinc-900 flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-zinc-700" />
              Báo cáo các mục cần bổ sung ({preflight.issues?.length || 0})
            </h4>
            <span className="text-[11px] text-zinc-500 font-medium">
              {preflight.issues?.filter((i) => i.severity === 'error').length || 0} mục bắt buộc,{' '}
              {preflight.issues?.filter((i) => i.severity === 'warning').length || 0} khuyến nghị
            </span>
          </div>

          {preflight.issues && preflight.issues.length > 0 ? (
            <div className="space-y-2.5">
              {preflight.issues.map((issue) => (
                <div
                  key={issue.id}
                  className={`p-3.5 rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1.5 transition-all ${issue.severity === 'error'
                    ? 'bg-red-50/60 border-red-200'
                    : issue.severity === 'warning'
                      ? 'bg-amber-50/60 border-amber-200'
                      : 'bg-blue-50/60 border-blue-200'
                    }`}
                >
                  <div className="flex items-start gap-2.5 flex-1">
                    <div className="mt-0.5">
                      {issue.severity === 'error' ? (
                        <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                      ) : issue.severity === 'warning' ? (
                        <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                      ) : (
                        <Info className="w-4 h-4 text-blue-600 flex-shrink-0" />
                      )}
                    </div>
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <h5
                          className={`font-bold text-xs ${issue.severity === 'error'
                            ? 'text-red-950'
                            : issue.severity === 'warning'
                              ? 'text-amber-950'
                              : 'text-blue-950'
                            }`}
                        >
                          {issue.title}
                        </h5>
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full uppercase tracking-wider ${issue.severity === 'error'
                            ? 'bg-red-200 text-red-800'
                            : issue.severity === 'warning'
                              ? 'bg-amber-200 text-amber-800'
                              : 'bg-blue-200 text-blue-800'
                            }`}
                        >
                          {issue.severity === 'error'
                            ? 'Bắt buộc'
                            : issue.severity === 'warning'
                              ? 'Khuyến nghị'
                              : 'Gợi ý'}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-700 leading-snug">{issue.message}</p>
                      <p className="text-[11px] text-zinc-500 italic">💡 {issue.suggestion}</p>
                    </div>
                  </div>

                  {issue.fixTab && (
                    <button
                      type="button"
                      onClick={() => onNavigateTab(issue.fixTab as EditorTabKey)}
                      className={`text-xs font-bold py-1.5 px-3 rounded-xl border flex items-center gap-1 flex-shrink-0 self-end sm:self-center transition-colors cursor-pointer shadow-2xs ${issue.severity === 'error'
                        ? 'bg-white text-red-700 border-red-300 hover:bg-red-50'
                        : issue.severity === 'warning'
                          ? 'bg-white text-amber-800 border-amber-300 hover:bg-amber-50'
                          : 'bg-white text-blue-700 border-blue-300 hover:bg-blue-50'
                        }`}
                    >
                      <span>Sửa ngay</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-lime-50 border border-lime-200 text-lime-800 text-xs flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-lime-600 flex-shrink-0" />
              <div>
                <h5 className="font-bold">Bản thảo hoàn hảo và đầy đủ 100%!</h5>
                <p className="text-[11px] text-lime-700 mt-0.5">
                  Tất cả các trường dữ liệu tiêu đề, tác giả, tóm tắt, từ khóa và trích dẫn đều đạt chuẩn xuất bản của ĐHQG-HCM.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* 6 Pillars Breakdown */}
        <div className="space-y-3 pt-2">
          <h4 className="font-bold text-xs uppercase tracking-wider text-zinc-900">
            Bảng đối soát tiêu chuẩn cấu trúc
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-1.5">
            {/* Pillar 1: Metadata */}
            <div className="p-3.5 rounded-3xl bg-gray-200/50 shadow-2xs space-y-2">
              <h5 className="font-bold text-xs text-zinc-900 flex items-center gap-1.5">
                1. Tiêu đề & Định danh
              </h5>
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between py-0.5 border-b border-zinc-200/60">
                  <span className="text-zinc-500">Tiêu đề tiếng Việt:</span>
                  {preflight.titleOk ? (
                    <span className="text-lime-700 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Đạt
                    </span>
                  ) : (
                    <span className="text-red-600 font-bold flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> Thiếu
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between py-0.5 border-b border-zinc-200/60">
                  <span className="text-zinc-500">Tiêu đề tiếng Anh:</span>
                  {preflight.titleEnOk ? (
                    <span className="text-lime-700 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Đạt
                    </span>
                  ) : (
                    <span className="text-amber-600 font-bold flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> Thiếu
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between py-0.5">
                  <span className="text-zinc-500">Mã DOI:</span>
                  <span className="font-mono text-[11px] text-zinc-800">
                    {preflight.titleOk ? '✓ Khả dụng' : 'Chưa có'}
                  </span>
                </div>
              </div>
            </div>

            {/* Pillar 2: Authors */}
            <div className="p-3.5 rounded-3xl bg-gray-200/50 shadow-2xs space-y-2">
              <h5 className="font-bold text-xs text-zinc-900 flex items-center gap-1.5">
                2. Tác giả & Đơn vị
              </h5>
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between py-0.5 border-b border-zinc-200/60">
                  <span className="text-zinc-500">Số lượng tác giả:</span>
                  <span className="font-bold text-zinc-900">{preflight.authorsCount} tác giả</span>
                </div>
                <div className="flex items-center justify-between py-0.5 border-b border-zinc-200/60">
                  <span className="text-zinc-500">Đơn vị công tác:</span>
                  <span className="font-bold text-zinc-900">{preflight.affiliationsCount} cơ quan</span>
                </div>
                <div className="flex items-center justify-between py-0.5">
                  <span className="text-zinc-500">Email liên hệ:</span>
                  {preflight.correspondingOk ? (
                    <span className="text-lime-700 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Hợp lệ
                    </span>
                  ) : (
                    <span className="text-amber-600 font-bold flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> Thiếu
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Pillar 3: Abstracts & Keywords */}
            <div className="p-3.5 rounded-3xl bg-gray-200/50 shadow-2xs space-y-2">
              <h5 className="font-bold text-xs text-zinc-900 flex items-center gap-1.5">
                3. Tóm tắt & Từ khóa
              </h5>
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between py-0.5 border-b border-zinc-200/60">
                  <span className="text-zinc-500">Tóm tắt tiếng Việt:</span>
                  {preflight.abstractOk ? (
                    <span className="text-lime-700 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Đạt chuẩn
                    </span>
                  ) : (
                    <span className="text-amber-600 font-bold flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> Cần bổ sung
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between py-0.5 border-b border-zinc-200/60">
                  <span className="text-zinc-500">Abstract tiếng Anh:</span>
                  {preflight.abstractEnOk ? (
                    <span className="text-lime-700 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Đạt chuẩn
                    </span>
                  ) : (
                    <span className="text-amber-600 font-bold flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> Thiếu
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between py-0.5">
                  <span className="text-zinc-500">Từ khóa song ngữ:</span>
                  <span className="font-bold text-zinc-900">
                    {preflight.keywordsCount} VN / {preflight.keywordsEnCount} EN
                  </span>
                </div>
              </div>
            </div>

            {/* Pillar 4: IMRaD Sections */}
            <div
              onClick={() => onNavigateTab('sections')}
              className="p-3.5 rounded-3xl bg-gray-200/50 shadow-2xs space-y-2 cursor-pointer hover:bg-gray-200/80 transition-all group"
              title="Nhấp để chuyển tới tab Nội dung"
            >
              <h5 className="font-bold text-xs text-zinc-900 flex items-center justify-between gap-1.5">
                <span>4. Khung cấu trúc IMRaD</span>
                <span className="text-[10px] text-zinc-400 group-hover:text-zinc-700 transition-colors font-medium">Sửa →</span>
              </h5>
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between py-0.5 border-b border-zinc-200/60">
                  <span className="text-zinc-500">Mở đầu / Giới thiệu:</span>
                  <span className={preflight.foundImradSections.intro ? 'text-lime-700 font-bold' : 'text-zinc-400 font-normal'}>
                    {preflight.foundImradSections.intro ? '✓ Có' : 'Chưa rõ'}
                  </span>
                </div>
                <div className="flex items-center justify-between py-0.5 border-b border-zinc-200/60">
                  <span className="text-zinc-500">Phương pháp (Methods):</span>
                  <span className={preflight.foundImradSections.methods ? 'text-lime-700 font-bold' : 'text-zinc-400 font-normal'}>
                    {preflight.foundImradSections.methods ? '✓ Có' : 'Chưa rõ'}
                  </span>
                </div>
                <div className="flex items-center justify-between py-0.5">
                  <span className="text-zinc-500">Kết quả & Kết luận:</span>
                  <span className={preflight.foundImradSections.results && preflight.foundImradSections.conclusion ? 'text-lime-700 font-bold' : 'text-amber-600 font-bold'}>
                    {preflight.foundImradSections.results && preflight.foundImradSections.conclusion ? '✓ Đạt' : 'Một phần'}
                  </span>
                </div>
              </div>
            </div>

            {/* Pillar 5: Figures & Tables */}
            <div
              onClick={() => onNavigateTab('sections')}
              className="p-3.5 rounded-3xl bg-gray-200/50 shadow-2xs space-y-2 cursor-pointer hover:bg-gray-200/80 transition-all group"
              title="Nhấp để chuyển tới tab Nội dung (Bảng & Hình)"
            >
              <h5 className="font-bold text-xs text-zinc-900 flex items-center justify-between gap-1.5">
                <span>5. Minh họa & Bảng biểu</span>
                <span className="text-[10px] text-zinc-400 group-hover:text-zinc-700 transition-colors font-medium">Sửa →</span>
              </h5>
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between py-0.5 border-b border-zinc-200/60">
                  <span className="text-zinc-500">Tổng số bảng biểu:</span>
                  <span className="font-bold text-zinc-900">{preflight.totalTables} bảng</span>
                </div>
                <div className="flex items-center justify-between py-0.5 border-b border-zinc-200/60">
                  <span className="text-zinc-500">Tổng số hình ảnh:</span>
                  <span className="font-bold text-zinc-900">{preflight.totalFigures} hình</span>
                </div>
                <div className="flex items-center justify-between py-0.5">
                  <span className="text-zinc-500">Trạng thái dữ liệu:</span>
                  <span className="text-lime-700 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Đã bóc tách
                  </span>
                </div>
              </div>
            </div>

            {/* Pillar 6: Vancouver Citations */}
            <div className="p-3.5 rounded-3xl bg-gray-200/50 shadow-2xs space-y-2">
              <h5 className="font-bold text-xs text-zinc-900 flex items-center gap-1.5">
                6. Trích dẫn Vancouver
              </h5>
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between py-0.5 border-b border-zinc-200/60">
                  <span className="text-zinc-500">Tổng số tài liệu:</span>
                  <span className="font-bold text-zinc-900">{preflight.totalReferences} mục</span>
                </div>
                <div className="flex items-center justify-between py-0.5 border-b border-zinc-200/60">
                  <span className="text-zinc-500">Chưa gọi trong bài:</span>
                  {preflight.uncitedReferences.length === 0 ? (
                    <span className="text-lime-700 font-bold">0 mục (Tốt)</span>
                  ) : (
                    <span className="text-amber-600 font-bold">{preflight.uncitedReferences.length} mục</span>
                  )}
                </div>
                <div className="flex items-center justify-between py-0.5">
                  <span className="text-zinc-500">Thiếu danh mục:</span>
                  {preflight.missingCitations.length === 0 ? (
                    <span className="text-lime-700 font-bold">0 (Đạt)</span>
                  ) : (
                    <span className="text-red-600 font-bold">{preflight.missingCitations.length} mục</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
