/**
 * Pre-fetch every TeX package StructPaper needs, so the user's first PDF export is fast and works offline.
 *
 *   pnpm warmup:latex            (xelatex if installed, otherwise the bundled bin/tectonic)
 *
 * It compiles a representative document (two-column body, long 1-column / 2-column / landscape tables,
 * equations, English closing page). MiKTeX installs missing packages on demand and tectonic downloads
 * its bundle files into a cache on first use; run this once at install time / in CI to fill that cache.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { createEmptyPaper } from '../apps/web/src/types/paper';
import { generateFullJournalLatex } from '../apps/web/src/lib/latex-template';

const root = path.resolve(__dirname, '..');
const rows = (n: number) => Array.from({ length: n }, (_, i) => [`a${i}`, `Thang đo ${i}`, `0,${800 + i}`, 'Đạt']);
const table = (num: number, extra: Record<string, unknown>) => ({
  id: `t${num}`,
  type: 'table' as const,
  content: '',
  table: { id: `t${num}`, num, caption: `Bảng ${num}: Mẫu`, source: 'Nguồn: Tác giả', headers: ['A', 'B', 'C', 'D'], rows: rows(40), ...extra },
});

const paper = createEmptyPaper('VNUHCM-EBL');
paper.metadata.title = 'Warm-up';
paper.metadata.titleEn = 'Warm-up';
paper.metadata.abstract = 'Tóm tắt.';
paper.metadata.abstractEn = 'Abstract.';
paper.sections = [
  { id: 'h', type: 'h1', title: 'Mục', content: '' },
  { id: 'p', type: 'paragraph', content: 'Văn bản mẫu $x_i^2$ [1].' },
  { id: 'e', type: 'equation', content: '', equation: { latex: '\\frac{a}{b}=\\sum_{i=1}^{n}x_i', numbered: true, num: 1 } },
  table(1, { columnSpan: '1-column', isFullWidth: false }),
  table(2, { columnSpan: '2-column', isFullWidth: true }),
  table(3, { isRotated: true, columnSpan: '2-column', isFullWidth: true }),
];
paper.references = [{ id: 1, raw: 'Ref.', isCited: true, citationCount: 1 }];

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'structpaper-warmup-'));
const tex = path.join(dir, 'warmup.tex');
fs.writeFileSync(tex, generateFullJournalLatex(paper), 'utf8');

const has = (cmd: string) => spawnSync(cmd, ['--version'], { encoding: 'utf8' }).status === 0;
const tectonic = path.join(root, 'bin', process.platform === 'win32' ? 'tectonic.exe' : 'tectonic');
const jobs: Array<[string, string[]]> = has('xelatex')
  ? [['xelatex', ['-interaction=nonstopmode', '-halt-on-error', '-output-directory', dir, tex]]]
  : fs.existsSync(tectonic)
    ? [[tectonic, [tex, '-o', dir, '--untrusted']]]
    : [];
if (!jobs.length) {
  console.error('No TeX engine found (xelatex or bin/tectonic).');
  process.exit(2);
}

const started = Date.now();
for (const pass of [1, 2]) {
  const [cmd, args] = jobs[0];
  const res = spawnSync(cmd, args, { encoding: 'utf8', cwd: dir, maxBuffer: 64 * 1024 * 1024 });
  console.log(`pass ${pass}: ${res.status === 0 ? 'ok' : 'FAILED'} (${((Date.now() - started) / 1000).toFixed(1)}s elapsed)`);
  if (res.status !== 0) {
    console.error((res.stdout || '').split('\n').filter((l) => l.startsWith('!')).slice(0, 5).join('\n') || res.stderr);
    process.exit(1);
  }
}
console.log(`PDF written: ${path.join(dir, 'warmup.pdf')}`);
