'use client';

import React from 'react';
import { Settings } from 'lucide-react';
import { Slot } from '@/platform';

export default function SettingsPage() {
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
              Cài Đặt Hệ Thống
            </h1>
            <p className="text-xs sm:text-sm text-zinc-500 mt-0.5">
              Quản lý phiên bản ứng dụng, kiểm tra cập nhật tự động và cấu hình nền tảng.
            </p>
          </div>
        </div>
      </div>

      {/* App Distribution Slot (Web: DownloadDesktopCard; Desktop: CheckForUpdateCard) */}
      <Slot id="app-distribution" />
    </div>
  );
}
