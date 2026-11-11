import { describe, it, expect } from 'vitest';
import { ommlToLatex } from '@/lib/omml';
import { extractDisplayEquations, insertEquations } from '@/lib/docx-equations';
import type { PaperSection } from '@/types/paper';

const run = (t: string, plain = false) =>
  `<m:r>${plain ? '<m:rPr><m:sty m:val="p"/></m:rPr>' : ''}<w:rPr><w:i/></w:rPr><m:t>${t}</m:t></m:r>`;
const sub = (base: string, s: string) =>
  `<m:sSub><m:sSubPr><m:ctrlPr/></m:sSubPr><m:e>${run(base)}</m:e><m:sub>${run(s)}</m:sub></m:sSub>`;

describe('ommlToLatex', () => {
  it('keeps text nested in subscripts (the old regex converter dropped it)', () => {
    const omml = `<m:oMathPara><m:oMath>${run('SDG')}${run('=')}${run('α')}${run('+')}${sub('β', '1')}${run('HDI')}</m:oMath></m:oMathPara>`;
    expect(ommlToLatex(omml)).toBe('SDG=\\alpha +\\beta_1HDI');
  });

  it('converts fractions, roots and scripts', () => {
    const frac = `<m:oMath><m:f><m:num>${run('a')}</m:num><m:den>${run('b')}</m:den></m:f></m:oMath>`;
    expect(ommlToLatex(frac)).toBe('\\frac{a}{b}');
    const rad = `<m:oMath><m:rad><m:radPr><m:degHide m:val="1"/></m:radPr><m:deg/><m:e>${run('x')}</m:e></m:rad></m:oMath>`;
    expect(ommlToLatex(rad)).toBe('\\sqrt{x}');
    const sup = `<m:oMath><m:sSup><m:e>${run('x')}</m:e><m:sup>${run('2')}</m:sup></m:sSup></m:oMath>`;
    expect(ommlToLatex(sup)).toBe('x^2');
  });

  it('converts n-ary operators with limits', () => {
    const omml = `<m:oMath><m:nary><m:naryPr><m:chr m:val="∑"/></m:naryPr><m:sub>${run('i=1')}</m:sub><m:sup>${run('n')}</m:sup><m:e>${sub('x', 'i')}</m:e></m:nary></m:oMath>`;
    expect(ommlToLatex(omml)).toBe('\\sum_{i=1}^n x_i');
  });

  it('converts delimiters, functions and matrices', () => {
    const d = `<m:oMath><m:d><m:dPr><m:begChr m:val="["/><m:endChr m:val="]"/></m:dPr><m:e>${run('x')}</m:e></m:d></m:oMath>`;
    expect(ommlToLatex(d)).toBe('\\left[ x \\right]');
    const fn = `<m:oMath><m:func><m:fName>${run('sin', true)}</m:fName><m:e>${run('x')}</m:e></m:func></m:oMath>`;
    expect(ommlToLatex(fn)).toContain('\\sin');
    const mat = `<m:oMath><m:m><m:mr><m:e>${run('a')}</m:e><m:e>${run('b')}</m:e></m:mr><m:mr><m:e>${run('c')}</m:e><m:e>${run('d')}</m:e></m:mr></m:m></m:oMath>`;
    expect(ommlToLatex(mat)).toBe('\\begin{matrix} a & b \\\\ c & d \\end{matrix}');
  });

  it('escapes LaTeX specials and tolerates garbage', () => {
    expect(ommlToLatex(`<m:oMath>${run('50%')}</m:oMath>`)).toBe('50\\%');
    expect(ommlToLatex('')).toBe('');
    expect(() => ommlToLatex('<m:oMath><m:f><m:num>')).not.toThrow();
  });
});

describe('equation recovery from document.xml', () => {
  const para = (text: string, math = '') => ({
    text,
    hasMath: Boolean(math),
    rawXml: math ? `<m:oMathPara><m:oMath>${math}</m:oMath></m:oMathPara>` : '',
  });

  it('extracts display equations with the preceding paragraph as anchor', () => {
    const eqs = extractDisplayEquations([
      para('Mô hình nghiên cứu được xác định như sau'),
      para('', run('y') + run('=') + run('x')),
      para('Trong đó: y là biến phụ thuộc'),
    ]);
    expect(eqs).toHaveLength(1);
    expect(eqs[0].latex).toBe('y=x');
    expect(eqs[0].prevText).toBe('Mô hình nghiên cứu được xác định như sau');
  });

  it('inserts numbered equation blocks after the anchor, keeping order', () => {
    const sections: PaperSection[] = [
      { id: '1', type: 'paragraph', content: 'Mô hình nghiên cứu được xác định như sau' },
      { id: '2', type: 'paragraph', content: 'Trong đó: y là biến phụ thuộc' },
    ];
    const res = insertEquations(sections, [
      { latex: 'y=x', omml: '', prevText: 'Mô hình nghiên cứu được xác định như sau' },
      { latex: 'z=1', omml: '', prevText: 'Trong đó: y là biến phụ thuộc' },
    ]);
    expect(res.placed).toBe(2);
    expect(res.sections.map((s) => s.type)).toEqual(['paragraph', 'equation', 'paragraph', 'equation']);
    expect(res.sections.filter((s) => s.type === 'equation').map((s) => s.equation!.num)).toEqual([1, 2]);
  });

  it('does not misplace an equation whose anchor cannot be found', () => {
    const res = insertEquations([{ id: '1', type: 'paragraph', content: 'khác hẳn' }], [
      { latex: 'a', omml: '', prevText: 'đoạn không tồn tại trong bài' },
    ]);
    expect(res.unplaced).toBe(1);
    expect(res.sections).toHaveLength(1);
  });
});
