'use client';

import React, { useState, useEffect } from 'react';
import {
  Monitor,
  ExternalLink,
  ArrowDownToLine,
} from 'lucide-react';

const FALLBACK_VERSION = '1.0.8';
const ALL_RELEASES_URL = 'https://github.com/StructPaper/StructPaper/releases/latest';

function getWindowsDownloadUrl(ver: string): string {
  return `https://github.com/StructPaper/StructPaper/releases/download/v${ver}/StructPaper_${ver}_x64-setup.exe`;
}

function getMacDownloadUrl(ver: string): string {
  return `https://github.com/StructPaper/StructPaper/releases/download/v${ver}/StructPaper_${ver}_aarch64.dmg`;
}

export function DownloadDesktopCard(): React.ReactElement {
  const [version, setVersion] = useState<string>(FALLBACK_VERSION);

  useEffect(() => {
    // Optionally query latest release version from GitHub endpoint
    let isMounted = true;
    fetch('https://github.com/StructPaper/StructPaper/releases/latest/download/latest.json')
      .then((res) => (res.ok ? res.json() : null))
      .then((manifest) => {
        if (isMounted && manifest?.version) {
          setVersion(manifest.version);
        }
      })
      .catch(() => {
        // Fallback to FALLBACK_VERSION
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const windowsUrl = getWindowsDownloadUrl(version);
  const macUrl = getMacDownloadUrl(version);

  const handleCardClick = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div data-testid="download-desktop-card" className="space-y-4">
      {/* 1. Header Toolbar Minimalist */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div>
          <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Monitor className="w-5 h-5 text-[#78C841]" strokeWidth={2.5} />
            <span>Cài Đặt Ứng Dụng StructPaper Cho Máy Tính (Desktop App)</span>
          </h2>
        </div>

        <a
          href={ALL_RELEASES_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-500 hover:text-zinc-900 transition-colors shrink-0 py-1"
        >
          <span>Xem tất cả bản phát hành</span>
          <ExternalLink className="w-3.5 h-3.5 text-zinc-400" />
        </a>
      </div>

      {/* 2. Dual Platform Cards (Windows & macOS) matching Templates / Papers Card Style */}
      <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
        {/* Card 1: Windows */}
        <div
          onClick={() => handleCardClick(windowsUrl)}
          className="w-full bg-gray-200/40 border-8 border-gray-200 p-5 rounded-[38px] transition-all duration-300 flex flex-col justify-between hover:bg-white hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] group select-none min-h-[220px] cursor-pointer"
        >
          <div>
            {/* Top Badges */}
            <div className="flex items-center justify-between mb-2.5">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold text-white shadow-2xs bg-[#0078D4]">
                Windows x64
              </span>
              <span className="text-[10px] font-extrabold text-[#14532D] bg-[#D9F99D] px-2.5 py-0.5 rounded-full">
                Khuyên dùng
              </span>
            </div>

            {/* Title & Description */}
            <h3 className="font-bold text-sm sm:text-base text-[#1A1A1A] line-clamp-1 mb-1 leading-snug">
              StructPaper cho Windows
            </h3>
            <p className="text-[11px] text-zinc-500 line-clamp-1 mb-2.5 italic">
              Bản cài đặt .exe Setup tự động cập nhật
            </p>

            {/* Specification Stats matching JournalProfileCard */}
            <div className="flex items-center gap-2 text-[10px] text-zinc-400 font-semibold mb-2 flex-wrap">
              <span>• Windows 10 / 11 64-bit</span>
              <span>• Ngoại tuyến 100%</span>
              <span>• Chữ ký số Ed25519</span>
            </div>
          </div>

          {/* Action Footer */}
          <div className="mt-3 pt-2.5 border-t border-gray-300/50 flex items-center justify-between text-xs font-bold text-zinc-800">
            <span className="text-[11px] text-zinc-500 font-medium">
              Bản cài đặt NSIS (~85 MB)
            </span>

            <a
              href={windowsUrl}
              target="_blank"
              rel="noopener noreferrer"
              data-testid="download-windows-btn"
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1.5 text-xs font-bold text-zinc-800 hover:text-zinc-950 transition-colors cursor-pointer"
            >
              <span>Tải bản Windows (.exe Setup)</span>
              <ArrowDownToLine className="w-3.5 h-3.5 text-[#78C841] group-hover:translate-y-0.5 transition-transform" />
            </a>
          </div>
        </div>

        {/* Card 2: macOS */}
        <div
          onClick={() => handleCardClick(macUrl)}
          className="w-full bg-gray-200/40 border-8 border-gray-200 p-5 rounded-[38px] transition-all duration-300 flex flex-col justify-between hover:bg-white hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] group select-none min-h-[220px] cursor-pointer"
        >
          <div>
            {/* Top Badges */}
            <div className="flex items-center justify-between mb-2.5">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold text-white shadow-2xs bg-[#1A1A1A]">
                macOS Silicon
              </span>
              <span className="text-[10px] font-extrabold text-[#14532D] bg-[#E4F8D5] px-2.5 py-0.5 rounded-full">
                Bản chính thức
              </span>
            </div>

            {/* Title & Description */}
            <h3 className="font-bold text-sm sm:text-base text-[#1A1A1A] line-clamp-1 mb-1 leading-snug">
              StructPaper cho macOS
            </h3>
            <p className="text-[11px] text-zinc-500 line-clamp-1 mb-2.5 italic">
              Gói đĩa cài đặt .dmg kéo thả tiện lợi cho Mac
            </p>

            {/* Specification Stats matching JournalProfileCard */}
            <div className="flex items-center gap-2 text-[10px] text-zinc-400 font-semibold mb-2 flex-wrap">
              <span>• macOS 12+ Monterey</span>
              <span>• Apple Silicon (M1 - M4)</span>
              <span>• Tectonic XeTeX</span>
            </div>
          </div>

          {/* Action Footer */}
          <div className="mt-3 pt-2.5 border-t border-gray-300/50 flex items-center justify-between text-xs font-bold text-zinc-800">
            <span className="text-[11px] text-zinc-500 font-medium">
              Gói đĩa DMG (~80 MB)
            </span>

            <a
              href={macUrl}
              target="_blank"
              rel="noopener noreferrer"
              data-testid="download-macos-btn"
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1.5 text-xs font-bold text-zinc-800 hover:text-zinc-950 transition-colors cursor-pointer"
            >
              <span>Tải bản macOS (.dmg Apple Silicon)</span>
              <ArrowDownToLine className="w-3.5 h-3.5 text-[#78C841] group-hover:translate-y-0.5 transition-transform" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
