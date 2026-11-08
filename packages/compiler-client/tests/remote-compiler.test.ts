import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RemoteCompiler } from '../src/remote/remote-compiler';
import type { CompileRequest, CompileResult } from '../src/interfaces/compiler-port';
import type { CompileContext } from '../src/interfaces/compiler-router.types';

describe('packages/compiler-client - RemoteCompiler', () => {
  let mockFetch: ReturnType<typeof vi.fn>;

  const sampleContext: CompileContext = {
    online: true,
    serverReachable: true,
    localEnv: 'ready',
    localEnvMatches: true,
    deviceScore: 90,
    pageEstimate: 5,
    assetBytes: 1024,
    recentLocalFailures: [],
    userPreference: 'auto',
    parity: 'same',
    localDisabledByFlag: false,
    saveData: false,
  };

  const sampleRequest: CompileRequest = {
    tex: '\\documentclass{article}\\begin{document}Hello Server\\end{document}',
    paperId: 'paper-123',
    mode: 'final',
    environmentId: 'tl2026.1-server',
    images: { 'fig1.png': 'base64data' },
  };

  beforeEach(() => {
    mockFetch = vi.fn();
  });

  it('implements CompilerPort with kind "server-native"', () => {
    const compiler = new RemoteCompiler({ fetchFn: mockFetch });
    expect(compiler.kind).toBe('server-native');
  });

  describe('canHandle capability check', () => {
    it('returns supported: true and canHandle: true when online and server reachable', () => {
      const compiler = new RemoteCompiler();
      const verdict = compiler.canHandle(sampleRequest, sampleContext);
      expect(verdict.canHandle).toBe(true);
      expect(verdict.supported).toBe(true);
    });

    it('returns supported: false and canHandle: false when offline', () => {
      const compiler = new RemoteCompiler();
      const verdict = compiler.canHandle(sampleRequest, {
        ...sampleContext,
        online: false,
      });
      expect(verdict.canHandle).toBe(false);
      expect(verdict.supported).toBe(false);
      expect(verdict.reasonCode).toBe('R04_OFFLINE_LOCAL_READY');
      expect(verdict.reason).toContain('offline');
    });

    it('returns supported: false and canHandle: false when server is unreachable', () => {
      const compiler = new RemoteCompiler();
      const verdict = compiler.canHandle(sampleRequest, {
        ...sampleContext,
        online: true,
        serverReachable: false,
      });
      expect(verdict.canHandle).toBe(false);
      expect(verdict.supported).toBe(false);
      expect(verdict.reasonCode).toBe('R07_LOCAL_ENV_NOT_READY');
      expect(verdict.reason).toContain('unreachable');
    });

    it('defaults to supported: true if context is omitted', () => {
      const compiler = new RemoteCompiler();
      const verdict = compiler.canHandle(sampleRequest);
      expect(verdict.canHandle).toBe(true);
      expect(verdict.supported).toBe(true);
    });
  });

  describe('compile() execution', () => {
    it('sends HTTP POST to configured endpoint with correct payload and headers', async () => {
      const dummyPdfBytes = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x31]); // %PDF1
      mockFetch.mockResolvedValueOnce(
        new Response(dummyPdfBytes.buffer, {
          status: 200,
          headers: {
            'Content-Type': 'application/pdf',
            'x-compiler-engine': 'XeLaTeX Server Native',
            'x-compilation-time-ms': '850',
          },
        })
      );

      const compiler = new RemoteCompiler({
        endpoint: '/api/compile-latex',
        baseUrl: 'https://compiler.structpaper.org',
        fetchFn: mockFetch,
        environmentId: 'tl2026.1-server',
      });

      const result = await compiler.compile(sampleRequest);

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [calledUrl, calledInit] = mockFetch.mock.calls[0];
      expect(calledUrl).toBe('https://compiler.structpaper.org/api/compile-latex');
      expect(calledInit.method).toBe('POST');
      expect(calledInit.headers['Content-Type']).toBe('application/json');

      const sentBody = JSON.parse(calledInit.body);
      expect(sentBody.tex).toBe(sampleRequest.tex);
      expect(sentBody.paperId).toBe('paper-123');
      expect(sentBody.mode).toBe('final');
      expect(sentBody.images).toEqual({ 'fig1.png': 'base64data' });

      expect(result.status).toBe('success');
      expect(result.pdfBuffer).toEqual(dummyPdfBytes);
      expect(result.engine).toBe('XeLaTeX Server Native');
      expect(result.durationMs).toBe(850);
      expect(result.producedBy).toEqual({
        kind: 'server-native',
        environmentId: 'tl2026.1-server',
      });
      expect(result.logs.length).toBeGreaterThan(0);
    });

    it('parses structured LaTeX error logs on HTTP error response', async () => {
      const errorJson = {
        error: 'LaTeX Compilation Failed',
        details: 'Undefined control sequence',
        rawLog: [
          '! Undefined control sequence.',
          'l.42 \\invalidCommand{test}',
          'The control sequence at the end of the top line',
          'was never \\def\'ed.',
        ].join('\n'),
      };

      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify(errorJson), {
          status: 422,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      const compiler = new RemoteCompiler({ fetchFn: mockFetch });
      const result = await compiler.compile({
        tex: 'Line 1\nLine 2\n%% BLOCK: block_sec1\n\\invalidCommand{test}',
      });

      expect(result.status).toBe('error');
      expect(result.error).toBe('LaTeX Compilation Failed');
      expect(result.report).toBeDefined();
      expect(result.report?.errors).toHaveLength(1);
      expect(result.report?.errors[0].message).toContain('! Undefined control sequence.');
      expect(result.report?.errors[0].line).toBe(42);
      expect(result.producedBy?.kind).toBe('server-native');
    });

    it('handles non-JSON error response gracefully (e.g. 502/503 HTML or plain text)', async () => {
      mockFetch.mockResolvedValueOnce(
        new Response('502 Bad Gateway: Worker unavailable', {
          status: 502,
          headers: { 'Content-Type': 'text/plain' },
        })
      );

      const compiler = new RemoteCompiler({ fetchFn: mockFetch });
      const result = await compiler.compile(sampleRequest);

      expect(result.status).toBe('error');
      expect(result.error).toContain('502 Bad Gateway');
      expect(result.producedBy?.kind).toBe('server-native');
      expect(result.logs).toContain('502 Bad Gateway: Worker unavailable');
    });

    it('aborts cleanly when AbortSignal is already aborted', async () => {
      const controller = new AbortController();
      controller.abort();

      const compiler = new RemoteCompiler({ fetchFn: mockFetch });
      const result = await compiler.compile(sampleRequest, controller.signal);

      expect(mockFetch).not.toHaveBeenCalled();
      expect(result.status).toBe('error');
      expect(result.cancelled).toBe(true);
      expect(result.error).toBe('Compilation was aborted');
    });

    it('aborts cleanly when signal is triggered in-flight', async () => {
      const controller = new AbortController();
      mockFetch.mockImplementationOnce((_url, init) => {
        return new Promise((_resolve, reject) => {
          init.signal?.addEventListener('abort', () => {
            const err = new Error('The operation was aborted');
            err.name = 'AbortError';
            reject(err);
          });
        });
      });

      const compiler = new RemoteCompiler({ fetchFn: mockFetch });
      const compilePromise = compiler.compile(sampleRequest, controller.signal);

      // Trigger abort in flight
      setTimeout(() => controller.abort(), 10);

      const result = await compilePromise;
      expect(result.status).toBe('error');
      expect(result.cancelled).toBe(true);
      expect(result.error).toBe('Compilation was aborted');
    });

    it('handles network failure (fetch throws error)', async () => {
      mockFetch.mockRejectedValueOnce(new TypeError('Failed to fetch'));

      const compiler = new RemoteCompiler({ fetchFn: mockFetch });
      const result = await compiler.compile(sampleRequest);

      expect(result.status).toBe('error');
      expect(result.error).toContain('Failed to fetch');
      expect(result.producedBy?.kind).toBe('server-native');
    });

    it('emits progress notifications via onProgress', async () => {
      mockFetch.mockResolvedValueOnce(
        new Response(new Uint8Array([1, 2, 3]).buffer, {
          status: 200,
          headers: { 'Content-Type': 'application/pdf' },
        })
      );

      const compiler = new RemoteCompiler({ fetchFn: mockFetch });
      const progressEvents: any[] = [];
      const unsub = compiler.onProgress((p) => progressEvents.push(p));

      await compiler.compile(sampleRequest);

      expect(progressEvents.length).toBeGreaterThan(0);
      expect(progressEvents[0].phase).toBeDefined();

      unsub();
    });
  });
});
