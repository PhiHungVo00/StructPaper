import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  CompileScheduler,
  CompileStatus,
  CompileAbortError,
} from '../src/scheduler/compile-scheduler';
import { MockCompilerAdapter } from '../src/adapters/mock-compiler';
import type { CompilerPort, CompileRequest, CompileResult } from '../src/interfaces/compiler-port';

describe('packages/compiler-client - CompileScheduler', () => {
  let mockCompiler: MockCompilerAdapter;
  let scheduler: CompileScheduler | null = null;

  beforeEach(() => {
    mockCompiler = new MockCompilerAdapter();
    scheduler = null;
  });

  afterEach(() => {
    if (scheduler) {
      scheduler.dispose();
      scheduler = null;
    }
  });

  it('debounces multiple rapid compile requests (only the 3rd job is executed)', async () => {
    const compileSpy = vi.fn(async (req: CompileRequest, signal?: AbortSignal): Promise<CompileResult> => {
      return {
        status: 'success',
        pdfBuffer: new Uint8Array([1, 2, 3]),
        logs: ['Compiled ok'],
        durationMs: 15,
        engine: 'TestEngine',
      };
    });

    const customCompiler: CompilerPort = { compile: compileSpy };

    scheduler = new CompileScheduler({
      compiler: customCompiler,
      debounceMs: 150,
    });

    const statuses: CompileStatus[] = [];
    scheduler.onStatusChange((s) => statuses.push(s));

    expect(scheduler.getStatus()).toBe('idle');

    // Dispatch 3 requests within 60ms (well within the 150ms debounce window)
    const p1 = scheduler.schedule({ tex: '\\documentclass{article}\\begin{document}1\\end{document}' });
    await new Promise((r) => setTimeout(r, 20));
    const p2 = scheduler.schedule({ tex: '\\documentclass{article}\\begin{document}2\\end{document}' });
    await new Promise((r) => setTimeout(r, 20));
    const p3 = scheduler.schedule({ tex: '\\documentclass{article}\\begin{document}3\\end{document}' });

    // Status should be debouncing
    expect(scheduler.getStatus()).toBe('debouncing');

    const [res1, res2, res3] = await Promise.all([p1, p2, p3]);

    // Only the 3rd job was compiled by the port
    expect(compileSpy).toHaveBeenCalledTimes(1);
    expect(compileSpy).toHaveBeenCalledWith(
      expect.objectContaining({ tex: expect.stringContaining('3') }),
      expect.any(Object)
    );

    // Job 1 and 2 were debounced and cancelled
    expect(res1.status).toBe('error');
    expect(res1.cancelled).toBe(true);
    expect(res2.status).toBe('error');
    expect(res2.cancelled).toBe(true);

    // Job 3 succeeded
    expect(res3.status).toBe('success');
    expect(res3.logs).toEqual(['Compiled ok']);

    // Final scheduler status is success
    expect(scheduler.getStatus()).toBe('success');
    expect(statuses).toContain('debouncing');
    expect(statuses).toContain('compiling');
    expect(statuses).toContain('success');
  });

  it('cancels slow running compile job and sends abort signal when new request arrives', async () => {
    let capturedSignal1: AbortSignal | undefined;
    let signal1AbortedDuringExecution = false;

    const slowCompiler: CompilerPort = {
      compile: async (req: CompileRequest, signal?: AbortSignal): Promise<CompileResult> => {
        if (req.tex.includes('slow_job')) {
          capturedSignal1 = signal;
          // Simulate slow 200ms compilation
          await new Promise<void>((resolve) => {
            const timer = setTimeout(resolve, 200);
            signal?.addEventListener('abort', () => {
              signal1AbortedDuringExecution = true;
              clearTimeout(timer);
              resolve();
            });
          });

          if (signal?.aborted) {
            return {
              status: 'error',
              error: 'Compilation was aborted',
              logs: ['Aborted by signal'],
              durationMs: 50,
              cancelled: true,
            };
          }
        }

        return {
          status: 'success',
          pdfBuffer: new Uint8Array([4, 5, 6]),
          logs: ['Fast compile finished'],
          durationMs: 10,
          engine: 'FastEngine',
        };
      },
    };

    scheduler = new CompileScheduler({
      compiler: slowCompiler,
      debounceMs: 50,
    });

    // Start slow job immediately
    const p1 = scheduler.compileNow({ tex: 'slow_job' });
    expect(scheduler.getStatus()).toBe('compiling');

    // Wait 25ms, then send new compile job
    await new Promise((r) => setTimeout(r, 25));

    // Calling compileNow with new job should abort slow_job
    const p2 = scheduler.compileNow({ tex: 'fast_job_2' });

    const [res1, res2] = await Promise.all([p1, p2]);

    // Verify job 1 received abort signal
    expect(capturedSignal1).toBeDefined();
    expect(capturedSignal1?.aborted).toBe(true);
    expect(signal1AbortedDuringExecution).toBe(true);
    expect(res1.cancelled).toBe(true);

    // Verify job 2 succeeded
    expect(res2.status).toBe('success');
    expect(res2.engine).toBe('FastEngine');
    expect(scheduler.getStatus()).toBe('success');
  });

  it('serves repeated compile requests with matching hash immediately from cache', async () => {
    const compileSpy = vi.fn(async (req: CompileRequest): Promise<CompileResult> => {
      return {
        status: 'success',
        pdfBuffer: new Uint8Array([7, 8, 9]),
        logs: ['Generated fresh PDF'],
        durationMs: 40,
        engine: 'CacheTestEngine',
      };
    });

    const compiler: CompilerPort = { compile: compileSpy };
    scheduler = new CompileScheduler({
      compiler,
      debounceMs: 50,
    });

    const request: CompileRequest = {
      tex: '\\documentclass{article}\\title{Deterministic Document}\\begin{document}Hello\\end{document}',
      paperId: 'paper-cache-123',
      images: { 'fig1.png': 'base64_data_abc' },
    };

    // First compilation
    const start1 = Date.now();
    const res1 = await scheduler.schedule(request);
    const duration1 = Date.now() - start1;

    expect(compileSpy).toHaveBeenCalledTimes(1);
    expect(res1.status).toBe('success');
    expect(res1.fromCache).toBeFalsy();
    expect(scheduler.getCacheSize()).toBe(1);

    // Second compilation with identical content
    const start2 = Date.now();
    const res2 = await scheduler.schedule(request);
    const duration2 = Date.now() - start2;

    // Cache hit should return immediately without calling compiler port again
    expect(compileSpy).toHaveBeenCalledTimes(1);
    expect(res2.status).toBe('success');
    expect(res2.fromCache).toBe(true);
    expect(res2.pdfBuffer).toEqual(new Uint8Array([7, 8, 9]));
    // Cache response is virtually instant (< 20ms, no debounce delay)
    expect(duration2).toBeLessThan(duration1);

    // Direct synchronous getCached also works
    const directCached = scheduler.getCached(request);
    expect(directCached?.fromCache).toBe(true);
  });

  it('handles compiler errors properly and updates status to error', async () => {
    const failingCompiler: CompilerPort = {
      compile: async (): Promise<CompileResult> => {
        return {
          status: 'error',
          error: 'Undefined control sequence \\unknowncommand',
          logs: ['! Undefined control sequence: \\unknowncommand on line 42'],
          durationMs: 25,
          engine: 'XeLaTeX',
        };
      },
    };

    scheduler = new CompileScheduler({
      compiler: failingCompiler,
      debounceMs: 30,
    });

    const statuses: CompileStatus[] = [];
    scheduler.onStatusChange((s) => statuses.push(s));

    const res = await scheduler.schedule({ tex: '\\unknowncommand' });

    expect(res.status).toBe('error');
    expect(res.error).toContain('Undefined control sequence');
    expect(res.logs[0]).toContain('line 42');
    expect(scheduler.getStatus()).toBe('error');
    expect(statuses).toContain('error');
    // Failed results are not cached
    expect(scheduler.getCacheSize()).toBe(0);
  });

  it('handles uncaught compiler exceptions gracefully without crashing', async () => {
    const crashingCompiler: CompilerPort = {
      compile: async () => {
        throw new Error('Fatal socket connection drop');
      },
    };

    scheduler = new CompileScheduler({
      compiler: crashingCompiler,
      debounceMs: 20,
    });

    const res = await scheduler.schedule({ tex: 'test' });
    expect(res.status).toBe('error');
    expect(res.error).toBe('Fatal socket connection drop');
    expect(scheduler.getStatus()).toBe('error');
  });

  it('supports throwOnError mode when configured', async () => {
    const crashingCompiler: CompilerPort = {
      compile: async () => {
        throw new Error('Explicit boom');
      },
    };

    scheduler = new CompileScheduler({
      compiler: crashingCompiler,
      debounceMs: 20,
      throwOnError: true,
    });

    await expect(scheduler.schedule({ tex: 'test' })).rejects.toThrow('Explicit boom');
  });

  it('cancels pending debounce when cancel() is invoked', async () => {
    scheduler = new CompileScheduler({
      compiler: mockCompiler,
      debounceMs: 200,
    });

    const p = scheduler.schedule({ tex: 'will_be_cancelled' });
    expect(scheduler.getStatus()).toBe('debouncing');

    scheduler.cancel();

    const res = await p;
    expect(res.cancelled).toBe(true);
    expect(scheduler.getStatus()).toBe('idle');
    expect(mockCompiler.compileCalls.length).toBe(0);
  });

  it('evicts oldest cache item when maxCacheSize is exceeded', async () => {
    scheduler = new CompileScheduler({
      compiler: mockCompiler,
      debounceMs: 10,
      maxCacheSize: 3,
    });

    await scheduler.compileNow({ tex: 'doc_1' });
    await scheduler.compileNow({ tex: 'doc_2' });
    await scheduler.compileNow({ tex: 'doc_3' });
    expect(scheduler.getCacheSize()).toBe(3);

    // 4th compilation evicts doc_1
    await scheduler.compileNow({ tex: 'doc_4' });
    expect(scheduler.getCacheSize()).toBe(3);

    expect(scheduler.getCached({ tex: 'doc_1' })).toBeUndefined();
    expect(scheduler.getCached({ tex: 'doc_4' })).toBeDefined();
  });
});
