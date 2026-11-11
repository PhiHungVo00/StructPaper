import { describe, it, expect, vi } from 'vitest';
import JSZip from 'jszip';
import { createEmptyPaper, type CompletePaper } from '@/types/paper';
import { createLimiter } from '@/lib/batch-import/limiter';
import { runBatchImport, retryFailed } from '@/lib/batch-import/run-batch';
import { zipPdfs, safeFileName } from '@/lib/batch-import/zip-pdfs';
import { compileToPdf } from '@/lib/batch-import/default-deps';
import type { BatchDeps, BatchItem } from '@/lib/batch-import/types';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const file = (name: string, size = 10) => new File([new Uint8Array(size)], name);
const journal = { journalId: 'VNUHCM-HS', journalName: 'Tạp chí HS', journalAbbv: 'HS' };

/** Fake dependencies that record how many calls overlap. */
function fakeDeps(over: Partial<BatchDeps> & { titles?: Record<string, string>; failParse?: string[]; failCompile?: string[]; delay?: number } = {}) {
  const live = { parse: 0, maxParse: 0, compile: 0, maxCompile: 0 };
  const saved: CompletePaper[] = [];
  const delay = over.delay ?? 5;
  const deps: BatchDeps = {
    async parse(f) {
      live.parse++;
      live.maxParse = Math.max(live.maxParse, live.parse);
      await sleep(delay);
      live.parse--;
      if (over.failParse?.includes(f.name)) throw new Error(`hỏng ${f.name}`);
      const p = createEmptyPaper();
      p.id = 'paper_same_ms'; // what the real parser does: the clock
      p.metadata.title = over.titles?.[f.name] ?? f.name.replace(/\.docx$/, '');
      return p;
    },
    existingTitles: async () => [],
    save: async (p) => (saved.push(p), true),
    check: () => ({ errors: 1, warnings: 2 }),
    async compile(p, signal) {
      live.compile++;
      live.maxCompile = Math.max(live.maxCompile, live.compile);
      try {
        await new Promise<void>((resolve, reject) => {
          const t = setTimeout(resolve, delay * 3);
          signal.addEventListener('abort', () => (clearTimeout(t), reject(Object.assign(new Error('x'), { name: 'AbortError' }))), { once: true });
        });
      } finally {
        live.compile--;
      }
      if (over.failCompile?.includes(p.metadata.title)) throw new Error('XeLaTeX lỗi');
      return { blob: new Blob([`pdf:${p.metadata.title}`]), ms: 7 };
    },
    ...over,
  };
  return { deps, live, saved };
}

describe('createLimiter', () => {
  it('never runs more than the limit at once and keeps arrival order', async () => {
    const lim = createLimiter(2);
    let active = 0;
    let max = 0;
    const order: number[] = [];
    await Promise.all(
      Array.from({ length: 7 }, (_, i) =>
        lim.run(async () => {
          active++;
          max = Math.max(max, active);
          order.push(i);
          await sleep(5);
          active--;
        })
      )
    );
    expect(max).toBe(2);
    expect(order).toEqual([0, 1, 2, 3, 4, 5, 6]);
  });

  it('a task that arrives while a slot is being handed over cannot exceed the limit', async () => {
    const lim = createLimiter(1);
    let active = 0;
    let max = 0;
    const task = async () => {
      active++;
      max = Math.max(max, active);
      await sleep(2);
      active--;
    };
    const first = lim.run(task);
    const queued = lim.run(task);
    await first;
    const late = lim.run(task); // arrives right after the first finished
    await Promise.all([queued, late]);
    expect(max).toBe(1);
  });

  it('removes an aborted waiter and still runs the others', async () => {
    const lim = createLimiter(1);
    const ac = new AbortController();
    const running = lim.run(() => sleep(10));
    const waiter = lim.run(async () => 'never', ac.signal);
    const after = lim.run(async () => 'ok');
    ac.abort();
    await expect(waiter).rejects.toMatchObject({ name: 'AbortError' });
    await running;
    await expect(after).resolves.toBe('ok');
  });

  it('rejects at once when already aborted and frees the slot after a failure', async () => {
    const lim = createLimiter(1);
    const ac = new AbortController();
    ac.abort();
    await expect(lim.run(async () => 1, ac.signal)).rejects.toMatchObject({ name: 'AbortError' });
    await expect(lim.run(async () => Promise.reject(new Error('boom')))).rejects.toThrow('boom');
    await expect(lim.run(async () => 'still works')).resolves.toBe('still works');
  });
});

describe('runBatchImport', () => {
  it('creates one paper per file, every id and title unique, and compiles them all', async () => {
    const { deps, saved } = fakeDeps({ titles: { 'a.docx': 'Cùng tiêu đề', 'b.docx': 'Cùng tiêu đề', 'c.docx': 'Cùng tiêu đề' } });
    const out = await runBatchImport({ files: [file('a.docx'), file('b.docx'), file('c.docx')], journal, deps });
    expect(out.map((i) => i.stage)).toEqual(['done', 'done', 'done']);
    expect(new Set(saved.map((p) => p.id)).size).toBe(3);
    expect(out.map((i) => i.title)).toEqual(['Cùng tiêu đề', 'Cùng tiêu đề (1)', 'Cùng tiêu đề (2)']);
    expect(saved.every((p) => p.metadata.journalId === 'VNUHCM-HS' && p.metadata.journalAbbv === 'HS')).toBe(true);
    expect(saved.map((p) => (p as any).displayName)).toEqual(out.map((i) => i.title));
    expect(out.every((i) => i.pdf && i.pdf.ms === 7 && i.errors === 1 && i.warnings === 2)).toBe(true);
  });

  it('avoids titles that already exist', async () => {
    const { deps } = fakeDeps({ existingTitles: async () => ['a'] });
    const out = await runBatchImport({ files: [file('a.docx')], journal, deps });
    expect(out[0].title).toBe('a (1)');
  });

  it('uses the file name when the paper has no title', async () => {
    const { deps } = fakeDeps({ titles: { 'Bài của tôi.docx': '' } });
    const out = await runBatchImport({ files: [file('Bài của tôi.docx')], journal, deps });
    expect(out[0].title).toBe('Bài của tôi');
  });

  it('overlaps the work within the limits instead of going one by one', async () => {
    const { deps, live } = fakeDeps({ delay: 15 });
    const started = Date.now();
    await runBatchImport({ files: Array.from({ length: 6 }, (_, i) => file(`f${i}.docx`)), journal, deps, parseLimit: 2, compileLimit: 3 });
    expect(live.maxParse).toBe(2);
    expect(live.maxCompile).toBe(3);
    // 6 files one after another would take 6 × (15 + 45) = 360 ms
    expect(Date.now() - started).toBeLessThan(300);
  });

  it('only the files that really run are shown as running; the others wait', async () => {
    const { deps } = fakeDeps({ delay: 15 });
    let max = { parsing: 0, compiling: 0 };
    let sawWaiting = false;
    let sawQueuedWhileParsing = false;
    await runBatchImport({
      files: Array.from({ length: 5 }, (_, i) => file(`f${i}.docx`)),
      journal,
      deps,
      parseLimit: 1,
      compileLimit: 2,
      onUpdate: (items) => {
        const n = (st: string) => items.filter((it) => it.stage === st).length;
        max = { parsing: Math.max(max.parsing, n('parsing')), compiling: Math.max(max.compiling, n('compiling')) };
        sawWaiting ||= n('waiting') > 0;
        sawQueuedWhileParsing ||= n('parsing') === 1 && n('queued') > 0;
      },
    });
    expect(max).toEqual({ parsing: 1, compiling: 2 });
    expect(sawWaiting).toBe(true);
    expect(sawQueuedWhileParsing).toBe(true);
  });

  it('one unreadable file does not stop the others', async () => {
    const { deps, saved } = fakeDeps({ failParse: ['bad.docx'] });
    const out = await runBatchImport({ files: [file('a.docx'), file('bad.docx'), file('c.docx')], journal, deps });
    expect(out.map((i) => i.stage)).toEqual(['done', 'error', 'done']);
    expect(out[1].error).toContain('hỏng bad.docx');
    expect(saved).toHaveLength(2);
  });

  it('a PDF failure keeps the paper (done + compileError)', async () => {
    const { deps, saved } = fakeDeps({ failCompile: ['b'] });
    const out = await runBatchImport({ files: [file('a.docx'), file('b.docx')], journal, deps });
    expect(saved).toHaveLength(2);
    expect(out[1]).toMatchObject({ stage: 'done', compileError: 'XeLaTeX lỗi' });
    expect(out[1].pdf).toBeUndefined();
    expect(out[0].pdf).toBeDefined();
  });

  it('a failed save is an error and is not compiled', async () => {
    const compile = vi.fn();
    const { deps } = fakeDeps({ save: async () => false, compile });
    const out = await runBatchImport({ files: [file('a.docx')], journal, deps });
    expect(out[0].stage).toBe('error');
    expect(compile).not.toHaveBeenCalled();
  });

  it('server copy and archive failures never fail an item', async () => {
    const { deps } = fakeDeps({ push: async () => Promise.reject(new Error('offline')), archive: async () => Promise.reject(new Error('offline')) });
    const out = await runBatchImport({ files: [file('a.docx')], journal, deps });
    expect(out[0].stage).toBe('done');
    expect(out[0].pdf).toBeDefined();
  });

  it('survives check() and existingTitles() throwing', async () => {
    const { deps } = fakeDeps({
      check: () => {
        throw new Error('x');
      },
      existingTitles: async () => Promise.reject(new Error('db')),
    });
    const out = await runBatchImport({ files: [file('a.docx')], journal, deps });
    expect(out[0]).toMatchObject({ stage: 'done', errors: 0, warnings: 0 });
  });

  it('reports progress through every stage, in order, for each file', async () => {
    const { deps } = fakeDeps();
    const seen: string[][] = [[], []];
    await runBatchImport({
      files: [file('a.docx'), file('b.docx')],
      journal,
      deps,
      onUpdate: (items) => items.forEach((it, i) => seen[i][seen[i].length - 1] !== it.stage && seen[i].push(it.stage)),
    });
    for (const s of seen) expect(s).toEqual(['queued', 'parsing', 'saving', 'waiting', 'compiling', 'done']);
  });

  it('cancelling stops waiting files, aborts running PDFs and keeps the papers already saved', async () => {
    const { deps, saved } = fakeDeps({ delay: 20 });
    const ac = new AbortController();
    const files = Array.from({ length: 5 }, (_, i) => file(`f${i}.docx`));
    let snapshot: BatchItem[] = [];
    const run = runBatchImport({
      files,
      journal,
      deps,
      parseLimit: 1,
      compileLimit: 1,
      signal: ac.signal,
      onUpdate: (it) => (snapshot = it),
    });
    await sleep(70); // first file parsed and compiling, the rest waiting
    ac.abort();
    const out = await run;
    expect(out.some((i) => i.stage === 'cancelled')).toBe(true);
    expect(out.every((i) => ['done', 'cancelled'].includes(i.stage))).toBe(true);
    // what was saved before the cancel stays saved, and is reported as such
    expect(out.filter((i) => i.paperId).length).toBe(saved.length);
    expect(snapshot).toEqual(out);
    const aborted = out.filter((i) => i.stage === 'done' && i.compileError);
    aborted.forEach((i) => expect(i.compileError).toMatch(/hủy/));
  });

  it('a file that was being read when the user cancelled is not created', async () => {
    const { deps, saved } = fakeDeps({ delay: 40 });
    const ac = new AbortController();
    const run = runBatchImport({ files: [file('a.docx'), file('b.docx'), file('c.docx')], journal, deps, parseLimit: 1, signal: ac.signal });
    await sleep(15); // a.docx is mid-parse
    ac.abort();
    const out = await run;
    expect(out.map((i) => i.stage)).toEqual(['cancelled', 'cancelled', 'cancelled']);
    expect(saved).toHaveLength(0);
    expect(out.every((i) => !i.paperId)).toBe(true);
  });

  it('retryFailed runs only the failed files and keeps the finished ones', async () => {
    const first = fakeDeps({ failParse: ['b.docx'] });
    const files = [file('a.docx'), file('b.docx'), file('c.docx')];
    const out1 = await runBatchImport({ files, journal, deps: first.deps });
    expect(out1[1].stage).toBe('error');
    const second = fakeDeps();
    const out2 = await retryFailed(out1, files, { journal, deps: second.deps });
    expect(out2.map((i) => i.stage)).toEqual(['done', 'done', 'done']);
    expect(out2[0].paperId).toBe(out1[0].paperId); // untouched
    expect(out2.map((i) => i.key)).toEqual(out1.map((i) => i.key));
    expect(second.saved).toHaveLength(1);
  });

  it('with no files it resolves at once', async () => {
    expect(await runBatchImport({ files: [], journal, deps: fakeDeps().deps })).toEqual([]);
  });
});

describe('zipPdfs / safeFileName', () => {
  it('zips only finished PDFs with unique, file-system safe names', async () => {
    const mk = (title: string, pdf: boolean): BatchItem => ({
      key: title,
      fileName: `${title}.docx`,
      size: 1,
      stage: 'done',
      errors: 0,
      warnings: 0,
      title,
      pdf: pdf ? { blob: new Blob([title]), ms: 1 } : undefined,
    });
    const blob = await zipPdfs([mk('Tên: bài/một?', true), mk('Tên: bài/một?', true), mk('Không có PDF', false)]);
    const zip = await JSZip.loadAsync(await blob!.arrayBuffer());
    expect(Object.keys(zip.files).sort()).toEqual(['Tên bài một.pdf', 'Tên bài một (2).pdf'].sort());
    expect(await zipPdfs([mk('x', false)])).toBeNull();
    expect(safeFileName('  ', 'tệp')).toBe('tệp');
  });
});

describe('compileToPdf', () => {
  it('returns the PDF and sends tex + images', async () => {
    const f = vi.fn(async (_u: any, init: any) => {
      expect(JSON.parse(init.body)).toEqual({ tex: 'T', images: { 'fig1.png': 'AA' } });
      return new Response('%PDF', { status: 200 });
    });
    const blob = await compileToPdf('T', { 'fig1.png': 'AA' }, new AbortController().signal, f as any);
    expect(await blob.text()).toBe('%PDF');
  });

  it('turns an error response into a readable message', async () => {
    const f = async () => new Response(JSON.stringify({ error: 'Biên dịch XeLaTeX thất bại', details: '! Undefined control sequence' }), { status: 422 });
    await expect(compileToPdf('T', {}, new AbortController().signal, f as any)).rejects.toThrow(/XeLaTeX thất bại.*Undefined/);
  });

  it('maps an aborted request to AbortError and a network failure to a clear message', async () => {
    const ac = new AbortController();
    const aborting = async () => {
      ac.abort();
      throw new Error('fetch failed');
    };
    await expect(compileToPdf('T', {}, ac.signal, aborting as any)).rejects.toMatchObject({ name: 'AbortError' });
    const down = async () => {
      throw new Error('ECONNREFUSED');
    };
    await expect(compileToPdf('T', {}, new AbortController().signal, down as any)).rejects.toThrow(/máy chủ biên dịch/);
  });
});
