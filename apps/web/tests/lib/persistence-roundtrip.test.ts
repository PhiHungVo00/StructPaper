import { describe, it, expect } from 'vitest';
import { migrateV1toV2, adaptV2toV1 } from '@structpaper/doc-model';
import { createEmptyPaper, type CompletePaper } from '@/types/paper';

/** Documents are stored through v1 -> v2 (IndexedDB) -> v1; nothing the user typed may be lost. */
function roundTrip(p: CompletePaper): CompletePaper {
  return adaptV2toV1(migrateV1toV2(p as any) as any) as unknown as CompletePaper;
}

function sample(): CompletePaper {
  const p = createEmptyPaper('VNUHCM-HS');
  p.id = 'rt1';
  p.metadata.title = 'Bài kiểm tra lưu trữ';
  p.layoutSettings = {
    paperSize: 'custom',
    columnLayout: '2-column',
    theme: { titleColor: '#112233', margins: { left: 2.2 }, repeatTableHeader: false },
  };
  p.sections = [
    { id: 'h', type: 'h1', title: 'Mô hình', content: '' },
    { id: 'p', type: 'paragraph', content: 'Xem Phương trình (1) và Bảng 1 [1].' },
    { id: 'e1', type: 'equation', content: '', equation: { latex: '\\frac{a}{b} = \\sum_{i=1}^{n} x_i', numbered: true, num: 1 } },
    { id: 'e2', type: 'equation', content: '', equation: { latex: 'y = x', numbered: false } },
    { id: 'e3', type: 'equation', content: '', equation: { latex: 'z = 1', numbered: true, num: 2 } },
    {
      id: 't',
      type: 'table',
      content: '',
      table: { id: 't', num: 1, caption: 'Bảng đo', source: 'Nguồn: Kết quả của nhóm tác giả', headers: ['A', 'B'], rows: [['1', '2']] },
    },
  ];
  p.references = [{ id: 1, raw: 'Tác giả. 2020.', isCited: true, citationCount: 1 }];
  return p;
}

describe('storage round-trip (v1 -> v2 -> v1)', () => {
  it('keeps equations as equation blocks with LaTeX, numbering flag and order', () => {
    const out = roundTrip(sample());
    const eqs = out.sections.filter((s) => s.type === 'equation');
    expect(eqs.map((s) => s.equation?.latex)).toEqual(['\\frac{a}{b} = \\sum_{i=1}^{n} x_i', 'y = x', 'z = 1']);
    expect(eqs.map((s) => s.equation?.numbered)).toEqual([true, false, true]);
    // numbers are re-derived from position: unnumbered ones are skipped
    expect(eqs.map((s) => s.equation?.num)).toEqual([1, undefined, 2]);
  });

  it('keeps the table source line', () => {
    const out = roundTrip(sample());
    expect(out.sections.find((s) => s.type === 'table')?.table?.source).toBe('Nguồn: Kết quả của nhóm tác giả');
  });

  it('keeps dynamic theme / margin settings', () => {
    const out = roundTrip(sample());
    expect(out.layoutSettings?.theme).toEqual({ titleColor: '#112233', margins: { left: 2.2 }, repeatTableHeader: false });
  });
});

describe('publication info round-trip', () => {
  it('keeps "never entered" (absent) vs "cleared" ("") vs a value', () => {
    const p = sample();
    (p.metadata as any).publication = { volume: '10', issue: '', articleId: '1750' };
    const out = roundTrip(p);
    expect((out.metadata as any).publication).toEqual({ volume: '10', issue: '', articleId: '1750' });
  });
});
