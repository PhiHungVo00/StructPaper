import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { WasmCompiler } from '../src/wasm/wasm-compiler';
import { WorkerBridge } from '../src/wasm/worker-bridge';
import type { CompileRequest, CompileProgress } from '../src/interfaces/compiler-port';
import type { CompileContext } from '../src/interfaces/compiler-router.types';

// Mock Web Worker implementation for Node / Vitest tests
class MockWorker {
  public onmessage: ((e: MessageEvent) => void) | null = null;
  public onerror: ((e: ErrorEvent) => void) | null = null;
  public terminated = false;
  public postedMessages: any[] = [];

  constructor() {}

  postMessage(message: any, transfer?: any[]): void {
    this.postedMessages.push(message);
  }

  terminate(): void {
    this.terminated = true;
  }

  // Helper for test to dispatch incoming message from worker
  simulateIncomingMessage(data: any): void {
    if (this.onmessage) {
      this.onmessage({ data } as MessageEvent);
    }
  }

  simulateError(error: any): void {
    if (this.onerror) {
      this.onerror({ error, message: String(error) } as ErrorEvent);
    }
  }
}

describe('packages/compiler-client - WasmCompiler & WorkerBridge', () => {
  let mockWorker: MockWorker;
  let compiler: WasmCompiler;

  const sampleContext: CompileContext = {
    online: true,
    serverReachable: true,
    localEnv: 'ready',
    localEnvMatches: true,
    deviceScore: 85,
    pageEstimate: 5,
    assetBytes: 1024 * 1024,
    recentLocalFailures: [],
    userPreference: 'auto',
    parity: 'same',
    localDisabledByFlag: false,
    saveData: false,
  };

  beforeEach(() => {
    mockWorker = new MockWorker();
    compiler = new WasmCompiler({
      workerFactory: () => mockWorker as unknown as Worker,
      environmentId: 'tl2026.1-wasm',
      timeoutMs: 1000,
    });
  });

  afterEach(() => {
    compiler.dispose();
  });

  it('exposes kind as browser-wasm', () => {
    expect(compiler.kind).toBe('browser-wasm');
  });

  describe('canHandle evaluation', () => {
    it('returns true for draft compile with ready environment', () => {
      const verdict = compiler.canHandle({ tex: '...', mode: 'draft' }, sampleContext);
      expect(verdict.canHandle).toBe(true);
    });

    it('rejects final mode compilation with R01_FINAL_SERVER', () => {
      const verdict = compiler.canHandle({ tex: '...', mode: 'final' }, sampleContext);
      expect(verdict.canHandle).toBe(false);
      expect(verdict.reasonCode).toBe('R01_FINAL_SERVER');
    });

    it('rejects missing local environment with R05_OFFLINE_NO_ENV', () => {
      const ctx = { ...sampleContext, localEnv: 'missing' as const };
      const verdict = compiler.canHandle({ tex: '...', mode: 'draft' }, ctx);
      expect(verdict.canHandle).toBe(false);
      expect(verdict.reasonCode).toBe('R05_OFFLINE_NO_ENV');
      expect(verdict.notice?.code).toBe('E1');
    });

    it('rejects weak device with R08_DEVICE_TOO_WEAK', () => {
      const ctx = { ...sampleContext, deviceScore: 'unsupported' as const };
      const verdict = compiler.canHandle({ tex: '...', mode: 'draft' }, ctx);
      expect(verdict.canHandle).toBe(false);
      expect(verdict.reasonCode).toBe('R08_DEVICE_TOO_WEAK');
    });

    it('rejects oversized asset payload with R09_DOCUMENT_TOO_BIG', () => {
      const ctx = { ...sampleContext, assetBytes: 50 * 1024 * 1024 }; // > 40MB
      const verdict = compiler.canHandle({ tex: '...', mode: 'draft' }, ctx);
      expect(verdict.canHandle).toBe(false);
      expect(verdict.reasonCode).toBe('R09_DOCUMENT_TOO_BIG');
    });
  });

  describe('compile lifecycle & worker communication', () => {
    it('compiles LaTeX successfully through WorkerBridge', async () => {
      const req: CompileRequest = {
        tex: '\\documentclass{article}\\begin{document}Hello WASM\\end{document}',
        paperId: 'paper-123',
      };

      const compilePromise = compiler.compile(req);

      // Verify worker was posted compile message
      expect(mockWorker.postedMessages.length).toBeGreaterThanOrEqual(1);
      const compileMsg = mockWorker.postedMessages[mockWorker.postedMessages.length - 1];
      expect(compileMsg.type).toBe('compile');
      expect(compileMsg.payload.tex).toBe(req.tex);

      // Simulate worker success response
      const dummyPdf = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d]);
      mockWorker.simulateIncomingMessage({
        type: 'compile-result',
        jobId: compileMsg.jobId,
        result: {
          status: 'success',
          pdfBuffer: dummyPdf,
          logs: ['Output written on main.pdf (1 page).'],
          durationMs: 120,
        },
      });

      const result = await compilePromise;
      expect(result.status).toBe('success');
      expect(result.pdfBuffer).toEqual(dummyPdf);
      expect(result.producedBy?.kind).toBe('browser-wasm');
      expect(result.producedBy?.environmentId).toBe('tl2026.1-wasm');
      expect(result.logs[0]).toContain('Output written on main.pdf');
      expect(result.report).toBeDefined();
      expect(result.report?.errors).toHaveLength(0);
    });

    it('handles compilation failure logs with structured report', async () => {
      const req: CompileRequest = {
        tex: '\\documentclass{article}\\begin{document}\\invalidCmd\\end{document}',
      };

      const compilePromise = compiler.compile(req);
      const compileMsg = mockWorker.postedMessages[mockWorker.postedMessages.length - 1];

      mockWorker.simulateIncomingMessage({
        type: 'compile-result',
        jobId: compileMsg.jobId,
        result: {
          status: 'error',
          error: 'Undefined control sequence',
          logs: [
            '! Undefined control sequence.',
            'l.1 \\invalidCmd',
            'Overfull \\hbox (10.0pt too wide) in paragraph at lines 1--2',
          ],
          durationMs: 95,
        },
      });

      const result = await compilePromise;
      expect(result.status).toBe('error');
      expect(result.report?.errors).toHaveLength(1);
      expect(result.report?.errors[0].line).toBe(1);
      expect(result.report?.overfullHbox).toBe(1);
    });

    it('aborts immediately when signal is already aborted', async () => {
      const controller = new AbortController();
      controller.abort();

      const result = await compiler.compile({ tex: 'test' }, controller.signal);
      expect(result.status).toBe('error');
      expect(result.cancelled).toBe(true);
      expect(result.error).toContain('aborted');
      // No compile message should be posted to worker
      expect(mockWorker.postedMessages.length).toBe(0);
    });

    it('cancels in-flight compilation when signal aborts', async () => {
      const controller = new AbortController();
      const compilePromise = compiler.compile({ tex: 'test' }, controller.signal);

      const compileMsg = mockWorker.postedMessages[mockWorker.postedMessages.length - 1];
      expect(compileMsg.type).toBe('compile');

      // Abort in flight
      controller.abort();

      const cancelMsg = mockWorker.postedMessages.find((m) => m.type === 'cancel');
      expect(cancelMsg).toBeDefined();

      const result = await compilePromise;
      expect(result.status).toBe('error');
      expect(result.cancelled).toBe(true);
    });

    it('watchdog timeout terminates hung worker and spawns new worker on next compile', async () => {
      let workerInstanceCount = 0;
      const workers: MockWorker[] = [];

      const watchdogCompiler = new WasmCompiler({
        workerFactory: () => {
          workerInstanceCount++;
          const w = new MockWorker();
          workers.push(w);
          return w as unknown as Worker;
        },
        timeoutMs: 100, // Short timeout
      });

      // Start compile that never responds
      const hungPromise = watchdogCompiler.compile({ tex: 'infinite-loop' });

      // Wait past timeout
      await new Promise((resolve) => setTimeout(resolve, 150));

      const result = await hungPromise;
      expect(result.status).toBe('error');
      expect(result.error).toContain('timed out');
      expect(workers[0].terminated).toBe(true);

      // Next compilation should create a new worker and succeed
      const secondPromise = watchdogCompiler.compile({ tex: 'second-try' });
      expect(workers.length).toBe(2);

      const secondWorker = workers[1];
      const secondMsg = secondWorker.postedMessages[secondWorker.postedMessages.length - 1];

      secondWorker.simulateIncomingMessage({
        type: 'compile-result',
        jobId: secondMsg.jobId,
        result: {
          status: 'success',
          pdfBuffer: new Uint8Array([1, 2, 3]),
          logs: ['ok'],
          durationMs: 50,
        },
      });

      const res2 = await secondPromise;
      expect(res2.status).toBe('success');

      watchdogCompiler.dispose();
    });

    it('notifies progress listeners during compilation', async () => {
      const progressEvents: CompileProgress[] = [];
      const unsub = compiler.onProgress!((evt) => progressEvents.push(evt));

      const compilePromise = compiler.compile({ tex: 'test' });
      const compileMsg = mockWorker.postedMessages[mockWorker.postedMessages.length - 1];

      // Simulate worker progress update
      mockWorker.simulateIncomingMessage({
        type: 'compile-progress',
        jobId: compileMsg.jobId,
        progress: {
          phase: 'compiling',
          percent: 50,
          message: 'Processing pass 1...',
        },
      });

      mockWorker.simulateIncomingMessage({
        type: 'compile-result',
        jobId: compileMsg.jobId,
        result: {
          status: 'success',
          pdfBuffer: new Uint8Array([1]),
          logs: [],
          durationMs: 30,
        },
      });

      await compilePromise;
      expect(progressEvents.some((e) => e.phase === 'compiling' && e.percent === 50)).toBe(true);

      unsub();
    });
  });
});
