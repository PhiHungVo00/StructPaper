import { describe, it, expect, beforeAll } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import type { CompletePaper } from '@/types/paper';
import { parseDocxFile } from '@/lib/docx-parser';
import { findEnglishBackMatter, splitKeywords } from '@/lib/docx-english-backmatter';
import { extractDisplayEquations } from '@/lib/docx-equations';

const FIXTURE = path.resolve(
  __dirname,
  '../../../../fixtures/golden/papers/tranhien05,+Production+editor,+VNUHCM-EES+ID850+Copyedited.docx'
);

describe('real file: EES ID850 imported from Word', () => {
  let paper: CompletePaper;
  beforeAll(async () => {
    const buf = fs.readFileSync(FIXTURE);
    paper = await parseDocxFile(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer, path.basename(FIXTURE));
  }, 60_000);

  it('keeps all 26 references, including those that end with "DOI: …"', () => {
    expect(paper.references).toHaveLength(26);
    expect(paper.references.map((r) => r.id)).toEqual(Array.from({ length: 26 }, (_, i) => i + 1));
    expect(paper.references[0].raw).toMatch(/^W\. C\. Skamarock/);
    expect(paper.references[24].raw).toContain('10.1029/2024MS004556');
    expect(paper.references.some((r) => /Correspondence|Research Article|Sub-Institute|Email:/.test(r.raw))).toBe(false);
  });

  it('never takes a DOI quoted in a reference as the article DOI', () => {
    expect(paper.metadata.doi || '').toBe('');
  });

  it('reads the English summary page after the references as metadata', () => {
    const m = paper.metadata;
    expect(m.titleEn).toBe('Experimental heavy rainfall forecasting using the WRF model in the southeastern area of Vinh Long Province');
    expect(m.keywordsEn).toEqual(['Weather Research and Forecasting (WRF) model', 'heavy rainfall forecasting', 'Vinh Long Province']);
    expect(m.abstractEn).toMatch(/^This study presents/);
    expect(m.abstractEn).not.toMatch(/Keyw/);
    expect(m.affiliations[0].nameEn).toMatch(/^Sub-Institute of HydroMeteorology/);
  });

  it('marks only the starred author as corresponding; keywords have no trailing period', () => {
    expect(paper.metadata.authors.filter((a) => a.isCorresponding).map((a) => a.name)).toEqual(['Võ Thị Nguyên']);
    expect(paper.metadata.keywords).toEqual(['Mô hình Nghiên cứu và Dự báo Thời tiết (WRF)', 'dự báo mưa lớn', 'tỉnh Vĩnh Long']);
  });

  it('recovers the 7 numbered Word equations with their source numbers', () => {
    const eqs = paper.sections.filter((s) => s.type === 'equation').map((s) => [s.equation!.num, s.equation!.latex]);
    expect(eqs.map((e) => e[0])).toEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(eqs[0][1]).toBe(String.raw`ME= \frac{1}{n}\sum_{i=1}^n (F_i-O_i)`);
    expect(eqs[6][1]).toBe(String.raw`CSI=\frac{A}{A+B+C}`);
    // the short "where" line under the formulas is kept
    expect(paper.sections.some((s) => s.type === 'paragraph' && s.content === 'n là số lượng mẫu')).toBe(true);
  });
});

describe('helpers', () => {
  it('splits keywords without the final period', () => {
    expect(splitKeywords('a, b; c.')).toEqual(['a', 'b', 'c']);
  });

  it('finds no English page without a marker and an Abstract after the references', () => {
    expect(findEnglishBackMatter(['TÀI LIỆU THAM KHẢO', 'A. Ref one, 2020.', 'B. Ref two, 2021.'])).toBeNull();
  });

  it('accepts an equation followed only by its number, and does not anchor on "(4)"', () => {
    const omml = '<m:oMath><m:r><m:t>x</m:t></m:r></m:oMath>';
    const eqs = extractDisplayEquations([
      { text: 'Công thức:', hasMath: false, rawXml: '' },
      { text: '\t\t(4)', hasMath: true, rawXml: `<w:p>${omml}<w:r><w:t>(4)</w:t></w:r></w:p>` },
      { text: '', hasMath: true, rawXml: `<w:p>${omml}</w:p>` },
    ]);
    expect(eqs.map((e) => [e.num, e.prevText])).toEqual([
      [4, 'Công thức:'],
      [undefined, 'Công thức:'],
    ]);
  });
});
