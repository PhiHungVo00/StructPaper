/**
 * CSL Citation & Bibliography Formatter
 *
 * Implements high-fidelity, deterministic citation formatting for:
 * - Vancouver style: numeric callouts ([1], [1-3], [1, 3-5]) and numbered references
 * - APA style: author-date callouts ((Author, Year)) and alphabetical bibliography
 */

import type { Reference } from '@structpaper/doc-model';
import type {
  CslItem,
  CslName,
  CslStyle,
  FormattedBibliographyEntry,
} from './csl-types';

/**
 * Compresses an array of integer numbers into compact ranges (e.g. [1, 2, 3] -> "1-3").
 * According to Vancouver convention, 3 or more consecutive numbers are hyphenated.
 */
export function compressNumberRanges(numbers: number[]): string {
  if (numbers.length === 0) return '';
  const sorted = Array.from(new Set(numbers)).sort((a, b) => a - b);

  const ranges: string[] = [];
  let start = sorted[0];
  let prev = start;

  for (let i = 1; i <= sorted.length; i++) {
    const current = sorted[i];
    if (current === prev + 1) {
      prev = current;
    } else {
      if (prev === start) {
        ranges.push(String(start));
      } else if (prev === start + 1) {
        ranges.push(`${start}, ${prev}`);
      } else {
        ranges.push(`${start}-${prev}`);
      }
      start = current;
      prev = current;
    }
  }

  return ranges.join(', ');
}

/**
 * Extracts a 4-digit publication year from a CSL item or raw string.
 */
function extractYear(csl?: CslItem, raw?: string): string {
  if (csl?.issued?.['date-parts']?.[0]?.[0]) {
    return String(csl.issued['date-parts'][0][0]);
  }
  if (csl?.issued?.raw) {
    const match = csl.issued.raw.match(/\b(19|20)\d{2}\b/);
    if (match) return match[0];
  }
  if (raw) {
    const match = raw.match(/\b(19|20)\d{2}\b/);
    if (match) return match[0];
  }
  return 'n.d.';
}

/**
 * Formats authors according to Vancouver style (Surname + initials without periods, max 6).
 */
function formatVancouverAuthors(authors?: CslName[]): string {
  if (!authors || authors.length === 0) return '';
  const formatted = authors.map((a) => {
    if (a.literal) return a.literal;
    const family = a.family || '';
    const givenInitials = (a.given || '')
      .split(/[\s.-]+/)
      .filter(Boolean)
      .map((part) => part[0].toUpperCase())
      .join('');
    return givenInitials ? `${family} ${givenInitials}` : family;
  });

  if (formatted.length > 6) {
    return formatted.slice(0, 6).join(', ') + ', et al.';
  }
  return formatted.join(', ');
}

/**
 * Formats authors according to APA style (Surname, Initials with periods & ampersand).
 */
function formatApaAuthors(authors?: CslName[]): string {
  if (!authors || authors.length === 0) return '';
  const formatted = authors.map((a) => {
    if (a.literal) return a.literal;
    const family = a.family || '';
    const givenInitials = (a.given || '')
      .split(/[\s.-]+/)
      .filter(Boolean)
      .map((part) => `${part[0].toUpperCase()}.`)
      .join(' ');
    return givenInitials ? `${family}, ${givenInitials}` : family;
  });

  if (formatted.length === 1) {
    return formatted[0];
  }
  if (formatted.length === 2) {
    return `${formatted[0]}, & ${formatted[1]}`;
  }
  if (formatted.length <= 20) {
    const head = formatted.slice(0, -1).join(', ');
    return `${head}, & ${formatted[formatted.length - 1]}`;
  }
  // APA > 20 authors: first 19, ellipsis ..., last author
  const head = formatted.slice(0, 19).join(', ');
  return `${head}, ... ${formatted[formatted.length - 1]}`;
}

/**
 * Formats in-text APA callout author string.
 */
function formatApaCalloutAuthors(authors?: CslName[], raw?: string): string {
  if (!authors || authors.length === 0) {
    if (raw) {
      const firstWord = raw.split(/[\s,.]+/)[0];
      return firstWord || 'Unknown';
    }
    return 'Unknown';
  }
  const primary = (a: CslName) => a.family || a.literal || 'Unknown';
  if (authors.length === 1) {
    return primary(authors[0]);
  }
  if (authors.length === 2) {
    return `${primary(authors[0])} & ${primary(authors[1])}`;
  }
  return `${primary(authors[0])} et al.`;
}

export class CslFormatter {
  /**
   * Formats an in-text citation callout.
   */
  public static formatCallout(
    refIds: string[],
    options: {
      style?: CslStyle;
      numbering?: Map<string, number>;
      references?: Map<string, Reference>;
    } = {}
  ): string {
    const style = options.style || 'vancouver';
    if (refIds.length === 0) return '';

    if (style === 'vancouver') {
      const numbers: number[] = [];
      for (const id of refIds) {
        const num = options.numbering?.get(id);
        if (num !== undefined) {
          numbers.push(num);
        }
      }
      if (numbers.length === 0) {
        // Fallback: return raw IDs
        return `[${refIds.join(', ')}]`;
      }
      return `[${compressNumberRanges(numbers)}]`;
    }

    // APA style: (Author, Year; Author2, Year2)
    const callouts: string[] = [];
    for (const id of refIds) {
      const ref = options.references?.get(id);
      const csl = ref?.csl as CslItem | undefined;
      const authors = csl?.author;
      const authorText = formatApaCalloutAuthors(authors, ref?.raw);
      const year = extractYear(csl, ref?.raw);
      callouts.push(`${authorText}, ${year}`);
    }

    return `(${callouts.join('; ')})`;
  }

  /**
   * Formats a single reference into a bibliographic string.
   */
  public static formatBibliographyEntry(
    ref: Reference,
    index: number,
    style: CslStyle = 'vancouver'
  ): FormattedBibliographyEntry {
    const csl = ref.csl as CslItem | undefined;
    const doi = ref.doi || csl?.DOI;
    const url = ref.url || csl?.URL;

    if (!csl || (!csl.title && !csl.author)) {
      // Fallback to raw reference
      const cleanRaw = ref.raw.replace(/^\s*\d+[\.\)]\s*/, '').trim();
      const text =
        style === 'vancouver'
          ? `${index}. ${cleanRaw}`
          : cleanRaw;
      return { id: ref.id, number: index, text, doi, url };
    }

    if (style === 'vancouver') {
      const parts: string[] = [];
      const authors = formatVancouverAuthors(csl.author);
      if (authors) parts.push(authors.endsWith('.') ? authors : `${authors}.`);

      if (csl.title) {
        const cleanTitle = csl.title.replace(/\.+$/, '');
        parts.push(`${cleanTitle}.`);
      }

      const container = csl['container-title'];
      const year = extractYear(csl, ref.raw);

      let journalInfo = '';
      if (container) journalInfo += container.replace(/\.+$/, '') + '.';
      if (year !== 'n.d.') {
        journalInfo += (journalInfo ? ' ' : '') + year;
      }
      if (csl.volume) {
        journalInfo += `;${csl.volume}`;
        if (csl.issue) {
          journalInfo += `(${csl.issue})`;
        }
      }
      if (csl.page) {
        journalInfo += `:${csl.page}`;
      }
      if (journalInfo) {
        parts.push(journalInfo.endsWith('.') ? journalInfo : `${journalInfo}.`);
      }

      if (doi) {
        const doiUrl = doi.startsWith('http') ? doi : `https://doi.org/${doi}`;
        parts.push(doiUrl);
      } else if (url) {
        parts.push(url);
      }

      const text = `${index}. ${parts.join(' ')}`;
      return { id: ref.id, number: index, text, doi, url };
    }

    // APA style (7th edition)
    const parts: string[] = [];
    const authors = formatApaAuthors(csl.author);
    if (authors) {
      parts.push(authors.endsWith('.') ? authors : `${authors}.`);
    } else {
      parts.push('Unknown Author.');
    }

    const year = extractYear(csl, ref.raw);
    parts.push(`(${year}).`);

    if (csl.title) {
      const cleanTitle = csl.title.replace(/\.+$/, '');
      parts.push(`${cleanTitle}.`);
    }

    const container = csl['container-title'];
    let pubInfo = '';
    if (container) {
      pubInfo += container;
      if (csl.volume) {
        pubInfo += `, ${csl.volume}`;
        if (csl.issue) {
          pubInfo += `(${csl.issue})`;
        }
      }
      if (csl.page) {
        pubInfo += `, ${csl.page}`;
      }
      pubInfo += '.';
      parts.push(pubInfo);
    }

    if (doi) {
      const doiUrl = doi.startsWith('http') ? doi : `https://doi.org/${doi}`;
      parts.push(doiUrl);
    } else if (url) {
      parts.push(url);
    }

    const text = parts.join(' ');
    return { id: ref.id, number: index, text, doi, url };
  }

  /**
   * Formats a complete bibliography list.
   */
  public static formatBibliography(
    references: Reference[],
    style: CslStyle = 'vancouver'
  ): FormattedBibliographyEntry[] {
    let refs = [...references];

    if (style === 'apa') {
      // Sort alphabetically by primary author family name or raw string
      refs.sort((a, b) => {
        const cslA = a.csl as CslItem | undefined;
        const cslB = b.csl as CslItem | undefined;
        const authorA = cslA?.author?.[0]?.family || a.raw;
        const authorB = cslB?.author?.[0]?.family || b.raw;
        return authorA.localeCompare(authorB);
      });
    }

    return refs.map((ref, idx) =>
      this.formatBibliographyEntry(ref, idx + 1, style)
    );
  }
}
