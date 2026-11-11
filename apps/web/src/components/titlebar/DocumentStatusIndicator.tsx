'use client';

import React from 'react';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import {
  getSaveStateMetadata,
  resolveDocumentDisplayTitle,
  type DocumentSaveState,
} from '@/lib/editor/save-status';

export interface DocumentStatusIndicatorProps {
  title?: string;
  saveState: DocumentSaveState;
  onManualSave?: () => Promise<void> | void;
}

const STATUS_STYLE_MAP: Record<
  DocumentSaveState,
  {
    pillClass: string;
    icon: React.ReactNode;
  }
> = {
  saved: {
    pillClass:
      'bg-[#ECFCCB]/85 text-[#14532D] border-[#D9F99D] shadow-[inset_0_0_8px_rgba(101,163,13,0.16)]',
    icon: <CheckCircle2 className="w-3 h-3 text-[#65A30D] shrink-0" strokeWidth={2.6} />,
  },
  saving: {
    pillClass:
      'bg-sky-50/90 text-sky-700 border-sky-200/80 shadow-[inset_0_0_8px_rgba(2,132,199,0.14)]',
    icon: <Loader2 className="w-3 h-3 text-sky-600 animate-spin shrink-0" strokeWidth={2.6} />,
  },
  unsaved: {
    pillClass:
      'bg-amber-50/95 hover:bg-amber-100/90 text-amber-800 border-amber-200/90 shadow-[inset_0_0_8px_rgba(217,119,6,0.16)]',
    icon: <span className="w-2 h-2 rounded-full bg-[#FF9B2F] shrink-0" />,
  },
  error: {
    pillClass:
      'bg-rose-50/95 hover:bg-rose-100/90 text-rose-700 border-rose-200/90 shadow-[inset_0_0_8px_rgba(225,29,72,0.16)]',
    icon: <AlertCircle className="w-3 h-3 text-rose-600 shrink-0" strokeWidth={2.6} />,
  },
};

export const DocumentStatusIndicator: React.FC<DocumentStatusIndicatorProps> = ({
  title,
  saveState,
  onManualSave,
}) => {
  const displayTitle = resolveDocumentDisplayTitle(title);
  const metadata = getSaveStateMetadata(saveState);
  const visual = STATUS_STYLE_MAP[saveState];
  const canManualSave = Boolean(
    onManualSave && (saveState === 'unsaved' || saveState === 'error')
  );

  return (
    <div
      data-testid="titlebar-document-status"
      className="flex items-center gap-1.5 min-w-0"
    >
      <div className="h-3.5 w-[1px] bg-zinc-300/80 mx-1 shrink-0" aria-hidden="true" />

      <span
        data-testid="titlebar-paper-title"
        title={displayTitle}
        className="text-[12px] font-bold text-zinc-800 truncate max-w-[180px] sm:max-w-[300px] md:max-w-[440px] tracking-tight"
      >
        {displayTitle}
      </span>

      <span className="text-zinc-400 text-[10px] shrink-0 select-none" aria-hidden="true">
        •
      </span>

      {canManualSave ? (
        <button
          type="button"
          data-testid="titlebar-save-state"
          data-save-state={saveState}
          data-no-drag="true"
          onClick={() => void onManualSave?.()}
          aria-label={`${metadata.ariaLabel} — Nhấn để lưu`}
          title="Nhấn để lưu ngay (Ctrl+S)"
          className={`px-2 py-[2px] rounded-full border text-[11px] font-semibold inline-flex items-center gap-1 shrink-0 transition-colors cursor-pointer ${visual.pillClass}`}
        >
          {visual.icon}
          <span>{metadata.label}</span>
        </button>
      ) : (
        <span
          data-testid="titlebar-save-state"
          data-save-state={saveState}
          aria-label={metadata.ariaLabel}
          className={`px-2 py-[2px] rounded-full border text-[11px] font-semibold inline-flex items-center gap-1 shrink-0 select-none ${visual.pillClass}`}
        >
          {visual.icon}
          <span>{metadata.label}</span>
        </span>
      )}
    </div>
  );
};
