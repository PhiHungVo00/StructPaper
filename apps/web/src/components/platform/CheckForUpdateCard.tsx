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
      className="bg-white/80 backdrop-blur-md border border-white/80 rounded-3xl p-6 sm:p-7 shadow-2xs space-y-5"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#D9F99D] text-[#14532D] flex items-center justify-center shrink-0">
            <RefreshCw className={`w-6 h-6 ${isChecking ? 'animate-spin' : ''}`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-zinc-900 tracking-tight">
                Cập Nhật Ứng Dụng StructPaper (Desktop)
              </h2>
              <span
                data-testid="current-version"
                className="px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-700 font-mono text-xs font-bold border border-zinc-200"
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
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-zinc-900 hover:bg-zinc-800 disabled:opacity-60 text-white font-semibold text-xs sm:text-sm shadow-2xs transition-all active:scale-[0.98]"
          >
            {isChecking ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                <span>Đang kiểm tra...</span>
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 text-emerald-400" />
                <span>Kiểm tra phiên bản mới</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* State: Idle / Up-to-date */}
      {state.s === 'idle' && (
        <div className="flex items-center gap-2.5 p-3.5 rounded-2xl bg-zinc-50 border border-zinc-200/60 text-xs text-zinc-600">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>StructPaper đang ở phiên bản mới nhất. Chưa phát hiện bản cập nhật nào mới hơn.</span>
        </div>
      )}

      {/* State: Available */}
      {state.s === 'available' && updateInfo && (
        <div
          data-testid="update-available-section"
          className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-4 sm:p-5 space-y-3.5"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
              <span className="text-xs sm:text-sm font-bold text-emerald-950">
                Đã có phiên bản mới:
              </span>
              <span
                data-testid="new-version-badge"
                className="font-mono font-extrabold text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-lg border border-emerald-200"
              >
                {updateInfo.version.startsWith('v') ? updateInfo.version : `v${updateInfo.version}`}
              </span>
            </div>
            {updateInfo.publishedAt && (
              <span className="text-[11px] text-emerald-700">
                Phát hành: {new Date(updateInfo.publishedAt).toLocaleDateString('vi-VN')}
              </span>
            )}
          </div>

          {updateInfo.notes && (
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-900">
                <FileText className="w-3.5 h-3.5" />
                <span>Nhật ký thay đổi (Release Notes):</span>
              </div>
              <div
                data-testid="changelog-notes"
                className="text-xs text-zinc-700 bg-white/90 border border-emerald-200/70 rounded-xl p-3 max-h-36 overflow-y-auto whitespace-pre-wrap leading-relaxed font-sans shadow-2xs"
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
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs sm:text-sm shadow-md transition-all active:scale-[0.98]"
            >
              <Download className="w-4 h-4" />
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
          className="bg-zinc-50 border border-zinc-200 rounded-2xl p-4 sm:p-5 space-y-3"
        >
          <div className="flex items-center justify-between text-xs font-semibold text-zinc-800">
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
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
            <span className="font-mono font-bold text-emerald-700">{percent}%</span>
          </div>

          {/* Progress bar */}
          <div className="w-full h-3 bg-zinc-200/80 rounded-full overflow-hidden p-0.5 border border-zinc-200">
            <div
              data-testid="download-progress-bar"
              className="h-full bg-gradient-to-r from-emerald-500 to-[#78C841] rounded-full transition-all duration-300"
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
          className="bg-lime-50/80 border border-lime-300 rounded-2xl p-4 sm:p-5 space-y-3"
        >
          <div className="flex items-center gap-2 text-zinc-900 font-bold text-sm">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
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
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#14532D] hover:bg-[#14532D]/90 text-white font-semibold text-xs sm:text-sm shadow-md transition-all active:scale-[0.98]"
          >
            <RotateCcw className="w-4 h-4 text-emerald-400" />
            <span>Khởi động lại để hoàn tất cập nhật</span>
          </button>
        </div>
      )}

      {/* State: Installing */}
      {isInstalling && (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-zinc-50 border border-zinc-200 text-xs text-zinc-700">
          <Loader2 className="w-4 h-4 animate-spin text-emerald-600 shrink-0" />
          <span>Đang lưu trữ dữ liệu và chuẩn bị khởi động lại ứng dụng StructPaper...</span>
        </div>
      )}

      {/* State: Error */}
      {error && (
        <div
          data-testid="update-error-section"
          className="bg-rose-50 border border-rose-200 rounded-2xl p-4 space-y-2 text-xs text-rose-800"
        >
          <div className="flex items-center gap-2 font-bold text-rose-900">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>Lỗi cập nhật ({error.code})</span>
          </div>
          <p className="leading-relaxed">{error.message}</p>
          <button
            type="button"
            onClick={() => checkForUpdates({ manual: true })}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-rose-300 font-semibold text-rose-700 hover:bg-rose-100 transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Thử lại</span>
          </button>
        </div>
      )}
    </div>
  );
}
