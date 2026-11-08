import { describe, it, expect } from 'vitest';
import type {
  CompilerPort,
  CompileRequest,
  CompileResult,
  CompileReport,
  CompileReportIssue,
  CapabilityVerdict,
  CompileProgress,
  Unsubscribe,
} from '../src/interfaces/compiler-port';
import type {
  CompileContext,
  Decision,
  ReasonCode,
  Rule,
  RulePorts,
  Notice,
  CompilerKind,
} from '../src/interfaces/compiler-router.types';
import type {
  CompilerPort as InterCompilerPort,
  CompileReport as InterCompileReport,
  CompileContext as InterCompileContext,
  Decision as InterDecision,
  CapabilityVerdict as InterCapabilityVerdict,
} from '../src/interfaces';
import type {
  CompilerPort as RootCompilerPort,
  CompileReport as RootCompileReport,
  CompileContext as RootCompileContext,
  Decision as RootDecision,
  CapabilityVerdict as RootCapabilityVerdict,
} from '../src/index';
import * as RootExports from '../src/index';

describe('CompilerPort & Data Models Expansion', () => {
  it('conforms to two-tier CompileResult contract with report and producedBy', () => {
    const report: CompileReport = {
      errors: [{ line: 42, message: 'Undefined control sequence \\foo', blockId: 'blk_1' }],
      warnings: [{ line: 10, message: 'Underfull \\hbox (badness 10000)' }],
      overfullHbox: 0,
      missingFonts: ['LinLibertine_R.otf'],
      missingReferences: ['cite:vaswani2017'],
    };

    const res: CompileResult = {
      status: 'success',
      logs: ['Output written on main.pdf'],
      durationMs: 1200,
      report,
      producedBy: {
        kind: 'browser-wasm',
        environmentId: 'tl2026.1-hs-r1',
      },
    };

    expect(res.producedBy?.kind).toBe('browser-wasm');
    expect(res.producedBy?.environmentId).toBe('tl2026.1-hs-r1');
    expect(res.report?.overfullHbox).toBe(0);
    expect(res.report?.errors).toHaveLength(1);
    expect(res.report?.missingFonts).toContain('LinLibertine_R.otf');
  });

  it('supports expanded CompileRequest options (mode, environmentId, passes, signal)', () => {
    const controller = new AbortController();
    const req: CompileRequest = {
      tex: '\\documentclass{article}\\begin{document}Hello\\end{document}',
      paperId: 'paper_123',
      manuscriptId: 'ms_456',
      rev: 2,
      images: { 'figure1.png': 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY44YAAAAASUVORK5CYII=' },
      mode: 'draft',
      environmentId: 'tl2026.1-hs-r1',
      passes: 1,
      signal: controller.signal,
    };

    expect(req.mode).toBe('draft');
    expect(req.passes).toBe(1);
    expect(req.environmentId).toBe('tl2026.1-hs-r1');
    expect(req.signal).toBe(controller.signal);
    expect(req.manuscriptId).toBe('ms_456');
    expect(req.rev).toBe(2);
  });

  it('preserves 100% backward compatibility for legacy CompileRequest and CompileResult', () => {
    // Legacy request: only tex
    const legacyReq: CompileRequest = {
      tex: '\\documentclass{article}\\begin{document}Legacy\\end{document}',
    };
    expect(legacyReq.tex).toBeTruthy();
    expect(legacyReq.mode).toBeUndefined();

    // Legacy result: status, logs, durationMs without report or producedBy
    const legacyRes: CompileResult = {
      status: 'success',
      logs: ['Legacy success'],
      durationMs: 450,
      pdfBuffer: new Uint8Array([0x25, 0x50, 0x44, 0x46]),
    };
    expect(legacyRes.status).toBe('success');
    expect(legacyRes.report).toBeUndefined();
    expect(legacyRes.producedBy).toBeUndefined();
  });

  it('validates CapabilityVerdict contract', () => {
    const verdictSuccess: CapabilityVerdict = {
      canHandle: true,
    };
    expect(verdictSuccess.canHandle).toBe(true);

    const verdictFailure: CapabilityVerdict = {
      canHandle: false,
      reason: 'Missing environment bundle for offline compilation',
      reasonCode: 'R05_OFFLINE_NO_ENV',
      missing: ['tl2026.1-hs-r1'],
      notice: {
        code: 'E1',
        message: 'Cần tải gói biên dịch trước khi dùng ngoại tuyến',
        severity: 'error',
        action: 'download',
      },
    };
    expect(verdictFailure.canHandle).toBe(false);
    expect(verdictFailure.reasonCode).toBe('R05_OFFLINE_NO_ENV');
    expect(verdictFailure.notice?.code).toBe('E1');
  });

  it('validates CompileContext data model conforming to Section 9.1', () => {
    const ctx: CompileContext = {
      online: true,
      serverReachable: true,
      localEnv: 'ready',
      localEnvMatches: true,
      deviceScore: 85,
      pageEstimate: 10,
      assetBytes: 2 * 1024 * 1024,
      recentLocalFailures: [{ code: 'E2', at: Date.now() - 5000 }],
      userPreference: 'auto',
      parity: 'same',
      localDisabledByFlag: false,
      saveData: false,
    };

    expect(ctx.online).toBe(true);
    expect(ctx.localEnv).toBe('ready');
    expect(ctx.recentLocalFailures).toHaveLength(1);
    expect(ctx.recentLocalFailures[0].code).toBe('E2');
  });

  it('validates Decision, ReasonCode, Rule, and CompilerKind types', () => {
    const kind: CompilerKind = 'browser-wasm';
    const reason: ReasonCode = 'R04_OFFLINE_LOCAL_READY';

    const decision: Decision = {
      targetKind: kind,
      reasonCode: reason,
      reason: 'Offline and local environment ready',
    };

    expect(decision.targetKind).toBe('browser-wasm');
    expect(decision.reasonCode).toBe('R04_OFFLINE_LOCAL_READY');

    const sampleRule: Rule = (req, ctx, ports) => {
      if (!ctx.online && ctx.localEnv === 'ready') {
        return {
          targetKind: 'browser-wasm',
          target: ports?.local,
          reasonCode: 'R04_OFFLINE_LOCAL_READY',
        };
      }
      return null;
    };

    const d = sampleRule(
      { tex: '' },
      {
        online: false,
        serverReachable: false,
        localEnv: 'ready',
        localEnvMatches: true,
        deviceScore: 70,
        pageEstimate: 5,
        assetBytes: 1000,
        recentLocalFailures: [],
        userPreference: 'auto',
        parity: 'same',
        localDisabledByFlag: false,
        saveData: false,
      }
    );

    expect(d?.targetKind).toBe('browser-wasm');
    expect(d?.reasonCode).toBe('R04_OFFLINE_LOCAL_READY');
  });

  it('allows CompilerPort implementation with optional canHandle and onProgress', async () => {
    let progressFired = false;
    const testCompiler: CompilerPort = {
      kind: 'browser-wasm',
      canHandle(req, ctx) {
        return { canHandle: true };
      },
      async compile(req) {
        return {
          status: 'success',
          logs: ['WASM compile ok'],
          durationMs: 100,
          producedBy: { kind: 'browser-wasm', environmentId: 'env_1' },
        };
      },
      onProgress(cb) {
        progressFired = true;
        cb({ phase: 'compiling', percent: 50 });
        return () => {};
      },
    };

    expect(testCompiler.kind).toBe('browser-wasm');
    expect(testCompiler.canHandle?.({ tex: '' })).toEqual({ canHandle: true });
    
    const unsubscribe = testCompiler.onProgress?.(() => {});
    expect(typeof unsubscribe).toBe('function');
    expect(progressFired).toBe(true);

    const result = await testCompiler.compile({ tex: '' });
    expect(result.status).toBe('success');
  });

  it('re-exports all interfaces cleanly from both src/interfaces/index and src/index', () => {
    // Check type-assignment compatibility across export levels
    const report: RootCompileReport = {
      errors: [],
      warnings: [],
      overfullHbox: 0,
      missingFonts: [],
      missingReferences: [],
    };
    const interReport: InterCompileReport = report;
    expect(interReport.overfullHbox).toBe(0);

    const verdict: RootCapabilityVerdict = { canHandle: true };
    const interVerdict: InterCapabilityVerdict = verdict;
    expect(interVerdict.canHandle).toBe(true);

    // Check runtime exports
    expect(RootExports.CompileScheduler).toBeDefined();
    expect(RootExports.LocalNextCompilerAdapter).toBeDefined();
    expect(RootExports.MockCompilerAdapter).toBeDefined();
    expect(RootExports.RemoteCompiler).toBeDefined();
    expect(RootExports.CompileCache).toBeDefined();
    expect(RootExports.computeCompileCacheKey).toBeDefined();
    expect(RootExports.computeSha256).toBeDefined();
    expect(RootExports.hashCompileRequest).toBeDefined();
  });
});
