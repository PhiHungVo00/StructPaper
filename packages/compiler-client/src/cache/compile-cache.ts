import type {
  CompileRequest,
  CompileResult,
  CompileReport,
} from '../interfaces/compiler-port';
import { computeSha256 } from '../utils/hash-utils';

/**
 * Interface for optional persistent storage backing (IndexedDB, Dexie, etc.)
 */
export interface CompileCachePersistentBacking {
  get(key: string): Promise<CompileResult | null | undefined> | CompileResult | null | undefined;
  set(key: string, result: CompileResult): Promise<void> | void;
  delete?(key: string): Promise<void> | void;
  clear?(): Promise<void> | void;
}

export interface CompileCacheOptions {
  /** Maximum number of items in in-memory LRU cache. Default: 50 */
  maxEntries?: number;

  /** Optional persistent storage backing */
  storage?: CompileCachePersistentBacking;

  /** Optional Time-To-Live in milliseconds */
  ttlMs?: number;
}

interface CacheEntry {
  result: CompileResult;
  timestamp: number;
}

/**
 * Computes a deterministic canonical SHA-256 cache key from (tex, images, mode, environmentId).
 */
export function computeCompileCacheKey(req: {
  tex: string;
  images?: Record<string, string>;
  mode?: string;
  environmentId?: string;
  [key: string]: unknown;
}): string {
  let sortedImages: [string, string][] = [];
  if (req.images) {
    sortedImages = Object.entries(req.images).sort(([a], [b]) => a.localeCompare(b));
  }

  const canonicalPayload = JSON.stringify({
    tex: req.tex ?? '',
    images: sortedImages,
    mode: req.mode ?? 'draft',
    environmentId: req.environmentId ?? '',
  });

  return computeSha256(canonicalPayload);
}

/**
 * Deep-clones a CompileResult to isolate cached instances and marks fromCache flag.
 */
function cloneCompileResult(result: CompileResult, markFromCache: boolean): CompileResult {
  let clonedBuffer: Uint8Array | undefined;
  let clonedBlob: Blob | undefined;
  let clonedUrl: string | undefined;

  if (result.pdfBuffer) {
    clonedBuffer = new Uint8Array(result.pdfBuffer);
    if (typeof Blob !== 'undefined') {
      try {
        clonedBlob = new Blob([clonedBuffer as unknown as BlobPart], { type: 'application/pdf' });
        if (typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function') {
          clonedUrl = URL.createObjectURL(clonedBlob);
        }
      } catch {
        // Ignore Blob / URL errors in non-browser environments
      }
    }
  }

  let clonedReport: CompileReport | undefined;
  if (result.report) {
    clonedReport = {
      errors: result.report.errors.map((e) => ({ ...e })),
      warnings: result.report.warnings.map((w) => ({ ...w })),
      overfullHbox: result.report.overfullHbox,
      underfullHbox: result.report.underfullHbox,
      missingFonts: [...result.report.missingFonts],
      missingReferences: [...result.report.missingReferences],
      missingImages: result.report.missingImages ? [...result.report.missingImages] : undefined,
      missingPackages: result.report.missingPackages ? [...result.report.missingPackages] : undefined,
    };
  }

  return {
    ...result,
    pdfBuffer: clonedBuffer,
    pdfBlob: clonedBlob ?? result.pdfBlob,
    pdf: clonedBlob ?? result.pdf,
    pdfUrl: clonedUrl ?? result.pdfUrl,
    logs: [...result.logs],
    report: clonedReport,
    producedBy: result.producedBy ? { ...result.producedBy } : undefined,
    fromCache: markFromCache ? true : result.fromCache,
  };
}

/**
 * CompileCache manages compilation artifacts with an in-memory LRU cache
 * and optional persistent backing (e.g. IndexedDB).
 */
export class CompileCache {
  private readonly maxEntries: number;
  private readonly storage?: CompileCachePersistentBacking;
  private readonly ttlMs?: number;
  private readonly memory = new Map<string, CacheEntry>();

  constructor(options: CompileCacheOptions = {}) {
    this.maxEntries = Math.max(1, options.maxEntries ?? 50);
    this.storage = options.storage;
    this.ttlMs = options.ttlMs;
  }

  /**
   * Current number of entries in the in-memory cache.
   */
  public get size(): number {
    return this.memory.size;
  }

  /**
   * Computes deterministic SHA-256 cache key for a request.
   */
  public computeKey(request: CompileRequest): string {
    return computeCompileCacheKey(request);
  }

  /**
   * Static helper to compute deterministic SHA-256 cache key for a request.
   */
  public static computeCacheKey(request: CompileRequest): string {
    return computeCompileCacheKey(request);
  }

  /**
   * Retrieves a cached compilation result by CompileRequest or SHA-256 hash key.
   * Returns a cloned result marked with fromCache: true, or null on cache miss.
   */
  public async get(keyOrRequest: string | CompileRequest): Promise<CompileResult | null> {
    const key = typeof keyOrRequest === 'string' ? keyOrRequest : this.computeKey(keyOrRequest);

    // 1. Check in-memory LRU cache
    if (this.memory.has(key)) {
      const entry = this.memory.get(key)!;

      // Check TTL
      if (this.ttlMs !== undefined && Date.now() - entry.timestamp > this.ttlMs) {
        this.memory.delete(key);
        if (this.storage?.delete) {
          await this.storage.delete(key);
        }
        return null;
      }

      // Refresh LRU order (delete & re-set puts it at the end of iteration)
      this.memory.delete(key);
      this.memory.set(key, entry);

      return cloneCompileResult(entry.result, true);
    }

    // 2. Check persistent backing store if configured
    if (this.storage) {
      const stored = await this.storage.get(key);
      if (stored) {
        this.setMemory(key, stored);
        return cloneCompileResult(stored, true);
      }
    }

    return null;
  }

  /**
   * Stores a compilation result in cache.
   */
  public async set(
    keyOrRequest: string | CompileRequest,
    result: CompileResult
  ): Promise<void> {
    const key = typeof keyOrRequest === 'string' ? keyOrRequest : this.computeKey(keyOrRequest);

    this.setMemory(key, result);

    if (this.storage) {
      await this.storage.set(key, cloneCompileResult(result, false));
    }
  }

  /**
   * Checks whether a cache entry exists and is not expired.
   */
  public async has(keyOrRequest: string | CompileRequest): Promise<boolean> {
    const item = await this.get(keyOrRequest);
    return item !== null;
  }

  /**
   * Removes an entry from both in-memory cache and persistent storage.
   */
  public async delete(keyOrRequest: string | CompileRequest): Promise<boolean> {
    const key = typeof keyOrRequest === 'string' ? keyOrRequest : this.computeKey(keyOrRequest);
    const deletedFromMemory = this.memory.delete(key);

    if (this.storage?.delete) {
      await this.storage.delete(key);
    }

    return deletedFromMemory;
  }

  /**
   * Clears all entries from both in-memory cache and persistent storage.
   */
  public async clear(): Promise<void> {
    this.memory.clear();

    if (this.storage?.clear) {
      await this.storage.clear();
    }
  }

  private setMemory(key: string, result: CompileResult): void {
    if (this.memory.has(key)) {
      this.memory.delete(key);
    }

    this.memory.set(key, {
      result: cloneCompileResult(result, false),
      timestamp: Date.now(),
    });

    // Enforce LRU capacity limit
    if (this.memory.size > this.maxEntries) {
      const oldestKey = this.memory.keys().next().value;
      if (oldestKey !== undefined) {
        this.memory.delete(oldestKey);
      }
    }
  }
}
