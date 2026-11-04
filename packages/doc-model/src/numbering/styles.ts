import type { Id, Reference, CitationStyle } from '../types';

/**
 * Format an array of citation numbers into standard Vancouver compressed ranges.
 * e.g. [1] -> "1"
 * e.g. [1, 2] -> "1, 2"
 * e.g. [2, 3, 4] -> "2-4"
 * e.g. [1, 3, 4, 5, 8] -> "1, 3-5, 8"
 */
export function formatCitationRange(numbers: number[]): string {
  if (numbers.length === 0) return '';
  const sorted = Array.from(new Set(numbers)).sort((a, b) => a - b);

  const ranges: string[] = [];
  let i = 0;
  while (i < sorted.length) {
    const start = sorted[i];
    let j = i;
    while (j + 1 < sorted.length && sorted[j + 1] === sorted[j] + 1) {
      j++;
    }
    const count = j - i + 1;
    if (count >= 3) {
      ranges.push(`${start}-${sorted[j]}`);
    } else if (count === 2) {
      ranges.push(`${start}, ${sorted[j]}`);
    } else {
      ranges.push(`${start}`);
    }
    i = j + 1;
  }
  return ranges.join(', ');
}

export const vancouverCitationStyle: CitationStyle = {
  name: 'Vancouver',
  formatCitation(numbers: number[]): string {
    return formatCitationRange(numbers);
  },
};

export const apaCitationStyle: CitationStyle = {
  name: 'APA',
  formatCitation(numbers: number[]): string {
    return numbers.join(', ');
  },
};

function extractAuthorSortKey(ref: Reference): string {
  if (ref.csl && typeof ref.csl === 'object') {
    const author = (ref.csl as Record<string, unknown>).author;
    if (Array.isArray(author) && author.length > 0) {
      const first = author[0];
      if (typeof first === 'object' && first !== null) {
        return (first.family || first.name || first.given || '').toString().toLowerCase();
      }
      if (typeof first === 'string') return first.toLowerCase();
    }
    if (typeof author === 'string') return author.toLowerCase();
  }
  const match = ref.raw.match(/^([A-Za-zÀ-ỹ\s]+?)(?:,|\(|\d{4})/);
  if (match) return match[1].trim().toLowerCase();
  return ref.raw.toLowerCase();
}

function extractYearSortKey(ref: Reference): number {
  if (ref.csl && typeof ref.csl === 'object') {
    const issued = (ref.csl as Record<string, unknown>).issued as Record<string, unknown> | undefined;
    const dateParts = issued?.['date-parts'];
    if (Array.isArray(dateParts) && dateParts.length > 0 && Array.isArray(dateParts[0])) {
      const yr = Number(dateParts[0][0]);
      if (!isNaN(yr)) return yr;
    }
  }
  const match = ref.raw.match(/\b(19\d\d|20\d\d)\b/);
  if (match) return Number(match[1]);
  return 9999;
}

export function sortReferencesApa(references: Reference[]): Id[] {
  const sorted = [...references].sort((a, b) => {
    const authorA = extractAuthorSortKey(a);
    const authorB = extractAuthorSortKey(b);
    const authorCmp = authorA.localeCompare(authorB);
    if (authorCmp !== 0) return authorCmp;
    const yearA = extractYearSortKey(a);
    const yearB = extractYearSortKey(b);
    if (yearA !== yearB) return yearA - yearB;
    return a.raw.localeCompare(b.raw);
  });
  return sorted.map((r) => r.id);
}
