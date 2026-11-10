# Editor Persistence, Autosave & Navigation Guard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

This plan addresses data loss risks in the StructPaper Editor (`/editor`) by implementing:
1. Automatic persistence to IndexedDB on LaTeX compilation (`handleRecompile`).
2. Debounced background auto-save (1.5 seconds) in `UnifiedEditorView`.
3. Unsaved changes warning modal (`ActionConfirmModal`) on back navigation (`/papers`).
4. Browser tab/window close prevention (`beforeunload`) when in a dirty state.
5. Unit & integration test verification.

---

## Proposed Changes & File Structure

### 1. `apps/web/src/components/editor/hooks/useEditorAutoSave.ts` (NEW)
- Encapsulates 1500ms debounced persistence to IndexedDB.
- Listens to `formData` mutations when `isDirty` is true.
- Provides `autosaveStatus` ('idle' | 'saving' | 'saved' | 'error'), `lastSavedAt`, and `flush()`.
- Registers `window.onbeforeunload` when `isDirty` is true.

### 2. `apps/web/src/components/editor/hooks/useEditorCompilation.ts` (MODIFY)
- Accepts `savePaper` in options.
- Calls `await savePaper(target)` inside `handleRecompile` before or during TeX compilation so IndexedDB is always in sync with previewed PDF.

### 3. `apps/web/src/components/editor/EditorLeftDock.tsx` (MODIFY)
- Adds `onBackClick?: () => void` prop to intercept the Back button.
- Adds `autosaveStatus?: 'idle' | 'saving' | 'saved' | 'error'` prop to render visual auto-save feedback.

### 4. `apps/web/src/components/editor/UnifiedEditorView.tsx` (MODIFY)
- Integrates `useEditorAutoSave`.
- Integrates Back navigation guard with `ActionConfirmModal`:
  - Intercepts Back button when `isDirty === true`.
  - Offers "Lưu & Thoát", "Rời đi không lưu", and "Ở lại".
- Connects `savePaper` to `useEditorCompilation`.

### 5. `apps/web/tests/components/editor-autosave.test.tsx` (NEW)
- Unit tests for debounced auto-save, `flush()`, and `beforeunload`.

---

## Tasks

- [ ] **Task 1: Implement `useEditorAutoSave` Hook & Window `beforeunload` Guard**
  - **Files:**
    - Create: `apps/web/src/components/editor/hooks/useEditorAutoSave.ts`
    - Export in: `apps/web/src/components/editor/hooks/index.ts`
    - Create Test: `apps/web/tests/components/editor-autosave.test.tsx`
  - **Steps:**
    - [ ] Create `useEditorAutoSave.ts` with 1500ms debounce timer, `flush()` method, and `beforeunload` listener.
    - [ ] Export `useEditorAutoSave` in `apps/web/src/components/editor/hooks/index.ts`.
    - [ ] Write Vitest unit tests in `apps/web/tests/components/editor-autosave.test.tsx`.
    - [ ] Run `pnpm --filter @structpaper/web test tests/components/editor-autosave.test.tsx` to verify all tests pass.

- [ ] **Task 2: Auto-save to IndexedDB on Recompile in `useEditorCompilation`**
  - **Files:**
    - Modify: `apps/web/src/components/editor/hooks/useEditorCompilation.ts`
  - **Steps:**
    - [ ] Add `savePaper?: (paper: CompletePaper) => Promise<boolean>` to `UseEditorCompilationOptions`.
    - [ ] In `handleRecompile`, call `await savePaper(target)` before or alongside `onUpdatePaper(target)`.
    - [ ] Verify TypeScript types and run existing compilation tests: `pnpm --filter @structpaper/web test tests/integration/editor-compilation-routing.test.tsx`.

- [ ] **Task 3: Back Button Interception & Autosave Indicator in `EditorLeftDock`**
  - **Files:**
    - Modify: `apps/web/src/components/editor/EditorLeftDock.tsx`
  - **Steps:**
    - [ ] Add `onBackClick?: () => void` and `autosaveStatus?: 'idle' | 'saving' | 'saved' | 'error'` to `EditorLeftDockProps`.
    - [ ] Update Dock Back button to invoke `onBackClick` if provided, falling back to router push.
    - [ ] Update Dock Save button badge to reflect `autosaveStatus === 'saving'` (pulsing/spinning) and `autosaveStatus === 'saved'`.

- [ ] **Task 4: Integrate Auto-Save & Back Navigation Guard in `UnifiedEditorView`**
  - **Files:**
    - Modify: `apps/web/src/components/editor/UnifiedEditorView.tsx`
  - **Steps:**
    - [ ] Wire `useEditorAutoSave` into `UnifiedEditorView`.
    - [ ] Pass `savePaper` to `useEditorCompilation`.
    - [ ] Add state `isExitWarningOpen` and handlers: `handleRequestBack`, `handleConfirmSaveAndExit`, `handleDiscardAndExit`, `handleCancelExit`.
    - [ ] Render `ActionConfirmModal` when `isExitWarningOpen` is true.
    - [ ] Wire `handleRequestBack` to `EditorLeftDock` and mobile Back button.

- [ ] **Task 5: End-to-End Verification & Full Regression Testing**
  - **Files:**
    - All affected files
  - **Steps:**
    - [ ] Run `pnpm --filter @structpaper/web exec tsc --noEmit` to verify 0 type errors.
    - [ ] Run full test suite `pnpm --filter @structpaper/web test` to verify all test suites pass.
    - [ ] Verify clean git diff and commit changes.
