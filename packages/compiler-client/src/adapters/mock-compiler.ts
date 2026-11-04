import type {
  CompilerPort,
  CompileRequest,
  CompileResult,
} from '../interfaces/compiler-port';

export interface MockCompilerOptions {
  delayMs?: number;
  engine?: string;
  resultProducer?: (request: CompileRequest, signal?: AbortSignal) => Promise<CompileResult> | CompileResult;
  shouldFail?: boolean;
  errorMessage?: string;
}

/**
 * MockCompilerAdapter provides a configurable in-memory compiler for tests
 * with support for artificial delay, custom responses, and abort signal tracking.
 */
export class MockCompilerAdapter implements CompilerPort {
  public compileCalls: Array<{ request: CompileRequest; signal?: AbortSignal }> = [];
  private options: MockCompilerOptions;

  constructor(options: MockCompilerOptions = {}) {
    this.options = options;
  }

  public setOptions(options: Partial<MockCompilerOptions>): void {
    this.options = { ...this.options, ...options };
  }

  public async compile(
    request: CompileRequest,
    signal?: AbortSignal
  ): Promise<CompileResult> {
    this.compileCalls.push({ request, signal });
    const startTime = Date.now();

    if (signal?.aborted) {
      return {
        status: 'error',
        error: 'Aborted before start',
        logs: ['Job aborted before start'],
        durationMs: 0,
        cancelled: true,
      };
    }

    if (this.options.delayMs && this.options.delayMs > 0) {
      await new Promise<void>((resolve, reject) => {
        const timer = setTimeout(() => {
          cleanup();
          resolve();
        }, this.options.delayMs);

        const onAbort = () => {
          cleanup();
          reject(new Error('Operation aborted'));
        };

        const cleanup = () => {
          clearTimeout(timer);
          signal?.removeEventListener('abort', onAbort);
        };

        signal?.addEventListener('abort', onAbort);
      }).catch((e) => {
        if (signal?.aborted) {
          return;
        }
        throw e;
      });
    }

    if (signal?.aborted) {
      return {
        status: 'error',
        error: 'Compilation was aborted',
        logs: ['Job aborted during execution'],
        durationMs: Date.now() - startTime,
        cancelled: true,
      };
    }

    if (this.options.resultProducer) {
      return this.options.resultProducer(request, signal);
    }

    if (this.options.shouldFail) {
      return {
        status: 'error',
        error: this.options.errorMessage || 'Simulated compiler error',
        logs: [this.options.errorMessage || 'Simulated compiler error'],
        durationMs: Date.now() - startTime,
        engine: this.options.engine || 'MockEngine',
      };
    }

    const dummyPdf = new Uint8Array([0x25, 0x50, 0x44, 0x46]); // %PDF
    return {
      status: 'success',
      pdfBuffer: dummyPdf,
      logs: ['Mock compilation completed successfully'],
      durationMs: Date.now() - startTime,
      engine: this.options.engine || 'MockEngine',
    };
  }
}
