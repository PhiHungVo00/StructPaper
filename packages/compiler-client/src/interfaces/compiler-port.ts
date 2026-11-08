import type {
  CompilerKind,
  CompileContext,
  ReasonCode,
  Notice,
} from './compiler-router.types';

/**
 * Detailed issue reported during compilation (TeX error, warning, box overflow, etc.)
 */
export interface CompileReportIssue {
  /** Source code line number where issue occurred */
  line?: number;

  /** Error or warning description message */
  message: string;

  /** Associated document block ID if mapped from %%BLOCK:<id> comments */
  blockId?: string;

  /** Optional machine-readable issue code */
  code?: string;

  /** Severity of issue */
  severity?: 'error' | 'warning' | 'info';

  /** Extensibility bucket */
  [key: string]: unknown;
}

/**
 * Structured diagnostic report produced by a compilation run.
 * Conforms to two-tier parity checking and QC integration requirements.
 */
export interface CompileReport {
  /** Fatal or syntax compilation errors */
  errors: CompileReportIssue[];

  /** Non-fatal compilation warnings */
  warnings: CompileReportIssue[];

  /** Count of overfull \hbox occurrences (text overflowing margins) */
  overfullHbox: number;

  /** Count of underfull \hbox occurrences */
  underfullHbox?: number;

  /** List of missing or substituted font names */
  missingFonts: string[];

  /** List of unresolved citations or cross-references */
  missingReferences: string[];

  /** List of missing image asset files */
  missingImages?: string[];

  /** List of missing LaTeX packages */
  missingPackages?: string[];

  /** Extensibility bucket */
  [key: string]: unknown;
}

/**
 * Capability evaluation verdict returned by CompilerPort.canHandle
 */
export interface CapabilityVerdict {
  /** Whether the compiler can fulfill the compilation request */
  canHandle: boolean;

  /** Human-readable explanation of capability or limitation */
  reason?: string;

  /** Standard machine-readable reason code */
  reasonCode?: ReasonCode | string;

  /** List of missing assets, packages, or environments if cannot handle */
  missing?: string[];

  /** Optional notice to surface to user */
  notice?: Notice;

  /** Extensibility bucket */
  [key: string]: unknown;
}

/**
 * Unsubscribe callback returned by event listeners.
 */
export type Unsubscribe = () => void;

/**
 * Progress notification payload during compilation.
 */
export interface CompileProgress {
  /** Current compilation phase */
  phase: 'idle' | 'preparing' | 'downloading' | 'compiling' | 'saving' | string;

  /** Approximate completion percentage (0 - 100) */
  percent?: number;

  /** Optional human-readable progress status */
  message?: string;

  /** Extensibility bucket */
  [key: string]: unknown;
}

/**
 * Request payload for compiling LaTeX documents.
 * Preserves full backward compatibility with legacy single-pass requests.
 */
export interface CompileRequest {
  /** LaTeX source code to compile */
  tex: string;

  /** Identifier of the manuscript or job */
  paperId?: string;

  /** Manuscript ID alias for compatibility with new architecture */
  manuscriptId?: string;

  /** Revision counter of the manuscript */
  rev?: number;

  /** Map of asset file names to Base64-encoded file contents */
  images?: Record<string, string>;

  /** Compilation target mode: 'draft' for fast in-browser preview, 'final' for publication */
  mode?: 'draft' | 'final';

  /** Pinned or requested TeX environment identifier */
  environmentId?: string;

  /** Number of compilation passes (1 for draft, 2 for final cross-references) */
  passes?: 1 | 2;

  /** List of files (main.tex, .bib, and asset references) */
  files?: Array<{ path: string; sha256: string; [key: string]: unknown }>;

  /** Pinned profile metadata */
  profilePin?: unknown;

  /** Optional AbortSignal to cancel in-flight compilation */
  signal?: AbortSignal;

  /** Optional compilation settings or flags */
  options?: {
    engine?: 'xelatex' | 'tectonic' | 'auto' | string;
    synctex?: boolean;
    timeoutMs?: number;
    [key: string]: unknown;
  };

  /** Extensibility bucket */
  [key: string]: unknown;
}

/**
 * Result returned by a LaTeX compiler execution.
 */
export interface CompileResult {
  /** Outcome status */
  status: 'success' | 'error' | 'cancelled' | 'ok';

  /** Binary PDF blob if produced */
  pdfBlob?: Blob;

  /** Alias for pdfBlob */
  pdf?: Blob;

  /** Object URL pointing to the generated PDF (for in-browser preview) */
  pdfUrl?: string;

  /** Raw binary bytes of the PDF */
  pdfBuffer?: Uint8Array;

  /** Compiler log output lines */
  logs: string[];

  /** Total compilation duration in milliseconds */
  durationMs: number;

  /** Structured diagnostic report */
  report?: CompileReport;

  /** Metadata identifying the exact compiler engine and environment that produced this result */
  producedBy?: {
    kind: CompilerKind | string;
    environmentId: string;
  };

  /** Name of the compiler engine utilized (e.g. 'XeLaTeX CLI', 'Tectonic', 'XeLaTeX WASM') */
  engine?: string;

  /** Optional SyncTeX synchronization metadata */
  synctexData?: unknown;

  /** Optional SyncTeX binary blob */
  synctex?: Blob;

  /** High-level error summary if compilation failed */
  error?: string;

  /** Detailed error message or stack trace */
  details?: string;

  /** Flag indicating whether the result was served from cache */
  fromCache?: boolean;

  /** Flag indicating whether compilation was cancelled or superseded */
  cancelled?: boolean;

  /** Extensibility bucket */
  [key: string]: unknown;
}

/**
 * Core interface representing a LaTeX compiler backend or client adapter.
 */
export interface CompilerPort {
  /** Compiler kind classification (browser-wasm, server-native, local-cli) */
  readonly kind?: CompilerKind;

  /**
   * Compiles LaTeX source into PDF.
   *
   * @param request The compilation parameters.
   * @param signal Optional abort signal to cancel in-flight compilation.
   * @returns Promise resolving to the compilation result.
   */
  compile(request: CompileRequest, signal?: AbortSignal): Promise<CompileResult>;

  /**
   * Evaluates if this compiler can handle the given compilation request under the current context.
   *
   * @param request The compilation parameters.
   * @param context Optional environment and network context.
   * @returns Capability verdict indicating whether compiler can handle request.
   */
  canHandle?(request: CompileRequest, context?: CompileContext): CapabilityVerdict;

  /**
   * Subscribes to compilation progress notifications.
   *
   * @param callback Progress event listener.
   * @returns Unsubscribe function.
   */
  onProgress?(callback: (event: CompileProgress) => void): Unsubscribe;
}
