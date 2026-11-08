import type {
  CompilerPort,
  CompileRequest,
  CompileResult,
  CapabilityVerdict,
  CompileProgress,
  Unsubscribe,
} from '../interfaces/compiler-port';
import type {
  CompileContext,
  Decision,
  Rule,
  RulePorts,
  CompilerKind,
} from '../interfaces/compiler-router.types';
import { DEFAULT_RULES } from './rules';

/**
 * Configuration options for initializing CompilerRouter.
 */
export interface CompilerRouterOptions {
  /** Local in-browser WebAssembly compiler */
  local?: CompilerPort;

  /** Remote server-native compiler */
  server?: CompilerPort;

  /** List of compiler ports for auto-discovery */
  ports?: CompilerPort[];

  /** Custom or overridden rules list. Defaults to DEFAULT_RULES (Rules 1-11). */
  rules?: Rule[];

  /** Dynamic context provider function */
  getContext?: () => CompileContext | Promise<CompileContext>;

  /** Static default context fallback values */
  defaultContext?: Partial<CompileContext>;
}

/**
 * Creates a standard CompileContext with sensible default values.
 */
export function createDefaultContext(overrides: Partial<CompileContext> = {}): CompileContext {
  return {
    online: true,
    serverReachable: true,
    localEnv: 'ready',
    localEnvMatches: true,
    deviceScore: 100,
    pageEstimate: 5,
    assetBytes: 1024 * 1024,
    recentLocalFailures: [],
    userPreference: 'auto',
    parity: 'same',
    localDisabledByFlag: false,
    saveData: false,
    ...overrides,
  };
}

/**
 * Intelligent compiler router evaluating Section 9.2 decision rules
 * and delegating compilation to local WASM or remote server.
 */
export class CompilerRouter implements CompilerPort {
  readonly kind: CompilerKind = 'local-cli';

  private local?: CompilerPort;
  private server?: CompilerPort;
  private rules: Rule[];
  private getContextFn?: () => CompileContext | Promise<CompileContext>;
  private defaultContext: Partial<CompileContext>;
  private progressListeners = new Set<(event: CompileProgress) => void>();
  private unsubscribeUpstreams: Unsubscribe[] = [];

  constructor(
    portsOrOptions?: RulePorts | CompilerPort[] | CompilerRouterOptions,
    maybeOptions?: CompilerRouterOptions
  ) {
    let opts: CompilerRouterOptions = {};

    if (Array.isArray(portsOrOptions)) {
      const local = portsOrOptions.find((p) => p.kind === 'browser-wasm');
      const server = portsOrOptions.find((p) => p.kind === 'server-native');
      opts = { local, server, ...(maybeOptions ?? {}) };
    } else if (portsOrOptions && ('local' in portsOrOptions || 'server' in portsOrOptions || 'rules' in portsOrOptions)) {
      opts = { ...(portsOrOptions as CompilerRouterOptions), ...(maybeOptions ?? {}) };
    } else if (portsOrOptions) {
      opts = { ...(portsOrOptions as CompilerRouterOptions) };
    }

    this.local = opts.local;
    this.server = opts.server;

    if (opts.ports && opts.ports.length > 0) {
      if (!this.local) {
        this.local = opts.ports.find((p) => p.kind === 'browser-wasm');
      }
      if (!this.server) {
        this.server = opts.ports.find((p) => p.kind === 'server-native');
      }
    }

    this.rules = opts.rules ? [...opts.rules] : [...DEFAULT_RULES];
    this.getContextFn = opts.getContext;
    this.defaultContext = opts.defaultContext ?? {};

    this.bindUpstreamProgress();
  }

  private bindUpstreamProgress(): void {
    const handleProgress = (event: CompileProgress) => {
      for (const listener of this.progressListeners) {
        try {
          listener(event);
        } catch {
          // Ignore listener errors
        }
      }
    };

    if (this.local?.onProgress) {
      this.unsubscribeUpstreams.push(this.local.onProgress(handleProgress));
    }
    if (this.server?.onProgress) {
      this.unsubscribeUpstreams.push(this.server.onProgress(handleProgress));
    }
  }

  /**
   * Resolves the runtime compile context.
   */
  async resolveContext(contextOverride?: CompileContext): Promise<CompileContext> {
    if (contextOverride) {
      return contextOverride;
    }
    if (this.getContextFn) {
      const ctx = await this.getContextFn();
      return { ...createDefaultContext(this.defaultContext), ...ctx };
    }
    return createDefaultContext(this.defaultContext);
  }

  /**
   * Evaluates Section 9.2 routing rules (1 to 11) in order, falling back to R99_FALLBACK.
   */
  route(request: CompileRequest, context?: CompileContext): Decision {
    const effectiveContext = context ?? createDefaultContext(this.defaultContext);
    const ports: RulePorts = { local: this.local, server: this.server };

    for (const rule of this.rules) {
      const decision = rule(request, effectiveContext, ports);
      if (decision) {
        if (!decision.target) {
          decision.target = decision.targetKind === 'browser-wasm' ? this.local : this.server;
        }
        return decision;
      }
    }

    // R99 Fallback: Section 9.5
    return {
      targetKind: 'server-native',
      target: this.server,
      reasonCode: 'R99_FALLBACK',
      reason: 'No explicit rule matched; falling back to default server compiler',
    };
  }

  /**
   * Evaluates if compilation can be handled under current conditions.
   */
  canHandle(request: CompileRequest, context?: CompileContext): CapabilityVerdict {
    const decision = this.route(request, context);

    if (decision.reasonCode === 'R05_OFFLINE_NO_ENV') {
      return {
        canHandle: false,
        reason: decision.reason,
        reasonCode: decision.reasonCode,
        notice: decision.notice,
      };
    }

    if (decision.target?.canHandle) {
      return decision.target.canHandle(request, context);
    }

    return {
      canHandle: Boolean(decision.target),
      reasonCode: decision.reasonCode,
      ...(decision.notice ? { notice: decision.notice } : {}),
    };
  }

  /**
   * Executes compilation on the routed compiler and enriches result.
   */
  async compile(
    request: CompileRequest,
    signal?: AbortSignal,
    runtimeContext?: CompileContext
  ): Promise<CompileResult> {
    const context = await this.resolveContext(runtimeContext);
    const decision = this.route(request, context);

    // Short-circuit Rule 05 (offline missing/outdated environment)
    if (decision.reasonCode === 'R05_OFFLINE_NO_ENV') {
      const notice = decision.notice ?? {
        code: 'E1',
        message: 'Cần tải gói biên dịch trước khi dùng ngoại tuyến',
        severity: 'error',
        action: 'download',
      };

      return {
        status: 'error',
        error: notice.message,
        logs: [`[Router] ${decision.reasonCode}: ${decision.reason ?? ''}`],
        durationMs: 0,
        decision,
        reasonCode: decision.reasonCode,
        notice,
        report: {
          errors: [{ message: notice.message, code: notice.code, severity: 'error' }],
          warnings: [],
          overfullHbox: 0,
          missingFonts: [],
          missingReferences: [],
        },
        producedBy: {
          kind: decision.targetKind,
          environmentId: request.environmentId ?? 'unknown',
        },
      };
    }

    if (!decision.target) {
      return {
        status: 'error',
        error: `No compiler available for targetKind: ${decision.targetKind}`,
        logs: [`[Router] Failed to route: target compiler not configured for ${decision.targetKind}`],
        durationMs: 0,
        decision,
        reasonCode: decision.reasonCode,
        ...(decision.notice ? { notice: decision.notice } : {}),
      };
    }

    const effectiveSignal = signal ?? request.signal;
    const result = await decision.target.compile(request, effectiveSignal);

    return {
      ...result,
      decision,
      reasonCode: decision.reasonCode,
      ...(decision.notice && !result.notice ? { notice: decision.notice } : {}),
      producedBy: result.producedBy ?? {
        kind: decision.targetKind,
        environmentId: request.environmentId ?? 'default',
      },
    };
  }

  /**
   * Subscribes to progress events.
   */
  onProgress(callback: (event: CompileProgress) => void): Unsubscribe {
    this.progressListeners.add(callback);
    return () => {
      this.progressListeners.delete(callback);
    };
  }

  /**
   * Disposes subscriptions.
   */
  dispose(): void {
    for (const unsubscribe of this.unsubscribeUpstreams) {
      try {
        unsubscribe();
      } catch {
        // Ignore dispose errors
      }
    }
    this.unsubscribeUpstreams = [];
    this.progressListeners.clear();
  }
}
