import { describe, it, expect } from 'vitest';
import JSZip from 'jszip';
import { createEmptyPaper, type CompletePaper } from '@/types/paper';
import { exportPaperToDocx } from '@/lib/docx-export';
import { latexToMathComponents } from '@/lib/docx-math';

async function documentXml(paper: CompletePaper): Promise<string> {
  const blob = await exportPaperToDocx(paper);
  const zip = await JSZip.loadAsync(await blob.arrayBuffer());
  return zip.file('word/document.xml')!.async('string');
}

function paper(): CompletePaper {
  const p = createEmptyPaper();
  p.metadata.title = 'Tiêu đề';
  p.sections = [
    { id: 'p', type: 'paragraph', content: 'Công thức nội dòng $x^2 + \\alpha_1$ trong câu.' },
    { id: 'e', type: 'equation', content: '', equation: { latex: '\\frac{a}{b} = \\sqrt{x} + \\sum_{i=1}^{n} x_i', numbered: true, num: 1 } },
    {
      id: 't',
      type: 'table',
      content: '',
      table: { id: 't', num: 1, caption: 'Cap', source: 'Nguồn: tác giả', headers: ['A', 'B'], rows: [['1', '2']] },
    },
  ];
  return p;
}

describe('DOCX export', () => {
  it('writes native Word equations (OMML) for block and inline formulas', async () => {
    const xml = await documentXml(paper());
    expect(xml).toContain('<m:oMath>');
    expect(xml).toContain('<m:f>'); // fraction
    expect(xml).toContain('<m:rad>'); // radical
    expect(xml).toContain('<m:nary>'); // sum
    expect(xml).toContain('<m:sSup>'); // inline x^2
    expect(xml).toContain('(1)'); // equation number
  });

  it('repeats the table header row and keeps rows unsplit', async () => {
    const xml = await documentXml(paper());
    expect(xml).toContain('<w:tblHeader');
    expect(xml).toContain('<w:cantSplit');
    expect(xml).toContain('Nguồn: tác giả');
  });

  it('honours the dynamic table colours', async () => {
    const p = paper();
    p.layoutSettings = { paperSize: 'custom', columnLayout: '2-column', theme: { tableHeaderColor: '#112233' } };
    expect(await documentXml(p)).toContain('w:fill="112233"');
  });

  it('lays the file out like the printed journal: pictures, 2 columns, page-1 header/footer, DOI QR', async () => {
    const p = paper();
    const png1x1 =
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    p.metadata.keywords = ['a', 'b.'];
    p.metadata.publication = { doi: '10.32508/vnuhcmj-ees.v10i1.850', firstPage: '1237' } as never;
    p.sections.push({ id: 'f', type: 'figure', content: '', figure: { id: 'f', num: 1, caption: 'Hình 1. Bản đồ', src: png1x1 } });
    const blob = await exportPaperToDocx(p, { loadImage: async (s) => (s.startsWith('data:') ? new Uint8Array(Buffer.from(s.split(',')[1], 'base64')) : null) });
    const zip = await JSZip.loadAsync(await blob.arrayBuffer());
    const xml = await zip.file('word/document.xml')!.async('string');
    expect(xml).toContain('<w:drawing'); // figure picture + QR
    expect(Object.keys(zip.files).filter((f) => f.startsWith('word/media/')).length).toBeGreaterThanOrEqual(2);
    expect(xml).toMatch(/<w:cols [^>]*w:num="2"/);
    expect(xml).toContain('<w:titlePg');
    expect(xml).toContain('w:start="1237"');
    expect(xml).not.toContain('contact@example.edu.vn');
    expect(xml).not.toContain('b..');
    const headers = Object.keys(zip.files).filter((f) => /word\/(header|footer)\d+\.xml/.test(f));
    expect(headers.length).toBeGreaterThanOrEqual(4);
  });

  it('keeps merged table cells (gridSpan / vMerge)', async () => {
    const p = createEmptyPaper();
    p.sections = [
      {
        id: 't',
        type: 'table',
        content: '',
        table: {
          id: 't', num: 1, caption: 'Bảng 1. X', headers: ['', '', 'Q / Có', 'Q / Không', 'Q / Có'], rows: [],
          headerRows: [[{ text: '', colSpan: 2, rowSpan: 2 }, { text: 'Quan trắc', colSpan: 3 }], [{ text: 'Có' }, { text: 'Không' }, { text: 'Có' }]],
          bodyRows: [[{ text: 'Dự báo', rowSpan: 2 }, { text: 'Có' }, { text: 'A' }, { text: 'B' }, { text: 'A' }], [{ text: 'Không' }, { text: 'C' }, { text: 'D' }, { text: 'C' }]],
        },
      },
    ];
    const xml = await documentXml(p);
    expect(xml).toContain('<w:gridSpan w:val="3"/>');
    expect(xml).toContain('<w:vMerge w:val="restart"/>');
  });

  it('latex parser never throws on malformed input', () => {
    for (const bad of ['\\frac{a}', '{{{', '^', '\\left(', '\\sqrt[3', '']) {
      expect(() => latexToMathComponents(bad)).not.toThrow();
    }
  });
});
