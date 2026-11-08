import { describe, it, expect, vi } from 'vitest';
import type {
  CompilerPort,
  CompileRequest,
  CompileResult,
  CapabilityVerdict,
  CompileProgress,
} from '../src/interfaces/compiler-port';
import type {
  CompileContext,
  Decision,
  RulePorts,
} from '../src/interfaces/compiler-router.types';

import {
  finalGoesToServer,
  killSwitch,
  preferServer,
  offlineLocal,
  offlineNoEnv,
  substituteFonts,
  envNotReady,
  deviceTooWeak,
  tooBig,
  recentFailure,
  defaultLocal,
  DEFAULT_RULES,
  CompilerRouter,
} from '../src/router';

function createMockContext(overrides: Partial<CompileContext> = {}): CompileContext {
  return {
    online: true,
    serverReachable: true,
    localEnv: 'ready',
    localEnvMatches: true,
    deviceScore: 80,
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

function createMockCompiler(
  kind: 'browser-wasm' | 'server-native',
  customResult?: Partial<CompileResult>
): CompilerPort {
  let progressCb: ((e: CompileProgress) => void) | undefined;
  return {
    kind,
    canHandle: vi.fn((req: CompileRequest, ctx?: CompileContext): CapabilityVerdict => ({
      canHandle: true,
    })),
    compile: vi.fn(async (req: CompileRequest, signal?: AbortSignal): Promise<CompileResult> => {
      if (progressCb) {
        progressCb({ phase: 'compiling', percent: 50, message: 'Working...' });
      }
      return {
        status: 'success',
        logs: [`Compiled via ${kind}`],
        durationMs: 150,
        producedBy: {
          kind,
          environmentId: req.environmentId ?? 'env-test',
        },
        ...customResult,
      };
    }),
    onProgress: vi.fn((cb: (e: CompileProgress) => void) => {
      progressCb = cb;
      return () => {
        progressCb = undefined;
      };
    }),
  };
}

describe('CompilerRouter Decision Rules (Table 9.2 & Section 9)', () => {
  const localMock = createMockCompiler('browser-wasm');
  const serverMock = createMockCompiler('server-native');
  const ports: RulePorts = { local: localMock, server: serverMock };
  const baseReq: CompileRequest = { tex: '\\documentclass{article}\\begin{document}Hi\\end{document}' };

  describe('Rule 01: finalGoesToServer (R01_FINAL_SERVER)', () => {
    it('routes mode=final to server when online', () => {
      const req: CompileRequest = { ...baseReq, mode: 'final' };
      const ctx = createMockContext({ online: true });
      const decision = finalGoesToServer(req, ctx, ports);

      expect(decision).not.toBeNull();
      expect(decision?.targetKind).toBe('server-native');
      expect(decision?.reasonCode).toBe('R01_FINAL_SERVER');
      expect(decision?.target).toBe(serverMock);
    });

    it('attaches queuing notice when mode=final and offline', () => {
      const req: CompileRequest = { ...baseReq, mode: 'final' };
      const ctx = createMockContext({ online: false });
      const decision = finalGoesToServer(req, ctx, ports);

      expect(decision).not.toBeNull();
      expect(decision?.targetKind).toBe('server-native');
      expect(decision?.reasonCode).toBe('R01_FINAL_SERVER');
      expect(decision?.notice).toBeDefined();
    });

    it('returns null when mode is draft or not final', () => {
      const req: CompileRequest = { ...baseReq, mode: 'draft' };
      const ctx = createMockContext();
      expect(finalGoesToServer(req, ctx, ports)).toBeNull();
    });
  });

  describe('Rule 02: killSwitch (R02_KILL_SWITCH)', () => {
    it('routes to server when localDisabledByFlag is true and online', () => {
      const ctx = createMockContext({ localDisabledByFlag: true, online: true });
      const decision = killSwitch(baseReq, ctx, ports);

      expect(decision).not.toBeNull();
      expect(decision?.targetKind).toBe('server-native');
      expect(decision?.reasonCode).toBe('R02_KILL_SWITCH');
    });

    it('attaches warning notice when localDisabledByFlag is true and offline', () => {
      const ctx = createMockContext({ localDisabledByFlag: true, online: false });
      const decision = killSwitch(baseReq, ctx, ports);

      expect(decision).not.toBeNull();
      expect(decision?.targetKind).toBe('server-native');
      expect(decision?.reasonCode).toBe('R02_KILL_SWITCH');
      expect(decision?.notice?.severity).toBe('error');
    });

    it('returns null when localDisabledByFlag is false', () => {
      const ctx = createMockContext({ localDisabledByFlag: false });
      expect(killSwitch(baseReq, ctx, ports)).toBeNull();
    });
  });

  describe('Rule 03: preferServer (R03_PREFER_SERVER)', () => {
    it('routes to server when userPreference is server and online', () => {
      const ctx = createMockContext({ userPreference: 'server', online: true });
      const decision = preferServer(baseReq, ctx, ports);

      expect(decision).not.toBeNull();
      expect(decision?.targetKind).toBe('server-native');
      expect(decision?.reasonCode).toBe('R03_PREFER_SERVER');
    });

    it('returns null when userPreference is server but offline (allowing offline fallback)', () => {
      const ctx = createMockContext({ userPreference: 'server', online: false });
      expect(preferServer(baseReq, ctx, ports)).toBeNull();
    });

    it('returns null when userPreference is auto or local', () => {
      const ctxAuto = createMockContext({ userPreference: 'auto' });
      const ctxLocal = createMockContext({ userPreference: 'local' });
      expect(preferServer(baseReq, ctxAuto, ports)).toBeNull();
      expect(preferServer(baseReq, ctxLocal, ports)).toBeNull();
    });
  });

  describe('Rule 04: offlineLocal (R04_OFFLINE_LOCAL_READY)', () => {
    it('routes to local when offline and localEnv is ready and matches', () => {
      const ctx = createMockContext({
        online: false,
        localEnv: 'ready',
        localEnvMatches: true,
      });
      const decision = offlineLocal(baseReq, ctx, ports);

      expect(decision).not.toBeNull();
      expect(decision?.targetKind).toBe('browser-wasm');
      expect(decision?.reasonCode).toBe('R04_OFFLINE_LOCAL_READY');
      expect(decision?.target).toBe(localMock);
    });

    it('returns null when online', () => {
      const ctx = createMockContext({
        online: true,
        localEnv: 'ready',
        localEnvMatches: true,
      });
      expect(offlineLocal(baseReq, ctx, ports)).toBeNull();
    });

    it('returns null when offline but localEnv is not ready', () => {
      const ctx = createMockContext({
        online: false,
        localEnv: 'downloading',
        localEnvMatches: true,
      });
      expect(offlineLocal(baseReq, ctx, ports)).toBeNull();
    });

    it('returns null when offline but localEnv does not match', () => {
      const ctx = createMockContext({
        online: false,
        localEnv: 'ready',
        localEnvMatches: false,
      });
      expect(offlineLocal(baseReq, ctx, ports)).toBeNull();
    });
  });

  describe('Rule 05: offlineNoEnv (R05_OFFLINE_NO_ENV)', () => {
    it('returns E1 notice when offline and localEnv is not ready', () => {
      const ctx = createMockContext({
        online: false,
        localEnv: 'missing',
        localEnvMatches: false,
      });
      const decision = offlineNoEnv(baseReq, ctx, ports);

      expect(decision).not.toBeNull();
      expect(decision?.reasonCode).toBe('R05_OFFLINE_NO_ENV');
      expect(decision?.notice?.code).toBe('E1');
      expect(decision?.notice?.action).toBe('download');
    });

    it('returns E1 notice when offline and localEnv is ready but mismatched', () => {
      const ctx = createMockContext({
        online: false,
        localEnv: 'ready',
        localEnvMatches: false,
      });
      const decision = offlineNoEnv(baseReq, ctx, ports);

      expect(decision).not.toBeNull();
      expect(decision?.reasonCode).toBe('R05_OFFLINE_NO_ENV');
      expect(decision?.notice?.code).toBe('E1');
    });

    it('returns null when online', () => {
      const ctx = createMockContext({
        online: true,
        localEnv: 'missing',
      });
      expect(offlineNoEnv(baseReq, ctx, ports)).toBeNull();
    });
  });

  describe('Rule 06: substituteFonts (R06_SUBSTITUTE_FONTS)', () => {
    it('routes to server when parity=substitute, layoutCheck is requested, and online', () => {
      const req: CompileRequest = { ...baseReq, options: { layoutCheck: true } };
      const ctx = createMockContext({ parity: 'substitute', online: true });
      const decision = substituteFonts(req, ctx, ports);

      expect(decision).not.toBeNull();
      expect(decision?.targetKind).toBe('server-native');
      expect(decision?.reasonCode).toBe('R06_SUBSTITUTE_FONTS');
    });

    it('routes to local with preview font warning notice when offline and layoutCheck requested', () => {
      const req: CompileRequest = { ...baseReq, options: { layoutCheck: true } };
      const ctx = createMockContext({ parity: 'substitute', online: false });
      const decision = substituteFonts(req, ctx, ports);

      expect(decision).not.toBeNull();
      expect(decision?.targetKind).toBe('browser-wasm');
      expect(decision?.reasonCode).toBe('R06_SUBSTITUTE_FONTS');
      expect(decision?.notice?.code).toBe('E5');
    });

    it('returns null when parity=substitute but no layout check is requested', () => {
      const req: CompileRequest = { ...baseReq };
      const ctx = createMockContext({ parity: 'substitute' });
      expect(substituteFonts(req, ctx, ports)).toBeNull();
    });

    it('returns null when parity=same', () => {
      const req: CompileRequest = { ...baseReq, options: { layoutCheck: true } };
      const ctx = createMockContext({ parity: 'same' });
      expect(substituteFonts(req, ctx, ports)).toBeNull();
    });
  });

  describe('Rule 07: envNotReady (R07_ENV_NOT_READY)', () => {
    it('routes to server with download suggestion when online and env is missing/downloading', () => {
      const ctx = createMockContext({ online: true, localEnv: 'downloading' });
      const decision = envNotReady(baseReq, ctx, ports);

      expect(decision).not.toBeNull();
      expect(decision?.targetKind).toBe('server-native');
      expect(decision?.reasonCode).toBe('R07_ENV_NOT_READY');
      expect(decision?.notice?.code).toBe('E1');
    });

    it('routes to server when online and localEnvMatches is false', () => {
      const ctx = createMockContext({
        online: true,
        localEnv: 'ready',
        localEnvMatches: false,
      });
      const decision = envNotReady(baseReq, ctx, ports);

      expect(decision).not.toBeNull();
      expect(decision?.targetKind).toBe('server-native');
      expect(decision?.reasonCode).toBe('R07_ENV_NOT_READY');
    });

    it('returns null when online and localEnv is ready and matches', () => {
      const ctx = createMockContext({ online: true, localEnv: 'ready', localEnvMatches: true });
      expect(envNotReady(baseReq, ctx, ports)).toBeNull();
    });

    it('returns null when offline', () => {
      const ctx = createMockContext({ online: false, localEnv: 'missing' });
      expect(envNotReady(baseReq, ctx, ports)).toBeNull();
    });
  });

  describe('Rule 08: deviceTooWeak (R08_DEVICE_TOO_WEAK)', () => {
    it('routes to server when deviceScore is unsupported', () => {
      const ctx = createMockContext({ deviceScore: 'unsupported' });
      const decision = deviceTooWeak(baseReq, ctx, ports);

      expect(decision).not.toBeNull();
      expect(decision?.targetKind).toBe('server-native');
      expect(decision?.reasonCode).toBe('R08_DEVICE_TOO_WEAK');
    });

    it('routes to server when deviceScore is low numeric (< 40)', () => {
      const ctx = createMockContext({ deviceScore: 25 });
      const decision = deviceTooWeak(baseReq, ctx, ports);

      expect(decision).not.toBeNull();
      expect(decision?.targetKind).toBe('server-native');
      expect(decision?.reasonCode).toBe('R08_DEVICE_TOO_WEAK');
    });

    it('returns null when deviceScore is healthy or unknown', () => {
      const ctxHealthy = createMockContext({ deviceScore: 75 });
      const ctxUnknown = createMockContext({ deviceScore: 'unknown' });

      expect(deviceTooWeak(baseReq, ctxHealthy, ports)).toBeNull();
      expect(deviceTooWeak(baseReq, ctxUnknown, ports)).toBeNull();
    });
  });

  describe('Rule 09: tooBig (R09_TOO_BIG)', () => {
    it('routes to server when pageEstimate > 25 pages', () => {
      const ctx = createMockContext({ pageEstimate: 30 });
      const decision = tooBig(baseReq, ctx, ports);

      expect(decision).not.toBeNull();
      expect(decision?.targetKind).toBe('server-native');
      expect(decision?.reasonCode).toBe('R09_TOO_BIG');
    });

    it('routes to server when assetBytes > 40 MB', () => {
      const ctx = createMockContext({ assetBytes: 45 * 1024 * 1024 });
      const decision = tooBig(baseReq, ctx, ports);

      expect(decision).not.toBeNull();
      expect(decision?.targetKind).toBe('server-native');
      expect(decision?.reasonCode).toBe('R09_TOO_BIG');
    });

    it('returns null when page count and assets are within limits', () => {
      const ctx = createMockContext({ pageEstimate: 20, assetBytes: 10 * 1024 * 1024 });
      expect(tooBig(baseReq, ctx, ports)).toBeNull();
    });
  });

  describe('Rule 10: recentFailure (R10_RECENT_FAILURE)', () => {
    it('routes to server when recent E2 (OOM) or E4 (timeout) occurred within 10 minutes', () => {
      const ctx = createMockContext({
        recentLocalFailures: [{ code: 'E2', at: Date.now() - 60 * 1000 }],
      });
      const decision = recentFailure(baseReq, ctx, ports);

      expect(decision).not.toBeNull();
      expect(decision?.targetKind).toBe('server-native');
      expect(decision?.reasonCode).toBe('R10_RECENT_FAILURE');
    });

    it('returns null when failures are older than 10 minutes', () => {
      const ctx = createMockContext({
        recentLocalFailures: [{ code: 'E2', at: Date.now() - 15 * 60 * 1000 }],
      });
      expect(recentFailure(baseReq, ctx, ports)).toBeNull();
    });

    it('returns null when recentLocalFailures is empty', () => {
      const ctx = createMockContext({ recentLocalFailures: [] });
      expect(recentFailure(baseReq, ctx, ports)).toBeNull();
    });
  });

  describe('Rule 11: defaultLocal (R11_DEFAULT_LOCAL)', () => {
    it('routes draft with ready env and good device to local compiler', () => {
      const ctx = createMockContext();
      const decision = defaultLocal(baseReq, ctx, ports);

      expect(decision).not.toBeNull();
      expect(decision?.targetKind).toBe('browser-wasm');
      expect(decision?.reasonCode).toBe('R11_DEFAULT_LOCAL');
      expect(decision?.target).toBe(localMock);
    });

    it('returns null if local compiler port is not available', () => {
      const ctx = createMockContext();
      expect(defaultLocal(baseReq, ctx, { server: serverMock })).toBeNull();
    });
  });
});

describe('CompilerRouter priority ordering and R99 fallback', () => {
  const localMock = createMockCompiler('browser-wasm');
  const serverMock = createMockCompiler('server-native');

  it('contains exactly 11 rules in default rule sequence', () => {
    expect(DEFAULT_RULES).toHaveLength(11);
  });

  it('respects rule priority: Rule 01 overrides Rule 04', () => {
    const router = new CompilerRouter({ local: localMock, server: serverMock });
    const req: CompileRequest = { tex: 'Hi', mode: 'final' };
    const ctx = createMockContext({ online: false, localEnv: 'ready', localEnvMatches: true });

    const decision = router.route(req, ctx);
    // Rule 1 triggers (final -> server) before Rule 4 (offlineLocal)
    expect(decision.reasonCode).toBe('R01_FINAL_SERVER');
    expect(decision.targetKind).toBe('server-native');
  });

  it('falls back to R99_FALLBACK when no rule matches', () => {
    // Empty rules set
    const router = new CompilerRouter({
      local: localMock,
      server: serverMock,
      rules: [],
    });
    const decision = router.route({ tex: 'Hi' }, createMockContext());

    expect(decision.reasonCode).toBe('R99_FALLBACK');
    expect(decision.targetKind).toBe('server-native');
    expect(decision.target).toBe(serverMock);
  });
});

describe('CompilerRouter delegation and CompileResult enrichment', () => {
  it('delegates compile() to local compiler and enriches result', async () => {
    const localMock = createMockCompiler('browser-wasm');
    const serverMock = createMockCompiler('server-native');
    const router = new CompilerRouter({ local: localMock, server: serverMock });

    const req: CompileRequest = {
      tex: '\\documentclass{article}\\begin{document}Draft\\end{document}',
      environmentId: 'tl2026.1-hs-r1',
    };
    const ctx = createMockContext();

    const result = await router.compile(req, undefined, ctx);

    expect(result.status).toBe('success');
    expect(localMock.compile).toHaveBeenCalledTimes(1);
    expect(serverMock.compile).not.toHaveBeenCalled();
    expect(result.decision).toBeDefined();
    expect(result.reasonCode).toBe('R11_DEFAULT_LOCAL');
    expect(result.producedBy?.kind).toBe('browser-wasm');
  });

  it('delegates compile() to server compiler for final mode and enriches result', async () => {
    const localMock = createMockCompiler('browser-wasm');
    const serverMock = createMockCompiler('server-native');
    const router = new CompilerRouter({ local: localMock, server: serverMock });

    const req: CompileRequest = {
      tex: '\\documentclass{article}\\begin{document}Final\\end{document}',
      mode: 'final',
      environmentId: 'tl2026.1-hs-r1',
    };
    const ctx = createMockContext();

    const result = await router.compile(req, undefined, ctx);

    expect(result.status).toBe('success');
    expect(serverMock.compile).toHaveBeenCalledTimes(1);
    expect(localMock.compile).not.toHaveBeenCalled();
    expect(result.reasonCode).toBe('R01_FINAL_SERVER');
    expect(result.producedBy?.kind).toBe('server-native');
  });

  it('intercepts Rule 05 (offline no env) and returns E1 error without compiling', async () => {
    const localMock = createMockCompiler('browser-wasm');
    const serverMock = createMockCompiler('server-native');
    const router = new CompilerRouter({ local: localMock, server: serverMock });

    const req: CompileRequest = { tex: 'Hi' };
    const ctx = createMockContext({ online: false, localEnv: 'missing' });

    const result = await router.compile(req, undefined, ctx);

    expect(result.status).toBe('error');
    expect(result.reasonCode).toBe('R05_OFFLINE_NO_ENV');
    expect(result.notice?.code).toBe('E1');
    expect(result.report?.errors[0].code).toBe('E1');
    expect(localMock.compile).not.toHaveBeenCalled();
    expect(serverMock.compile).not.toHaveBeenCalled();
  });

  it('evaluates canHandle() via routing decision', () => {
    const localMock = createMockCompiler('browser-wasm');
    const serverMock = createMockCompiler('server-native');
    const router = new CompilerRouter({ local: localMock, server: serverMock });

    const verdictReady = router.canHandle({ tex: 'Hi' }, createMockContext());
    expect(verdictReady.canHandle).toBe(true);

    const verdictOfflineNoEnv = router.canHandle(
      { tex: 'Hi' },
      createMockContext({ online: false, localEnv: 'missing' })
    );
    expect(verdictOfflineNoEnv.canHandle).toBe(false);
    expect(verdictOfflineNoEnv.reasonCode).toBe('R05_OFFLINE_NO_ENV');
    expect(verdictOfflineNoEnv.notice?.code).toBe('E1');
  });

  it('forwards progress events from delegated compilers', async () => {
    const localMock = createMockCompiler('browser-wasm');
    const router = new CompilerRouter({ local: localMock });

    const progressEvents: CompileProgress[] = [];
    const unsubscribe = router.onProgress((event) => {
      progressEvents.push(event);
    });

    await router.compile({ tex: 'Hi' }, undefined, createMockContext());

    expect(progressEvents.length).toBeGreaterThan(0);
    expect(progressEvents[0].phase).toBe('compiling');

    unsubscribe();
  });
});
