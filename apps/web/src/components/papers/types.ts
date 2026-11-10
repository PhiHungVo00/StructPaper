import type { ManuscriptRecord, WorkflowStatus } from '@structpaper/doc-model';
export type { WorkflowStatus };
import {
  ALL_JOURNAL_IDS,
  JOURNAL_DEFINITIONS,
  normalizeJournalId,
  type JournalId,
} from '@structpaper/journal-profiles';

export type FilterWorkflowStatus = 'all' | WorkflowStatus;
export type FilterJournal = 'all' | JournalId | string;
export type SortOption = 'newest' | 'title' | 'status';
export type ViewMode = 'grid' | 'table';

export interface WorkflowStatusConfig {
  label: string;
  chipBg: string;
  chipText: string;
  border: string;
  dotBg: string;
}

export const WORKFLOW_STATUS_CONFIG: Record<WorkflowStatus, WorkflowStatusConfig> = {
  draft: {
    label: 'Bản nháp',
    chipBg: 'bg-slate-100',
    chipText: 'text-slate-700',
    border: 'border-slate-200',
    dotBg: 'bg-slate-400',
  },
  'in-review': {
    label: 'Đang duyệt',
    chipBg: 'bg-amber-50',
    chipText: 'text-amber-800',
    border: 'border-amber-200',
    dotBg: 'bg-amber-500',
  },
  proofing: {
    label: 'Hiệu đính',
    chipBg: 'bg-sky-50',
    chipText: 'text-sky-800',
    border: 'border-sky-200',
    dotBg: 'bg-sky-500',
  },
  ready: {
    label: 'Sẵn sàng',
    chipBg: 'bg-[#D9F99D]/60',
    chipText: 'text-[#14532D]',
    border: 'border-[#B4E50D]/40',
    dotBg: 'bg-[#78C841]',
  },
  published: {
    label: 'Đã xuất bản',
    chipBg: 'bg-indigo-50',
    chipText: 'text-indigo-800',
    border: 'border-indigo-200',
    dotBg: 'bg-indigo-500',
  },
};

export function getWorkflowStatusConfig(status?: string): WorkflowStatusConfig {
  if (status && status in WORKFLOW_STATUS_CONFIG) {
    return WORKFLOW_STATUS_CONFIG[status as WorkflowStatus];
  }
  return WORKFLOW_STATUS_CONFIG.draft;
}

export const JOURNAL_COLOR_MAP: Record<string, string> = {
  std: '#000099',
  hs: '#2B74B7',
  ssh: '#0000FF',
  ebl: '#8F0B97',
  et: '#0F4761',
  ees: '#0C712F',
  arns: '#FF0000',
};

export function getJournalColor(journalId?: string): string {
  if (!journalId) return JOURNAL_COLOR_MAP.std;
  const normalized = normalizeJournalId(journalId);
  if (normalized && JOURNAL_DEFINITIONS[normalized]?.color) {
    return JOURNAL_DEFINITIONS[normalized].color!;
  }
  return JOURNAL_COLOR_MAP[journalId.toLowerCase()] || JOURNAL_COLOR_MAP.std;
}

export function getJournalShortName(journalId?: string): string {
  if (!journalId) return 'VNUHCM';
  const normalized = normalizeJournalId(journalId);
  if (normalized && JOURNAL_DEFINITIONS[normalized]?.names?.short) {
    return JOURNAL_DEFINITIONS[normalized].names.short;
  }
  return journalId.toUpperCase();
}

export function getManuscriptTitle(record: ManuscriptRecord): string {
  if (record.info.displayName && record.info.displayName.trim()) {
    return record.info.displayName.trim();
  }
  if (Array.isArray(record.doc.meta?.title)) {
    const extracted = record.doc.meta.title
      .map((item: any) => (typeof item === 'string' ? item : item.v || item.text || ''))
      .join('')
      .trim();
    if (extracted) return extracted;
  }
  return 'Chưa đặt tiêu đề';
}

export function getManuscriptAuthors(record: ManuscriptRecord): string {
  const authors = record.doc.meta?.authors;
  if (Array.isArray(authors) && authors.length > 0) {
    return authors.map((a: any) => a.name).join(', ');
  }
  return 'Chưa có tác giả';
}

export function formatRelativeTime(dateInput?: string | number | Date): string {
  if (!dateInput) return 'Vừa xong';
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return 'Vừa xong';

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);

  if (diffSec < 60) return 'Vừa xong';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} phút trước`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour} giờ trước`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay === 1) return 'Hôm qua';
  if (diffDay < 7) return `${diffDay} ngày trước`;

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}
