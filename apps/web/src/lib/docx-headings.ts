/**
 * Headings that Word shows as automatic list numbers ("1. Giới thiệu", "2.1 Lý thuyết nền tảng") are plain
 * bold paragraphs in the text: the number is not in the text, so the importer used to drop short ones
 * ("Tổng quan", "Lý thuyết nền tảng"). Read them from the list level instead: level 0 -> h1, 1 -> h2, 2 -> h3.
 */
const isOn = (run: string, tag: 'b' | 'i') =>
  new RegExp(`<w:${tag}[\\s/>]`, 'i').test(run) && !new RegExp(`<w:${tag}\\s+w:val="(?:0|false)"`, 'i').test(run);

export function extractListHeadings(docXml: string): Map<string, number> {
  const out = new Map<string, number>();
  const withoutTables = docXml.replace(/<w:tbl\b[\s\S]*?<\/w:tbl>/gi, '');
  for (const m of withoutTables.matchAll(/<w:p\b[\s>][\s\S]*?<\/w:p>/gi)) {
    const p = m[0];
    const lvl = p.match(/<w:numPr>[\s\S]*?<w:ilvl w:val="(\d+)"/i)?.[1];
    const runs = [...p.matchAll(/<w:r\b[\s>][\s\S]*?<\/w:r>/gi)].map((r) => r[0]).filter((r) => /<w:t\b/.test(r));
    if (!runs.length) continue;
    // Numbered list heading: every run bold. Unnumbered sub-heading typed by hand ("Mô hình nghiên cứu…",
    // "Đối với nhóm quốc gia…"): every run bold AND italic (the journal template's sub-heading look).
    const numbered = lvl !== undefined && runs.every((r) => isOn(r, 'b'));
    const handTyped = lvl === undefined && runs.every((r) => isOn(r, 'b') && isOn(r, 'i'));
    if (!numbered && !handTyped) continue;
    const text = p.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
    if (text.length < 3 || text.length > 80 || /[.;:,]$/.test(text) || !/^[A-ZÀ-Ỹ]/.test(text)) continue;
    if (handTyped && /^(hình|bảng|figure|table|nguồn|source|ghi chú|note)\b/i.test(text)) continue;
    out.set(text, numbered ? Math.min(Number(lvl), 2) : 1);
  }
  return out;
}

/**
 * A lone dash under a heading ("Kinh phí" / "-") is the journal's way of writing "none". It is the
 * content the file states, so it is kept instead of leaving an empty heading.
 */
export function isNoneMark(line: string, prev: { type: string; content?: string } | undefined): boolean {
  return /^[-–—]$/.test(line.trim()) && prev?.type === 'h1' && !prev.content;
}
