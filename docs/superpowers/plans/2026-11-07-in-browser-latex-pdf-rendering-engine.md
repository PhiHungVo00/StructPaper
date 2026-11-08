# In-Browser LaTeX-to-PDF Rendering Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a high-fidelity, 100% offline in-browser LaTeX-to-PDF layout and compilation engine inside `packages/compiler-client` (running inside `latex-wasm.worker.ts`) that parses LaTeX source code (Title, Authors, Abstract, Headings H1/H2/H3, Paragraphs, Tables, References) and typesets a publication-quality multi-page A4 PDF with Vietnamese Unicode font support directly in the browser when offline without requiring any backend.

**Architecture:** 
1. `latex-ast-parser.ts` parses raw LaTeX source into a structured document AST (`PaperAST`) containing metadata, sections, paragraphs, tables, and references.
2. `liberation-sans.ts` provides embedded base64 Unicode TrueType fonts (`LiberationSans-Regular` and `LiberationSans-Bold`) enabling full Vietnamese diacritics rendering without external font downloads.
3. `pdf-typesetter.ts` calculates page geometry, running headers/footers (`Trang X / Y`), article header block, multi-column / flowing paragraph layout with line-breaking, section styling, tables, and bibliography into a multi-page A4 PDF using `jsPDF`.
4. `latex-wasm.worker.ts` connects the typesetter to the Web Worker bridge, reporting fine-grained progress and returning binary PDF bytes to `WasmCompiler`.
5. `CompilerRouter` and `useEditorCompilation.ts` route compilation to `WasmCompiler` whenever the client is offline or server is unreachable.

**Tech Stack:** TypeScript, `jsPDF`, `pdfjs-dist` embedded TrueType fonts, Web Workers, Vitest.

**Spec:** `docs/superpowers/specs/2026-11-07-in-browser-latex-compiler-and-offline-architecture-design.md` and `docs/Architecture/Biên dịch LaTeX trong trình duyệt và chế độ ngoại tuyến — Thiết kế chi tiết.pdf`

---

## Global Constraints

- Must work 100% offline in a Web Worker without access to Node.js APIs (`fs`, `child_process`, `os`) or browser DOM (`window`, `document`).
- Must correctly render Vietnamese diacritics (ắ, ế, ư, ơ, đ, etc.) into the generated PDF.
- Output PDF must be valid PDF-1.4 with standard magic header `%PDF-1.4` and valid xref table.
- Monorepo vitest tests must pass 100% without memory leaks or hanging processes.
- File length limits: logic files < 500 lines.

## Review Focus

1. **Large documents (e.g. 96 paragraphs):** The typesetter must automatically flow paragraphs across 5–15+ pages with page breaks and page numbers without clipping or infinite loops.
2. **Vietnamese Unicode characters:** Text with heavy diacritics (e.g. "Căn tính", "nghiên cứu", "ĐHQG-HCM") must render legible glyphs using embedded TrueType font without encoding errors.
3. **TeX macros and formatting:** LaTeX markup such as `\textbf{...}`, `\textit{...}`, `\&`, `\%`, `~`, `\cite{...}`, `\ref{...}` must be cleaned and formatted legibly.
4. **Tables and Citations:** `\begin{table}` and `\bibitem` blocks must be parsed and laid out cleanly at the end of the document.
5. **Offline routing:** When `monitor.isServerReachable() === false` or `monitor.isOnline() === false`, `CompilerRouter` must route to `WasmCompiler` and generate the real multi-page PDF without falling back to a dummy stub.

---

### Task 1: LaTeX Document AST Parser for In-Browser Engine

**Files:**
- Create: `packages/compiler-client/src/wasm/parser/latex-ast-parser.ts`
- Create: `packages/compiler-client/src/wasm/parser/ast-types.ts`
- Create: `packages/compiler-client/tests/latex-ast-parser.test.ts`

- [x] **Step 1: Define AST types** (`ast-types.ts`):
  Define `PaperAST`, `ASTMetadata`, `ASTBlock` (`h1`, `h2`, `h3`, `paragraph`, `table`, `figure`, `reference`), `ASTTable`, `ASTReference`.

- [x] **Step 2: Write unit tests** (`latex-ast-parser.test.ts`):
  Write tests covering:
  - Extracting title from `\title{...}` or `\def\@title{...}`
  - Extracting authors from `\author{...}`
  - Extracting abstract from `\begin{abstract}...\end{abstract}` or `\begin{onecolabstract}...\end{onecolabstract}`
  - Extracting headings: `\section{...}`, `\subsection{...}`, `\subsubsection{...}`
  - Extracting paragraphs and cleaning LaTeX macros (`\textit`, `\textbf`, `\cite`, `~`, `\\`)
  - Extracting tabular data from `\begin{tabular}...\end{tabular}`
  - Extracting bibliography items from `\bibitem{...}`

- [x] **Step 3: Implement parser** (`latex-ast-parser.ts`):
  Implement `parseLatexToAST(tex: string): PaperAST` with regex-based tokenization, macro cleanup, and paragraph chunking.

- [x] **Step 4: Verify parser tests pass**:
  Run `pnpm --filter @structpaper/compiler-client vitest run tests/latex-ast-parser.test.ts`.

---

### Task 2: Embedded Unicode Font & Typography Support

**Files:**
- Create: `packages/compiler-client/src/wasm/fonts/liberation-sans.ts`
- Create: `packages/compiler-client/tests/font-metrics.test.ts`

- [x] **Step 1: Extract and compress font binary**:
  Read `LiberationSans-Regular.ttf` and `LiberationSans-Bold.ttf` from `node_modules/pdfjs-dist/standard_fonts/`, encode to base64, and export as typed constants in `liberation-sans.ts`.

- [x] **Step 2: Write test for font loading and glyph rendering**:
  Write `tests/font-metrics.test.ts` verifying that `jsPDF` can register `LiberationSans` from `liberation-sans.ts` and write Vietnamese text ("Căn tính (identity) là một khái niệm đa chiều...") into an ArrayBuffer without throwing.

- [x] **Step 3: Run test**:
  Run `pnpm --filter @structpaper/compiler-client vitest run tests/font-metrics.test.ts`.

---

### Task 3: In-Browser Multi-Page PDF Typesetting Layout Engine

**Files:**
- Create: `packages/compiler-client/src/wasm/typesetter/pdf-typesetter.ts`
- Create: `packages/compiler-client/src/wasm/typesetter/typesetter-options.ts`
- Create: `packages/compiler-client/tests/pdf-typesetter.test.ts`

- [x] **Step 1: Write unit tests** (`pdf-typesetter.test.ts`):
  - Test generating a 1-page document with title, author, abstract, and 2 paragraphs.
  - Test generating a 96-paragraph document and verifying it spans multiple pages (> 5 pages).
  - Test that every page has a header line and footer with `Trang X / Y`.
  - Test that output is valid PDF buffer with `%PDF-` header and length > 20,000 bytes.

- [x] **Step 2: Implement `PDFTypesetter`** (`pdf-typesetter.ts`):
  - Initialize `jsPDF({ format: 'a4', unit: 'pt' })` (page size: 595.28 x 841.89 pt).
  - Register `LiberationSans` regular and bold.
  - Layout functions:
    - `renderRunningHeader(doc, pageNum, journalName, title)`
    - `renderRunningFooter(doc, pageNum, totalPages)`
    - `renderTitleBlock(doc, ast, cursor)`: Journal badge, article title (16pt bold), authors, abstract box with tint and border, keywords.
    - `renderSection(doc, section, cursor)`: Section heading with page break protection.
    - `renderParagraph(doc, text, cursor)`: Line wrapping with `doc.splitTextToSize()`, automatic page breaks, cursor tracking.
    - `renderTable(doc, table, cursor)`: Render tabular cells with borders.
    - `renderReferences(doc, refs, cursor)`: Numbered reference list.
    - Final pass: loop through pages and stamp `Trang X / totalPages`.
  - Export `typesetLatexToPdf(tex: string, options?: TypesetterOptions): Uint8Array`.

- [x] **Step 3: Run unit tests**:
  Run `pnpm --filter @structpaper/compiler-client vitest run tests/pdf-typesetter.test.ts`.

---

### Task 4: Integrate Typesetter into `latex-wasm.worker.ts` & `WasmCompiler`

**Files:**
- Modify: `packages/compiler-client/src/wasm/worker/latex-wasm.worker.ts`
- Modify: `packages/compiler-client/src/wasm/wasm-compiler.ts`
- Modify: `packages/compiler-client/tests/wasm-compiler.test.ts`

- [x] **Step 1: Update Web Worker compilation handler**:
  In `executeCompilation` inside `latex-wasm.worker.ts`:
  - When external `@siglum/engine` is not present, call `typesetLatexToPdf(payload.tex)` instead of the minimal 1-line stub!
  - Emit realistic progress milestones:
    - 20%: Phân tích cấu trúc tài liệu LaTeX (AST Parsing)
    - 50%: Dàn trang văn bản và định dạng phông chữ (Typesetting)
    - 80%: Tạo các trang PDF và đánh số trang (PDF Generation)
    - 100%: Hoàn tất biên dịch
  - Return the real multi-page `pdfBytes`.

- [x] **Step 2: Verify `wasm-compiler.test.ts`**:
  Run `pnpm --filter @structpaper/compiler-client vitest run tests/wasm-compiler.test.ts`.

---

### Task 5: Configure Offline Auto-Routing in `useEditorCompilation.ts`

**Files:**
- Modify: `apps/web/src/components/editor/hooks/useEditorCompilation.ts`
- Modify: `apps/web/tests/integration/editor-compilation-routing.test.tsx`

- [x] **Step 1: Update `useEditorCompilation.ts` routing context**:
  - In `getContext()`:
    - `localEnv: 'ready'` (since our in-browser typesetter is now fully ready and built-in!).
    - `userPreference: 'auto'`.
    - When `monitor.isOnline() && monitor.isServerReachable()`: User can use Server Tectonic for 100% native TeX Live or local WASM.
    - When `!monitor.isOnline() || !monitor.isServerReachable()`: `CompilerRouter` automatically selects `browser-wasm` (Rule 4: Offline Local Ready).
    - The in-browser typesetter compiles all 96 sections into a real multi-page PDF offline!

- [x] **Step 2: Add integration tests**:
  Test in `editor-compilation-routing.test.tsx` that when offline, `useEditorCompilation` produces a multi-page PDF blob from `WasmCompiler`.

- [x] **Step 3: Run all monorepo tests and typecheck**:
  - `pnpm --filter @structpaper/compiler-client test`
  - `pnpm --filter @structpaper/web test`
  - `pnpm --filter @structpaper/web exec tsc --noEmit`
