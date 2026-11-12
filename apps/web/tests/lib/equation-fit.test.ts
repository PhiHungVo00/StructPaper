import { describe, it, expect } from 'vitest';
import { createEmptyPaper, normalizeCompletePaper, type CompletePaper, type PaperSection } from '@/types/paper';
import { mathWidthEm } from '@/lib/latex-math-width';
import { equationToLatex } from '@/lib/latex-equation';
import { exportToLatex } from '@/lib/latex-template';

const LONG = String.raw`y_{i,t}=\beta_1+\beta_2 a_{i,t}+\beta_3 b_{i,t}+\beta_4 c_{i,t}+\beta_5 d_{i,t}+\beta_6 e_{i,t}+\beta_7 f_{i,t}+\beta_8 g_{i,t}+\epsilon_{i,t}`;
const eq = (id: string, latex = LONG): PaperSection => ({ id, type: 'equation', content: '', equation: { latex, numbered: true, num: 1 } });
const para = (id: string): PaperSection => ({ id, type: 'paragraph', content: `Đoạn ${id}` });

function paperWith(sections: PaperSection[]): CompletePaper {
  const p = createEmptyPaper('VNUHCM-STD');
  p.metadata.title = 'Thử';
  p.sections = sections;
  return normalizeCompletePaper(p);
}

describe('width estimate', () => {
  it('counts italic capitals wider than lower-case letters and the space around operators', () => {
    expect(mathWidthEm('HDI')).toBeGreaterThan(mathWidthEm('hdi') * 1.3);
    expect(mathWidthEm('a+b')).toBeGreaterThan(mathWidthEm('ab') + 0.8);
  });

  it('counts a subscript smaller than the same text on the line', () => {
    expect(mathWidthEm('x_{i,t}')).toBeLessThan(mathWidthEm('x') + mathWidthEm('i,t'));
  });

  it('counts a fraction as its wider half, not the sum', () => {
    expect(mathWidthEm(String.raw`\frac{a+b+c}{d}`)).toBeLessThan(mathWidthEm('a+b+c') + 1);
  });
});

describe('formula fits the column', () => {
  it('leaves a short formula alone', () => {
    expect(equationToLatex(eq('s', 'E=mc^2'), 0, false)).not.toContain(String.raw`\fiteq`);
  });

  it('breaks a long formula and gives it the shrink-to-fit box; the number stays outside the box', () => {
    const tex = equationToLatex(eq('l'), 0, false);
    expect(tex).toContain(String.raw`\fiteq{\dimexpr\linewidth-2.6em\relax}{`);
    expect(tex).toContain(String.raw`\begin{aligned}`);
    expect(tex).toMatch(/\}\\tag\{1\}/);
  });

  it('every line of a broken formula, with its alignment indent, stays within the column budget', () => {
    const tex = equationToLatex(eq('l'), 0, false);
    const lines = tex.match(/\\begin\{aligned\}([\s\S]*?)\\end\{aligned\}/)![1].split('\\\\');
    expect(lines.length).toBeGreaterThan(1);
    lines.forEach((l, i) => expect(mathWidthEm(l.replace(/&|\\quad/g, '')) + (i ? 3 : 0)).toBeLessThanOrEqual(23));
  });

  it('emits the fit macro once, before the first formula, and only when one is needed', () => {
    const withLong = exportToLatex(paperWith([para('a'), eq('l'), eq('m')]));
    expect(withLong.match(/\\newcommand\{\\fiteq\}/g)).toHaveLength(1);
    expect(withLong.indexOf(String.raw`\newcommand{\fiteq}`)).toBeLessThan(withLong.indexOf(String.raw`\fiteq{\dimexpr`));
    expect(exportToLatex(paperWith([para('a'), eq('s', 'E=mc^2')]))).not.toContain(String.raw`\fiteq`);
  });
});
