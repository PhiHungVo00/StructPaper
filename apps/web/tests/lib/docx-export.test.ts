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

  it('latex parser never throws on malformed input', () => {
    for (const bad of ['\\frac{a}', '{{{', '^', '\\left(', '\\sqrt[3', '']) {
      expect(() => latexToMathComponents(bad)).not.toThrow();
    }
  });
});
