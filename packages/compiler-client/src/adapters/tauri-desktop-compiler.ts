import type {
  CompilerPort,
  CompileRequest,
  CompileResult,
} from '../interfaces/compiler-port';
import { parseLatexLog } from '../wasm/log-parser';

/**
 * Checks if the current execution context is inside a Tauri Desktop WebView.
 */
export function isTauriEnvironment(): boolean {
  if (typeof window === 'undefined' && typeof globalThis === 'undefined') return false;
  const g: any = typeof window !== 'undefined' ? window : globalThis;
  return Boolean(g.__TAURI_INTERNALS__ || g.__TAURI__ || g.__TAURI_METADATA__);
}

/**
 * Converts a base64 string to Uint8Array in browser and Node environments.
 */
function base64ToUint8Array(base64: string): Uint8Array {
  if (typeof atob === 'function') {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  }
  return new Uint8Array(Buffer.from(base64, 'base64'));
}

export class TauriDesktopCompiler implements CompilerPort {
  readonly id = 'tauri-tectonic';
  readonly name = 'Tauri Desktop Tectonic Engine';

  async compile(request: CompileRequest): Promise<CompileResult> {
    const startTime = Date.now();
    const g: any = typeof window !== 'undefined' ? window : globalThis;

    if (!isTauriEnvironment() || !g.__TAURI_INTERNALS__?.invoke) {
      return {
        status: 'error',
        logs: ['Tauri environment not detected'],
        error: 'Tauri Desktop environment not available',
        producedBy: {
          kind: 'local-cli',
          environmentId: this.id,
        },
        durationMs: Date.now() - startTime,
      };
    }

    try {
      const response = await g.__TAURI_INTERNALS__.invoke('compile_latex_desktop', {
        payload: {
          tex: request.tex,
          images: request.images,
        },
      });

      const durationMs = response.duration_ms ?? Date.now() - startTime;
      const logs = response.logs ?? [];
      const report = parseLatexLog(logs, request.tex);

      if (response.status === 'success' && response.pdf_base64) {
        const pdfBytes = base64ToUint8Array(response.pdf_base64);
        let pdfBlob: Blob | undefined;
        let pdfUrl: string | undefined;

        if (typeof Blob !== 'undefined') {
          pdfBlob = new Blob([pdfBytes as any], { type: 'application/pdf' });
          if (typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function') {
            pdfUrl = URL.createObjectURL(pdfBlob);
          }
        }

        return {
          status: 'success',
          pdfBuffer: pdfBytes,
          pdfBlob,
          pdfUrl,
          logs,
          report,
          producedBy: {
            kind: 'local-cli',
            environmentId: this.id,
          },
          durationMs,
        };
      }

      return {
        status: 'error',
        logs,
        report,
        error: response.error || 'Desktop compilation failed',
        producedBy: {
          kind: 'local-cli',
          environmentId: this.id,
        },
        durationMs,
      };
    } catch (err: any) {
      return {
        status: 'error',
        logs: [err?.message || String(err)],
        error: err?.message || 'Error executing desktop compilation',
        producedBy: {
          kind: 'local-cli',
          environmentId: this.id,
        },
        durationMs: Date.now() - startTime,
      };
    }
  }
}
