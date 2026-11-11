import { describe, it, expect } from 'vitest';
import JSZip from 'jszip';
import { createEmptyPaper, type CompletePaper, type PaperSection } from '@/types/paper';
import { exportPaperToDocx } from '@/lib/docx-export';
import { SegmentBuilder, pageWidths } from '@/lib/docx-export-layout';
import { Paragraph } from 'docx';

async function documentXml(paper: CompletePaper): Promise<string> {
  const zip = await JSZip.loadAsync(await (await exportPaperToDocx(paper)).arrayBuffer());
  return zip.file('word/document.xml')!.async('string');
}

const para = (id: string, extra: Partial<PaperSection> = {}): PaperSection => ({ id, type: 'paragraph', content: `Đoạn ${id}`, ...extra });
const eq = (id: string, columnSpan?: '1-column' | '2-column', extra: Partial<PaperSection> = {}): PaperSection => ({
  id,
  type: 'equation',
  content: '',
  equation: { latex: 'a+b=c', numbered: false, columnSpan },
  ...extra,
});
const rotatedTable = (id: string): PaperSection => ({
  id,
  type: 'table',
  content: '',
  table: { id, num: 1, caption: 'Cap', headers: ['A', 'B'], rows: [['1', '2']], isRotated: true },
});

function build(sections: PaperSection[], layout?: Partial<NonNullable<CompletePaper['layoutSettings']>>): CompletePaper {
  const p = createEmptyPaper();
  p.sections = sections;
  if (layout) p.layoutSettings = { paperSize: 'custom', columnLayout: '2-column', ...layout };
  return p;
}

/** The w:sectPr blocks in document order (the last one is the final section). */
const sectPrs = (xml: string) => xml.match(/<w:sectPr[\s\S]*?<\/w:sectPr>/g) ?? [];

describe('SegmentBuilder', () => {
  const blk = () => new Paragraph({ children: [] });

  it('keeps one continuous 2-column segment by default', () => {
    const b = new SegmentBuilder(false, false);
    b.push(false, blk());
    b.push(false, blk());
    expect(b.done()).toHaveLength(1);
    expect(b.done()[0]).toMatchObject({ oneColumn: false, landscape: false, newPage: false });
  });

  it('full-width runs are no-ops in a one-column layout', () => {
    const b = new SegmentBuilder(true, false);
    b.push(true, blk());
    b.push(false, blk());
    const segs = b.done();
    expect(segs).toHaveLength(1);
    expect(segs[0].fullWidth).toBe(false);
    expect(b.width(true)).toBe(pageWidths(false).textW);
  });

  it('a marker starts a new page and persists; a gap falls back to the document default', () => {
    const b = new SegmentBuilder(false, false);
    b.push(false, blk());
    b.enter({ orientation: 'landscape' });
    b.push(false, blk());
    b.push(false, blk());
    b.enter({ columns: '1-column' });
    b.push(false, blk());
    b.enter({});
    b.push(false, blk());
    const segs = b.done();
    expect(segs.map((s) => [s.newPage, s.landscape, s.oneColumn])).toEqual([
      [false, false, false],
      [true, true, false],
      [true, false, true],
      [true, false, false],
    ]);
    expect(segs[1].children).toHaveLength(2);
  });

  it('a landscape document starts its first body segment on a landscape page; an empty marker means landscape then', () => {
    const b = new SegmentBuilder(false, true);
    b.push(false, blk());
    b.enter({ columns: '1-column' });
    b.push(false, blk());
    expect(b.done().map((s) => [s.newPage, s.landscape, s.oneColumn])).toEqual([
      [true, true, false],
      [true, true, true],
    ]);
  });

  it('a rotated table gets its own landscape one-column page, then the layout resumes on a new page', () => {
    const b = new SegmentBuilder(false, false);
    b.push(false, blk());
    b.rotated((w) => {
      expect(w).toBe(pageWidths(true).textW);
      return [blk()];
    });
    b.push(false, blk());
    expect(b.done().map((s) => [s.newPage, s.landscape, s.oneColumn])).toEqual([
      [false, false, false],
      [true, true, true],
      [true, false, false],
    ]);
  });

  it('landscape text width is the portrait page height minus the margins', () => {
    expect(pageWidths(true).textW).toBeGreaterThan(pageWidths(false).textW);
    expect(pageWidths(true).colW).toBeLessThan(pageWidths(true).textW / 2);
  });
});

describe('DOCX export page layout', () => {
  it('defaults to a single 2-column portrait body', async () => {
    const xml = await documentXml(build([para('a'), eq('e')]));
    expect(xml).not.toContain('w:orient="landscape"');
    expect(xml).toMatch(/<w:cols [^>]*w:num="2"/);
  });

  it('layoutSettings.columnLayout 1-column puts the body in one column', async () => {
    const xml = await documentXml(build([para('a')], { columnLayout: '1-column' }));
    expect(xml).not.toMatch(/<w:cols [^>]*w:num="2"/);
  });

  it('an equation spanning 2 columns becomes its own one-column section', async () => {
    const xml = await documentXml(build([para('a'), eq('e', '2-column'), para('b')]));
    const cols = sectPrs(xml).map((s) => /w:num="(\d)"/.exec(s)?.[1]);
    expect(cols.filter((c) => c === '1').length).toBeGreaterThanOrEqual(1);
    expect(xml).toContain('<m:oMath>');
  });

  it('page-layout markers write NEXT_PAGE sections with landscape and column counts', async () => {
    const xml = await documentXml(
      build([para('a'), para('b', { pageLayout: { orientation: 'landscape' } }), para('c', { pageLayout: { columns: '1-column', orientation: 'portrait' } })])
    );
    const secs = sectPrs(xml);
    const land = secs.filter((s) => s.includes('w:orient="landscape"'));
    expect(land).toHaveLength(1);
    expect(land[0]).toContain('<w:type w:val="nextPage"/>');
    // docx swaps the portrait size: the landscape section is wider than tall.
    const w = Number(/w:pgSz[^>]*w:w="(\d+)"/.exec(land[0])![1]);
    const h = Number(/w:pgSz[^>]*w:h="(\d+)"/.exec(land[0])![1]);
    expect(w).toBeGreaterThan(h);
    expect(secs.some((s) => s.includes('<w:type w:val="nextPage"/>') && /w:num="1"/.test(s) && !s.includes('landscape'))).toBe(true);
  });

  it('a landscape document puts the body on landscape pages and leaves the first page portrait', async () => {
    const secs = sectPrs(await documentXml(build([para('a')], { orientation: 'landscape' })));
    expect(secs[0]).not.toContain('landscape');
    expect(secs[1]).toContain('w:orient="landscape"');
  });

  it('a rotated table is alone on a landscape page, then portrait resumes', async () => {
    const secs = sectPrs(await documentXml(build([para('a'), rotatedTable('t'), para('b')])));
    const orients = secs.map((s) => s.includes('w:orient="landscape"'));
    expect(orients).toEqual([false, false, true, false]);
  });
});
