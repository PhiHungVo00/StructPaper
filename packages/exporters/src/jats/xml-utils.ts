/**
 * XML Utility functions for JATS export
 */

/**
 * Escapes special XML characters: &, <, >, ", '
 */
export function escapeXml(str?: string | null): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Parses a date string (e.g. "2026-11-05", "2026/11", "2026") into year, month, day components.
 */
export function parseDateComponents(dateStr?: string): {
  year?: string;
  month?: string;
  day?: string;
} {
  if (!dateStr) return {};

  const clean = dateStr.trim();
  // YYYY-MM-DD or YYYY-MM
  const match = clean.match(/^(\d{4})(?:[-/](\d{1,2}))?(?:[-/](\d{1,2}))?/);
  if (match) {
    return {
      year: match[1],
      month: match[2] ? String(parseInt(match[2], 10)) : undefined,
      day: match[3] ? String(parseInt(match[3], 10)) : undefined,
    };
  }

  // Fallback 4-digit year search
  const yearMatch = clean.match(/\b(19|20)\d{2}\b/);
  if (yearMatch) {
    return { year: yearMatch[0] };
  }

  return {};
}
