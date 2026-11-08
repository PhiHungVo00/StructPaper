import type { CompileProgress, Unsubscribe } from '../interfaces/compiler-port';
import type { CompileReport } from '../interfaces/compiler-port';

export interface CompileWorkerPayload {
  tex: string;
  paperId?: string;
  images?: Record<string, string>;
  options?: Record<string, unknown>;
  files?: Array<{ path: string; content?: string | Uint8Array; [key: string]: unknown }>;
  passes?: 1 | 2;
  environmentId?: string;
}

export interface CompileWorkerResult {
  status: 'success' | 'error' | 'cancelled';
  pdfBuffer?: Uint8Array;
  logs: string[];
  report?: CompileReport;
  durationMs: number;
  error?: string;
  details?: string;
  cancelled?: boolean;
}

export interface WorkerBridgeOptions {
  /** Optional custom worker factory function (useful for tests and custom worker bundling) */
  workerFactory?: () => Worker;

  /** Pinned TeX Live environment identifier */
  environmentId?: string;

  /** Watchdog timeout in milliseconds before killing worker thread (default: 30000ms) */
  timeoutMs?: number;
}

interface ActiveJob {
  jobId: string;
  resolve: (result: CompileWorkerResult) => void;
  reject: (err: Error) => void;
  watchdogTimer: any;
  signal?: AbortSignal;
  onAbort?: () => void;
  startTime: number;
}

/**
 * WorkerBridge manages typed communication with the Web Worker running WebAssembly TeX Live,
 * handling job queuing, in-flight abort signals, and watchdog timeout recovery.
 */
export class WorkerBridge {
  private worker: Worker | null = null;
  private workerFactory: () => Worker;
  private environmentId: string;
  private timeoutMs: number;
  private activeJob: ActiveJob | null = null;
  private progressListeners: Set<(p: CompileProgress) => void> = new Set();
  private jobCounter = 0;

  constructor(options: WorkerBridgeOptions = {}) {
    this.environmentId = options.environmentId || 'tl2026.1-wasm';
    this.timeoutMs = options.timeoutMs ?? 30000;
    this.workerFactory =
      options.workerFactory ||
      (() => {
        if (typeof Worker !== 'undefined') {
          return new Worker(new URL('./worker/latex-wasm.worker', import.meta.url), {
            type: 'module',
          });
        }
        throw new Error('Web Worker is not supported in this runtime environment');
      });
  }

  /**
   * Initializes or gets the active worker instance.
   */
  private getOrCreateWorker(): Worker {
    if (!this.worker) {
      this.worker = this.workerFactory();
      this.setupWorkerListeners(this.worker);

      // Post init configuration
      this.worker.postMessage({
        type: 'init',
        payload: {
          environmentId: this.environmentId,
        },
      });
    }
    return this.worker;
  }

  private setupWorkerListeners(worker: Worker): void {
    worker.onmessage = (event: MessageEvent) => {
      const data = event.data;
      if (!data) return;

      if (data.type === 'compile-progress') {
        if (this.activeJob && this.activeJob.jobId === data.jobId) {
          for (const listener of this.progressListeners) {
            listener(data.progress);
          }
        }
        return;
      }

      if (data.type === 'compile-result') {
        if (this.activeJob && this.activeJob.jobId === data.jobId) {
          const job = this.activeJob;
          this.cleanupActiveJob();
          job.resolve(data.result);
        }
        return;
      }
    };

    worker.onerror = (error: ErrorEvent) => {
      if (this.activeJob) {
        const job = this.activeJob;
        this.cleanupActiveJob();
        job.resolve({
          status: 'error',
          error: error.message || 'Web Worker compilation error',
          logs: [error.message || 'Worker encountered unhandled error'],
          durationMs: Date.now() - job.startTime,
        });
      }
    };
  }

  /**
   * Dispatches a compilation job to the Web Worker.
   */
  public async compile(
    payload: CompileWorkerPayload,
    signal?: AbortSignal
  ): Promise<CompileWorkerResult> {
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

    const worker = this.getOrCreateWorker();
    const jobId = `job-${Date.now()}-${++this.jobCounter}`;

    return new Promise<CompileWorkerResult>((resolve, reject) => {
      // Set up watchdog timeout timer
      const watchdogTimer = setTimeout(() => {
        this.handleWatchdogTimeout(jobId);
      }, this.timeoutMs);

      let onAbort: (() => void) | undefined = undefined;
      if (signal) {
        onAbort = () => {
          this.cancelJob(jobId);
        };
        signal.addEventListener('abort', onAbort, { once: true });
      }

      this.activeJob = {
        jobId,
        resolve,
        reject,
        watchdogTimer,
        signal,
        onAbort,
        startTime,
      };

      worker.postMessage({
        type: 'compile',
        jobId,
        payload,
      });
    });
  }

  /**
   * Cancels active compilation job.
   */
  public cancelJob(jobId?: string): void {
    if (!this.activeJob) return;
    if (jobId && this.activeJob.jobId !== jobId) return;

    const job = this.activeJob;
    if (this.worker) {
      this.worker.postMessage({
        type: 'cancel',
        jobId: job.jobId,
      });
    }

    this.cleanupActiveJob();
    job.resolve({
      status: 'error',
      error: 'Compilation was aborted',
      logs: ['Job was cancelled by abort signal'],
      durationMs: Date.now() - job.startTime,
      cancelled: true,
    });
  }

  /**
   * Watchdog timeout handler: terminates hung worker thread and prepares fresh restart.
   */
  private handleWatchdogTimeout(jobId: string): void {
    if (!this.activeJob || this.activeJob.jobId !== jobId) return;

    const job = this.activeJob;
    this.cleanupActiveJob();

    // Terminate hung worker to reclaim threads and memory
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }

    job.resolve({
      status: 'error',
      error: `Compilation timed out after ${this.timeoutMs}ms (watchdog watchdog termination)`,
      logs: [`Compilation worker exceeded timeout of ${this.timeoutMs}ms`],
      durationMs: Date.now() - job.startTime,
    });
  }

  private cleanupActiveJob(): void {
    if (!this.activeJob) return;
    clearTimeout(this.activeJob.watchdogTimer);
    if (this.activeJob.signal && this.activeJob.onAbort) {
      this.activeJob.signal.removeEventListener('abort', this.activeJob.onAbort);
    }
    this.activeJob = null;
  }

  /**
   * Subscribes to compile progress updates.
   */
  public onProgress(callback: (p: CompileProgress) => void): Unsubscribe {
    this.progressListeners.add(callback);
    return () => {
      this.progressListeners.delete(callback);
    };
  }

  /**
   * Terminates active worker and cleans up all listeners and timers.
   */
  public dispose(): void {
    this.cleanupActiveJob();
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    this.progressListeners.clear();
  }
}
