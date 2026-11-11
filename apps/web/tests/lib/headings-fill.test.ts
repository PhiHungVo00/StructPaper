import { describe, it, expect } from 'vitest';
import { createEmptyPaper, DEFAULT_LAYOUT_SETTINGS, type PaperSection } from '@/types/paper';
import { stripHeadingNumber } from '@/lib/headings';
import { resolveBodyFill, rowIsTinted } from '@/lib/table-fill';
import { generateFullJournalLatex } from '@/lib/latex-template';
import { exportToJatsXml } from '@/lib/jats-export';

describe('section numbers', () => {
  it('strips typed numbers but not years or ordinary words', () => {
    expect(stripHeadingNumber('4. Kết quả và thảo luận')).toBe('Kết quả và thảo luận');
    expect(stripHeadingNumber('2.1. Mô hình')).toBe('Mô hình');
    expect(stripHeadingNumber('3.2.1 Kiểm định')).toBe('Kiểm định');
    expect(stripHeadingNumber('5) Kết luận')).toBe('Kết luận');
    expect(stripHeadingNumber('2019 là năm quan trọng')).toBe('2019 là năm quan trọng');
    expect(stripHeadingNumber('Giới thiệu')).toBe('Giới thiệu');
    expect(stripHeadingNumber('4.')).toBe('4.');
  });

  const doc = () => {
    const p = createEmptyPaper();
    p.metadata.title = 'T';
    p.sections = [
      { id: 'h1', type: 'h1', title: '5. Kết luận và hàm ý', content: '' },
      { id: 'h2', type: 'h2', title: '5.1. Hạn chế', content: '' },
    ];
    return p;
  };

  it('LaTeX and XML print unnumbered headings by default', () => {
    const tex = generateFullJournalLatex(doc());
    expect(tex).toContain('KẾT LUẬN VÀ HÀM Ý');
    expect(tex).not.toContain('5. KẾT LUẬN');
    expect(tex).toContain('{\\textbf{Hạn chế}}');
    expect(exportToJatsXml(doc())).toContain('<title>Kết luận và hàm ý</title>');
  });

  it('"keep section numbers" brings them back everywhere', () => {
    const settings = { ...DEFAULT_LAYOUT_SETTINGS, theme: { keepSectionNumbers: true } };
    expect(generateFullJournalLatex(doc(), settings)).toContain('5. KẾT LUẬN VÀ HÀM Ý');
    const p = doc();
    p.layoutSettings = settings;
    expect(exportToJatsXml(p)).toContain('<title>5. Kết luận và hàm ý</title>');
  });
});

describe('table body fill', () => {
  it('is white by default; old documents that explicitly had stripes keep them', () => {
    expect(resolveBodyFill({})).toBe('plain');
    expect(resolveBodyFill({ hasZebraStripes: false })).toBe('plain');
    expect(resolveBodyFill({ hasZebraStripes: true })).toBe('zebra');
    expect(resolveBodyFill({ bodyFill: 'shaded', hasZebraStripes: true })).toBe('shaded');
  });

  it('tints the right rows', () => {
    expect([0, 1, 2, 3].map((i) => rowIsTinted('plain', i))).toEqual([false, false, false, false]);
    expect([0, 1, 2, 3].map((i) => rowIsTinted('zebra', i))).toEqual([true, false, true, false]);
    expect([0, 1, 2, 3].map((i) => rowIsTinted('shaded', i))).toEqual([true, true, true, true]);
  });

  const withTable = (extra: Record<string, unknown>) => {
    const p = createEmptyPaper();
    p.metadata.title = 'T';
    const sec: PaperSection = {
      id: 't',
      type: 'table',
      content: '',
      table: { id: 't', num: 1, caption: 'C', headers: ['a', 'b'], rows: [['1', '2'], ['3', '4'], ['5', '6']], ...extra },
    };
    p.sections = [sec];
    return p;
  };
  const tinted = (tex: string) => (tex.match(/\\rowcolor\{tablezebracolor\}/g) || []).length;

  it('LaTeX output follows the option', () => {
    expect(tinted(generateFullJournalLatex(withTable({})))).toBe(0);
    expect(tinted(generateFullJournalLatex(withTable({ bodyFill: 'zebra' })))).toBe(2);
    expect(tinted(generateFullJournalLatex(withTable({ bodyFill: 'shaded' })))).toBe(3);
  });
});

describe('curly quotes', () => {
  it('declares curly quotes as Default class for xeCJK so they are not CJK glyphs', () => {
    const p = createEmptyPaper();
    p.metadata.title = 'T';
    const tex = generateFullJournalLatex(p);
    if (tex.includes(String.raw`\usepackage{xeCJK}`)) {
      expect(tex).toContain(String.raw`\xeCJKDeclareCharClass{Default}{"2018,"2019`);
    }
  });
});
