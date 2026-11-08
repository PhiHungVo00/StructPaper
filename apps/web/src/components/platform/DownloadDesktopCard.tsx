'use client';

import React from 'react';
import {
  Monitor,
  HardDrive,
  Zap,
  ArrowDownToLine,
  Apple,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';

const WINDOWS_DOWNLOAD_URL =
  'https://github.com/StructPaper/StructPaper/releases/latest/download/StructPaper-Setup.exe';
const MACOS_DOWNLOAD_URL =
  'https://github.com/StructPaper/StructPaper/releases/latest/download/StructPaper.dmg';
const ALL_RELEASES_URL = 'https://github.com/StructPaper/StructPaper/releases/latest';

export function DownloadDesktopCard(): React.ReactElement {
  return (
    <div
      data-testid="download-desktop-card"
      className="bg-white/80 backdrop-blur-md border border-white/80 rounded-3xl p-6 sm:p-7 shadow-2xs space-y-5"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#D9F99D] text-[#14532D] flex items-center justify-center shrink-0">
            <Monitor className="w-6 h-6" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100/70 text-emerald-800 text-[11px] font-bold tracking-wide uppercase mb-1">
              Bản Cài Đặt Desktop Khuyên Dùng
            </div>
            <h2 className="text-base sm:text-lg font-bold text-zinc-900 tracking-tight">
              Cài Đặt Ứng Dụng StructPaper Cho Máy Tính (Desktop App)
            </h2>
          </div>
        </div>
      </div>

      {/* Main highlight callout */}
      <div className="bg-gradient-to-r from-emerald-50/80 to-lime-50/60 border border-emerald-200/60 rounded-2xl p-4 sm:p-4.5">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-white text-emerald-700 flex items-center justify-center shrink-0 shadow-2xs border border-emerald-100">
            <Zap className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-zinc-900 leading-snug">
              Tích hợp sẵn Tectonic XeTeX biên dịch 100% ngoại tuyến siêu tốc, lưu trữ dữ liệu an toàn trên ổ cứng.
            </p>
            <p className="text-xs text-zinc-600 leading-relaxed">
              Trải nghiệm xuất bản báo cáo khoa học mượt mà nhất mà không lo gián đoạn mạng hoặc rò rỉ bản thảo chưa công bố.
            </p>
          </div>
        </div>
      </div>

      {/* Features grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-2xl bg-zinc-50 border border-zinc-200/70 space-y-1.5">
          <div className="flex items-center gap-2 text-zinc-800 font-bold text-xs">
            <Zap className="w-4 h-4 text-emerald-600" />
            <span>Biên dịch XeTeX tức thì</span>
          </div>
          <p className="text-[11px] text-zinc-500 leading-relaxed">
            Biên dịch trực tiếp bằng Tectonic nhúng nội bộ, hoàn thành bản in PDF chuẩn trong chưa đầy 1.5 giây.
          </p>
        </div>

        <div className="p-3.5 rounded-2xl bg-zinc-50 border border-zinc-200/70 space-y-1.5">
          <div className="flex items-center gap-2 text-zinc-800 font-bold text-xs">
            <HardDrive className="w-4 h-4 text-emerald-600" />
            <span>Lưu trữ trên ổ cứng</span>
          </div>
          <p className="text-[11px] text-zinc-500 leading-relaxed">
            Bản thảo, hình vẽ và cơ sở dữ liệu BibTeX được mã hóa và lưu tại thư mục hệ thống cục bộ.
          </p>
        </div>

        <div className="p-3.5 rounded-2xl bg-zinc-50 border border-zinc-200/70 space-y-1.5">
          <div className="flex items-center gap-2 text-zinc-800 font-bold text-xs">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Tự động cập nhật bảo mật</span>
          </div>
          <p className="text-[11px] text-zinc-500 leading-relaxed">
            Hỗ trợ tự động kiểm tra và nâng cấp phiên bản với chữ ký số Ed25519 Minisign bảo vệ toàn vẹn.
          </p>
        </div>
      </div>

      {/* Download action buttons */}
      <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <a
          href={WINDOWS_DOWNLOAD_URL}
          target="_blank"
          rel="noopener noreferrer"
          data-testid="download-windows-btn"
          className="inline-flex items-center justify-center gap-2.5 px-5 py-3 rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-white font-semibold text-sm shadow-md transition-all active:scale-[0.98] group"
        >
          <Monitor className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Tải bản Windows (.exe Setup)</span>
          <ArrowDownToLine className="w-4 h-4 text-zinc-400 group-hover:translate-y-0.5 transition-transform shrink-0" />
        </a>

        <a
          href={MACOS_DOWNLOAD_URL}
          target="_blank"
          rel="noopener noreferrer"
          data-testid="download-macos-btn"
          className="inline-flex items-center justify-center gap-2.5 px-5 py-3 rounded-2xl bg-white hover:bg-zinc-50 border border-zinc-200 text-zinc-800 font-semibold text-sm shadow-2xs transition-all active:scale-[0.98] group"
        >
          <Apple className="w-4 h-4 text-zinc-700 shrink-0" />
          <span>Tải bản macOS (.dmg Apple Silicon)</span>
          <ArrowDownToLine className="w-4 h-4 text-zinc-400 group-hover:translate-y-0.5 transition-transform shrink-0" />
        </a>

        <a
          href={ALL_RELEASES_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="sm:ml-auto inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-zinc-900 transition-colors py-2 px-1"
        >
          <span>Xem tất cả bản phát hành</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  );
}
