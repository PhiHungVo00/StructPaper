import type { CompilerPort, CompileRequest } from './compiler-port';

/**
 * Compiler architecture classification:
 * - 'browser-wasm': In-browser WebAssembly TeX Live engine running in Web Worker.
 * - 'server-native': Remote backend compiler (XeLaTeX / compiler-worker).
 * - 'local-cli': Local workstation development CLI (XeLaTeX / Tectonic).
 */
export type CompilerKind = 'browser-wasm' | 'server-native' | 'local-cli' | (string & {});

/**
 * Standard machine-readable reason codes for compilation routing decisions.
 * Corresponds to Section 9.2 (11 Decision Rules).
 */
export type ReasonCode =
  | 'R01_FINAL_SERVER'
  | 'R02_KILL_SWITCH'
  | 'R03_PREFER_SERVER'
  | 'R03_USER_PREF_SERVER'
  | 'R04_OFFLINE_LOCAL_READY'
  | 'R05_OFFLINE_NO_ENV'
  | 'R06_SUBSTITUTE_FONTS'
  | 'R07_LOCAL_ENV_NOT_READY'
  | 'R07_ENV_NOT_READY'
  | 'R08_DEVICE_TOO_WEAK'
  | 'R09_TOO_BIG'
  | 'R09_DOCUMENT_TOO_BIG'
  | 'R10_RECENT_FAILURE'
  | 'R10_RECENT_FAILURES'
  | 'R11_DEFAULT_LOCAL'
  | 'R99_FALLBACK'
  | (string & {});

/**
 * User-facing notice or warning attached to a routing decision or capability verdict.
 * Follows error classification codes (E1 to E7) defined in Section 5.7.
 */
export interface Notice {
  /** Error or notice code: E1..E7 or custom */
  code: 'E1' | 'E2' | 'E3' | 'E4' | 'E5' | 'E6' | 'E7' | string;

  /** User-friendly message explaining the condition */
  message: string;

  /** Severity classification */
  severity?: 'error' | 'warning' | 'info';

  /** Recommended user or automatic action */
  action?: 'download' | 'switch-server' | 'retry' | string;

  /** Additional diagnostic details */
  details?: unknown;
}

/**
 * Environment and runtime context evaluated by CompilerRouter.
 * Conforms to Section 9.1 of the Two-Tier LaTeX Compiler Specification.
 */
export interface CompileContext {
  /** Whether browser currently has internet connectivity */
  online: boolean;

  /** Whether the backend compile server is reachable via health probe / API */
  serverReachable: boolean;

  /** Readiness state of local WebAssembly TeX environment */
  localEnv: 'ready' | 'downloading' | 'missing' | 'outdated';

  /** Whether local environment matches the manuscript pinned environment */
  localEnvMatches: boolean;

  /** Device benchmark score or status ('unsupported' | 'unknown' | numeric score) */
  deviceScore: number | 'unsupported' | 'unknown';

  /** Estimated page count of manuscript */
  pageEstimate: number;

  /** Total asset file size in bytes */
  assetBytes: number;

  /** Recent local compiler crash / failure records */
  recentLocalFailures: Array<{
    code: 'E2' | 'E4' | 'E7' | string;
    at: number;
  }>;

  /** User compilation preference setting ('auto' | 'local' | 'server') */
  userPreference: 'auto' | 'local' | 'server';

  /** Font parity setting ('same' or 'substitute') */
  parity: 'same' | 'substitute';

  /** Remote kill-switch flag disabling local compilation */
  localDisabledByFlag: boolean;

  /** Browser saveData mode (Save-Data header / connection.saveData) */
  saveData: boolean;

  /** Extensibility bucket for additional routing context */
  [key: string]: unknown;
}

/**
 * Routing decision returned by CompilerRouter or individual routing rules.
 */
export interface Decision {
  /** Selected target compiler kind */
  targetKind: CompilerKind;

  /** Standard reason code explaining why this decision was reached */
  reasonCode: ReasonCode;

  /** Optional human-readable rationale */
  reason?: string;

  /** The actual compiler port target instance, if available */
  target?: CompilerPort;

  /** Optional user-facing notice (e.g. E1 missing environment) */
  notice?: Notice;

  /** Extensibility bucket */
  [key: string]: unknown;
}

/**
 * Map of available compiler ports passed into routing rules.
 */
export interface RulePorts {
  local?: CompilerPort;
  server?: CompilerPort;
  [key: string]: CompilerPort | undefined;
}

/**
 * Individual pure routing rule function.
 * Evaluates a compile request and context, returning a Decision or null if skipped.
 */
export type Rule = (
  request: CompileRequest,
  context: CompileContext,
  ports?: RulePorts
) => Decision | null;
