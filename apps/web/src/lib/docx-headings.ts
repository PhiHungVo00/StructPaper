/**
 * Headings that Word shows as automatic list numbers ("1. Giới thiệu", "2.1 Lý thuyết nền tảng") are plain
 * bold paragraphs in the text: the number is not in the text, so the importer used to drop short ones
 * ("Tổng quan", "Lý thuyết nền tảng"). Read them from the list level instead: level 0 -> h1, 1 -> h2, 2 -> h3.
 */
export function extractListHeadings(docXml: string): Map<string, number> {
  const out = new Map<string, number>();
  for (const m of docXml.matchAll(/<w:p\b[\s>][\s\S]*?<\/w:p>/gi)) {
    const p = m[0];
    const lvl = p.match(/<w:numPr>[\s\S]*?<w:ilvl w:val="(\d+)"/i)?.[1];
    if (lvl === undefined) continue;
    const runs = [...p.matchAll(/<w:r\b[\s>][\s\S]*?<\/w:r>/gi)].map((r) => r[0]).filter((r) => /<w:t\b/.test(r));
    if (!runs.length || !runs.every((r) => /<w:b[\s/>]/i.test(r) && !/<w:b\s+w:val="(?:0|false)"/i.test(r))) continue;
    const text = p.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
    if (text.length < 3 || text.length > 80 || /[.;:,]$/.test(text) || !/^[A-ZÀ-Ỹ]/.test(text)) continue;
    out.set(text, Math.min(Number(lvl), 2));
  }
  return out;
}
