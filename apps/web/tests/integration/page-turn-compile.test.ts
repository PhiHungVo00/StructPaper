/**
 * Opt-in (RUN_TEX_E2E=1, PDFTOTEXT=path to poppler's pdftotext if another one is first on PATH; needs the Spring API on :8080 with XeLaTeX and poppler's pdfinfo/pdftotext on PATH):
 * compiles a real paper, turns a page, turns it back, and compares the PDFs. Unit tests cannot see a blank page
 * or a lost column, only a real compile can.
 */
import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import type { CompletePaper } from '@/types/paper';
import { exportToLatex } from '@/lib/latex-template';
import { SAMPLE_PAPER_HS722 } from '@/lib/sample-papers';
import { derivePageGroups } from '@/lib/editor/page-groups';
import { rotatePageAt } from '@/lib/editor/page-turn';

const RUN = process.env.RUN_TEX_E2E === '1';
const defaults = { oneColumn: false, landscape: false };

interface Compiled {
  pages: { w: number; h: number; text: string; used: number; xmin: number }[];
}

async function compile(paper: CompletePaper): Promise<Compiled> {
  const res = await fetch('http://localhost:8080/api/v1/compile/latex', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ texContent: exportToLatex(paper), jobName: 'article', autoFontFallback: true, images: {} }),
  });
  if (!res.ok) throw new Error(`compile failed: ${res.status} ${(await res.text()).slice(0, 300)}`);
  const dir = mkdtempSync(path.join(tmpdir(), 'turn-'));
  const pdf = path.join(dir, 'a.pdf');
  writeFileSync(pdf, Buffer.from(await res.arrayBuffer()));
  const info = execFileSync('pdfinfo', ['-f', '1', '-l', '200', pdf]).toString();
  const sizes = [...info.matchAll(/Page\s+(\d+) size:\s+([\d.]+) x ([\d.]+)/g)].map((m) => {
    const rot = Number((info.match(new RegExp('Page\\s+' + m[1] + ' rot:\\s+(\\d+)')) || [])[1] || 0);
    const w = Number(m[2]);
    const h = Number(m[3]);
    return rot === 90 || rot === 270 ? `${h} x ${w}` : `${w} x ${h}`;
  });
  const html = path.join(dir, 'a.html');
  execFileSync(process.env.PDFTOTEXT || 'pdftotext', ['-bbox', pdf, html]);
  const bbox = readFileSync(html, 'utf-8');
  const pages = sizes.map((line, i) => {
    const m = line.match(/([\d.]+) x ([\d.]+)/)!;
    const w = Number(m[1]);
    const h = Number(m[2]);
    const chunk = bbox.split('<page ')[i + 1] || '';
    const ys = [...chunk.matchAll(/yMax="([\d.]+)"/g)].map((x) => Number(x[1])).filter((y) => y < h * 0.91);
    const words = [...chunk.matchAll(/>([^<]+)<\/word>/g)].map((x) => x[1]).join(' ');
    const xs = [...chunk.matchAll(/xMin="([\d.]+)"/g)].map((x) => Number(x[1]));
    return { w, h, text: words, used: ys.length ? Math.max(...ys) / h : 0, xmin: xs.length ? Math.min(...xs) : 0 };
  });
  return { pages };
}

describe.skipIf(!RUN)('turning a page, on a real compile', () => {
  const paper = SAMPLE_PAPER_HS722;
  const body = paper.sections.filter((s) => s.type !== 'citation');
  const anchor = body[Math.floor(body.length / 3)].id;
  const ai = paper.sections.findIndex((s) => s.id === anchor);
  const next = paper.sections[ai + 2].id;

  it('page count, page sizes and text come back exactly after turning a page and turning it back', async () => {
    const original = await compile(paper);
    const turnedSections = rotatePageAt(paper.sections, anchor, next, 'landscape', defaults);
    expect(derivePageGroups(turnedSections, defaults).length).toBeGreaterThan(1);
    const turned = await compile({ ...paper, sections: turnedSections });
    expect(turned.pages.some((p) => p.w > p.h)).toBe(true);

    const backSections = rotatePageAt(turnedSections, anchor, next, 'portrait', defaults);
    expect(backSections).toEqual(paper.sections);
    const back = await compile({ ...paper, sections: backSections });

    expect(back.pages.length).toBe(original.pages.length);
    expect(back.pages.map((p) => [p.w, p.h])).toEqual(original.pages.map((p) => [p.w, p.h]));
    expect(back.pages.map((p) => p.text)).toEqual(original.pages.map((p) => p.text));
  }, 240_000);

  it('a turned page keeps the two-column body and leaves no nearly empty page behind it', async () => {
    const turnedSections = rotatePageAt(paper.sections, anchor, next, 'landscape', defaults);
    const turned = await compile({ ...paper, sections: turnedSections });
    const original = await compile(paper);
    // the extra pages caused by the turn are limited to the turned range (one break before, one after)
    expect(turned.pages.length - original.pages.length).toBeLessThanOrEqual(2);
    // body pages keep their left column: no portrait page (other than the first and the English page) starts far from the left margin
    const worstLeft = (c: Compiled) => Math.max(...c.pages.slice(1, -1).filter((p) => p.w < p.h).map((p) => p.xmin / p.w));
    expect(worstLeft(turned)).toBeLessThanOrEqual(worstLeft(original) + 0.02);
  }, 240_000);
});
