import { describe, it, expect } from 'vitest';
import { createEmptyPaper, DEFAULT_LAYOUT_SETTINGS, type CompletePaper } from '@/types/paper';
import { generateFullJournalLatex, escapeLatex } from '@/lib/latex-template';
import { sanitizeMathForLatex } from '@/lib/math-text';

function paperWithTable(rows: number): CompletePaper {
  const p = createEmptyPaper();
  p.metadata.title = 'Tiêu đề';
  p.sections = [
    { id: 'h', type: 'h1', title: 'Kết quả', content: '' },
    {
      id: 't',
      type: 'table',
      content: '',
      table: {
        id: 't',
        num: 1,
        caption: 'Bảng dài',
        source: 'Nguồn: Kết quả của nhóm tác giả',
        headers: ['Cột A', 'Cột B'],
        rows: Array.from({ length: rows }, (_, i) => [`a${i}`, `b${i}`]),
      },
    },
  ];
  return p;
}

describe('LaTeX table export', () => {
  it('keeps short tables as floating tabulary', () => {
    const tex = generateFullJournalLatex(paperWithTable(3));
    expect(tex).toContain('\\begin{tabulary}');
    expect(tex).not.toContain('\\begin{supertabular}');
  });

  it('typesets long tables as breakable supertabular with a repeated header row', () => {
    const tex = generateFullJournalLatex(paperWithTable(40));
    expect(tex).toContain('\\begin{supertabular}');
    expect(tex).toContain('\\tablehead{');
    expect(tex).toContain('\\tablefirsthead{');
    expect(tex).not.toContain('\\begin{tabulary}');
    expect(tex).toContain('Nguồn: Kết quả của nhóm tác giả');
  });

  it('can disable header repetition and move the long-table threshold', () => {
    const p = paperWithTable(5);
    const settings = { ...DEFAULT_LAYOUT_SETTINGS, theme: { longTableRowThreshold: 3, repeatTableHeader: false } };
    const tex = generateFullJournalLatex(p, settings);
    expect(tex).toContain('\\begin{supertabular}');
    expect(tex).toContain('\\tablefirsthead{');
    expect(tex).not.toContain('\\tablehead{');
  });
});

describe('LaTeX theme / margins', () => {
  it('uses dynamic colours instead of hard-coded ones', () => {
    const p = paperWithTable(2);
    const tex = generateFullJournalLatex(p, {
      ...DEFAULT_LAYOUT_SETTINGS,
      theme: { titleColor: '#FF0000', tableHeaderColor: '#112233', tableZebraColor: '#445566' },
    });
    expect(tex).toContain('\\definecolor{titlecolor}{RGB}{255, 0, 0}');
    expect(tex).toContain('\\definecolor{tableheadrcolor}{RGB}{17, 34, 51}');
    expect(tex).toContain('\\definecolor{tablezebracolor}{RGB}{68, 85, 102}');
  });

  it('applies configurable margins to the geometry', () => {
    const tex = generateFullJournalLatex(paperWithTable(2), {
      ...DEFAULT_LAYOUT_SETTINGS,
      theme: { margins: { left: 2.5, right: 2, top: 3, bottom: 2.8 } },
    });
    expect(tex).toContain('left=2.5cm,headsep=.2cm,right=2cm,top=3cm,bottom=2.8cm]');
    expect(tex).toContain('top=3cm}');
  });

  it('emits custom fonts only when they differ from defaults', () => {
    const base = generateFullJournalLatex(paperWithTable(2));
    expect(base).not.toContain('\\IfFontExistsTF{Georgia}');
    const tex = generateFullJournalLatex(paperWithTable(2), {
      ...DEFAULT_LAYOUT_SETTINGS,
      theme: { bodyFont: 'Georgia' },
    });
    expect(tex).toContain('\\IfFontExistsTF{Georgia}{\\setmainfont{Georgia}}{}');
  });
});

describe('LaTeX equations', () => {
  it('numbered equation uses the equation environment with a label', () => {
    const p = createEmptyPaper();
    p.sections = [
      { id: 'e', type: 'equation', content: '', equation: { latex: 'E = mc^2', numbered: true, num: 1 } },
    ];
    const tex = generateFullJournalLatex(p);
    expect(tex).toContain('\\begin{equation}\nE = mc^2\n\\label{eq:1}\n\\end{equation}');
  });

  it('unnumbered equation uses equation*', () => {
    const p = createEmptyPaper();
    p.sections = [{ id: 'e', type: 'equation', content: '', equation: { latex: 'a=b', numbered: false } }];
    expect(generateFullJournalLatex(p)).toContain('\\begin{equation*}\na=b\n\\end{equation*}');
  });

  it('keeps inline and display math in paragraphs intact (regression: placeholder was escaped)', () => {
    expect(escapeLatex('giá trị $x_1^2$ và 50% tăng')).toBe('giá trị $x_1^2$ và 50\\% tăng');
    expect(escapeLatex('$$a_b = $1$$')).toBe('$$a_b = $1$$');
    expect(escapeLatex('a_b $E=mc^2$')).toBe('a\\_b $E=mc^2$');
  });

  it('strips dangerous primitives from formulas', () => {
    expect(sanitizeMathForLatex('x \\end{equation} \\input{/etc/passwd} \\write18{rm}')).not.toMatch(/\\(end|input|write)/);
  });
});
