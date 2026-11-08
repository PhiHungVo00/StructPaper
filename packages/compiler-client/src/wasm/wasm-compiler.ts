import type {
  CompilerPort,
  CompileRequest,
  CompileResult,
  CapabilityVerdict,
  CompileProgress,
  Unsubscribe,
} from '../interfaces/compiler-port';
import type {
  CompilerKind,
  CompileContext,
} from '../interfaces/compiler-router.types';
import { WorkerBridge, type WorkerBridgeOptions } from './worker-bridge';
import { parseLatexLog } from './log-parser';

export interface WasmCompilerOptions extends WorkerBridgeOptions {
  /** TeX Live WASM environment identifier (defaults to 'tl2026.1-wasm') */
  environmentId?: string;
}

/**
 * WasmCompiler implements CompilerPort ('browser-wasm') by executing LaTeX compilation
 * inside a dedicated Web Worker running WebAssembly TeX Live.
 */
export class WasmCompiler implements CompilerPort {
  public readonly kind: CompilerKind = 'browser-wasm';
  private bridge: WorkerBridge;
  private environmentId: string;

  constructor(options: WasmCompilerOptions = {}) {
    this.environmentId = options.environmentId || 'tl2026.1-wasm';
    this.bridge = new WorkerBridge({
      environmentId: this.environmentId,
      workerFactory: options.workerFactory,
      timeoutMs: options.timeoutMs,
    });
  }

  /**
   * Evaluates if this WebAssembly compiler can handle the compilation request
   * based on document mode and device/environment context.
   */
  public canHandle(
    request: CompileRequest,
    context?: CompileContext
  ): CapabilityVerdict {
    // Rule 1: Final publication mode must always run on server
    if (request.mode === 'final') {
      return {
        canHandle: false,
        reasonCode: 'R01_FINAL_SERVER',
        reason: 'Final publication compile must run on server',
      };
    }

    if (context) {
      // Rule 5: Missing local WebAssembly bundle
      if (context.localEnv === 'missing') {
        return {
          canHandle: false,
          reasonCode: 'R05_OFFLINE_NO_ENV',
          reason: 'WebAssembly TeX environment not installed',
          notice: {
            code: 'E1',
            message: 'Môi trường biên dịch WebAssembly chưa được tải',
            severity: 'error',
            action: 'download',
          },
        };
      }

      // Rule 8: Low-end device
      if (context.deviceScore === 'unsupported') {
        return {
          canHandle: false,
          reasonCode: 'R08_DEVICE_TOO_WEAK',
          reason: 'Device capabilities insufficient for WebAssembly compilation',
        };
      }

      // Rule 9: Document too large for browser WASM heap
      const pageEstimate = context.pageEstimate || 0;
      const assetBytes = context.assetBytes || 0;
      if (pageEstimate > 25 || assetBytes > 40 * 1024 * 1024) {
        return {
          canHandle: false,
          reasonCode: 'R09_DOCUMENT_TOO_BIG',
          reason: 'Document exceeds client-side memory limits (max 25 pages or 40MB assets)',
        };
      }
    }

    return {
      canHandle: true,
    };
  }

  /**
   * Compiles LaTeX source into binary PDF using in-browser WebAssembly Web Worker.
   */
  public async compile(
    request: CompileRequest,
    signal?: AbortSignal
  ): Promise<CompileResult> {
    const startTime = Date.now();

    if (signal?.aborted) {
      return {
        status: 'error',
        error: 'Compilation was aborted before start',
        logs: ['Job aborted before start'],
        durationMs: 0,
        cancelled: true,
      };
    }

    const workerResult = await this.bridge.compile(
      {
        tex: request.tex,
        paperId: request.paperId,
        images: request.images,
        options: request.options,
        files: request.files as any,
        passes: request.passes,
        environmentId: request.environmentId || this.environmentId,
      },
      signal
    );

    const report = workerResult.report || parseLatexLog(workerResult.logs, request.tex);

    let pdfBlob: Blob | undefined = undefined;
    let pdfUrl: string | undefined = undefined;

    if (workerResult.pdfBuffer) {
      if (typeof Blob !== 'undefined') {
        try {
          pdfBlob = new Blob([workerResult.pdfBuffer as unknown as BlobPart], { type: 'application/pdf' });
          if (typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function') {
            pdfUrl = URL.createObjectURL(pdfBlob);
          }
        } catch {
          // Ignore Blob creation errors in test/non-DOM environments
        }
      }
    }

    return {
      status: workerResult.status,
      pdfBuffer: workerResult.pdfBuffer,
      pdfBlob,
      pdf: pdfBlob,
      pdfUrl,
      logs: workerResult.logs,
      report,
      producedBy: {
        kind: 'browser-wasm',
        environmentId: this.environmentId,
      },
      durationMs: workerResult.durationMs ?? (Date.now() - startTime),
      error: workerResult.error,
      details: workerResult.details,
      cancelled: workerResult.cancelled,
    };
  }

  /**
   * Subscribes to compile progress notifications.
   */
  public onProgress(callback: (event: CompileProgress) => void): Unsubscribe {
    return this.bridge.onProgress(callback);
  }

  /**
   * Disposes the WebAssembly compiler and terminates background workers.
   */
  public dispose(): void {
    this.bridge.dispose();
  }
}
