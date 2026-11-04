import type {
  CompilerPort,
  CompileRequest,
  CompileResult,
} from '../interfaces/compiler-port';
import { hashCompileRequest } from '../utils/hash-utils';

export type CompileStatus =
  | 'idle'
  | 'debouncing'
  | 'compiling'
  | 'success'
  | 'error';

export interface CompileStatusContext {
  result?: CompileResult;
  error?: unknown;
  requestId?: string;
  fromCache?: boolean;
}

export type CompileStatusListener = (
  status: CompileStatus,
  context?: CompileStatusContext
) => void;

export class CompileAbortError extends Error {
  readonly code = 'COMPILE_ABORTED';
  constructor(message = 'Compilation was cancelled or superseded') {
    super(message);
    this.name = 'CompileAbortError';
  }
}

export interface CompileSchedulerOptions {
  /** Underlying compiler adapter */
  compiler: CompilerPort;

  /** Debounce delay in milliseconds (default: 500ms) */
  debounceMs?: number;

  /** Maximum number of compiled results to keep in cache (default: 50) */
  maxCacheSize?: number;

  /** If true, rejects promises on error/abort instead of resolving to CompileResult with status 'error' */
  throwOnError?: boolean;

  /** Initial listener for status changes */
  onStatusChange?: CompileStatusListener;
}

interface PendingJob {
  request: CompileRequest;
  resolve: (res: CompileResult) => void;
  reject: (err: unknown) => void;
  throwOnError: boolean;
  scheduledAt: number;
}

/**
 * CompileScheduler manages compilation debouncing, cancellation of stale jobs via AbortController,
 * SHA-256 result caching, and lifecycle state emission.
 */
export class CompileScheduler {
  private readonly compiler: CompilerPort;
  private readonly debounceMs: number;
  private readonly maxCacheSize: number;
  private readonly defaultThrowOnError: boolean;

  private status: CompileStatus = 'idle';
  private listeners = new Set<CompileStatusListener>();

  // Debounce state
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private pendingJob: PendingJob | null = null;

  // Active compilation state
  private currentAbortController: AbortController | null = null;
  private isCompiling = false;

  // Cache: hash -> CompileResult
  private cache = new Map<string, CompileResult>();

  constructor(options: CompileSchedulerOptions) {
    this.compiler = options.compiler;
    this.debounceMs = options.debounceMs ?? 500;
    this.maxCacheSize = options.maxCacheSize ?? 50;
    this.defaultThrowOnError = options.throwOnError ?? false;

    if (options.onStatusChange) {
      this.listeners.add(options.onStatusChange);
    }
  }

  /**
   * Current lifecycle status.
   */
  public getStatus(): CompileStatus {
    return this.status;
  }

  /**
   * Subscribe to status changes. Returns an unsubscribe function.
   */
  public onStatusChange(listener: CompileStatusListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Schedule a compilation with debounce.
   * If an identical request exists in the cache, returns it immediately without debouncing.
   */
  public schedule(
    request: CompileRequest,
    options?: { throwOnError?: boolean }
  ): Promise<CompileResult> {
    const throwOnError = options?.throwOnError ?? this.defaultThrowOnError;

    // 1. Check cache immediately
    const hash = hashCompileRequest(request);
    const cached = this.cache.get(hash);
    if (cached) {
      const cachedResult: CompileResult = {
        ...cached,
        fromCache: true,
      };
      this.setStatus('success', { result: cachedResult, fromCache: true });
      return Promise.resolve(cachedResult);
    }

    // 2. Clear previous pending debounce job
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }

    if (this.pendingJob) {
      const supersededResult: CompileResult = {
        status: 'error',
        error: 'Compilation superseded by newer request',
        logs: ['Debounced: superseded by newer compile request'],
        durationMs: 0,
        cancelled: true,
      };

      if (this.pendingJob.throwOnError) {
        this.pendingJob.reject(new CompileAbortError('Superseded by newer request'));
      } else {
        this.pendingJob.resolve(supersededResult);
      }
      this.pendingJob = null;
    }

    this.setStatus('debouncing');

    return new Promise<CompileResult>((resolve, reject) => {
      this.pendingJob = {
        request,
        resolve,
        reject,
        throwOnError,
        scheduledAt: Date.now(),
      };

      this.debounceTimer = setTimeout(() => {
        this.debounceTimer = null;
        const job = this.pendingJob;
        this.pendingJob = null;
        if (job) {
          this.executeCompile(job.request, job.resolve, job.reject, job.throwOnError);
        }
      }, this.debounceMs);
    });
  }

  /**
   * Immediately compiles the request, bypassing the debounce timer.
   */
  public async compileNow(
    request: CompileRequest,
    options?: { throwOnError?: boolean }
  ): Promise<CompileResult> {
    const throwOnError = options?.throwOnError ?? this.defaultThrowOnError;

    // Check cache
    const hash = hashCompileRequest(request);
    const cached = this.cache.get(hash);
    if (cached) {
      const cachedResult: CompileResult = {
        ...cached,
        fromCache: true,
      };
      this.setStatus('success', { result: cachedResult, fromCache: true });
      return cachedResult;
    }

    // Clear debounce timer if active
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }

    if (this.pendingJob) {
      const supersededResult: CompileResult = {
        status: 'error',
        error: 'Compilation superseded by compileNow call',
        logs: ['Debounced: superseded by compileNow call'],
        durationMs: 0,
        cancelled: true,
      };
      if (this.pendingJob.throwOnError) {
        this.pendingJob.reject(new CompileAbortError('Superseded by compileNow call'));
      } else {
        this.pendingJob.resolve(supersededResult);
      }
      this.pendingJob = null;
    }

    return new Promise<CompileResult>((resolve, reject) => {
      this.executeCompile(request, resolve, reject, throwOnError);
    });
  }

  /**
   * Internal execution of a compile job.
   * Cancels in-flight job if one is running.
   */
  private async executeCompile(
    request: CompileRequest,
    resolve: (res: CompileResult) => void,
    reject: (err: unknown) => void,
    throwOnError: boolean
  ): Promise<void> {
    // Abort in-flight compilation if one is active
    if (this.isCompiling && this.currentAbortController) {
      this.currentAbortController.abort();
    }

    const abortController = new AbortController();
    this.currentAbortController = abortController;
    this.isCompiling = true;
    this.setStatus('compiling');

    const startTime = Date.now();
    const hash = hashCompileRequest(request);

    try {
      const result = await this.compiler.compile(request, abortController.signal);

      // Check if job was aborted while awaiting
      if (abortController.signal.aborted) {
        const abortedResult: CompileResult = {
          status: 'error',
          error: 'Compilation was aborted',
          logs: ['Compilation aborted by newer request'],
          durationMs: Date.now() - startTime,
          cancelled: true,
        };
        if (throwOnError) {
          reject(new CompileAbortError('Compilation was aborted'));
        } else {
          resolve(abortedResult);
        }
        return;
      }

      if (result.status === 'success') {
        this.addToCache(hash, result);
        this.setStatus('success', { result, fromCache: false });
        resolve(result);
      } else {
        this.setStatus('error', { result, error: result.error });
        if (throwOnError) {
          reject(new Error(result.error || 'Compilation failed'));
        } else {
          resolve(result);
        }
      }
    } catch (err: unknown) {
      const isAbort =
        abortController.signal.aborted ||
        (err instanceof Error && err.name === 'AbortError');

      if (isAbort) {
        const abortedResult: CompileResult = {
          status: 'error',
          error: 'Compilation was aborted',
          logs: ['Compilation aborted by newer request'],
          durationMs: Date.now() - startTime,
          cancelled: true,
        };
        if (throwOnError) {
          reject(new CompileAbortError('Compilation was aborted'));
        } else {
          resolve(abortedResult);
        }
      } else {
        const errorMsg = err instanceof Error ? err.message : String(err);
        const errorResult: CompileResult = {
          status: 'error',
          error: errorMsg,
          logs: [errorMsg],
          durationMs: Date.now() - startTime,
        };
        this.setStatus('error', { result: errorResult, error: err });
        if (throwOnError) {
          reject(err);
        } else {
          resolve(errorResult);
        }
      }
    } finally {
      if (this.currentAbortController === abortController) {
        this.currentAbortController = null;
        this.isCompiling = false;
      }
    }
  }

  /**
   * Adds a successful compile result to the hash cache, evicting the oldest entry if full.
   */
  private addToCache(hash: string, result: CompileResult): void {
    if (this.cache.size >= this.maxCacheSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }
    this.cache.set(hash, result);
  }

  /**
   * Retrieves a cached compile result for the given request if available.
   */
  public getCached(request: CompileRequest): CompileResult | undefined {
    const hash = hashCompileRequest(request);
    const cached = this.cache.get(hash);
    return cached ? { ...cached, fromCache: true } : undefined;
  }

  /**
   * Current number of cached compile outputs.
   */
  public getCacheSize(): number {
    return this.cache.size;
  }

  /**
   * Clears the result cache.
   */
  public clearCache(): void {
    this.cache.clear();
  }

  /**
   * Cancels any pending debounce timer and in-flight compile job.
   */
  public cancel(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }

    if (this.pendingJob) {
      const cancelledResult: CompileResult = {
        status: 'error',
        error: 'Compilation cancelled',
        logs: ['Cancelled by scheduler.cancel()'],
        durationMs: 0,
        cancelled: true,
      };
      if (this.pendingJob.throwOnError) {
        this.pendingJob.reject(new CompileAbortError('Compilation cancelled'));
      } else {
        this.pendingJob.resolve(cancelledResult);
      }
      this.pendingJob = null;
    }

    if (this.currentAbortController) {
      this.currentAbortController.abort();
      this.currentAbortController = null;
    }

    this.isCompiling = false;
    this.setStatus('idle');
  }

  /**
   * Disposes scheduler resources, unregisters all listeners, and cancels jobs.
   */
  public dispose(): void {
    this.cancel();
    this.clearCache();
    this.listeners.clear();
  }

  private setStatus(status: CompileStatus, context?: CompileStatusContext): void {
    this.status = status;
    for (const listener of this.listeners) {
      try {
        listener(status, context);
      } catch (e) {
        console.warn('CompileScheduler listener error:', e);
      }
    }
  }
}
