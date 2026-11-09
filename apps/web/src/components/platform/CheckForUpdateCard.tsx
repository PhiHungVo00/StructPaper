'use client';

import React from 'react';
import {
  RefreshCw,
  Loader2,
  Download,
  CheckCircle2,
  AlertCircle,
  FileText,
  RotateCcw,
} from 'lucide-react';
import { useAppUpdater, usePlatform } from '@structpaper/platform';

function formatBytes(bytes?: number): string {
  if (!bytes || bytes <= 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function CheckForUpdateCard(): React.ReactElement {
  const platform = usePlatform();
  const {
    state,
    updateInfo,
    isChecking,
    isDownloading,
    isReady,
    isInstalling,
    error,
    downloadProgress,
    checkForUpdates,
    startUpdate,
    restart,
  } = useAppUpdater();

  const currentVersion = platform.config.appVersion || '1.0.0';
  const displayVersion = currentVersion.startsWith('v') ? currentVersion : `v${currentVersion}`;
  const percent = downloadProgress?.percent ?? 0;

  return (
    <div
      data-testid="check-for-update-card"
      className="w-full bg-gray-200/40 border-8 border-gray-200 p-6 sm:p-7 rounded-[38px] transition-all duration-300 flex flex-col justify-between hover:bg-white hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] group select-none relative overflow-hidden space-y-5"
    >
      {/* Faint bold watermark icon top-right */}
      <div className="absolute top-3 right-4 pointer-events-none select-none text-zinc-900/[0.08] group-hover:text-lime-600/[0.14] group-hover:scale-105 group-hover:rotate-12 transition-all duration-300">
        <RefreshCw className="w-20 h-20" strokeWidth={2.7} />
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#D9F99D] text-[#14532D] flex items-center justify-center shrink-0">
            <RefreshCw className={`w-6 h-6 ${isChecking ? 'animate-spin' : ''}`} strokeWidth={2.5} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-zinc-900 tracking-tight">
                Cập Nhật Ứng Dụng StructPaper (Desktop)
              </h2>
              <span
                data-testid="current-version"
                className="px-2.5 py-0.5 rounded-full bg-[#E4F8D5] text-[#14532D] font-mono text-xs font-bold border border-[#D9F99D]"
              >
                {displayVersion}
              </span>
            </div>
            <p className="text-xs text-zinc-500 mt-0.5">
              Tự động kiểm tra bản phát hành mới, tải gói cài đặt và xác thực chữ ký bảo mật.
            </p>
          </div>
        </div>

        {/* Check Button (shown unless currently downloading or ready) */}
        {!isDownloading && !isReady && !isInstalling && (
          <button
            type="button"
            onClick={() => checkForUpdates({ manual: true })}
            disabled={isChecking}
            data-testid="check-update-btn"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-zinc-900 hover:bg-zinc-800 disabled:opacity-60 text-white font-semibold text-xs sm:text-sm shadow-2xs transition-all active:scale-[0.98] cursor-pointer"
          >
            {isChecking ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-[#78C841]" />
                <span>Đang kiểm tra...</span>
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 text-[#78C841]" />
                <span>Kiểm tra phiên bản mới</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* State: Idle / Up-to-date */}
      {state.s === 'idle' && (
        <div className="flex items-center gap-2.5 p-3.5 rounded-2xl bg-white/70 border border-zinc-200/60 text-xs text-zinc-700 relative z-10">
          <CheckCircle2 className="w-4 h-4 text-[#78C841] shrink-0" strokeWidth={2.5} />
          <span>StructPaper đang ở phiên bản mới nhất. Chưa phát hiện bản cập nhật nào mới hơn.</span>
        </div>
      )}

      {/* State: Available */}
      {state.s === 'available' && updateInfo && (
        <div
          data-testid="update-available-section"
          className="bg-[#E4F8D5]/70 border border-[#D9F99D] rounded-2xl p-4 sm:p-5 space-y-3.5 relative z-10"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#78C841] animate-ping" />
              <span className="text-xs sm:text-sm font-bold text-[#14532D]">
                Đã có phiên bản mới:
              </span>
              <span
                data-testid="new-version-badge"
                className="font-mono font-extrabold text-xs bg-[#D9F99D] text-[#14532D] px-2.5 py-0.5 rounded-full border border-[#D9F99D]"
              >
                {updateInfo.version.startsWith('v') ? updateInfo.version : `v${updateInfo.version}`}
              </span>
            </div>
            {updateInfo.publishedAt && (
              <span className="text-[11px] text-[#14532D]/80">
                Phát hành: {new Date(updateInfo.publishedAt).toLocaleDateString('vi-VN')}
              </span>
            )}
          </div>

          {updateInfo.notes && (
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[#14532D]">
                <FileText className="w-3.5 h-3.5" />
                <span>Nhật ký thay đổi (Release Notes):</span>
              </div>
              <div
                data-testid="changelog-notes"
                className="text-xs text-zinc-700 bg-white/90 border border-[#D9F99D] rounded-xl p-3 max-h-36 overflow-y-auto whitespace-pre-wrap leading-relaxed font-sans shadow-2xs"
              >
                {updateInfo.notes}
              </div>
            </div>
          )}

          <div className="pt-1 flex items-center gap-3">
            <button
              type="button"
              onClick={startUpdate}
              data-testid="start-update-btn"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#14532D] hover:bg-[#14532D]/90 text-white font-semibold text-xs sm:text-sm shadow-md transition-all active:scale-[0.98] cursor-pointer"
            >
              <Download className="w-4 h-4 text-[#D9F99D]" />
              <span>Cập nhật ngay</span>
            </button>
            <span className="text-[11px] text-zinc-500">
              Quá trình tải về sẽ diễn ra ở chế độ nền mà không làm gián đoạn bài viết của bạn.
            </span>
          </div>
        </div>
      )}

      {/* State: Downloading */}
      {isDownloading && (
        <div
          data-testid="downloading-section"
          className="bg-white/80 border border-zinc-200 rounded-2xl p-4 sm:p-5 space-y-3 relative z-10"
        >
          <div className="flex items-center justify-between text-xs font-semibold text-zinc-800">
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-[#78C841]" />
              <span>
                Đang tải bản cập nhật{' '}
                {updateInfo?.version
                  ? updateInfo.version.startsWith('v')
                    ? updateInfo.version
                    : `v${updateInfo.version}`
                  : ''}
                ...
              </span>
            </div>
            <span className="font-mono font-bold text-[#14532D]">{percent}%</span>
          </div>

          {/* Progress bar */}
          <div className="w-full h-3 bg-zinc-200/80 rounded-full overflow-hidden p-0.5 border border-zinc-200">
            <div
              data-testid="download-progress-bar"
              className="h-full bg-gradient-to-r from-[#D9F99D] to-[#78C841] rounded-full transition-all duration-300"
              style={{ width: `${Math.max(4, Math.min(100, percent))}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-zinc-500 font-mono">
            <span>Đã nhận: {formatBytes(downloadProgress?.received)}</span>
            {downloadProgress?.total ? (
              <span>Tổng dung lượng: {formatBytes(downloadProgress.total)}</span>
            ) : null}
          </div>
        </div>
      )}

      {/* State: Ready */}
      {isReady && (
        <div
          data-testid="ready-section"
          className="bg-lime-50/80 border border-lime-300 rounded-2xl p-4 sm:p-5 space-y-3 relative z-10"
        >
          <div className="flex items-center gap-2 text-zinc-900 font-bold text-sm">
            <CheckCircle2 className="w-5 h-5 text-[#78C841] shrink-0" strokeWidth={2.5} />
            <span>
              Bản cập nhật{' '}
              {updateInfo?.version
                ? updateInfo.version.startsWith('v')
                  ? updateInfo.version
                  : `v${updateInfo.version}`
                : ''}{' '}
              đã sẵn sàng cài đặt!
            </span>
          </div>
          <p className="text-xs text-zinc-600 leading-relaxed">
            Mọi bài thảo đang soạn thảo sẽ được tự động lưu trữ an toàn trước khi khởi động lại ứng dụng.
          </p>
          <button
            type="button"
            onClick={restart}
            data-testid="restart-update-btn"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#14532D] hover:bg-[#14532D]/90 text-white font-semibold text-xs sm:text-sm shadow-md transition-all active:scale-[0.98] cursor-pointer"
          >
            <RotateCcw className="w-4 h-4 text-[#D9F99D]" />
            <span>Khởi động lại để hoàn tất cập nhật</span>
          </button>
        </div>
      )}

      {/* State: Installing */}
      {isInstalling && (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/70 border border-zinc-200 text-xs text-zinc-700 relative z-10">
          <Loader2 className="w-4 h-4 animate-spin text-[#78C841] shrink-0" />
          <span>Đang lưu trữ dữ liệu và chuẩn bị khởi động lại ứng dụng StructPaper...</span>
        </div>
      )}

      {/* State: Error */}
      {error && (
        <div
          data-testid="update-error-section"
          className="bg-rose-50 border border-rose-200 rounded-2xl p-4 space-y-2 text-xs text-rose-800 relative z-10"
        >
          <div className="flex items-center gap-2 font-bold text-rose-900">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>Lỗi cập nhật ({error.code})</span>
          </div>
          <p className="leading-relaxed">{error.message}</p>
          <button
            type="button"
            onClick={() => checkForUpdates({ manual: true })}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-rose-300 font-semibold text-rose-700 hover:bg-rose-100 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Thử lại</span>
          </button>
        </div>
      )}

      {/* Dev Mode Testing Toolbar (Shown only during development) */}
      {process.env.NODE_ENV !== 'production' && (
        <div className="pt-3 border-t border-zinc-200/60 flex flex-wrap items-center justify-between gap-2 text-xs relative z-10">
          <span className="text-zinc-500 font-medium">🧪 Kiểm thử Dev:</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              data-testid="simulate-update-btn"
              onClick={() => {
                if (
                  'simulateUpdate' in platform.updates &&
                  typeof (platform.updates as any).simulateUpdate === 'function'
                ) {
                  (platform.updates as any).simulateUpdate();
                }
              }}
              className="px-3 py-1.5 rounded-xl bg-[#E4F8D5] hover:bg-[#D9F99D] text-[#14532D] font-bold border border-[#D9F99D] transition-all active:scale-95 cursor-pointer"
            >
              Mô phỏng phát hiện bản mới v1.0.8
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
