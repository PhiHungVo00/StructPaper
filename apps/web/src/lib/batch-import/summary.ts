import type { BatchItem } from './types';

export interface BatchSummary {
  total: number;
  /** papers that exist (saved), with or without a PDF */
  created: number;
  withPdf: number;
  /** created but the PDF failed or was cancelled */
  pdfFailed: number;
  /** not created: unreadable / save failed */
  failed: number;
  cancelled: number;
  /** finished one way or another (done / error / cancelled) */
  finished: number;
  /** 0..1 */
  progress: number;
  /** items the "retry" button would run again */
  retryable: number;
}

export function summarize(items: BatchItem[]): BatchSummary {
  const created = items.filter((i) => i.stage === 'done').length;
  const failed = items.filter((i) => i.stage === 'error').length;
  const cancelled = items.filter((i) => i.stage === 'cancelled').length;
  const finished = created + failed + cancelled;
  return {
    total: items.length,
    created,
    withPdf: items.filter((i) => i.stage === 'done' && i.pdf).length,
    pdfFailed: items.filter((i) => i.stage === 'done' && !i.pdf).length,
    failed,
    cancelled,
    finished,
    progress: items.length ? finished / items.length : 0,
    retryable: failed + cancelled + items.filter((i) => i.stage === 'done' && !i.pdf && i.paperId).length,
  };
}

export const STAGE_LABEL: Record<BatchItem['stage'], string> = {
  queued: 'Đang chờ',
  parsing: 'Đang đọc tệp Word…',
  saving: 'Đang lưu…',
  waiting: 'Chờ tới lượt biên dịch PDF…',
  compiling: 'Đang biên dịch PDF…',
  done: 'Hoàn tất',
  error: 'Không tạo được',
  cancelled: 'Đã hủy',
};

/** One-line status of an item as shown in the list. */
export function itemStatus(it: BatchItem): string {
  if (it.stage === 'done' && it.compileError) return `Đã tạo bài báo, PDF lỗi: ${it.compileError}`;
  if (it.stage === 'error') return it.error || STAGE_LABEL.error;
  return STAGE_LABEL[it.stage];
}

export function saveBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
