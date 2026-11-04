/**
 * Request payload for compiling LaTeX documents.
 */
export interface CompileRequest {
  /** LaTeX source code to compile */
  tex: string;

  /** Identifier of the manuscript or job */
  paperId?: string;

  /** Map of asset file names to Base64-encoded file contents */
  images?: Record<string, string>;

  /** Optional compilation settings or flags */
  options?: {
    engine?: 'xelatex' | 'tectonic' | 'auto' | string;
    synctex?: boolean;
    timeoutMs?: number;
    [key: string]: unknown;
  };
}

/**
 * Result returned by a LaTeX compiler execution.
 */
export interface CompileResult {
  /** Outcome status */
  status: 'success' | 'error';

  /** Binary PDF blob if produced */
  pdfBlob?: Blob;

  /** Object URL pointing to the generated PDF (for in-browser preview) */
  pdfUrl?: string;

  /** Raw binary bytes of the PDF */
  pdfBuffer?: Uint8Array;

  /** Compiler log output lines */
  logs: string[];

  /** Total compilation duration in milliseconds */
  durationMs: number;

  /** Name of the compiler engine utilized (e.g. 'XeLaTeX CLI', 'Tectonic') */
  engine?: string;

  /** Optional SyncTeX synchronization metadata */
  synctexData?: unknown;

  /** High-level error summary if compilation failed */
  error?: string;

  /** Detailed error message or stack trace */
  details?: string;

  /** Flag indicating whether the result was served from cache */
  fromCache?: boolean;

  /** Flag indicating whether compilation was cancelled or superseded */
  cancelled?: boolean;
}

/**
 * Core interface representing a LaTeX compiler backend or client adapter.
 */
export interface CompilerPort {
  /**
   * Compiles LaTeX source into PDF.
   *
   * @param request The compilation parameters.
   * @param signal Optional abort signal to cancel in-flight compilation.
   * @returns Promise resolving to the compilation result.
   */
  compile(request: CompileRequest, signal?: AbortSignal): Promise<CompileResult>;
}
