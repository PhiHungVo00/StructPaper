import type { PaperMetadata, PublicationInfo } from '@/types/paper';

/**
 * Publication data (volume, issue, pages, DOI, publication date) comes from the editorial office, so a
 * Word file usually lacks it. Each field has three states:
 *   - never entered           -> shown/printed as "?"
 *   - entered, then cleared   -> blank
 *   - entered                 -> the value
 */
export const UNKNOWN = '?';

export type PublicationKey = keyof Pick<PublicationInfo, 'volume' | 'issue' | 'firstPage' | 'lastPage' | 'doi' | 'published'>;

export const PUBLICATION_KEYS: PublicationKey[] = ['volume', 'issue', 'firstPage', 'lastPage', 'doi', 'published'];

function legacyValue(md: PaperMetadata, key: PublicationKey): string {
  switch (key) {
    case 'volume':
      return (md.volume || '').trim();
    case 'issue':
      return (md.issue || '').trim();
    case 'firstPage':
      return md.firstPage > 0 ? String(md.firstPage) : '';
    case 'lastPage':
      return md.lastPage > 0 ? String(md.lastPage) : '';
    case 'doi':
      return (md.doi || '').trim();
    case 'published':
      return (md.dates?.published || '').trim();
  }
}

/** The value to show in the editor and print in the PDF ("?" when nothing was ever entered). */
export function publicationValue(md: PaperMetadata, key: PublicationKey): string {
  const explicit = md.publication?.[key];
  if (explicit !== undefined) return explicit;
  return legacyValue(md, key) || UNKNOWN;
}

export function resolvePublication(md: PaperMetadata): Record<PublicationKey, string> {
  const out = {} as Record<PublicationKey, string>;
  for (const k of PUBLICATION_KEYS) out[k] = publicationValue(md, k);
  return out;
}

/** True when the value is a real, printable datum (neither "?" nor blank). */
export function hasPublicationValue(v: string | undefined): boolean {
  const t = (v ?? '').trim();
  return t !== '' && t !== UNKNOWN;
}

/** Article id from a file name such as "…, 1750.docx" (last 3-5 digit group). */
export function articleIdFromFileName(fileName?: string): string | undefined {
  if (!fileName) return undefined;
  const base = fileName.replace(/\.[a-z0-9]+$/i, '');
  const groups = base.match(/(?<![\d])\d{3,5}(?![\d])/g);
  return groups ? groups[groups.length - 1] : undefined;
}

/** DOI from the journal prefix: 10.32508/vnuhcmj-ebl + v10i3 + .1750 */
export function composeDoi(prefix: string | undefined, volume: string, issue: string, articleId: string | undefined): string | null {
  if (!prefix || !hasPublicationValue(volume) || !hasPublicationValue(issue) || !articleId) return null;
  return `https://doi.org/${prefix}.v${volume.trim()}i${issue.trim()}.${articleId}`;
}

const LAST_KEY = (journalId: string) => `structpaper_last_issue_${journalId}`;

/** Remember the last volume/issue used for a journal (to offer it for the next article). */
export function rememberIssue(journalId: string, volume: string, issue: string): void {
  try {
    if (hasPublicationValue(volume) && hasPublicationValue(issue)) {
      localStorage.setItem(LAST_KEY(journalId), JSON.stringify({ volume, issue }));
    }
  } catch {
    /* storage unavailable */
  }
}

export function lastIssue(journalId: string): { volume: string; issue: string } | null {
  try {
    const raw = localStorage.getItem(LAST_KEY(journalId));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
