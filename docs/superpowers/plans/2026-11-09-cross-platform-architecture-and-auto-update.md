# Cross-Platform Architecture & Auto-Update Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a clean, enterprise-grade cross-platform architecture (`packages/platform`, `packages/platform-web`, `packages/platform-desktop`) with a polymorphic Slot system, an in-app Auto-Update engine using Tauri v2 Updater following the 30-page architecture spec ("Kiến trúc đa nền tảng Web và Desktop (Tauri) và cập nhật tự động"), a platform-specific Settings distribution slot (Web: Download Desktop App; Desktop: Check for Updates), and fix the LaTeX `\multicolumn` uppercase alignment bug.

**Architecture:** Ports & Adapters (Hexagonal / Clean Architecture). UI components express intent via `PlatformServices` and declarative `Slot` components without knowing concrete platforms or importing `@tauri-apps/*` directly. `UpdateService` encapsulates a strict state machine (`idle` → `checking` → `available` → `downloading` → `ready` → `installing` / `error`) with 5 data-safety hooks (`flushAutosave`, `settleCompile`, `createBackup`, `closeDialogs`) before installation.

**Tech Stack:** TypeScript, React, Next.js (SSG export), Tauri v2 (`tauri-plugin-updater`, `tauri-plugin-process`, `tauri-action`), Minisign Ed25519 cryptography, Vitest.

**Spec:** `docs/Architecture/Kiến trúc đa nền tảng Web và Desktop (Tauri) và cập nhật tự động — Thiết kế chi tiết.pdf`

## Global Constraints

- Never import `@tauri-apps/*` directly in web packages or shared UI components; only `platform-desktop` may import Tauri APIs.
- The UI must never check `window.__TAURI__` or use ad-hoc `if (isTauri)` conditions; all platform capabilities are queried via `PlatformServices` and `Capabilities`.
- Autosave flush and compilation check (`beforeInstall` hooks) must always precede desktop updater installation to guarantee zero user data loss.
- Maintain 100% offline compilation capability with local Tectonic XeTeX.
- Keep all existing 87 Vitest unit tests passing and add comprehensive tests for new platform services.

## Review Focus

1. **Web Bundle Isolation:** Web build must not fail or bundle any `@tauri-apps/*` native bindings.
2. **Data Safety during Updater Relaunch:** In-progress user edits and active compilations must be flushed to IndexedDB before desktop updater relaunch.
3. **Platform Slot Fallback:** Missing platform implementations in a Slot must fail compilation via TypeScript (`Record<PlatformKind, Component | null>`).
4. **LaTeX Multicolumn Safety:** Merged cells with `colSpan > 1` must output lowercase `l`, `c`, `r` in `\multicolumn` to prevent XeTeX `\TY@F7` undefined control sequence error.
5. **Updater Security:** Public key must be embedded in `tauri.conf.json` with signature verification required before installing updates.

---

### Task 1: Fix LaTeX Multicolumn Alignment Bug

**Files:**
- Modify: `apps/web/src/lib/latex-template.ts:460-468`
- Test: `tests/latex-multicolumn-fix.test.ts`

- [x] **Step 1.1: Write failing test for table multicolumn alignment**
  Create `tests/latex-multicolumn-fix.test.ts` parsing `Bài mẫu template tiếng Việt.docx` and generating LaTeX with `generateFullJournalLatex`. Assert generated LaTeX contains `\multicolumn{5}{l}` and never `\multicolumn{5}{L}`.
- [x] **Step 1.2: Run test to confirm it fails**
  Run `pnpm vitest run tests/latex-multicolumn-fix.test.ts`.
- [x] **Step 1.3: Fix `alignChar` in `latex-template.ts`**
  In `apps/web/src/lib/latex-template.ts`, change:
  ```ts
  const alignChar = cell.align === 'center' ? 'c' : cell.align === 'right' ? 'r' : 'l';
  ```
- [x] **Step 1.4: Run test to confirm it passes and verify with Tectonic**
  Run `pnpm vitest run tests/latex-multicolumn-fix.test.ts` and confirm Tectonic compiles `Bài mẫu template tiếng Việt.docx` to PDF successfully.
- [x] **Step 1.5: Commit fix**
  `git commit -am "fix(latex): use lowercase alignment for table multicolumn to prevent XeTeX TY@F crash"`

---

### Task 2: Core Platform Abstraction Package (`packages/platform`)

**Files:**
- Create: `packages/platform/package.json`
- Create: `packages/platform/tsconfig.json`
- Create: `packages/platform/src/types.ts`
- Create: `packages/platform/src/services/update-service.ts`
- Create: `packages/platform/src/services/file-service.ts`
- Create: `packages/platform/src/services/shell-service.ts`
- Create: `packages/platform/src/slots.tsx`
- Create: `packages/platform/src/context.tsx`
- Create: `packages/platform/src/index.ts`
- Test: `packages/platform/tests/slots-and-context.test.tsx`

- [x] **Step 2.1: Define package structure and types**
  Create `packages/platform/package.json` (named `@structpaper/platform`) and `tsconfig.json`. In `src/types.ts`, define `PlatformKind = 'web' | 'desktop'`, `Capabilities`, `RuntimeConfig`, `PlatformServices`.
- [x] **Step 2.2: Define Service Interfaces and State Machine**
  Implement `UpdateService`, `UpdateInfo`, `UpdateState`, `UpdateErrorCode` in `src/services/update-service.ts`. Implement `FileService` in `src/services/file-service.ts` and `ShellService` in `src/services/shell-service.ts`.
- [x] **Step 2.3: Implement Declarative Slot System**
  In `src/slots.tsx`, implement `defineSlots` and `<Slot id="..." />` ensuring strict TypeScript enforcement (`Record<PlatformKind, React.ComponentType | null>`).
- [x] **Step 2.4: Implement React Context and Hooks**
  In `src/context.tsx`, implement `PlatformProvider`, `usePlatform()`, `useCapabilities()`, `useUpdateService()`.
- [x] **Step 2.5: Write unit tests for Platform package**
  Create `packages/platform/tests/slots-and-context.test.tsx` verifying Slot rendering for `web` vs `desktop` and Context provider propagation.
- [x] **Step 2.6: Run tests and commit**
  Run `pnpm --filter @structpaper/platform test` and commit.

---

### Task 3: Web Platform Adapter (`packages/platform-web`)

**Files:**
- Create: `packages/platform-web/package.json`
- Create: `packages/platform-web/tsconfig.json`
- Create: `packages/platform-web/src/web-update-service.ts`
- Create: `packages/platform-web/src/web-file-service.ts`
- Create: `packages/platform-web/src/web-shell-service.ts`
- Create: `packages/platform-web/src/index.ts`
- Test: `packages/platform-web/tests/web-platform.test.ts`

- [x] **Step 3.1: Define Web adapter package**
  Create `packages/platform-web/package.json` (named `@structpaper/platform-web`).
- [x] **Step 3.2: Implement `WebUpdateService`**
  Implement `WebUpdateService` with `kind: 'web-reload'`, checking version or emitting `idle` / `available` for page reload without native binaries.
- [x] **Step 3.3: Implement `WebFileService` & `WebShellService`**
  Implement DOM-based downloads (`<a download>`), input file picker, and `window.open` for links.
- [x] **Step 3.4: Write unit tests for Web adapter**
  Create `packages/platform-web/tests/web-platform.test.ts`.
- [x] **Step 3.5: Run tests and commit**
  Run `pnpm --filter @structpaper/platform-web test` and commit.

---

### Task 4: Desktop Platform Adapter (`packages/platform-desktop`)

**Files:**
- Create: `packages/platform-desktop/package.json`
- Create: `packages/platform-desktop/tsconfig.json`
- Create: `packages/platform-desktop/src/desktop-update-service.ts`
- Create: `packages/platform-desktop/src/desktop-file-service.ts`
- Create: `packages/platform-desktop/src/desktop-shell-service.ts`
- Create: `packages/platform-desktop/src/index.ts`
- Test: `packages/platform-desktop/tests/desktop-update-service.test.ts`

- [x] **Step 4.1: Define Desktop adapter package**
  Create `packages/platform-desktop/package.json` (named `@structpaper/platform-desktop`).
- [x] **Step 4.2: Implement `DesktopUpdateService` with Tauri v2 Updater**
  Implement `DesktopUpdateService` calling `@tauri-apps/plugin-updater`. Implement safety hooks execution:
  - `flushAutosave`: Trigger and wait for IndexedDB save.
  - `settleCompile`: Wait for active compilation.
  - `downloadAndInstall`: Stream download progress (0-100%) and relaunch via `@tauri-apps/plugin-process`.
- [x] **Step 4.3: Implement `DesktopFileService` & `DesktopShellService`**
  Wrap Tauri dialog, fs, and shell plugins.
- [x] **Step 4.4: Write unit tests with mock Tauri bindings**
  Create `packages/platform-desktop/tests/desktop-update-service.test.ts` verifying state transitions (`idle` → `checking` → `available` → `downloading` → `ready`).
- [x] **Step 4.5: Run tests and commit**
  Run `pnpm --filter @structpaper/platform-desktop test` and commit.

---

### Task 5: Tauri v2 Updater Rust Configuration & Key Generation

**Files:**
- Modify: `apps/web/src-tauri/Cargo.toml`
- Modify: `apps/web/src-tauri/src/main.rs`
- Modify: `apps/web/src-tauri/tauri.conf.json`
- Create: `scripts/generate-updater-keys.mjs`
- Modify: `.github/workflows/release.yml`

- [x] **Step 5.1: Add updater plugins in Cargo.toml**
  Add `tauri-plugin-updater = "2"` and `tauri-plugin-process = "2"` to `apps/web/src-tauri/Cargo.toml`.
- [x] **Step 5.2: Register plugins in `main.rs`**
  In `apps/web/src-tauri/src/main.rs`, register `.plugin(tauri_plugin_updater::Builder::new().build())` and `.plugin(tauri_plugin_process::init())`.
- [x] **Step 5.3: Create key generator script and generate updater keypair**
  Create `scripts/generate-updater-keys.mjs`. Generate Ed25519 updater key pair. Add the public key to `tauri.conf.json` under `plugins.updater.pubkey`.
- [x] **Step 5.4: Configure `tauri.conf.json`**
  Add `plugins.updater`:
  - `endpoints`: `["https://github.com/StructPaper/StructPaper/releases/latest/download/latest.json"]`
  - `windows.installMode`: `"passive"`
  - Add `"bundle": { "createUpdaterArtifacts": true }`.
- [x] **Step 5.5: Update release workflow for signing**
  In `.github/workflows/release.yml`, pass `TAURI_SIGNING_PRIVATE_KEY: ${{ secrets.TAURI_SIGNING_PRIVATE_KEY }}` to `tauri-action`.
- [x] **Step 5.6: Verify Rust compilation**
  Run `cargo check` in `apps/web/src-tauri` and commit.

---

### Task 6: UI Integration: Settings Distribution Slot & Global Update Banner

**Files:**
- Create: `apps/web/src/platform/bootstrap.ts`
- Create: `apps/web/src/components/platform/DownloadDesktopCard.tsx`
- Create: `apps/web/src/components/platform/CheckForUpdateCard.tsx`
- Create: `apps/web/src/components/platform/UpdateNotificationBanner.tsx`
- Modify: `apps/web/src/app/layout.tsx`
- Modify: `apps/web/src/app/settings/page.tsx`
- Test: `apps/web/tests/components/settings-distribution-slot.test.tsx`

- [x] **Step 6.1: Implement dynamic bootstrap in `apps/web`**
  In `apps/web/src/platform/bootstrap.ts`, implement `createPlatform()` using dynamic imports to load `platform-desktop` or `platform-web`.
- [x] **Step 6.2: Create `DownloadDesktopCard` (for Web)**
  Create modern, beautiful card showing links to download Windows `.exe` setup and macOS `.dmg`, highlighting offline Tectonic engine and local speed.
- [x] **Step 6.3: Create `CheckForUpdateCard` (for Desktop)**
  Create interactive card showing current app version, "Kiểm tra cập nhật" button, release notes modal, download progress bar, and "Cập nhật & Khởi động lại" button.
- [x] **Step 6.4: Create `UpdateNotificationBanner`**
  Floating, non-intrusive toast/banner when a new update is found, with "Xem nội dung", "Cập nhật ngay", "Nhắc tôi sau", "Bỏ qua".
- [x] **Step 6.5: Integrate Slot into Settings page & Root Layout**
  In `apps/web/src/app/settings/page.tsx`, mount `<Slot id="app-distribution" />` right below the header banner.
  In `apps/web/src/app/layout.tsx`, wrap the app with `PlatformProvider` and mount `UpdateNotificationBanner`.
- [x] **Step 6.6: Write unit tests and verify**
  Create `apps/web/tests/components/settings-distribution-slot.test.tsx`. Verify both Web and Desktop slot rendering.
- [x] **Step 6.7: Run all tests and commit**
  Run full test suite: `pnpm test` and commit.

---

### Task 7: Unified Dynamic Island Toast Notification for Updates

**Files:**
- Create: `apps/web/src/components/platform/UpdateToastNotifier.tsx`
- Modify: `apps/web/src/app/layout.tsx`
- Modify: `apps/web/tests/components/settings-distribution-slot.test.tsx`

- [x] **Step 7.1: Implement `UpdateToastNotifier`**
  Synchronizes `UpdateService` events directly with `DynamicIslandToast` (`toast.info`, `toast.loading`, `toast.success`, `toast.error`) maintaining 100% design system uniformity.
- [x] **Step 7.2: Mount `UpdateToastNotifier` in Root Layout**
  Replace banner in `apps/web/src/app/layout.tsx` with `<UpdateToastNotifier />`.
- [x] **Step 7.3: Add tests and verify**
  Add unit tests in `settings-distribution-slot.test.tsx` verifying toast calls on update available, downloading, and ready states.
