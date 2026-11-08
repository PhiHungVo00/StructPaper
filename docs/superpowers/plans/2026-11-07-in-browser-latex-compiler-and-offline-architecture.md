# In-Browser LaTeX Compiler & Offline Two-Tier Architecture Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a production-grade two-tier compilation system enabling offline and server-offload LaTeX compilation directly in the browser via Web Worker WebAssembly (`WasmCompiler`), an 11-rule `CompilerRouter`, real-time network/server reachability detection, and a persistent Sticky Full-Width single-line Liquid Glass Toast.

**Architecture:** A client-side `CompilerRouter` dynamically evaluates an 11-rule decision matrix against `CompileContext` (`online`, `serverReachable`, `localEnv`, `mode`, etc.) to delegate requests to either `WasmCompiler` (Web Worker WebAssembly engine with virtual FS) or `RemoteCompiler` (HTTP backend). Offline / server-unreachable states trigger a persistent full-width banner toast while rerouting to the local WASM compiler to produce authentic PDF documents.

**Tech Stack:** TypeScript, Web Workers, WebAssembly (`@siglum/engine` / BusyTeX TeX Live 2026), Next.js 14, Framer Motion, Vitest.

**Spec:** `docs/superpowers/specs/2026-11-07-in-browser-latex-compiler-and-offline-architecture-design.md`

## Global Constraints

- Line limits: files under 500 lines for logic, under 700 lines for UI components.
- Zero main-thread blocking: WebAssembly execution and heavy TeX processing must run in Web Worker.
- Sticky toast must be 1-line, full-width (100vw), persistent (no auto-timeout), not dismissed by incoming toasts, dismissible only by explicit user click.
- Strict backwards compatibility with existing `toast` API (`success`, `error`, `warning`, `info`, `loading`).
- Strict backwards compatibility for `CompileRequest` with existing `useEditorCompilation.ts` payload.

## Review Focus

1. **Toast Persistence & Sticky Isolation:** Ordinary toast bursts must not evict or dismiss the sticky full-width toast.
2. **Offline Web Worker Error Handling:** If WASM binary or bundle is missing, `WasmCompiler` must return error E1 gracefully without unhandled worker crashes.
3. **Router Determinism:** The 11 routing rules must execute in the exact order specified in Table 9.2 of the spec.
4. **Network Reconnection Resiliency:** Re-establishing internet connectivity must update `CompileContext.online` and allow subsequent final compiles to reach the server.
5. **Memory Cleanup in Worker:** Worker must clear its virtual filesystem memory after every compilation run to prevent unbounded memory growth.

---

### Task 1: Sticky Full-Width Toast System (Single-Line Banner, Non-Dismissing on New Toasts)

**Files:**
- Create: `apps/web/src/components/toast/FullWidthStickyToast.tsx`
- Modify: `apps/web/src/components/toast/toast-store.ts`
- Modify: `apps/web/src/components/toast/Toaster.tsx`
- Modify: `apps/web/src/components/DynamicIslandToast.tsx`
- Test: `apps/web/tests/toast/sticky-full-width-toast.test.ts`

**Interfaces:**
- Produces:
  - `toast.sticky(title: string | ToastOptions, description?: string, opts?: ToastOptions): string`
  - `ToastItem.variant?: 'island' | 'full-width-sticky'`
  - `ToastItem.sticky?: boolean`
  - `FullWidthStickyToast` component rendering full screen width single-line liquid glass banner.

- [ ] **Step 1: Write unit tests for sticky toast store behavior**
```typescript
// apps/web/tests/toast/sticky-full-width-toast.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { toastStore, toast } from '@/components/toast/toast-store';

describe('Sticky Full-Width Toast', () => {
  beforeEach(() => {
    toastStore.clear();
  });

  it('keeps sticky toast pinned when multiple new normal toasts arrive', () => {
    const stickyId = toast.sticky('Đang ngoại tuyến', 'Chuyển sang chế độ biên dịch nội bộ');
    toast.success('Lưu thành công');
    toast.info('Thông báo 1');
    toast.warning('Cảnh báo 2');
    toast.error('Lỗi 3');

    const all = toastStore.getToasts();
    const hasSticky = all.some((t) => t.id === stickyId && t.sticky === true);
    expect(hasSticky).toBe(true);
  });

  it('sets duration to Infinity and marks variant as full-width-sticky', () => {
    const id = toast.sticky('Mất kết nối server');
    const item = toastStore.getToasts().find((t) => t.id === id);
    expect(item?.duration).toBe(Infinity);
    expect(item?.variant).toBe('full-width-sticky');
    expect(item?.sticky).toBe(true);
  });

  it('only removes sticky toast when explicitly dismissed', () => {
    const id = toast.sticky('Thử nghiệm');
    expect(toastStore.getToasts().some((t) => t.id === id)).toBe(true);
    toast.dismiss(id);
    expect(toastStore.getToasts().some((t) => t.id === id)).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**
Run: `pnpm --filter @structpaper/web test apps/web/tests/toast/sticky-full-width-toast.test.ts`
Expected: FAIL (`toast.sticky is not a function`).

- [ ] **Step 3: Update `toast-store.ts` to support sticky toasts**
Extend `ToastItem` and `ToastOptions` with `variant?: 'island' | 'full-width-sticky'` and `sticky?: boolean`. In `addToast`, ensure sticky toasts are stored in a dedicated persistent slot or preserved during normal toast trimming. Add `toast.sticky(...)` method with `duration: Infinity`, `dismissible: true`.

- [ ] **Step 4: Create `FullWidthStickyToast.tsx`**
Single-line height (`h-10 sm:h-11`), width `w-full`, frosted liquid glass styling (`backdrop-blur-md bg-amber-500/15 border-b border-amber-500/30`), status badge (`NGOẠI TUYẾN` or `MẤT KẾT NỐI SERVER`), truncated title/description, and dismiss `X` button.

- [ ] **Step 5: Update `Toaster.tsx` to render sticky toasts as top banner**
Mount the sticky toast directly across the top width without interfering with the centered pill stack of standard dynamic island toasts.

- [ ] **Step 6: Run test to verify it passes**
Run: `pnpm --filter @structpaper/web test apps/web/tests/toast/sticky-full-width-toast.test.ts`
Expected: PASS.

---

### Task 2: CompilerPort Expansion & Data Models

**Files:**
- Modify: `packages/compiler-client/src/interfaces/compiler-port.ts`
- Create: `packages/compiler-client/src/interfaces/compiler-router.types.ts`
- Modify: `packages/compiler-client/src/interfaces/index.ts`
- Test: `packages/compiler-client/tests/compiler-port-types.test.ts`

**Interfaces:**
- Produces:
  - `CompileReport`, `CapabilityVerdict`, `CompileContext`, `Decision`, `ReasonCode`, `Rule`
  - Expanded `CompileRequest` (optional `mode: 'draft' | 'final'`, `passes?: 1 | 2`)
  - Expanded `CompileResult` (`producedBy: { kind, environmentId }`, `report?: CompileReport`)

- [ ] **Step 1: Write test for CompilerPort and types**
```typescript
// packages/compiler-client/tests/compiler-port-types.test.ts
import { describe, it, expect } from 'vitest';
import type { CompileRequest, CompileResult, CompileReport } from '../src/interfaces/compiler-port';
import type { CompileContext, Decision } from '../src/interfaces/compiler-router.types';

describe('Compiler Interfaces', () => {
  it('conforms to two-tier CompileResult contract', () => {
    const report: CompileReport = {
      errors: [],
      warnings: [],
      overfullHbox: 0,
      missingFonts: [],
      missingReferences: [],
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
    expect(res.producedBy.kind).toBe('browser-wasm');
    expect(res.report?.overfullHbox).toBe(0);
  });
});
```

- [ ] **Step 2: Run test to verify compilation**
Run: `pnpm --filter @structpaper/compiler-client test tests/compiler-port-types.test.ts`
Expected: FAIL (missing types).

- [ ] **Step 3: Implement expanded interfaces in `compiler-port.ts` and `compiler-router.types.ts`**
Add `CompileReport`, `CapabilityVerdict`, `CompileContext`, `Decision`, and export all from `interfaces/index.ts`.

- [ ] **Step 4: Run test to verify it passes**
Run: `pnpm --filter @structpaper/compiler-client test tests/compiler-port-types.test.ts`
Expected: PASS.

---

### Task 3: CompilerRouter with 11 Decision Rules (Mục 9.2 PDF Spec)

**Files:**
- Create: `packages/compiler-client/src/router/rules/index.ts`
- Create: `packages/compiler-client/src/router/rules/01-final-goes-to-server.ts`
- Create: `packages/compiler-client/src/router/rules/02-kill-switch.ts`
- Create: `packages/compiler-client/src/router/rules/03-prefer-server.ts`
- Create: `packages/compiler-client/src/router/rules/04-offline-local.ts`
- Create: `packages/compiler-client/src/router/rules/05-offline-no-env.ts`
- Create: `packages/compiler-client/src/router/rules/06-substitute-fonts.ts`
- Create: `packages/compiler-client/src/router/rules/07-env-not-ready.ts`
- Create: `packages/compiler-client/src/router/rules/08-device-too-weak.ts`
- Create: `packages/compiler-client/src/router/rules/09-too-big.ts`
- Create: `packages/compiler-client/src/router/rules/10-recent-failure.ts`
- Create: `packages/compiler-client/src/router/rules/11-default-local.ts`
- Create: `packages/compiler-client/src/router/compiler-router.ts`
- Modify: `packages/compiler-client/src/index.ts`
- Test: `packages/compiler-client/tests/compiler-router-rules.test.ts`

**Interfaces:**
- Produces:
  - `class CompilerRouter implements CompilerPort`
  - `route(req: CompileRequest, ctx: CompileContext): Decision`
  - Exported rule functions `Rule`

- [ ] **Step 1: Write test matrix for all 11 decision rules**
```typescript
// packages/compiler-client/tests/compiler-router-rules.test.ts
import { describe, it, expect } from 'vitest';
import { CompilerRouter } from '../src/router/compiler-router';
import type { CompileContext } from '../src/interfaces/compiler-router.types';
import type { CompilerPort } from '../src/interfaces/compiler-port';

const dummyPort = (kind: any): CompilerPort => ({
  compile: async () => ({ status: 'success', logs: [], durationMs: 0, producedBy: { kind, environmentId: 'test' } }),
});

describe('CompilerRouter 11 Rules Matrix', () => {
  const local = dummyPort('browser-wasm');
  const server = dummyPort('server-native');
  const router = new CompilerRouter({ local, server });

  const baseCtx: CompileContext = {
    online: true,
    serverReachable: true,
    localEnv: 'ready',
    localEnvMatches: true,
    deviceScore: 85,
    pageEstimate: 10,
    assetBytes: 2 * 1024 * 1024,
    recentLocalFailures: [],
    userPreference: 'auto',
    parity: 'same',
    localDisabledByFlag: false,
    saveData: false,
  };

  it('Rule 1: final mode routes to server', () => {
    const d = router.decide({ tex: '', mode: 'final' }, baseCtx);
    expect(d.targetKind).toBe('server-native');
    expect(d.reasonCode).toBe('R01_FINAL_SERVER');
  });

  it('Rule 4: offline and localEnv ready routes to local wasm', () => {
    const ctx = { ...baseCtx, online: false };
    const d = router.decide({ tex: '', mode: 'draft' }, ctx);
    expect(d.targetKind).toBe('browser-wasm');
    expect(d.reasonCode).toBe('R04_OFFLINE_LOCAL_READY');
  });

  it('Rule 5: offline and localEnv missing returns error notice E1', () => {
    const ctx = { ...baseCtx, online: false, localEnv: 'missing' as const };
    const d = router.decide({ tex: '', mode: 'draft' }, ctx);
    expect(d.targetKind).toBe('browser-wasm');
    expect(d.reasonCode).toBe('R05_OFFLINE_NO_ENV');
    expect(d.notice?.code).toBe('E1');
  });

  it('Rule 11: draft mode with ready localEnv defaults to local wasm', () => {
    const d = router.decide({ tex: '', mode: 'draft' }, baseCtx);
    expect(d.targetKind).toBe('browser-wasm');
    expect(d.reasonCode).toBe('R11_DEFAULT_LOCAL');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**
Run: `pnpm --filter @structpaper/compiler-client test tests/compiler-router-rules.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement individual rules in `src/router/rules/` and `CompilerRouter`**
Write each rule as a pure function `(req, ctx) => Decision | null`. Combine in `CompilerRouter` sequentially according to Table 9.2.

- [ ] **Step 4: Run test to verify it passes**
Run: `pnpm --filter @structpaper/compiler-client test tests/compiler-router-rules.test.ts`
Expected: PASS.

---

### Task 4: Network & Server Reachability Monitor

**Files:**
- Create: `packages/compiler-client/src/monitor/network-monitor.ts`
- Test: `packages/compiler-client/tests/network-monitor.test.ts`

**Interfaces:**
- Produces:
  - `class NetworkMonitor`
  - `isOnline(): boolean`
  - `isServerReachable(): boolean`
  - `checkServerReachability(endpoint?: string): Promise<boolean>`
  - `subscribe(cb: (state: NetworkState) => void): () => void`

- [ ] **Step 1: Write test for NetworkMonitor**
```typescript
// packages/compiler-client/tests/network-monitor.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NetworkMonitor } from '../src/monitor/network-monitor';

describe('NetworkMonitor', () => {
  it('detects online/offline browser state and notifies listeners', () => {
    const monitor = new NetworkMonitor({ initialOnline: true });
    let state = monitor.getState();
    expect(state.online).toBe(true);

    const listener = vi.fn();
    const unsub = monitor.subscribe(listener);

    monitor.simulateOffline();
    expect(listener).toHaveBeenCalledWith(expect.objectContaining({ online: false }));
    unsub();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**
Run: `pnpm --filter @structpaper/compiler-client test tests/network-monitor.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement `NetworkMonitor`**
Listen to `window.addEventListener('online')` and `window.addEventListener('offline')`. Provide active probe via lightweight `fetch(endpoint, { method: 'HEAD' })` with timeout.

- [ ] **Step 4: Run test to verify it passes**
Run: `pnpm --filter @structpaper/compiler-client test tests/network-monitor.test.ts`
Expected: PASS.

---

### Task 5: WasmCompiler Adapter & Web Worker LaTeX Compilation

**Files:**
- Create: `packages/compiler-client/src/wasm/virtual-fs.ts`
- Create: `packages/compiler-client/src/wasm/log-parser.ts`
- Create: `packages/compiler-client/src/wasm/worker-bridge.ts`
- Create: `packages/compiler-client/src/wasm/wasm-compiler.ts`
- Create: `packages/compiler-client/src/wasm/worker/compiler-worker.ts`
- Test: `packages/compiler-client/tests/log-parser.test.ts`
- Test: `packages/compiler-client/tests/wasm-compiler.test.ts`

**Interfaces:**
- Produces:
  - `class WasmCompiler implements CompilerPort`
  - `parseLatexLog(log: string): CompileReport`
  - In-browser PDF compilation producing `pdfBlob` and `pdfUrl`

- [ ] **Step 1: Write test for log-parser**
```typescript
// packages/compiler-client/tests/log-parser.test.ts
import { describe, it, expect } from 'vitest';
import { parseLatexLog } from '../src/wasm/log-parser';

describe('LaTeX Log Parser', () => {
  it('extracts errors, line numbers and overfull hbox count', () => {
    const sampleLog = `
! Undefined control sequence.
l.42 \\invalidCommand
Overfull \\hbox (12.3pt too wide) in paragraph at lines 50--55
Output written on main.pdf (1 page).
`;
    const report = parseLatexLog(sampleLog);
    expect(report.errors.length).toBe(1);
    expect(report.errors[0].line).toBe(42);
    expect(report.overfullHbox).toBe(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**
Run: `pnpm --filter @structpaper/compiler-client test tests/log-parser.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement `log-parser.ts`, `virtual-fs.ts`, `worker-bridge.ts`, and `wasm-compiler.ts`**
  - Implement regex parser in `log-parser.ts`.
  - Implement MemFS mapping in `virtual-fs.ts`.
  - Implement `WasmCompiler` with Web Worker instantiation, fallback error handling, and `CompilerPort` adherence.

- [ ] **Step 4: Run test to verify it passes**
Run: `pnpm --filter @structpaper/compiler-client test tests/log-parser.test.ts`
Expected: PASS.

---

### Task 6: RemoteCompiler Adapter & CompileCache

**Files:**
- Create: `packages/compiler-client/src/remote/remote-compiler.ts`
- Create: `packages/compiler-client/src/cache/compile-cache.ts`
- Modify: `packages/compiler-client/src/adapters/index.ts`
- Test: `packages/compiler-client/tests/remote-compiler.test.ts`
- Test: `packages/compiler-client/tests/compile-cache.test.ts`

**Interfaces:**
- Produces:
  - `class RemoteCompiler implements CompilerPort`
  - `class CompileCache`

- [x] **Step 1: Write tests for RemoteCompiler and CompileCache**
Verify HTTP communication, JSON payload formatting, binary PDF response parsing, and SHA-256 result caching.

- [x] **Step 2: Run tests to verify they fail**
Run: `pnpm --filter @structpaper/compiler-client test tests/remote-compiler.test.ts`
Expected: FAIL.

- [x] **Step 3: Implement `RemoteCompiler` and `CompileCache`**
Standardize `/api/compile-latex` response wrapping and IndexedDB hash caching.

- [x] **Step 4: Run tests to verify they pass**
Run: `pnpm --filter @structpaper/compiler-client test tests/remote-compiler.test.ts tests/compile-cache.test.ts`
Expected: PASS.

---

### Task 7: Editor UI Integration & Full Flow Verification

**Files:**
- Modify: `apps/web/src/components/editor/hooks/useEditorCompilation.ts`
- Modify: `apps/web/src/components/preview/PublicationPreview.tsx`
- Test: E2E and unit integration tests

- [ ] **Step 1: Integrate `CompilerRouter` and `NetworkMonitor` in `useEditorCompilation.ts`**
Replace hardcoded `LocalNextCompilerAdapter` with `CompilerRouter`. Listen to `NetworkMonitor`. When offline or server is unreachable, invoke `toast.sticky('Đang ngoại tuyến', 'Chuyển sang chế độ biên dịch trực tiếp trên trình duyệt')` and route to `WasmCompiler`.

- [ ] **Step 2: Add visual badge indicator in `PublicationPreview.tsx`**
Display "Bản nháp · Trình duyệt" or "Chính thức · Máy chủ" based on `result.producedBy.kind` (Section 9.4 in spec).

- [ ] **Step 3: Run all unit and integration tests across monorepo**
Run: `pnpm --filter @structpaper/compiler-client test` and `pnpm --filter @structpaper/web test`
Expected: ALL PASS.

- [ ] **Step 4: Run typecheck and production build**
Run: `pnpm build:web`
Expected: Successful Next.js build with 0 TypeScript/ESLint errors.
