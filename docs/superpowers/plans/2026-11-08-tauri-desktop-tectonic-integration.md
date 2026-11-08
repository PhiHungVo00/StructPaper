# Tauri Desktop with Native Tectonic Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Package StructPaper into a high-performance offline desktop application using Tauri with bundled native Tectonic XeTeX engine, while cleaning up the broken in-browser typesetter and configuring automated GitHub Actions releases for Windows and macOS.

**Architecture:** 
1. **Frontend Clean-up:** Revert the custom regex jsPDF typesetter in Web Worker that caused missing Vietnamese glyphs and raw LaTeX command leaks; ensure compilation routes to native Tectonic backend when on Web.
2. **Tauri Scaffolding & Native Rust Backend:** Configure Tauri v2 in `apps/web/src-tauri` with sidecar bundling for `bin/tectonic.exe` (Windows) and `bin/tectonic` (macOS). Expose a native Rust command `compile_latex_desktop` that executes Tectonic directly against isolated temporary workspaces.
3. **Compiler Client Adapter:** Add `TauriDesktopCompiler` adapter to `packages/compiler-client` conforming to `CompilerPort`. When running inside the Tauri WebView, it invokes the native Rust Tectonic command with zero network overhead; when running in browser, it seamlessly delegates to the Next.js API route.
4. **CI/CD Automation:** Configure `.github/workflows/release.yml` with `tauri-apps/tauri-action` so tagging a release (`git tag v1.0.0`) automatically builds and publishes `.exe` (Windows) and `.dmg` (macOS) to GitHub Releases.

**Tech Stack:** Next.js 14, React 18, Tauri v2, Rust (cargo 1.99), Tectonic 0.17.0, GitHub Actions.

**Spec:** `docs/superpowers/specs/spike-latex-engine-report.md`, `docs/Architecture/Biên dịch LaTeX trong trình duyệt và chế độ ngoại tuyến — Thiết kế chi tiết.pdf`

## Global Constraints
- Preserve 100% existing React/Next.js UI features (TipTap editor, 96-paragraph DOCX parser, IndexedDB storage, Framer Motion animations).
- Zero compilation errors in `@structpaper/compiler-client` and `@structpaper/web`.
- Offline execution must not make external network requests when running inside Tauri Desktop.
- Monorepo package boundaries and pnpm workspace resolution must remain intact.

## Review Focus
1. Vietnamese diacritics integrity: Verify full Unicode support (`ư`, `ơ`, `ệ`, `ở`, `ứ`, `ử`, `ễ`, `ộ`, `ồ`) in generated PDFs.
2. Raw TeX command isolation: Ensure LaTeX template macros (`\newsavebox`, `\fontsize`, `\twocolumn`) are evaluated by Tectonic and never leaked as raw text into the document body.
3. Desktop detection safety: The app must gracefully fall back to web API routes when `window.__TAURI__` is undefined (in standard browsers).
4. Sidecar execution timeout: Prevent frozen Tectonic processes by enforcing a 60-second timeout watchdog in Rust.
5. Temp file cleanup: Rust backend must delete temporary job directories after PDF compilation completes.

---

### Task 1: Revert/Clean In-Browser Typesetter and Restore Clean Compiler Routing

**Files:**
- Modify: `packages/compiler-client/src/wasm/worker/latex-wasm.worker.ts`
- Modify: `apps/web/src/components/editor/hooks/useEditorCompilation.ts`
- Modify: `apps/web/src/components/preview/PublicationPreview.tsx`
- Test: `packages/compiler-client/tests/wasm-compiler.test.ts`
- Test: `apps/web/tests/integration/editor-compilation-routing.test.tsx`

- [ ] **Step 1.1**: Update `latex-wasm.worker.ts` to remove the faulty `typesetLatexToPdf` invocation that stripped Vietnamese glyphs. If worker is called as draft fallback, return a clean minimal draft status without corrupting user text.
- [ ] **Step 1.2**: Update `useEditorCompilation.ts` to ensure remote compiler (calling Next.js `/api/compile-latex` with `tectonic.exe`) is always prioritized when available.
- [ ] **Step 1.3**: Run `pnpm --filter @structpaper/compiler-client test` and `pnpm --filter @structpaper/web test` to verify all tests pass.

---

### Task 2: Setup Tauri Scaffolding and Sidecar Configuration

**Files:**
- Create: `apps/web/src-tauri/Cargo.toml`
- Create: `apps/web/src-tauri/tauri.conf.json`
- Create: `apps/web/src-tauri/src/main.rs`
- Create: `apps/web/src-tauri/build.rs`
- Create: `apps/web/src-tauri/capabilities/default.json`
- Directory: `apps/web/src-tauri/bin/` (hosts `tectonic-x86_64-pc-windows-msvc.exe`)
- Modify: `apps/web/package.json` (add scripts: `tauri:dev`, `tauri:build`)

- [ ] **Step 2.1**: Copy `StructPaper/bin/tectonic.exe` to `apps/web/src-tauri/bin/tectonic-x86_64-pc-windows-msvc.exe`.
- [ ] **Step 2.2**: Configure `Cargo.toml` with `tauri = "2"`, `serde`, `serde_json`, and `tokio`.
- [ ] **Step 2.3**: Configure `tauri.conf.json` with product name `StructPaper`, app identifier `com.structpaper.app`, sidecar `bin/tectonic`, and dev url pointing to Next.js dev server.
- [ ] **Step 2.4**: Implement `compile_latex_desktop` command in `apps/web/src-tauri/src/main.rs` that writes TeX input to a temp directory, invokes the bundled Tectonic sidecar, reads the generated PDF, and returns bytes or base64.
- [ ] **Step 2.5**: Verify Rust project compiles successfully with `cargo check` using `$env:USERPROFILE\.cargo\bin\cargo.exe`.

---

### Task 3: Implement Tauri Desktop Compiler Adapter in `@structpaper/compiler-client`

**Files:**
- Create: `packages/compiler-client/src/adapters/tauri-desktop-compiler.ts`
- Modify: `packages/compiler-client/src/adapters/index.ts`
- Modify: `packages/compiler-client/src/index.ts`
- Modify: `apps/web/src/components/editor/hooks/useEditorCompilation.ts`
- Test: `packages/compiler-client/tests/tauri-desktop-compiler.test.ts`

- [ ] **Step 3.1**: Write failing unit test `tauri-desktop-compiler.test.ts` verifying that `TauriDesktopCompiler` checks `window.__TAURI_INTERNALS__` or Tauri invoke, sends TeX payload, and returns `CompileResult` with `producedBy: { kind: 'local-cli', environmentId: 'tauri-tectonic' }`.
- [ ] **Step 3.2**: Implement `TauriDesktopCompiler` in `tauri-desktop-compiler.ts` conforming to `CompilerPort`.
- [ ] **Step 3.3**: Update `useEditorCompilation.ts` to instantiate `TauriDesktopCompiler` if running in Desktop mode, falling back to `RemoteCompiler` in web browser mode.
- [ ] **Step 3.4**: Run tests to verify `@structpaper/compiler-client` passes.

---

### Task 4: Configure Automated GitHub Actions Workflow for Windows & macOS Releases

**Files:**
- Create: `.github/workflows/release.yml`

- [ ] **Step 4.1**: Create `.github/workflows/release.yml` with workflow triggers for `push: tags: ['v*']` and manual `workflow_dispatch`.
- [ ] **Step 4.2**: Configure build matrix for `windows-latest` (builds NSIS `.exe` and `.msi`) and `macos-latest` (builds `.dmg`).
- [ ] **Step 4.3**: Include steps to download appropriate Tectonic binaries for each platform into `apps/web/src-tauri/bin/` before calling `tauri-apps/tauri-action`.
- [ ] **Step 4.4**: Configure automatic creation of GitHub Release with uploaded installer artifacts and changelog.

---

### Task 5: End-to-End Verification & Health Check

**Files:**
- Modify: `apps/web/src/components/DynamicIslandToast.tsx` / `apps/web/src/components/toast/Toaster.tsx` (if needed for desktop status badge)
- Test: Run complete monorepo test suite

- [ ] **Step 5.1**: Run `pnpm --filter @structpaper/compiler-client test`.
- [ ] **Step 5.2**: Run `pnpm --filter @structpaper/web test`.
- [ ] **Step 5.3**: Run TypeScript typecheck `pnpm --filter @structpaper/web exec tsc --noEmit`.
- [ ] **Step 5.4**: Run cargo check in `apps/web/src-tauri` to ensure 0 Rust warnings/errors.
