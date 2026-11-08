'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  X,
  ChevronDown,
  ChevronUp,
  Download,
  RotateCcw,
  Loader2,
  Clock,
  Ban,
  FileText,
} from 'lucide-react';
import { useAppUpdater } from '@structpaper/platform';

export function UpdateNotificationBanner(): React.ReactElement | null {
  const {
    hasUpdate,
    updateInfo,
    isDownloading,
    isReady,
    isInstalling,
    downloadProgress,
    startUpdate,
    restart,
    skipVersion,
    remindLater,
  } = useAppUpdater();

  const [dismissed, setDismissed] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  // Non-intrusive: only shown if there is an update and user hasn't dismissed it
  if (!hasUpdate || dismissed || !updateInfo) {
    return null;
  }

  const versionText = updateInfo.version.startsWith('v')
    ? updateInfo.version
    : `v${updateInfo.version}`;

  const handleRemindLater = () => {
    remindLater(24);
    setDismissed(true);
  };

  const handleSkipVersion = () => {
    skipVersion(updateInfo.version);
    setDismissed(true);
  };

  const handleActionClick = () => {
    if (isReady) {
      restart();
    } else {
      startUpdate();
    }
  };

  return (
    <aside
      aria-label="Thông báo cập nhật ứng dụng"
      data-testid="update-notification-banner"
      className="fixed bottom-5 right-5 z-50 w-[calc(100vw-2.5rem)] sm:w-[420px] bg-white/95 backdrop-blur-xl border border-zinc-200/90 rounded-3xl p-4 sm:p-5 shadow-[0_12px_40px_rgba(0,0,0,0.12)] space-y-3.5 transition-all"
    >
      {/* Top Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4 text-emerald-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-zinc-900 tracking-tight">
                Bản Cập Nhật Mới
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-mono text-[11px] font-extrabold border border-emerald-200">
                {versionText}
              </span>
            </div>
            <p className="text-[11px] text-zinc-500 mt-0.5">
              Đã có bản phát hành StructPaper mới sẵn sàng nâng cấp.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleRemindLater}
          title="Đóng thông báo"
          className="text-zinc-400 hover:text-zinc-600 p-1 rounded-lg hover:bg-zinc-100 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Downloading indicator */}
      {isDownloading && (
        <div className="space-y-1.5 p-2.5 rounded-2xl bg-zinc-50 border border-zinc-200/80">
          <div className="flex items-center justify-between text-xs text-zinc-700 font-medium">
            <span className="flex items-center gap-1.5">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
              Đang tải về...
            </span>
            <span className="font-mono font-bold text-emerald-700">
              {downloadProgress?.percent ?? 0}%
            </span>
          </div>
          <div className="w-full h-2 bg-zinc-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-300"
              style={{ width: `${downloadProgress?.percent ?? 0}%` }}
            />
          </div>
        </div>
      )}

      {/* Ready indicator */}
      {isReady && (
        <div className="p-2.5 rounded-2xl bg-lime-50 border border-lime-200 text-xs text-zinc-700 font-medium">
          Gói cập nhật đã tải xong! Khởi động lại để hoàn tất.
        </div>
      )}

      {/* Collapsible Release Notes */}
      {showDetails && updateInfo.notes && (
        <div
          data-testid="banner-details-container"
          className="p-3 bg-zinc-50 border border-zinc-200/80 rounded-2xl space-y-1.5 text-xs text-zinc-700 max-h-36 overflow-y-auto"
        >
          <div className="flex items-center gap-1.5 font-semibold text-zinc-900">
            <FileText className="w-3.5 h-3.5 text-zinc-500" />
            <span>Nội dung cập nhật:</span>
          </div>
          <div className="text-[11px] leading-relaxed whitespace-pre-wrap font-sans text-zinc-600">
            {updateInfo.notes}
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex items-center justify-between gap-2 pt-1 border-t border-zinc-100">
        <button
          type="button"
          onClick={() => setShowDetails(!showDetails)}
          data-testid="banner-details-btn"
          className="inline-flex items-center gap-1 text-xs font-semibold text-zinc-600 hover:text-zinc-900 px-2 py-1.5 rounded-xl hover:bg-zinc-100 transition-colors"
        >
          <span>{showDetails ? 'Thu gọn' : 'Xem chi tiết'}</span>
          {showDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleActionClick}
            disabled={isDownloading || isInstalling}
            data-testid="banner-update-btn"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 disabled:opacity-50 text-white font-semibold text-xs shadow-2xs transition-all active:scale-[0.98]"
          >
            {isReady ? (
              <>
                <RotateCcw className="w-3.5 h-3.5 text-emerald-400" />
                <span>Khởi động lại</span>
              </>
            ) : isDownloading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                <span>Đang tải...</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5 text-emerald-400" />
                <span>Cập nhật ngay</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Footer secondary links: Nhắc sau & Bỏ qua bản này */}
      <div className="flex items-center justify-between text-[11px] text-zinc-400 px-1 pt-0.5">
        <button
          type="button"
          onClick={handleRemindLater}
          data-testid="banner-remind-btn"
          className="inline-flex items-center gap-1 hover:text-zinc-700 transition-colors"
        >
          <Clock className="w-3 h-3" />
          <span>Nhắc sau</span>
        </button>

        <button
          type="button"
          onClick={handleSkipVersion}
          data-testid="banner-skip-btn"
          className="inline-flex items-center gap-1 hover:text-rose-600 transition-colors"
        >
          <Ban className="w-3 h-3" />
          <span>Bỏ qua bản này</span>
        </button>
      </div>
    </aside>
  );
}
