import { describe, it, expect, vi } from 'vitest';
import { createEmptyPaper, type CompletePaper } from '@/types/paper';
import { runBatchImport, retryFailed } from '@/lib/batch-import/run-batch';
import { safeFileName } from '@/lib/batch-import/zip-pdfs';
import { referencedImages } from '@/lib/batch-import/default-deps';
import type { BatchDeps } from '@/lib/batch-import/types';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const file = (name: string) => new File([new Uint8Array(4)], name);
const journal = { journalId: 'VNUHCM-HS', journalName: 'HS', journalAbbv: 'HS' };

function deps(over: Partial<BatchDeps> & { failCompile?: string[]; titles?: Record<string, string> } = {}): BatchDeps {
  return {
    async parse(f) {
      await sleep(3);
      const p = createEmptyPaper();
      p.metadata.title = over.titles?.[f.name] ?? f.name.replace(/\.docx$/i, '');
      return p;
    },
    existingTitles: async () => [],
    save: async () => true,
    check: () => ({ errors: 0, warnings: 0 }),
    async compile(p, signal) {
      await sleep(10);
      if (signal.aborted) throw Object.assign(new Error('abort'), { name: 'AbortError' });
      if (over.failCompile?.includes(p.metadata.title)) throw new Error('XeLaTeX lỗi');
      return { blob: new Blob(['pdf']), ms: 5 };
    },
    ...over,
  };
}

describe('runBatchImport robustness (found by the independent review)', () => {
  it('a save that returns false is an error and is never typeset', async () => {
    const compile = vi.fn();
    const out = await runBatchImport({ files: [file('a.docx')], journal, deps: deps({ save: async () => false, compile }) });
    expect(out[0]).toMatchObject({ stage: 'error', error: 'Không lưu được bài báo' });
    expect(compile).not.toHaveBeenCalled();
  });

  it('cancelling frees a parse that never settles', async () => {
    const ac = new AbortController();
    const run = runBatchImport({ files: [file('a.docx')], journal, deps: deps({ parse: () => new Promise(() => {}) }), signal: ac.signal });
    await sleep(10);
    ac.abort();
    expect((await run)[0].stage).toBe('cancelled');
  });

  it('cancelling frees a save that never settles and reports no paper', async () => {
    const ac = new AbortController();
    const run = runBatchImport({ files: [file('a.docx')], journal, deps: deps({ save: () => new Promise(() => {}) }), signal: ac.signal });
    await sleep(25);
    ac.abort();
    const out = await run;
    expect(out[0].stage).toBe('cancelled');
    expect(out[0].paperId).toBeUndefined();
  });

  it('a push or archive that throws synchronously cannot break the run or look like a PDF failure', async () => {
    const boom = () => {
      throw new Error('sync boom');
    };
    const out = await runBatchImport({ files: [file('a.docx')], journal, deps: deps({ push: boom as any, archive: boom as any }) });
    expect(out[0].stage).toBe('done');
    expect(out[0].compileError).toBeUndefined();
    expect(out[0].pdf).toBeDefined();
  });

  it('archives the PDF only after the server copy of the paper exists', async () => {
    const order: string[] = [];
    let release!: () => void;
    const gate = new Promise<void>((r) => (release = r));
    const run = runBatchImport({
      files: [file('a.docx')],
      journal,
      deps: deps({
        push: async () => {
          await gate;
          order.push('push');
        },
        archive: async () => void order.push('archive'),
      }),
    });
    await sleep(60);
    expect(order).toEqual([]);
    release();
    await run;
    await sleep(10);
    expect(order).toEqual(['push', 'archive']);
  });

  it('does not archive when the server copy failed', async () => {
    const archive = vi.fn();
    await runBatchImport({ files: [file('a.docx')], journal, deps: deps({ push: async () => Promise.reject(new Error('offline')), archive }) });
    await sleep(10);
    expect(archive).not.toHaveBeenCalled();
  });

  it('with deps.load a saved paper is read back for typesetting instead of being kept in memory', async () => {
    const store = new Map<string, CompletePaper>();
    const loads: string[] = [];
    const out = await runBatchImport({
      files: [file('a.docx'), file('b.docx')],
      journal,
      deps: deps({ save: async (p) => (store.set(p.id, p), true), load: async (id) => (loads.push(id), store.get(id) ?? null) }),
    });
    expect(loads.sort()).toEqual(out.map((i) => i.paperId!).sort());
    expect(out.every((i) => i.pdf)).toBe(true);
  });

  it('a paper that cannot be read back reports the PDF problem but stays created', async () => {
    const out = await runBatchImport({ files: [file('a.docx')], journal, deps: deps({ load: async () => null }) });
    expect(out[0]).toMatchObject({ stage: 'done', compileError: 'Không nạp lại được bài báo đã lưu' });
  });

  it('retryFailed re-typesets only papers without a PDF and does not read the Word file again', async () => {
    const store = new Map<string, CompletePaper>();
    const io = { save: async (p: CompletePaper) => (store.set(p.id, p), true), load: async (id: string) => store.get(id) ?? null };
    const files = [file('a.docx'), file('b.docx')];
    const out1 = await runBatchImport({ files, journal, deps: deps({ ...io, failCompile: ['a'] }) });
    expect(out1[0].pdf).toBeUndefined();
    const again = deps(io);
    const parse = vi.spyOn(again, 'parse');
    const out2 = await retryFailed(out1, files, { journal, deps: again });
    expect(parse).not.toHaveBeenCalled();
    expect(out2[0]).toMatchObject({ stage: 'done', paperId: out1[0].paperId });
    expect(out2[0].pdf).toBeDefined();
    expect(out2[0].compileError).toBeUndefined();
    expect(out2[1].pdf).toBe(out1[1].pdf);
  });

  it('upper-case extensions are stripped from the fallback title', async () => {
    const out = await runBatchImport({ files: [file('Report.Docx')], journal, deps: deps({ titles: { 'Report.Docx': '' } }) });
    expect(out[0].title).toBe('Report');
  });
});

describe('referencedImages', () => {
  it('keeps only the pictures the LaTeX source names', () => {
    const images = { 'fig1.png': 'A', 'fig1.jpg': 'A', 'image1.png': 'A', 'fig2.png': 'B' };
    expect(Object.keys(referencedImages('\\includegraphics{images/fig1.png} \\includegraphics{fig2.png}', images)).sort()).toEqual(['fig1.png', 'fig2.png']);
    expect(referencedImages('no pictures', images)).toEqual({});
  });
});

describe('safeFileName hardening', () => {
  it('avoids Windows device names, trailing dots, bidi overrides and cut surrogate pairs', () => {
    expect(safeFileName('CON', 'x')).toBe('_CON');
    expect(safeFileName('Bài báo. ', 'x')).toBe('Bài báo');
    expect(safeFileName('a\u202Eb', 'x')).toBe('a b');
    const long = '😀'.repeat(200);
    expect(Array.from(safeFileName(long, 'x'))).toHaveLength(120);
    expect(safeFileName(long, 'x')).not.toMatch(/[\ud800-\udbff](?![\udc00-\udfff])/);
  });
});

describe('a different template per file', () => {
  const hs = { journalId: 'VNUHCM-HS', journalName: 'Sức khỏe', journalAbbv: 'HS' };
  const ebl = { journalId: 'VNUHCM-EBL', journalName: 'Kinh tế', journalAbbv: 'EBL' };
  const std = { journalId: 'VNUHCM-STD', journalName: 'KH&CN', journalAbbv: 'STD' };

  it('each paper gets the journal chosen for its own file, and the row shows it', async () => {
    const saved: CompletePaper[] = [];
    const d = deps({ save: async (p) => (saved.push(p), true) });
    const out = await runBatchImport({ files: [file('a.docx'), file('b.docx'), file('c.docx')], journal: hs, journals: [hs, ebl, std], deps: d });
    expect(saved.map((p) => p.metadata.journalId)).toEqual(['VNUHCM-HS', 'VNUHCM-EBL', 'VNUHCM-STD']);
    expect(saved.map((p) => p.metadata.journalAbbv)).toEqual(['HS', 'EBL', 'STD']);
    expect(saved[1].metadata.journalName).toBe('Kinh tế');
    expect(out.map((i) => i.journalAbbv)).toEqual(['HS', 'EBL', 'STD']);
  });

  it('files without an entry use the fallback journal', async () => {
    const saved: CompletePaper[] = [];
    await runBatchImport({ files: [file('a.docx'), file('b.docx')], journal: std, journals: [ebl], deps: deps({ save: async (p) => (saved.push(p), true) }) });
    expect(saved.map((p) => p.metadata.journalId)).toEqual(['VNUHCM-EBL', 'VNUHCM-STD']);
  });

  it('retry keeps the template of each retried file (not the first one)', async () => {
    const files = [file('a.docx'), file('b.docx'), file('c.docx')];
    const out1 = await runBatchImport({ files, journal: hs, journals: [hs, ebl, std], deps: deps({ parse: async (f) => (f.name === 'c.docx' ? Promise.reject(new Error('hỏng')) : deps().parse(f)) }) });
    expect(out1[2].stage).toBe('error');
    const saved: CompletePaper[] = [];
    const out2 = await retryFailed(out1, files, { journal: hs, journals: [hs, ebl, std], deps: deps({ save: async (p) => (saved.push(p), true) }) });
    expect(saved).toHaveLength(1);
    expect(saved[0].metadata.journalId).toBe('VNUHCM-STD'); // c.docx's own choice, not the first file's HS
    expect(out2[2].journalAbbv).toBe('STD');
    expect(out2[0].journalAbbv).toBe('HS');
  });
});
