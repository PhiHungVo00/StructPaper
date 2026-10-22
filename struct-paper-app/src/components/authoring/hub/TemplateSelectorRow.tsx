'use client';

import React from 'react';
import { UniversalTemplateSchema } from '@/types/template-builder';
import { Sparkles, ArrowRight, LayoutTemplate, Plus } from 'lucide-react';

interface TemplateSelectorRowProps {
  templates: UniversalTemplateSchema[];
  onSelectTemplate: (template: UniversalTemplateSchema) => void;
}

export const TemplateSelectorRow: React.FC<TemplateSelectorRowProps> = ({
  templates,
  onSelectTemplate,
}) => {
  return (
    <div className="space-y-3.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#78C841]" />
          <h2 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight">
            Chọn mẫu để tạo bài báo mới
          </h2>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
            {templates.length} mẫu sẵn sàng
          </span>
        </div>
        <span className="text-xs text-slate-500 hidden sm:inline">
          Nhấp vào mẫu để khởi tạo bài báo chuẩn Typst
        </span>
      </div>

      {/* Grid of templates */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
        {templates.map((tmpl) => {
          const isVnuhcm = tmpl.id.includes('vnuhcm');
          const isIEEE = tmpl.id.includes('ieee');
          const isBlank = tmpl.id.includes('blank');

          return (
            <div
              key={tmpl.id}
              onClick={() => onSelectTemplate(tmpl)}
              className="group cursor-pointer flex flex-col items-center select-none"
            >
              {/* Mini A4 Simulation Card */}
              <div className="w-full aspect-[210/280] rounded-2xl bg-white border border-slate-200/90 group-hover:border-[#78C841] p-2.5 flex flex-col justify-between shadow-xs transition-all duration-200 group-hover:shadow-md group-hover:scale-[1.02] overflow-hidden relative">
                {/* Top header line */}
                <div className="space-y-1">
                  <div
                    className="h-1 w-8 rounded-full"
                    style={{ backgroundColor: tmpl.primaryColor || '#14532D' }}
                  />
                  <div className="h-0.5 w-full bg-slate-200" />
                </div>

                {/* Simulated content preview */}
                <div className="flex-1 my-1.5 flex flex-col justify-center space-y-1">
                  <div className="h-1.5 w-3/4 rounded bg-slate-800" />
                  <div className="h-1 w-1/2 rounded bg-slate-400" />

                  {isVnuhcm ? (
                    <div className="grid grid-cols-12 gap-1 pt-1">
                      <div className="col-span-4 bg-emerald-50/70 border border-emerald-100 rounded p-0.5 space-y-0.5">
                        <div className="h-0.5 w-full bg-emerald-300" />
                        <div className="h-0.5 w-3/4 bg-emerald-300" />
                      </div>
                      <div className="col-span-8 bg-slate-50 border border-slate-200/60 rounded p-0.5 space-y-0.5">
                        <div className="h-0.5 w-full bg-slate-300" />
                        <div className="h-0.5 w-4/5 bg-slate-300" />
                      </div>
                    </div>
                  ) : isIEEE ? (
                    <div className="grid grid-cols-2 gap-1 pt-1">
                      <div className="space-y-0.5 bg-blue-50/50 p-0.5 rounded">
                        <div className="h-0.5 w-full bg-blue-200" />
                        <div className="h-0.5 w-4/5 bg-blue-200" />
                      </div>
                      <div className="space-y-0.5 bg-blue-50/50 p-0.5 rounded">
                        <div className="h-0.5 w-full bg-blue-200" />
                        <div className="h-0.5 w-3/4 bg-blue-200" />
                      </div>
                    </div>
                  ) : isBlank ? (
                    <div className="flex items-center justify-center h-12 text-slate-300">
                      <Plus className="w-5 h-5 text-slate-400" />
                    </div>
                  ) : (
                    <div className="space-y-0.5 pt-1">
                      <div className="h-0.5 w-full bg-slate-200" />
                      <div className="h-0.5 w-5/6 bg-slate-200" />
                      <div className="h-0.5 w-4/5 bg-slate-200" />
                    </div>
                  )}
                </div>

                {/* Bottom line */}
                <div className="flex items-center justify-between text-[7.5px] text-slate-400 font-mono">
                  <span>Typst Engine</span>
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: tmpl.primaryColor || '#14532D' }}
                  />
                </div>

                {/* Hover overlay hint */}
                <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-2 text-center backdrop-blur-2xs">
                  <span className="text-[10px] font-extrabold text-white bg-[#78C841] px-2 py-1 rounded-full shadow-md flex items-center gap-1">
                    <span>Soạn bài này</span>
                    <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>

              {/* Title & Category info below card */}
              <div className="w-full text-center mt-2 px-1">
                <div className="text-xs font-bold text-slate-800 group-hover:text-[#14532D] truncate" title={tmpl.name}>
                  {tmpl.name.split('(')[0].trim()}
                </div>
                <div className="text-[10px] text-slate-400 truncate">
                  {tmpl.institution || tmpl.author || 'Mẫu chuẩn'}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
