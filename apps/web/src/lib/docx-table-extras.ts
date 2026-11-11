import type { PaperSection } from '@/types/paper';

/** Helpers used while importing tables from Word (kept apart from the large docx-parser). */

const FOOTER_RE = /^\(?\s*(Chú thích|Ghi chú|Notes?|Nguồn|Source)\s*:\s*\S/i;

/**
 * "Chú thích: …" and "Nguồn: …" lines that follow a table belong to the table
 * (they are printed under it), not to the running text. Returns true when consumed.
 */
export function attachTableFooterLine(sections: PaperSection[], line: string): boolean {
  const last = sections[sections.length - 1];
  const text = line.trim();
  if (!last || last.type !== 'table' || !last.table || !FOOTER_RE.test(text)) return false;
  let clean = text;
  if (clean.startsWith('(')) {
    // "(Nguồn: …)" wrapped in parentheses: drop the wrapper only when it is unbalanced
    clean = clean.slice(1).trim();
    const opens = (clean.match(/\(/g) || []).length;
    const closes = (clean.match(/\)/g) || []).length;
    if (closes > opens) clean = clean.replace(/\)\s*$/, '');
  }
  last.table = { ...last.table, source: last.table.source ? `${last.table.source}\n${clean}` : clean };
  return true;
}

/**
 * Insert a table the text pass could not place (its caption sits inside the table) in numeric order:
 * after the closest earlier-numbered table, or before the first later-numbered one.
 */
export function placeLeftoverTable(sections: PaperSection[], section: PaperSection): void {
  const num = section.table?.num ?? 0;
  let afterIdx = -1;
  let beforeIdx = -1;
  sections.forEach((s, i) => {
    if (s.type !== 'table' || !s.table) return;
    if (s.table.num < num && i > afterIdx) afterIdx = i;
    if (s.table.num > num && beforeIdx === -1) beforeIdx = i;
  });
  if (afterIdx >= 0 && (beforeIdx === -1 || afterIdx < beforeIdx)) sections.splice(afterIdx + 1, 0, section);
  else if (beforeIdx >= 0) sections.splice(beforeIdx, 0, section);
  else sections.push(section);
}

/**
 * Which tables sit in a landscape section of the Word file? A section ends at its <w:sectPr>,
 * so a table belongs to the first sectPr that follows it.
 */
export function landscapeResolver(docXml: string): (position: number) => boolean {
  const sections = [...docXml.matchAll(/<w:sectPr\b[\s\S]*?<\/w:sectPr>/gi)].map((m) => {
    const size = m[0].match(/<w:pgSz\b[^>]*>/i)?.[0] || '';
    const w = Number(size.match(/w:w="(\d+)"/)?.[1] || 0);
    const h = Number(size.match(/w:h="(\d+)"/)?.[1] || 0);
    return { end: m.index ?? 0, landscape: /w:orient="landscape"/i.test(size) || (w > 0 && w > h) };
  });
  return (position) => sections.find((s) => s.end > position)?.landscape ?? false;
}

/**
 * Layout defaults for imported tables: landscape section -> rotated; otherwise narrow tables
 * (<= 4 columns) go in one column and wide ones span both columns. The user can change both.
 */
export function applyTableLayoutHints(sections: PaperSection[], landscapeById: Record<string, boolean>): void {
  for (const s of sections) {
    const t = s.table;
    if (s.type !== 'table' || !t) continue;
    const landscape = landscapeById[t.id] === true;
    const cols = Math.max(t.headers?.length ?? 0, ...(t.rows || []).map((r) => r.length), 1);
    if (landscape && t.isRotated === undefined) t.isRotated = true;
    if (t.columnSpan === undefined) {
      t.columnSpan = landscape || cols > 4 ? '2-column' : '1-column';
      t.isFullWidth = t.columnSpan === '2-column';
    }
  }
}

/** "Bảng 2: Mô hình đo lường" -> "Mô hình đo lường" (the label is printed by the template). */
export function stripCaptionLabel(caption: string): string {
  return (caption || '').replace(/^\s*(?:b\s*ảng|bảng|table|hình|figure|fig\.?|phụ\s*lục)\s*\d*\s*[:.\-–]\s*/i, '').trim() || caption;
}
