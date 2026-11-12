import { describe, it, expect, beforeAll } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import type { CompletePaper } from '@/types/paper';
import { parseDocxFile } from '@/lib/docx-parser';
import { breakLongEquation } from '@/lib/latex-equation-break';
import { mathWidthEm } from '@/lib/latex-math-width';
import { extractListHeadings } from '@/lib/docx-headings';
import { exportToLatex } from '@/lib/latex-template';
import { normalizeCompletePaper } from '@/types/paper';

const FIXTURE = path.resolve(__dirname, '../../../../fixtures/golden/templates/Bài mẫu template tiếng Việt.docx');

describe('real file: journal Vietnamese template sample', () => {
  let paper: CompletePaper;
  beforeAll(async () => {
    const buf = fs.readFileSync(FIXTURE);
    paper = await parseDocxFile(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer, 'vi.docx');
  }, 60_000);

  it('reads every date the file states, including "Ngày sửa bài"', () => {
    expect(paper.metadata.dates).toMatchObject({ received: '08-09-2025', revised: '20-03-2026', accepted: '21-05-2026' });
    // "Ngày xuất bản trực tuyến:" is empty in the file: it stays empty (printed as "?"), it is not invented
    expect(paper.metadata.dates.published).toBe('');
  });

  it('turns the bold-italic lines into sub-headings', () => {
    const h2 = paper.sections.filter((s) => s.type === 'h2').map((s) => s.title);
    expect(h2).toEqual(
      expect.arrayContaining([
        'Mô hình nghiên cứu và các biến trong mô hình',
        'Phân tích hồi quy và biện luận kết quả',
        'Đối với nhóm quốc gia thu nhập cao',
        'Đối với nhóm quốc gia thu nhập thấp',
      ])
    );
    expect(paper.sections.some((s) => s.type === 'paragraph' && s.content === 'Mô hình nghiên cứu và các biến trong mô hình')).toBe(false);
  });

  it('breaks the 7-term regression formula so it fits the two-column page', () => {
    const tex = exportToLatex(normalizeCompletePaper(paper));
    const eq = tex.match(/\\begin\{equation\}([\s\S]*?)\\end\{equation\}/)![1];
    expect(eq).toContain('\\begin{aligned}');
    const lines = eq.match(/\\begin\{aligned\}([\s\S]*?)\\end\{aligned\}/)![1].split('\\\\');
    expect(lines.length).toBeGreaterThan(1);
    for (const l of lines) expect(mathWidthEm(l.replace(/&|\\quad/g, ''))).toBeLessThanOrEqual(23);
    expect(eq).toContain('\\tag{1}');
  });
});

describe('breakLongEquation', () => {
  const long = String.raw`y_{i,t}=\beta_1+\beta_2 a_{i,t}+\beta_3 b_{i,t}+\beta_4 c_{i,t}+\beta_5 d_{i,t}+\beta_6 e_{i,t}+\epsilon_{i,t}`;

  it('keeps a short formula as it is', () => {
    expect(breakLongEquation('a=b+c', 21)).toBe('a=b+c');
  });

  it('splits at top-level operators and loses nothing', () => {
    const out = breakLongEquation(long, 12);
    expect(out.startsWith('\\begin{aligned}')).toBe(true);
    const flat = out.replace(/\\begin\{aligned\}|\\end\{aligned\}|\\\\|&|\\quad|\s/g, '');
    expect(flat).toBe(long.replace(/\s/g, ''));
    expect(out).toContain('y_{i,t} &=');
  });

  it('does not split inside braces, fractions or \\left…\\right', () => {
    const f = String.raw`x=\frac{a+b+c+d+e+f+g}{h+i+j+k+l+m+n}+\left(p+q+r+s+t+u\right)+z`;
    const out = breakLongEquation(f, 8);
    for (const line of out.split('\\\\')) {
      expect((line.match(/\\left/g) || []).length).toBe((line.match(/\\right/g) || []).length);
      expect((line.match(/\{/g) || []).length).toBe((line.match(/\}/g) || []).length);
    }
  });

  it('leaves formulas that already have their own structure alone', () => {
    const own = String.raw`\begin{cases}a+b+c+d+e+f+g+h+i+j+k+l+m+n+o+p+q+r+s+t+u+v+w \\ x\end{cases}`;
    expect(breakLongEquation(own, 10)).toBe(own);
  });

  it('does not treat a sign after an operator or a script as a break point', () => {
    const out = breakLongEquation(String.raw`a=b^{-1}+c_{-2}+-d+e+f+g+h+i+j`, 4);
    for (const line of out.split('\\\\')) expect((line.match(/\{/g) || []).length).toBe((line.match(/\}/g) || []).length);
  });
});

describe('extractListHeadings', () => {
  const para = (text: string, rpr: string, ppr = '') => `<w:p><w:pPr>${ppr}</w:pPr><w:r><w:rPr>${rpr}</w:rPr><w:t>${text}</w:t></w:r></w:p>`;

  it('takes whole-line bold italic as h2, but not plain bold, captions or table cells', () => {
    const xml =
      para('Mô hình nghiên cứu', '<w:b/><w:i/>') +
      para('Chỉ in đậm', '<w:b/>') +
      para('Bảng 1 Số liệu', '<w:b/><w:i/>') +
      '<w:tbl><w:tr><w:tc>' + para('Biến phụ thuộc', '<w:b/><w:i/>') + '</w:tc></w:tr></w:tbl>';
    const m = extractListHeadings(xml);
    expect([...m.entries()]).toEqual([['Mô hình nghiên cứu', 1]]);
  });
});

describe('empty header cells', () => {
  it('keeps the empty corner cell of Bảng 4/5 empty instead of inventing "Cột 1"', async () => {
    const buf = fs.readFileSync(FIXTURE);
    const p = await parseDocxFile(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer, 'vi.docx');
    const t4 = p.sections.find((s) => s.type === 'table' && s.table!.num === 4)!.table!;
    expect(t4.headers[0]).toBe('');
    expect(p.sections.filter((s) => s.type === 'table').some((s) => s.table!.headers.some((h) => /^Cột \d+$/.test(h)))).toBe(false);
  }, 60_000);
});

describe('back-matter "none" marks', () => {
  it('keeps the "-" the file writes under Kinh phí / Lời cảm ơn instead of leaving empty headings', async () => {
    const buf = fs.readFileSync(FIXTURE);
    const p = await parseDocxFile(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer, 'vi.docx');
    for (const title of ['Chấp thuận về đạo đức nghiên cứu', 'Lời cảm ơn', 'Kinh phí', 'Tính khả dụng của dữ liệu']) {
      const i = p.sections.findIndex((s) => s.type === 'h1' && s.title === title);
      expect(i, title).toBeGreaterThanOrEqual(0);
      expect(p.sections[i + 1].content, title).toBe('-');
    }
  }, 60_000);
});

describe('nothing from the template body or English block is lost', () => {
  it('keeps the "Nguồn dữ liệu" sub-heading (a bold-italic line starting with "Nguồn")', async () => {
    const buf = fs.readFileSync(FIXTURE);
    const p = await parseDocxFile(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer, 'vi.docx');
    const i = p.sections.findIndex((s) => s.type === 'h2' && s.title === 'Nguồn dữ liệu');
    expect(i).toBeGreaterThan(0);
    expect(p.sections[i - 1].content).toMatch(/^Nghiên cứu sử dụng dữ liệu|Để xác định mô hình/);
  }, 60_000);

  it('reads the English affiliation written on the same line as the English authors', async () => {
    const buf = fs.readFileSync(FIXTURE);
    const p = await parseDocxFile(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer, 'vi.docx');
    expect(p.metadata.affiliations[0].nameEn).toMatch(/^University of Economics and Law, Vietnam National University/);
    expect(p.metadata.affiliations[0].nameEn).not.toMatch(/Pham My Duyen/);
  }, 60_000);

  it('"Nguồn: …" and "Hình 1 …" bold-italic lines are still not headings', () => {
    const para = (t: string) => `<w:p><w:r><w:rPr><w:b/><w:i/></w:rPr><w:t>${t}</w:t></w:r></w:p>`;
    const m = extractListHeadings(para('Nguồn dữ liệu') + para('Nguồn: Tác giả tổng hợp') + para('Hình 1 Mô hình') + para('Chú thích: ghi chú'));
    expect([...m.keys()]).toEqual(['Nguồn dữ liệu']);
  });
});
