import { describe, it, expect, vi } from 'vitest';
import { LocalNextCompilerAdapter } from '../src/adapters/local-next-compiler';
import { MockCompilerAdapter } from '../src/adapters/mock-compiler';
import type { CompileRequest } from '../src/interfaces/compiler-port';

describe('packages/compiler-client - LocalNextCompilerAdapter', () => {
  it('calls the HTTP endpoint with expected payload and extracts PDF response', async () => {
    const dummyPdfBytes = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x35]); // %PDF-1.5

    const mockFetch = vi.fn(async (url: string | URL | Request, init?: RequestInit): Promise<Response> => {
      expect(url).toBe('/api/compile-latex');
      expect(init?.method).toBe('POST');

      const body = JSON.parse(init?.body as string);
      expect(body.tex).toBe('\\documentclass{article}');
      expect(body.paperId).toBe('paper-123');
      expect(body.images).toEqual({ 'fig1.png': 'base64_data' });

      return {
        ok: true,
        status: 200,
        headers: new Headers({
          'Content-Type': 'application/pdf',
          'X-Compiler-Engine': 'Java Spring Boot (XeLaTeX)',
          'X-Compilation-Time-Ms': '1250',
        }),
        arrayBuffer: async () => dummyPdfBytes.buffer,
      } as any;
    });

    const adapter = new LocalNextCompilerAdapter({
      fetchFn: mockFetch as any,
    });

    const request: CompileRequest = {
      tex: '\\documentclass{article}',
      paperId: 'paper-123',
      images: { 'fig1.png': 'base64_data' },
    };

    const result = await adapter.compile(request);

    expect(result.status).toBe('success');
    expect(result.engine).toBe('Java Spring Boot (XeLaTeX)');
    expect(result.durationMs).toBe(1250);
    expect(result.pdfBuffer).toEqual(dummyPdfBytes);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('handles server 422 compilation failure with LaTeX error logs', async () => {
    const mockFetch = vi.fn(async (): Promise<Response> => {
      return {
        ok: false,
        status: 422,
        statusText: 'Unprocessable Entity',
        headers: new Headers(),
        json: async () => ({
          error: 'Biên dịch XeLaTeX thất bại',
          engine: 'XeLaTeX CLI',
          details: '! LaTeX Error: File `custom.sty` not found.',
          rawLog: 'Full log output showing missing package...',
        }),
      } as any;
    });

    const adapter = new LocalNextCompilerAdapter({
      fetchFn: mockFetch as any,
    });

    const result = await adapter.compile({ tex: '\\usepackage{custom}' });

    expect(result.status).toBe('error');
    expect(result.error).toBe('Biên dịch XeLaTeX thất bại');
    expect(result.details).toContain('File `custom.sty` not found');
    expect(result.logs[0]).toContain('Full log output');
  });

  it('handles AbortSignal cancellation', async () => {
    const abortController = new AbortController();

    const mockFetch = vi.fn(async (_url: any, init?: RequestInit): Promise<Response> => {
      return new Promise<Response>((_, reject) => {
        init?.signal?.addEventListener('abort', () => {
          const err = new Error('The user aborted a request.');
          err.name = 'AbortError';
          reject(err);
        });
      });
    });

    const adapter = new LocalNextCompilerAdapter({
      fetchFn: mockFetch as any,
    });

    const compilePromise = adapter.compile({ tex: 'test' }, abortController.signal);
    abortController.abort();

    const result = await compilePromise;
    expect(result.status).toBe('error');
    expect(result.cancelled).toBe(true);
    expect(result.error).toBe('Compilation was aborted');
  });

  it('delegates to fallbackCompiler when endpoint returns 503 service unavailable', async () => {
    const fallback = new MockCompilerAdapter({
      engine: 'LocalTectonicFallback',
    });

    const mockFetch = vi.fn(async (): Promise<Response> => {
      return {
        ok: false,
        status: 503,
        statusText: 'Service Unavailable',
        headers: new Headers(),
        json: async () => ({ error: 'Compiler not installed' }),
      } as any;
    });

    const adapter = new LocalNextCompilerAdapter({
      fetchFn: mockFetch as any,
      fallbackCompiler: fallback,
    });

    const result = await adapter.compile({ tex: 'test' });
    expect(result.status).toBe('success');
    expect(result.engine).toBe('LocalTectonicFallback');
    expect(fallback.compileCalls.length).toBe(1);
  });
});
