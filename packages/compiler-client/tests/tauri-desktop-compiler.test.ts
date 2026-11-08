import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TauriDesktopCompiler, isTauriEnvironment } from '../src/adapters/tauri-desktop-compiler';

describe('TauriDesktopCompiler', () => {
  beforeEach(() => {
    delete (globalThis as any).__TAURI_INTERNALS__;
    delete (globalThis as any).__TAURI__;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('detects when Tauri environment is present vs absent', () => {
    expect(isTauriEnvironment()).toBe(false);

    (globalThis as any).__TAURI_INTERNALS__ = {};
    expect(isTauriEnvironment()).toBe(true);
  });

  it('compiles via Tauri invoke and returns valid CompileResult', async () => {
    const mockPdfBase64 = 'JVBERi0xLjQKJdDUxdgKMSAwIG9iago8PC9UeXBlL0NhdGFsb2cvUGFnZXMgMiAwIFI+PgplbmRvYmoK';
    const mockInvoke = vi.fn().mockResolvedValue({
      status: 'success',
      pdf_base64: mockPdfBase64,
      logs: ['This is Tectonic 0.17.0', 'Output written on article.pdf'],
      duration_ms: 850,
      error: null,
    });

    (globalThis as any).__TAURI_INTERNALS__ = {
      invoke: mockInvoke,
    };

    const compiler = new TauriDesktopCompiler();
    const result = await compiler.compile({
      tex: '\\documentclass{article}\\begin{document}Hello\\end{document}',
    });

    expect(mockInvoke).toHaveBeenCalledWith('compile_latex_desktop', {
      payload: {
        tex: '\\documentclass{article}\\begin{document}Hello\\end{document}',
        images: undefined,
      },
    });

    expect(result.status).toBe('success');
    expect(result.producedBy.kind).toBe('local-cli');
    expect(result.producedBy.environmentId).toBe('tauri-tectonic');
    expect(result.pdfBuffer).toBeInstanceOf(Uint8Array);
    expect(result.durationMs).toBe(850);
  });

  it('handles compilation failure from Tauri desktop gracefully', async () => {
    const mockInvoke = vi.fn().mockResolvedValue({
      status: 'error',
      pdf_base64: null,
      logs: ['! Undefined control sequence.'],
      duration_ms: 320,
      error: 'Tectonic exited with error code 1',
    });

    (globalThis as any).__TAURI_INTERNALS__ = {
      invoke: mockInvoke,
    };

    const compiler = new TauriDesktopCompiler();
    const result = await compiler.compile({
      tex: '\\invalid',
    });

    expect(result.status).toBe('error');
    expect(result.error).toContain('Tectonic exited with error code 1');
  });
});
