'use client';

import React, { useState } from 'react';
import {
  Settings,
  Sliders,
  Cpu,
  Save,
  CheckCircle2,
  FileCheck,
  Palette,
  RefreshCw,
  HardDrive,
} from 'lucide-react';
import { usePaper } from '@/context/PaperContext';
import { JOURNAL_TEMPLATES } from '@/lib/templates';

export default function SettingsPage() {
  const { currentJournal, setCurrentJournal } = usePaper();
  const [selectedJournal, setSelectedJournal] = useState(currentJournal || 'VNUHCM-HS');
  const [compilerEngine, setCompilerEngine] = useState('tectonic');
  const [autoSaveInterval, setAutoSaveInterval] = useState('30');
  const [fontFamily, setFontFamily] = useState('times');
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentJournal(selectedJournal);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Banner */}
      <div className="bg-white/75 backdrop-blur-xl border border-white/80 rounded-3xl p-6 sm:p-8 shadow-[0_8px_32px_rgba(0,0,0,0.04)]">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#D9F99D] text-[#14532D] flex items-center justify-center">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-zinc-900 tracking-tight">
              Cài Đặt Hệ Thống & Xuất Bản
            </h1>
            <p className="text-xs sm:text-sm text-zinc-500 mt-0.5">
              Tùy biến cấu hình biên dịch LaTeX, quy chuẩn tạp chí mặc định và hành vi tự động lưu.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-5">
        {/* Card 1: Default Journal Template */}
        <div className="bg-white/80 backdrop-blur-md border border-white/80 rounded-3xl p-6 shadow-2xs space-y-4">
          <div className="flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-zinc-700" />
            <h2 className="text-base font-bold text-zinc-900">
              Mẫu Tạp Chí ĐHQG-HCM Mặc Định
            </h2>
          </div>
          <p className="text-xs text-zinc-500">
            Chọn mẫu tạp chí được áp dụng khi tạo mới hoặc tải bản thảo lên mà chưa có chỉ định cụ thể.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            {Object.entries(JOURNAL_TEMPLATES).map(([id, tpl]) => (
              <div
                key={id}
                onClick={() => setSelectedJournal(id)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                  selectedJournal === id
                    ? 'border-[#78C841] bg-[#D9F99D]/15 shadow-2xs ring-2 ring-[#78C841]/30'
                    : 'border-zinc-200/80 bg-zinc-50 hover:bg-white hover:border-zinc-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-sm text-zinc-900">{tpl.shortName}</span>
                  {selectedJournal === id && (
                    <span className="w-2.5 h-2.5 rounded-full bg-[#78C841]" />
                  )}
                </div>
                <p className="text-xs text-zinc-600 mt-1 line-clamp-2 leading-relaxed font-medium">
                  {tpl.name}
                </p>
                <div className="mt-3 text-[11px] text-zinc-400 font-mono">
                  ISSN: {tpl.issn || 'Chính thức'}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Card 2: Compiler & Auto-save */}
        <div className="bg-white/80 backdrop-blur-md border border-white/80 rounded-3xl p-6 shadow-2xs space-y-5">
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-zinc-700" />
            <h2 className="text-base font-bold text-zinc-900">
              Động Cơ Biên Dịch & Lưu Trữ
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-700 block">
                Động cơ biên dịch LaTeX (Engine)
              </label>
              <select
                value={compilerEngine}
                onChange={(e) => setCompilerEngine(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-zinc-200 bg-white font-medium focus:outline-none focus:border-zinc-400"
              >
                <option value="tectonic">Tectonic Rust Engine (Nhanh, tự tải gói & phông chữ)</option>
                <option value="xelatex">XeLaTeX (Đầy đủ font tiếng Việt)</option>
                <option value="pdflatex">pdfLaTeX (Chuẩn cổ điển)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-700 block">
                Tần suất tự động lưu bản nháp
              </label>
              <select
                value={autoSaveInterval}
                onChange={(e) => setAutoSaveInterval(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-zinc-200 bg-white font-medium focus:outline-none focus:border-zinc-400"
              >
                <option value="15">Mỗi 15 giây</option>
                <option value="30">Mỗi 30 giây (Khuyên dùng)</option>
                <option value="60">Mỗi 1 phút</option>
                <option value="0">Tắt (Lưu thủ công)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-700 block">
                Phông chữ xuất bản chuẩn
              </label>
              <select
                value={fontFamily}
                onChange={(e) => setFontFamily(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-zinc-200 bg-white font-medium focus:outline-none focus:border-zinc-400"
              >
                <option value="times">Times New Roman (Chuẩn VNUHCM)</option>
                <option value="stix">STIX Two Text (Học thuật toán - lý - hóa)</option>
                <option value="cmodern">Computer Modern (LaTeX Classic)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex items-center justify-between bg-white/60 p-4 rounded-2xl border border-white/80">
          <div>
            {saveSuccess && (
              <span className="text-xs font-bold text-[#14532D] bg-[#D9F99D] px-3 py-1.5 rounded-full inline-flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> Đã lưu cấu hình thành công!
              </span>
            )}
          </div>

          <button
            type="submit"
            className="btn-pill-lime text-xs px-6 py-2.5 flex items-center gap-2 shadow-2xs hover:scale-105 active:scale-95 transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Lưu tất cả thiết lập</span>
          </button>
        </div>
      </form>
    </div>
  );
}
