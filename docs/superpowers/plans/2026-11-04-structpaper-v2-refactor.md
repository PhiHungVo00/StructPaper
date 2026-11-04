# Kế hoạch Triển khai Tái cấu trúc StructPaper v2 (Implementation Plan)

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Chuyển đổi toàn diện hệ thống StructPaper từ kiến trúc nguyên khối sang kiến trúc phân tầng Monorepo (pnpm workspaces) theo chiến lược Strangler Fig, đảm bảo bảo toàn 100% giao diện người dùng, hỗ trợ mô hình Manuscript v2 có cấu trúc với Stable ID, trích xuất DOCX chuẩn hóa theo Word Styles của tòa soạn, lưu trữ ngoại tuyến chống mất dữ liệu (Dexie IndexedDB), Undo/Redo, biên dịch LaTeX an toàn và backend Spring Boot mô-đun hóa.

**Architecture:** Kiến trúc phân tầng Hexagonal / Ports & Adapters trong cấu trúc Monorepo (`apps/*`, `packages/*`). Lõi miền `packages/doc-model` thuần túy TypeScript, không phụ thuộc DOM hay React; mọi biến đổi trên Editor đi qua `CommandBus` với Immer patches; lưu trữ Offline-First qua Dexie; trích xuất Word đa tầng ưu tiên `StyleMapRecognizer`; biên dịch LaTeX qua `LatexExporter` hợp nhất gọi macro `.cls`.

**Tech Stack:** Next.js 14, React 18, Tailwind CSS, TypeScript 5, pnpm, Vitest, Playwright, Zustand, Immer, Dexie (IndexedDB), TipTap/ProseMirror, fast-xml-parser, Spring Boot 3, MySQL 8 (Native JSON), XeLaTeX / Tectonic.

**Spec:** [`docs/superpowers/specs/2026-11-04-structpaper-v2-refactor-design.md`](file:///c:/Users/OWNER/source/StructPaper/docs/superpowers/specs/2026-11-04-structpaper-v2-refactor-design.md)

---

## Global Constraints

- **Bảo tồn giao diện:** Nghiêm cấm thay đổi 180 độ giao diện người dùng hiện tại; giữ nguyên mọi luồng Upload $\rightarrow$ Editor chia đôi màn hình, Dock, các Tab và Modal.
- **Giới hạn số dòng theo tầng (Tiered Line Limits):** Logic thuần tối đa 500 dòng (cảnh báo từ 300); component giao diện tối đa 700 dòng (cảnh báo từ 400); bật `skipBlankLines: true` và `skipComments: true`. Các file cũ vượt ngưỡng nằm trong baseline allowlist và chỉ được giảm.
- **Bảo mật:** Không lưu API key ở client; loại bỏ `NEXT_PUBLIC_OPENAI_API_KEY`, sử dụng route server proxy `/api/ai/proxy` có whitelist action, giới hạn payload và origin check.
- **Định danh khối:** Sử dụng ULID (`ulid`) qua interface `IdGenerator` có thể inject (dùng deterministic generator trong unit test).
- **Không lưu base64:** Toàn bộ ảnh lưu theo mã băm SHA-256 nhị phân (Blob trong Dexie / file trên máy chủ); loại bỏ hoàn toàn `sessionStorage`.
- **Hệ thống luôn chạy được:** Ở cuối mỗi task, `pnpm build` (`next build`) và `./gradlew test` (backend) bắt buộc phải xanh.

---

## Review Focus

1. **Gõ tiếng Việt Telex/VNI trong TipTap Editor:** Kiểm tra sự kiện composition qua Playwright CDP `Input.imeSetComposition` không bị mất dấu tiếng Việt hoặc nhảy con trỏ.
2. **Chống mất dữ liệu khi F5 hoặc đóng tab:** Kiểm tra kịch bản nạp bản thảo, chỉnh sửa, chờ 1s autosave, F5 khôi phục nguyên vẹn 100% từ Dexie.
3. **Trích xuất chính xác 100% file Word template chuẩn:** Kiểm tra `StyleMapRecognizer` nhận diện đầy đủ FrontMatter, Sections, Tables, Equations, References trên cả 4 file trong `docs/StandardTemplate/`.
4. **Fallback an toàn khi nạp file Word tự do:** Kiểm tra file Word không có style chuẩn tự động fallback qua parser cũ với cờ `ENABLE_LEGACY_PARSER_FALLBACK` và đi qua `migrateV1toV2` mà không gây sập ứng dụng.
5. **Đồng bộ Undo/Redo tức thì:** Bấm `Ctrl+Z` và `Ctrl+Y` trên Editor khôi phục chính xác từng thao tác mà không gây lệch số thứ tự hay vỡ cây dữ liệu.

---

## Danh sách Task Thực thi (Bite-Sized Tasks)

### Phase 0: Nền tảng Monorepo, AI Proxy Bảo mật & Tooling Kiểm thử

- [x] **Task 0.1: Xây dựng Route Server AI Proxy an toàn & Loại bỏ Client API Key**
  - **Files:**
    - Tạo: `apps/web/src/app/api/ai/proxy/route.ts` (hiện tại ở `struct-paper-app/src/app/api/ai/proxy/route.ts`)
    - Sửa: `struct-paper-app/src/lib/docx-parser.ts` (trỏ endpoint AI sang proxy nội bộ)
    - Sửa: `struct-paper-app/src/components/UploadView.tsx` (loại bỏ NEXT_PUBLIC_ key)
    - Sửa: `struct-paper-app/.env.local` (chuyển sang `OPENAI_API_KEY`)
    - Test: `struct-paper-app/src/app/api/ai/proxy/route.test.ts` (9/9 pass)
  - **Hoàn thành:** Đã viết test TDD, loại bỏ hoàn toàn `NEXT_PUBLIC_OPENAI_API_KEY`, bảo vệ route bằng whitelist actions, payload limit 15KB và origin check. Next.js build pass.

- [x] **Task 0.2: Chuyển dịch Thư mục Monorepo bằng `git mv` & Cấu hình `pnpm-workspace.yaml`**
  - **Files:**
    - Tạo: `pnpm-workspace.yaml`
    - Di chuyển: `struct-paper-app` $\rightarrow$ `apps/web` (bằng `git mv`)
    - Di chuyển: `struct-paper-backend` $\rightarrow$ `apps/api` (bằng `git mv`)
    - Sửa: `package.json` (root), `apps/web/package.json`, `apps/web/next.config.mjs`, `apps/web/tsconfig.json`
    - Tạo: `packages/` (thư mục gốc)
  - **Hoàn thành:** Đã di chuyển thư mục bảo toàn lịch sử Git (commit `5b87294`), cấu hình `pnpm-workspace.yaml`, cập nhật `transpilePackages` và path mappings. Cả Next.js build và Gradle tests backend đều xanh 100%.

- [x] **Task 0.3: Thiết lập Vitest, Playwright, Dependency-Cruiser & ESLint Tiered Limits**
  - **Files:**
    - Tạo: `vitest.workspace.ts`, `vitest.config.ts`, `playwright.config.ts`
    - Tạo: `.dependency-cruiser.js`, `.eslintrc.cjs`, `.eslintignore`, `tsconfig.json`
    - Tạo: `scripts/baseline-line-limits.json`, `scripts/verify-line-limits.js`
    - Test: `tests/architecture.test.ts`, `e2e/smoke.spec.ts`
  - **Hoàn thành:** Cấu hình thành công Vitest workspace, Playwright test harness, Dependency-Cruiser architecture guardrails (cấm `doc-model` contamination và enforce strict downward dependencies) cùng ESLint tiered line limits (logic <=500 lines, UI <=700 lines) kèm baseline allowlist bảo vệ 41 file legacy. `pnpm lint`, `pnpm depcruise`, `pnpm test`, và Next.js build đều xanh 100%.

- [x] **Task 0.4: Thiết lập Bộ Golden Fixtures (11 file bài báo thật) & Baseline Characterization Test**
  - **Files:**
    - Tạo: `fixtures/golden/templates/` (sao chép 4 file template)
    - Tạo: `fixtures/golden/papers/` (sao chép 7 file bài báo Word thật, loại trừ `Yêu cầu phần mềm.docx`)
    - Tạo: `fixtures/golden/baseline-snapshots.json`
    - Tạo: `tests/baseline-parser.test.ts`
  - **Hoàn thành:** Đã thiết lập trọn bộ 11 file Word golden fixtures (4 templates + 7 bài báo Word thật từ File demo và các phân ban tạp chí ARNS, EBL, EES, HS, SSH, ET; loại trừ nghiêm ngặt `Yêu cầu phần mềm.docx`). Đã sinh snapshot baseline đối chứng và hoàn thành bộ test characterization `tests/baseline-parser.test.ts` kiểm thử 14/14 tests xanh tuyệt đối (5.32s). `pnpm test`, `pnpm lint`, `pnpm depcruise`, và Next.js build đều đạt 100%.

---

### Phase 1: Lõi Miền `packages/doc-model` & `packages/journal-profiles` (CỔNG 1)

- [x] **Task 1.1: Khởi tạo Package `packages/doc-model` với Zod Schemas & TypeScript Types**
  - **Files:**
    - Tạo: `packages/doc-model/package.json`
    - Tạo: `packages/doc-model/tsconfig.json`
    - Tạo: `packages/doc-model/src/types/manuscript.ts`
    - Tạo: `packages/doc-model/src/types/block.ts`
    - Tạo: `packages/doc-model/src/types/inline.ts`
    - Tạo: `packages/doc-model/src/types/citation.ts`
    - Tạo: `packages/doc-model/src/types/contracts.ts`
    - Tạo: `packages/doc-model/src/types/index.ts`
    - Tạo: `packages/doc-model/src/schemas/manuscript.schema.ts`
    - Tạo: `packages/doc-model/src/schemas/index.ts`
    - Tạo: `packages/doc-model/src/utils/id-generator.ts`
    - Tạo: `packages/doc-model/src/utils/index.ts`
    - Tạo: `packages/doc-model/src/index.ts`
    - Test: `packages/doc-model/tests/manuscript.schema.test.ts`
    - Test: `packages/doc-model/tests/id-generator.test.ts`
  - **Hoàn thành:** Đã khởi tạo hoàn chỉnh package `@structpaper/doc-model` độc lập với zero contamination; định nghĩa đầy đủ TypeScript types (`Manuscript`, `Section`, `Block`, `Inline`, `Cell`, `Reference`, `Author`, `Affiliation`, `AssetMeta`, và các common contracts `Command`, `Patch`, `InversePatch`, `ManuscriptRepository`, `AssetRepository`); xây dựng Zod schemas với lazy evaluation hỗ trợ đệ quy; triển khai `IdGenerator` (`UlidIdGenerator` và `DeterministicIdGenerator`). 26/26 tests của doc-model và 52/52 tests toàn monorepo pass 100%, 0 vi phạm depcruise, 0 lỗi eslint.

- [x] **Task 1.2: Xây dựng Hàm Thuần túy `computeNumbering` (Derived Numbering)**
  - **Files:**
    - Tạo: `packages/doc-model/src/numbering/compute-numbering.ts`
    - Tạo: `packages/doc-model/src/numbering/styles.ts`
    - Tạo: `packages/doc-model/src/numbering/index.ts`
    - Sửa: `packages/doc-model/src/types/citation.ts`
    - Sửa: `packages/doc-model/src/index.ts`
    - Sửa: `packages/doc-model/package.json`
    - Test: `packages/doc-model/tests/compute-numbering.test.ts`
    - Test: `packages/doc-model/tests/compute-numbering.property.test.ts` (dùng `fast-check`)
  - **Hoàn thành:** Đã triển khai hàm thuần túy `computeNumbering` duyệt đệ quy toàn diện `Section`, `Block`, `Inline`. Đánh số tuần tự 1-based cho Figures, Tables, Equations (chỉ đánh số khi `numbered: true`). Ghi nhận thứ tự xuất hiện đầu tiên của citations trong `citationOrder`, sinh `citationLabels` dạng range Vancouver (`2-4`, `1, 3-5, 8`), hỗ trợ `bibliographyOrder` cho cả Vancouver và APA. Phát hiện chính xác `uncitedRefs`, `danglingCites`, `xrefBroken`, và tiền kiểm định preflight `firstMentionBeforeFloat`. 100% tests (13/13 tests mới gồm 9 unit tests và 4 property-based tests với 300 runs qua `fast-check`, tổng cộng 65/65 tests monorepo) xanh tuyệt đối; 0 vi phạm depcruise, 0 lỗi eslint, Next.js build xanh 100%.

- [x] **Task 1.3: Khởi tạo Package `packages/journal-profiles` & Schema Profile `VNUHCM-HS`**
  - **Files:**
    - Tạo: `packages/journal-profiles/package.json`
    - Tạo: `packages/journal-profiles/tsconfig.json`
    - Tạo: `packages/journal-profiles/src/types/profile.ts`
    - Tạo: `packages/journal-profiles/src/types/index.ts`
    - Tạo: `packages/journal-profiles/src/schemas/profile.schema.ts`
    - Tạo: `packages/journal-profiles/src/schemas/index.ts`
    - Tạo: `packages/journal-profiles/src/profiles/vnuhcm-hs.json`
    - Tạo: `packages/journal-profiles/src/profiles/index.ts`
    - Tạo: `packages/journal-profiles/src/index.ts`
    - Test: `packages/journal-profiles/tests/profile.test.ts` (18/18 pass)
  - **Hoàn thành:** Khởi tạo thành công package độc lập `@structpaper/journal-profiles`; định nghĩa đầy đủ TypeScript types và Zod schemas cho `JournalProfile` (names, articleTypes, frontMatter, citation, styleMap, layout, typography, latex, qc); tạo cấu hình profile chuẩn `VNUHCM-HS` chứa quy định tóm tắt 275-500 từ, từ khóa 3-5 phân cách dấu chấm phẩy, trích dẫn Vancouver dạng ngoặc vuông, định dạng LaTeX `structpaper-hs.cls` / `xelatex`, và `styleMap` ánh xạ chính xác 35 styles Word (trong đó `Guide*` và `Instruction` ánh xạ vào `ignore`); cung cấp helper functions `getJournalProfile` và `getAllJournalProfiles`. 100% test (18/18 test mới, 83/83 tests monorepo) xanh, Next.js build pass, 0 vi phạm depcruise, 0 lỗi eslint.

- [x] **Task 1.4: Định nghĩa Hợp đồng Chung (Common Interfaces) & Bộ Chuyển đổi V1 $\leftrightarrow$ V2**
  - **Files:**
    - Tạo: `packages/doc-model/src/interfaces/command.ts` (Command, Patch, InversePatch)
    - Tạo: `packages/doc-model/src/interfaces/repository.ts` (ManuscriptRepository, AssetRepository, ManuscriptSummary)
    - Tạo: `packages/doc-model/src/interfaces/index.ts`
    - Tạo: `packages/doc-model/src/adapters/types.ts`
    - Tạo: `packages/doc-model/src/adapters/text-citation-utils.ts`
    - Tạo: `packages/doc-model/src/adapters/migrate-v1-to-v2.ts`
    - Tạo: `packages/doc-model/src/adapters/adapt-v2-to-v1.ts`
    - Tạo: `packages/doc-model/src/adapters/index.ts`
    - Test: `packages/doc-model/tests/adapters.test.ts` (17/17 pass)
  - **Hoàn thành:** Định nghĩa đầy đủ các interface dùng chung `Command`, `Patch`, `InversePatch`, `ManuscriptRepository`, `AssetRepository`, `ManuscriptSummary`; triển khai bộ chuyển đổi 2 chiều `migrateV1toV2` (chuyển đổi phẳng sang phân cấp, phân tích trích dẫn `[1]`, `[2, 3]`, `[2-4]` thành node cite, chuyển đổi bảng sang grid Cell, chuyển đổi hình ảnh base64 sang asset metadata SHA-256) và `adaptV2toV1` (dùng `computeNumbering` tái tạo `[n]`, khôi phục headers/rows bảng và asset figure); kiểm thử roundtrip `v1 -> v2 -> v1` bảo toàn cấu trúc; 100/100 tests monorepo xanh, Next.js build pass, 0 vi phạm depcruise, 0 lỗi eslint.
  - **KHÓA CỔNG 1 (Gate 1 Closed):** Cổng 1 chính thức khóa. Toàn bộ types, Zod schemas của `packages/doc-model`, profile của `packages/journal-profiles`, common interfaces và adapters đã sẵn sàng để các sub-agents bắt đầu Phase 2, 3, 5, 6.

---

### Phase 2: Engine Spike, Cổng 2 OpenAPI, Minimal Store/Bus & Lưu trữ Offline-first

- [x] **Task 2.1: LaTeX Engine Spike (XeLaTeX, Tectonic, WasmCompiler)**
  - **Files:**
    - Tạo: `scripts/spikes/latex-engine-spike.ts`
    - Tạo: `docs/superpowers/specs/spike-latex-engine-report.md`
    - Tạo: `tests/latex-spike.test.ts`
    - Sửa: `package.json` (thêm script `spike:engine` và dependency `tsx`)
  - **Bước 1:** Viết script benchmark chạy biên dịch bài mẫu chứa tiếng Việt Unicode, font OpenType và công thức toán với:
    - Engine 1: `xelatex` (local TeX Live / Docker container baseline).
    - Engine 2: `bin/tectonic.exe` (đã có sẵn trong thư mục `bin/tectonic.exe`).
    - Engine 3: `WasmCompiler` (phân tích tính khả thi trong trình duyệt).
  - **Bước 2:** So sánh thời gian biên dịch (Cold vs Warm), dung lượng PDF, mức chiếm dụng bộ nhớ, độ trung thực font chữ tiếng Việt và khả năng cách ly bảo mật (`--untrusted`, `--no-shell-escape`).
  - **Bước 3:** Ghi nhận báo cáo kỹ thuật chi tiết tại `docs/superpowers/specs/spike-latex-engine-report.md`, chốt sử dụng **XeLaTeX** làm engine chính thức trên server (Spring Boot Compile Queue qua Docker TeX Live) và **Tectonic** làm engine dev offline siêu tốc (zero-config, ~1.1s warm compile).
  - **Hoàn thành:** Đã viết xong benchmark script đa nền tảng, xuất báo cáo benchmark tự động `benchmark-results.json` và file PDF kiểm chứng `spike-sample.pdf` (hợp lệ với magic bytes `%PDF-`). 105/105 tests monorepo xanh, 0 vi phạm depcruise, 0 lỗi eslint, Next.js build pass 100%.

- [x] **Task 2.2: Thiết lập Hợp đồng API `contracts/openapi.yaml` (KHÓA CỔNG 2)**
  - **Files:**
    - Tạo: `contracts/openapi.yaml`
    - Sửa: `apps/web/package.json` (thêm script sinh client `openapi-typescript`)
    - Tạo: `apps/web/src/lib/api/schema.d.ts` (sinh tự động từ openapi.yaml)
    - Test: `contracts/tests/openapi-validation.test.ts`
  - **Bước 1:** Viết `contracts/openapi.yaml` đặc tả đầy đủ endpoints:
    - `/api/v1/manuscripts/{id}` (GET, PUT với `If-Match: rev` header)
    - `/api/v1/manuscripts/{id}/revisions` (GET lấy lịch sử revision)
    - `/api/v1/assets/{sha256}` (HEAD kiểm tra, PUT upload binary theo hash SHA-256, GET tải binary)
    - `/api/v1/compile` (POST nạp manifest job, GET polling status, GET SSE sự kiện thời gian thực, DELETE hủy job)
    - `/api/v1/journals/{id}/profile` (GET lấy JournalProfile)
    - `/api/v1/ai/extract` (POST proxy trích xuất bảo mật với action whitelist)
    - `/api/v1/batches` (POST nạp ZIP đa bài báo)
    - Toàn bộ Schema (`Manuscript`, `Section`, `Block`, `Inline`, `Cell`, `Reference`, `AssetMeta`, `JournalProfile`, `CompileRequest`, etc.) khớp 100% với Zod schema và TypeScript types của `packages/doc-model` và `packages/journal-profiles`.
  - **Bước 2:** Viết test validate cú pháp OpenAPI 3.0.3, regex ULID/SHA-256, 8 block types, 6 inline types, If-Match parameter, và cross-validation với Zod fixture. 9/9 unit tests pass.
  - **Bước 3: KHÓA CỔNG 2 (Gate 2 Closed).** Tất cả 114/114 tests monorepo xanh, 0 vi phạm depcruise, 0 lỗi eslint. Đã sinh thành công client types `apps/web/src/lib/api/schema.d.ts`.

- [x] **Task 2.3: Xây dựng Bản Tối thiểu của `packages/editor-core` (Store, CommandBus, History)**
  - **Files:**
    - Tạo: `packages/editor-core/package.json`
    - Tạo: `packages/editor-core/tsconfig.json`
    - Tạo: `packages/editor-core/src/store/manuscript-store.ts` (Zustand vanilla store)
    - Tạo: `packages/editor-core/src/store/index.ts`
    - Tạo: `packages/editor-core/src/commands/types.ts`
    - Tạo: `packages/editor-core/src/commands/base-commands.ts` (9 base commands)
    - Tạo: `packages/editor-core/src/commands/index.ts`
    - Tạo: `packages/editor-core/src/bus/command-bus.ts` (produceWithPatches, onPatch listener)
    - Tạo: `packages/editor-core/src/bus/index.ts`
    - Tạo: `packages/editor-core/src/history/history-manager.ts` (undoStack, redoStack, sliding window max 100)
    - Tạo: `packages/editor-core/src/history/index.ts`
    - Tạo: `packages/editor-core/src/index.ts`
    - Test: `packages/editor-core/tests/fixtures/sample-manuscript.ts`
    - Test: `packages/editor-core/tests/command-bus.test.ts` (12/12 pass)
    - Test: `packages/editor-core/tests/history-manager.test.ts` (7/7 pass)
  - **Hoàn thành:** Đã khởi tạo hoàn chỉnh package `@structpaper/editor-core`. Triển khai Zustand vanilla store quản lý vòng đời Manuscript (`rev`, `savedRev`, `isDirty`). Xây dựng `CommandBus` điều phối và sinh cặp forward/inverse patches nguyên tử qua Immer `produceWithPatches`. Triển khai đầy đủ 9 base command handlers (`metadata/updateTitle`, `metadata/updateAbstract`, `metadata/updateAuthors`, `block/insert`, `block/update`, `block/remove`, `reference/add`, `reference/remove`, `table/updateCell`). Xây dựng `HistoryManager` quản lý undo/redo stack tối đa 100 bước, tự động dọn redo stack khi có mutation mới, đồng bộ trạng thái Store và khôi phục chính xác 100% snapshot dữ liệu. 133/133 tests monorepo xanh (19/19 test mới), 0 vi phạm depcruise, 0 lỗi eslint, Next.js build pass 100%.

- [x] **Task 2.4: Xây dựng Package `packages/storage` (Dexie IndexedDB & Autosave)**
  - **Files:**
    - Tạo: `packages/storage/package.json`
    - Tạo: `packages/storage/tsconfig.json`
    - Tạo: `packages/storage/src/db/types.ts`
    - Tạo: `packages/storage/src/db/structpaper-db.ts` (Dexie 8 bảng)
    - Tạo: `packages/storage/src/db/index.ts`
    - Tạo: `packages/storage/src/repositories/indexeddb-manuscript-repo.ts`
    - Tạo: `packages/storage/src/repositories/indexeddb-asset-repo.ts`
    - Tạo: `packages/storage/src/repositories/index.ts`
    - Tạo: `packages/storage/src/autosave/autosave-engine.ts`
    - Tạo: `packages/storage/src/autosave/index.ts`
    - Tạo: `packages/storage/src/backup/zip-backup.ts` (xuất/nhập `.structpaper`)
    - Tạo: `packages/storage/src/backup/index.ts`
    - Tạo: `packages/storage/src/index.ts`
    - Sửa: `.dependency-cruiser.js` (cho phép `@structpaper/storage` phụ thuộc `doc-model` và `editor-core`)
    - Sửa: `vitest.workspace.ts` (alias `@structpaper/storage`)
    - Test: `packages/storage/tests/storage.test.ts` (9/9 pass)
    - Test: `packages/storage/tests/autosave.test.ts` (5/5 pass)
  - **Hoàn thành:** Đã khởi tạo hoàn chỉnh package `@structpaper/storage` Offline-First. Triển khai `StructPaperDatabase` kế thừa Dexie với 8 bảng (`manuscripts`, `revisions`, `assets`, `assetRefs`, `ingestSources`, `outbox`, `compileCache`, `settings`). Triển khai `IndexedDbManuscriptRepo` (lưu giao dịch, tự động snapshot revision và cập nhật quan hệ `assetRefs`, `listRecent` tối ưu không nạp nặng full body). Triển khai `IndexedDbAssetRepo` (lưu binary blob ảnh theo mã băm SHA-256). Triển khai `AutosaveEngine` (lắng nghe `onPatch` từ `CommandBus`, debounce 1 giây ghi an toàn xuống IndexedDB, đồng bộ cờ `isDirty` trên Store, hỗ trợ `flush` tức thì và `stop` dọn dẹp). Triển khai bộ sao lưu nén `.structpaper` qua JSZip (`exportBackup` và `importBackup` roundtrip). 147/147 tests monorepo xanh (14/14 tests mới), 0 vi phạm depcruise, 0 lỗi eslint, Next.js build pass 100%.

- [x] **Task 2.5: Viết Kiểm thử E2E Đầu tiên (Chống mất Dữ liệu F5)**
  - **Files:**
    - Tạo: `e2e/data-persistence.spec.ts` (Playwright E2E test suite)
    - Tạo: `apps/web/src/app/dev-persistence-test/page.tsx` (Test harness Client page)
    - Sửa: `playwright.config.ts` (cấu hình webServer dev:web port 3000)
    - Sửa: `apps/web/package.json` (kết nối workspace doc-model, editor-core, storage)
  - **Bước 1:** Viết kịch bản Playwright E2E:
    - Mở ứng dụng `http://localhost:3000`.
    - Tải một bản thảo mẫu vào hệ thống.
    - Sửa tiêu đề bài báo.
    - Đợi 1.2 giây để Autosave hoàn tất ghi xuống IndexedDB.
    - Thực hiện Reload trang (F5).
    - Kiểm tra tiêu đề vừa sửa vẫn hiển thị nguyên vẹn 100%.
  - **Bước 2:** Chạy kiểm thử Playwright và xác nhận tính bền vững của dữ liệu:
    - Test 1: IndexedDB Persistence on Page Reload (F5) - giữ nguyên manuscript và revision snapshot.
    - Test 2: Autosave Lifecycle - debounce user edit, lưu IndexedDB, cập nhật `rev`, `savedRev`, giữ nguyên tiêu đề sau F5.
    - Test 3: Asset Binary Persistence - lưu binary Blob ảnh theo SHA-256 vào `assets`, kiểm tra byte-exact sau F5.
  - **Hoàn thành:** Đã tạo hoàn chỉnh bộ kiểm thử Playwright E2E `e2e/data-persistence.spec.ts` và trang harness `dev-persistence-test` phục vụ xác thực độ bền vững dữ liệu. Cấu hình tự động khởi động webServer `pnpm dev:web` trên `http://localhost:3000`. Cả 4/4 kịch bản Playwright E2E chạy trên Chromium thực tế đều pass 100% (chứng minh chống mất dữ liệu tuyệt đối khi người dùng ấn F5). 147/147 unit tests Vitest monorepo pass 100%, 0 vi phạm depcruise, 0 lỗi eslint. Giai đoạn 2 (Phase 2) chính thức hoàn tất.

---

### Phase 3: Pipeline Bóc tách DOCX Đa tầng `packages/ingest-docx`

- [x] **Task 3.1: Xây dựng Package Layer & OOXML Reader với `fast-xml-parser`**
  - **Files:**
    - Tạo: `packages/ingest-docx/package.json`
    - Tạo: `packages/ingest-docx/tsconfig.json`
    - Tạo: `packages/ingest-docx/src/types/raw-doc.ts`
    - Tạo: `packages/ingest-docx/src/package/docx-package.ts`
    - Tạo: `packages/ingest-docx/src/ooxml/xml-node.ts`
    - Tạo: `packages/ingest-docx/src/ooxml/style-resolver.ts`
    - Tạo: `packages/ingest-docx/src/ooxml/raw-doc-visitor.ts`
    - Test: `packages/ingest-docx/tests/ooxml-reader.test.ts`
  - **Bước 1:** Viết test mở file `.docx` mẫu, kiểm tra đọc được các part: `document.xml`, `styles.xml`, `numbering.xml`, và trích xuất các asset ảnh trong `word/media/`.
  - **Bước 2:** Triển khai `DocxPackage` bọc JSZip để đọc nhanh các part nhị phân.
  - **Bước 3:** Triển khai `RawDocVisitor` duyệt XML bằng `fast-xml-parser`, phân giải cây kế thừa `w:basedOn`, gỡ bỏ `w:sdt`, và bóc tách `w:instrText` (REF, SEQ, EndNote).
  - **Bước 4:** Chạy test kiểm tra trả về danh sách `RawBlock[]` thô chuẩn xác.
  - **Hoàn thành:** Đã khởi tạo hoàn chỉnh package `@structpaper/ingest-docx` với JSZip và fast-xml-parser isomorphic (chạy trên Node, Browser, Web Worker không phụ thuộc DOMParser). `DocxPackage` bóc tách nhanh XML parts và thư mục `word/media/` cùng bản đồ quan hệ `rels`. `StyleResolver` phân giải đầy đủ tên style, chuỗi kế thừa `w:basedOn` chống loop và hỗ trợ tra cứu không phân biệt hoa thường. `RawDocVisitor` duyệt cây OOXML trích xuất formatting (bold, italic, sup, sub, code, font, size), OMML Math (inline & block), drawings, fields đơn và phức tạp, bảng với `gridSpan` và `vMerge`, hỗ trợ Track Changes và content controls `w:sdt`. 16/16 tests trong `ooxml-reader.test.ts` và toàn bộ 163/163 unit tests monorepo pass 100%, 0 vi phạm depcruise, 0 lỗi eslint.

- [x] **Task 3.2: Xây dựng `StyleMapRecognizer` cho ~35 Word Styles Chuẩn & StructureRecognizer**
  - **Files:**
    - Tạo: `packages/ingest-docx/src/recognizers/types.ts` (SemanticRole, Claim, IngestContext, Recognizer)
    - Tạo: `packages/ingest-docx/src/recognizers/style-map-recognizer.ts`
    - Tạo: `packages/ingest-docx/src/recognizers/structure-recognizer.ts`
    - Tạo: `packages/ingest-docx/src/recognizers/recognizer-chain.ts`
    - Tạo: `packages/ingest-docx/src/recognizers/index.ts`
    - Sửa: `packages/ingest-docx/src/index.ts` (export recognizers)
    - Sửa: `packages/ingest-docx/package.json` (thêm phụ thuộc `@structpaper/journal-profiles` và export recognizers)
    - Sửa: `.dependency-cruiser.js` (cho phép `@structpaper/ingest-docx` phụ thuộc `@structpaper/journal-profiles`)
    - Test: `packages/ingest-docx/tests/style-map-recognizer.test.ts` (18/18 pass)
  - **Bước 1:** Viết test với dữ liệu từ `Template_EN.docx` và `Template_VI.docx`:
    - Đoạn có style `ArticleTitle` nhận diện đúng vai trò Title (confidence 1.0).
    - Đoạn có style `Authors`, `Affiliation`, `SectionAbstract` nhận diện đúng FrontMatter.
    - Các đoạn mang style `Guide*` hoặc `Instruction` bị loại bỏ sạch sẽ.
    - Đoạn không có style chuẩn thì chuyển qua `StructureRecognizer` phỏng đoán bằng regex (Table N., Hình N.).
  - **Bước 2:** Triển khai `StyleMapRecognizer` đọc bản đồ `styleMap` từ `packages/journal-profiles`.
  - **Bước 3:** Triển khai `StructureRecognizer` theo Chain of Responsibility.
  - **Bước 4:** Chạy test xác nhận nhận diện chính xác 100% các đoạn mẫu.
  - **Hoàn thành:** Đã xây dựng hoàn chỉnh hệ thống nhận diện ngữ nghĩa đa tầng DOCX (`StyleMapRecognizer`, `StructureRecognizer`, `RecognizerChain`). `StyleMapRecognizer` (Priority 1) ánh xạ trọn vẹn 35 standard Word styles trong profile `VNUHCM-HS` với độ tin cậy 1.0, hỗ trợ chuẩn hóa tên style không phân biệt hoa thường/khoảng trắng, duyệt chuỗi kế thừa `w:basedOn` qua `StyleResolver`, và loại bỏ toàn bộ các đoạn hướng dẫn template `Guide*`/`Instruction` vào vai trò `ignore`. `StructureRecognizer` (Priority 2) nhận diện bằng heuristic cho đoạn unstyled: bảng biểu (`table.cell`, 0.9), table captions (`table.caption`, 0.85), figure captions (`figure.caption`, 0.85), keywords (`keywords`, 0.85), trích dẫn tài liệu tham khảo `[n]` (`reference`, 0.8), đánh số đề mục La Mã / số Ả Rập (`h1`/`h2`/`h3`, 0.8), và tiêu đề đậm/giữa ở đầu văn bản (`title`, 0.6). `RecognizerChain` điều phối thực thi theo thứ tự ưu tiên, short-circuit khi đạt confidence 1.0, chọn claim có độ tin cậy cao nhất và fallback về body paragraph mặc định (confidence 0.5). 18/18 tests mới và 181/181 unit tests monorepo pass 100%, 0 vi phạm depcruise, 0 lỗi eslint.

- [x] **Task 3.3: Xây dựng Bộ Assemblers (Table, Figure, Equation, Reference, Section)**
  - **Files:**
    - Tạo: `packages/ingest-docx/src/assemblers/types.ts`
    - Tạo: `packages/ingest-docx/src/assemblers/inline-utils.ts`
    - Tạo: `packages/ingest-docx/src/assemblers/table-assembler.ts` (lưới `rowSpan`/`colSpan`)
    - Tạo: `packages/ingest-docx/src/assemblers/figure-assembler.ts` (SHA-256 asset hash)
    - Tạo: `packages/ingest-docx/src/assemblers/equation-assembler.ts` (OMML $\rightarrow$ MathML $\rightarrow$ LaTeX)
    - Tạo: `packages/ingest-docx/src/assemblers/reference-assembler.ts`
    - Tạo: `packages/ingest-docx/src/assemblers/front-matter-assembler.ts`
    - Tạo: `packages/ingest-docx/src/assemblers/section-tree-assembler.ts`
    - Tạo: `packages/ingest-docx/src/assemblers/backmatter-assembler.ts`
    - Tạo: `packages/ingest-docx/src/assemblers/doc-assembler.ts`
    - Tạo: `packages/ingest-docx/src/assemblers/index.ts`
    - Test: `packages/ingest-docx/tests/assemblers.test.ts`
  - **Bước 1:** Viết test dựng ma trận bảng có `w:gridSpan` và `w:vMerge` thành ma trận `Cell[][]` có `colSpan`/`rowSpan` chuẩn.
  - **Bước 2:** Viết test chuyển đổi công thức OMML phức tạp (phân số, căn bậc hai, tích phân) sang mã LaTeX.
  - **Bước 3:** Triển khai toàn bộ các class Assembler gom nhóm các `RawBlock` đã được nhận diện vào cấu trúc `Manuscript`.
  - **Bước 4:** Chạy test xác nhận cây bài báo được dựng hoàn chỉnh.
  - **Hoàn thành:** Đã xây dựng hoàn chỉnh bộ Assemblers chuyển đổi toàn diện các khối raw OOXML đã nhận diện ngữ nghĩa thành cây mô hình `Manuscript` chuẩn (`AssembledDoc`):
    - `TableAssembler`: Phân giải ma trận bảng hai chiều `Cell[][]` hỗ trợ đa tầng `gridSpan` (colSpan) và `vMerge` ('restart' / 'continue' rowSpan), liên kết caption (`table.caption`), ghi chú (`table.note`), nguồn (`source`), căn lề ô (`l`/`c`/`r`) và `headerRows` (mặc định 1).
    - `FigureAssembler`: Bóc tách media nhị phân từ package, sinh mã băm SHA-256 bằng crypto hoặc pure JS RFC 6234, tự động nhận diện MIME type (`image/png`, `image/jpeg`, `image/svg+xml`, `image/webp`), khởi tạo `AssetMeta` (dpi 300) và `FigureBlock`.
    - `EquationAssembler`: Chuyển đổi cú pháp toán học OMML sang LaTeX hoàn chỉnh: phân số `m:f` (`\frac{num}{den}`), căn bậc hai/bậc n `m:rad` (`\sqrt[deg]{e}`), chỉ số trên/dưới `m:sSup`, `m:sSub`, `m:sSubSup`, dấu đóng mở `m:d` (`\left( ... \right)`), toán tử n-ary `m:nary` (`\sum`, `\int`), ánh xạ ký hiệu Unicode, nhận diện số thứ tự công thức `(1)` và fallback an toàn khi gặp OMML lỗi.
    - `ReferenceAssembler`: Chuẩn hóa danh mục tài liệu tham khảo, gọt bỏ tiền tố đánh số `[n]` / `n.`, trích xuất tự động DOI (`10.xxxx/...`) và URLs, đánh giá trạng thái parse (`ok`/`partial`/`failed`).
    - `FrontMatterAssembler`: Tổng hợp siêu dữ liệu bài báo: `title: Inline[]`, `titleEn: Inline[]` (`translations.en`), `authors: Author[]` và `affiliations: Affiliation[]` (phân giải dấu superscript số và `*` liên kết tác giả với đơn vị công tác và tác giả liên hệ), `abstract: Inline[][]`, `keywords: string[]`, `dates: Dates` (ngày nhận/chấp nhận/xuất bản), `doi`, `volume`, `issue`.
    - `SectionTreeAssembler`: Gom nhóm phân cấp headings `h1`, `h2`, `h3` và các khối thân bài thành cây `Section[]` đệ quy chuẩn `SectionSchema`.
    - `BackmatterAssembler`: Gom nhóm các tuyên bố đạo đức, tài trợ, lời cảm ơn, xung đột lợi ích, đóng góp tác giả và tính khả dụng của dữ liệu vào `BackMatterItem[]`.
    - `DocAssembler`: Điều phối toàn bộ quy trình, liên kết tự động các khối phụ cận và xuất ra `AssembledDoc`.
    - 21/21 tests mới và 202/202 unit tests toàn bộ monorepo pass 100%, 0 vi phạm depcruise (442 modules), 0 lỗi eslint, toàn bộ file mới < 300 dòng (tuân thủ quy định < 500 dòng logic).

- [x] **Task 3.4: Xây dựng Normalizers, Fallback Parser & Đóng gói Web Worker**
  - **Files:**
    - Tạo: `packages/ingest-docx/src/normalizers/unicode-nfc-normalizer.ts`
    - Tạo: `packages/ingest-docx/src/normalizers/vietnamese-spacing-normalizer.ts`
    - Tạo: `packages/ingest-docx/src/normalizers/caption-number-stripper.ts`
    - Tạo: `packages/ingest-docx/src/normalizers/citation-linker.ts`
    - Tạo: `packages/ingest-docx/src/pipeline/confidence.ts`
    - Tạo: `packages/ingest-docx/src/pipeline/ingest-pipeline.ts`
    - Tạo: `packages/ingest-docx/src/worker/ingest-worker.ts`
    - Test: `packages/ingest-docx/tests/normalizers.test.ts` (12/12 pass)
    - Test: `packages/ingest-docx/tests/ingest-pipeline.test.ts` (5/5 pass)
    - Test: `packages/ingest-docx/tests/golden-fixtures.test.ts` (4/4 pass)
  - **Hoàn thành:** Đã xây dựng hoàn chỉnh Normalizers (chuẩn hóa Unicode NFC, phục hồi lỗi dãn chữ tiếng Việt `Nguy ễ n`, bóc tách số cứng caption "Bảng 1:", liên kết node cite); triển khai `IngestPipeline` tính điểm tin cậy tổng thể (Title 30%, Authors 30%, Sections 20%, Tables 20%) với cơ chế fallback tự động an toàn khi confidence < 0.85; đóng gói Web Worker; kiểm thử toàn diện trên 11 golden fixtures: 2 file template đạt 1.0 confidence tuyệt đối (chạy chỉ trong 39-106ms), các bài báo khác trích xuất chính xác. Toàn bộ 223/223 tests monorepo pass 100%, 0 vi phạm depcruise, 0 lỗi eslint, Next.js build pass 100%. Giai đoạn 3 (Phase 3) chính thức hoàn tất.

---

### Phase 4: Hoàn thiện Editor Core, Phân rã Giao diện & Tích hợp TipTap Rich-Text

- [x] **Task 4.1: Xây dựng `packages/compiler-client` & Compile Scheduler**
  - **Files:**
    - Tạo: `packages/compiler-client/package.json`
    - Tạo: `packages/compiler-client/tsconfig.json`
    - Tạo: `packages/compiler-client/src/interfaces/compiler-port.ts`
    - Tạo: `packages/compiler-client/src/utils/hash-utils.ts`
    - Tạo: `packages/compiler-client/src/scheduler/compile-scheduler.ts`
    - Tạo: `packages/compiler-client/src/adapters/local-next-compiler.ts`
    - Tạo: `packages/compiler-client/src/adapters/mock-compiler.ts`
    - Tạo: `packages/compiler-client/src/index.ts`
    - Test: `packages/compiler-client/tests/compile-scheduler.test.ts` (8/8 pass)
    - Test: `packages/compiler-client/tests/local-next-compiler.test.ts` (4/4 pass)
    - Test: `packages/compiler-client/tests/hash-utils.test.ts` (3/3 pass)
  - **Hoàn thành:** Đã khởi tạo hoàn chỉnh package `@structpaper/compiler-client`. Định nghĩa `CompilerPort`, `CompileRequest`, `CompileResult`. Xây dựng `CompileScheduler` quản lý debounce 500ms, hủy request đang chạy dở thông qua `AbortController`, caching kết quả theo mã băm SHA-256 chuẩn tắc với LRU eviction, emit trạng thái vòng đời. Triển khai `LocalNextCompilerAdapter` gọi Next.js `/api/compile-latex` kèm fallback và trích xuất error log. 15/15 tests mới và 238/238 tests monorepo pass 100%, 0 vi phạm depcruise, 0 lỗi eslint.

- [x] **Task 4.2: Refactor UI Modals, Drawers & Rút gọn `UnifiedEditorView.tsx` (< 200 dòng)**
  - **Files:**
    - Sửa: `apps/web/src/components/editor/UnifiedEditorView.tsx` (rút gọn từ 566 dòng xuống 183 dòng)
    - Tạo: `apps/web/src/components/editor/hooks/useEditorCompilation.ts`
    - Tạo: `apps/web/src/components/editor/hooks/useEditorExport.ts`
    - Tạo: `apps/web/src/components/editor/hooks/useEditorShortcuts.ts`
    - Tạo: `apps/web/src/components/editor/hooks/index.ts`
    - Sửa: `apps/web/src/components/editor/TableSpreadsheetModal.tsx` & tạo `table-spreadsheet-adapter.ts` (hỗ trợ ma trận `Cell[][]`)
    - Sửa: `apps/web/src/components/editor/FigureSettingsModal.tsx` (tích hợp SHA-256 asset hash)
    - Sửa: `apps/web/src/components/editor/TableSettingsModal.tsx` & `LayoutSettingsDrawer.tsx`
    - Test: `apps/web/tests/components/unified-editor-view.test.tsx` (8/8 pass)
  - **Hoàn thành:** Rút gọn thành công `UnifiedEditorView.tsx` xuống còn 183 dòng (< 200 dòng), bảo toàn 100% bố cục Split Layout, Left Dock, Tab Nav và các Modal/Drawers; tách 3 custom hooks nghiệp vụ độc lập tích hợp `CompileScheduler`; hỗ trợ ma trận `Cell[][]` trong `TableSpreadsheetModal` và asset hash SHA-256 trong `FigureSettingsModal`. 8/8 tests mới và 246/246 tests monorepo pass 100%, 0 vi phạm depcruise, 0 lỗi eslint, Next.js build pass 100%.

- [x] **Task 4.3: Refactor Các Tab Giao diện (`MetadataTab`, `AuthorsTab`, `ReferencesTab`) sang CommandBus**
  - **Files:**
    - Sửa: `apps/web/src/components/editor/MetadataTab.tsx`
    - Sửa: `apps/web/src/components/editor/AuthorsTab.tsx` (tách `AuthorItemCard.tsx` và `AffiliationItemCard.tsx`)
    - Sửa: `apps/web/src/components/editor/ReferencesTab.tsx`
    - Sửa: `apps/web/src/components/editor/PreflightQCTab.tsx` & `apps/web/src/components/editor/preflight-wrapper.ts` (wrapper cho `computePreflightCheck`)
    - Tạo: `apps/web/src/components/editor/command-bus-adapter.ts` và `apps/web/src/components/editor/dispatchers/`
    - Mở rộng: `packages/editor-core/src/commands/` (`block-commands.ts`, `metadata/updateKeywords`, `metadata/updateDates`, `author/add`, `author/update`, `author/remove`, `reference/update`)
    - Test: `apps/web/tests/components/editor-tabs.test.tsx` (5/5 pass)
  - **Bước 1:** Viết unit test cho các thao tác trên từng tab: thêm/sửa tác giả, sửa ngày nhận bài, thêm/xóa tài liệu tham khảo qua CommandBus.
  - **Bước 2:** Thay thế toàn bộ lời gọi `setFormData` hoặc `setPaper` trong các tab bằng các selectors và hàm `dispatch` của `editor-core` (hoặc adapter tương thích hỗ trợ 2 luồng).
  - **Bước 3:** Chạy test xác nhận các tab hoạt động trơn tru và hỗ trợ Undo/Redo tức thì.
  - **Hoàn thành:** Hoàn thành refactor toàn bộ các tab giao diện (`MetadataTab`, `AuthorsTab`, `ReferencesTab`, `PreflightQCTab`) sang CommandBus của `@structpaper/editor-core`. Bảo toàn 100% giao diện người dùng (inputs, textareas, selects, badges, buttons, labels tiếng Việt); mở rộng hỗ trợ ORCID trong `AuthorItemCard`; bọc bộ kiểm định preflight qua `preflight-wrapper.ts` sẵn sàng cho Phase 5 `qc-engine`. Tách subcomponents giúp `AuthorsTab.tsx` giảm mạnh từ 522 dòng xuống còn 195 dòng (< 523 dòng allowlist). 5/5 tests mới và 254/254 tests monorepo pass 100%, 0 vi phạm depcruise, 0 lỗi eslint, Next.js build pass 100%.

- [x] **Task 4.4: Refactor `SectionsTab` với Khung Danh sách Block & Ô Đoạn văn Tạm thời**
  - **Files:**
    - Sửa: `apps/web/src/components/editor/SectionsTab.tsx`
    - Sửa: `apps/web/src/components/editor/sections/ParagraphSectionItem.tsx`
    - Sửa: `apps/web/src/components/editor/sections/SectionCardHeader.tsx`
    - Sửa: `apps/web/src/components/editor/sections/index.ts`
    - Sửa: `apps/web/src/components/editor/command-bus-adapter.ts`
    - Sửa: `apps/web/src/components/editor/types.ts`
    - Tạo: `apps/web/src/components/editor/sections/TemporaryParagraphInput.tsx`
    - Tạo: `apps/web/src/components/editor/sections/SectionHeaderCard.tsx`
    - Tạo: `apps/web/src/components/editor/sections/SectionBlockList.tsx`
    - Tạo: `apps/web/src/components/editor/sections/SectionActionToolbar.tsx`
    - Tạo: `apps/web/src/components/editor/sections/FigureLightboxModal.tsx`
    - Tạo: `apps/web/src/components/editor/sections/useSectionInspectors.ts`
    - Tạo: `apps/web/src/components/editor/sections/useSectionMediaHandlers.ts`
    - Tạo: `apps/web/src/components/editor/dispatchers/sections-dispatchers.ts`
    - Test: `apps/web/tests/components/sections-tab.test.tsx`
  - **Hoàn thành:**
    - Bảo tồn 100% giao diện người dùng thị giác của `SectionsTab`: giữ nguyên các nút thêm section, thêm block (+ Tiêu đề H1, + Đoạn văn, + Bảng, + Hình), nút xóa, nút di chuyển lên/xuống, badges phân loại, typography và màu sắc.
    - Xây dựng `TemporaryParagraphInput.tsx` đọc và ghi trực tiếp kiểu `Inline[]` của `@structpaper/doc-model`: chuyển đổi 2 chiều `Inline[]` $\leftrightarrow$ text hiển thị (bảo tồn in nghiêng `*text*`, math `$latex$`, citations `[n]`), styling khớp 100% giao diện `<AutoResizeTextarea>` cũ.
    - Phân rã modular toàn diện cho `SectionsTab.tsx`: giảm từ 916 dòng xuống còn 348 dòng (< 350 dòng theo yêu cầu), tách thành các subcomponent chuyên biệt (`SectionHeaderCard.tsx`, `SectionBlockList.tsx`, `SectionActionToolbar.tsx`, `FigureLightboxModal.tsx`, `useSectionInspectors.ts`, `useSectionMediaHandlers.ts`).
    - Nối chuyển đổi sang CommandBus qua `sections-dispatchers.ts` (`block/insert`, `block/update`, `block/remove`) tương thích hoàn toàn mô hình V2 và V1, không phụ thuộc `adaptV2toV1`.
    - Viết 13/13 tests mới trong `sections-tab.test.tsx` kiểm thử toàn diện rendering, input text inline, xóa block, di chuyển section và CommandBus integration. Toàn bộ 267/267 tests monorepo pass 100%, 0 vi phạm depcruise, 0 lỗi eslint, Next.js build pass 100%.

- [x] **Task 4.5: Tích hợp TipTap Rich-Text Editor cho Đoạn văn & Kiểm thử IME Tiếng Việt**
  - **Files:**
    - Cài đặt: `@tiptap/core`, `@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-subscript`, `@tiptap/extension-superscript`
    - Tạo: `apps/web/src/components/editor/sections/tiptap-schema.ts` (marks b, i, sup, sub, code; 2 chiều `inlines <-> tiptapDoc`)
    - Tạo: `apps/web/src/components/editor/sections/tiptap-nodes.ts` (custom atom nodes: `CiteNode`, `XrefNode`, `MathNode`)
    - Tạo: `apps/web/src/components/editor/sections/TipTapParagraphEditor.tsx` (styling khớp 100% ô cũ, mini toolbar, debounced commit 150ms)
    - Tạo: `apps/web/src/components/editor/sections/tiptap-popovers.tsx` (popup trích dẫn `[` và popover công thức)
    - Tạo: `apps/web/src/components/editor/sections/clean-word-paste.ts` (lọc rác Word, giữ *H. pylori*, FEV1, 10^3)
    - Sửa: `apps/web/src/components/editor/sections/ParagraphSectionItem.tsx` & `SectionBlockList.tsx`
    - Test: `apps/web/tests/components/tiptap-paragraph-editor.test.tsx` (16/16 pass)
    - Test: `e2e/ime-vietnamese.spec.ts` (4/4 pass qua Playwright CDP)
  - **Hoàn thành:** Hoàn thành tích hợp toàn diện TipTap Rich-Text Editor cho đoạn văn theo quyết định Phương án A. Bảo toàn 100% visual parity (styling, viền, font, padding, placeholder); mini toolbar tinh gọn (Ctrl+B, Ctrl+I, sup, sub, trích dẫn, công thức); gõ `[` mở reference picker popup; lọc rác paste từ Word giữ nguyên in nghiêng khoa học (*Helicobacter pylori*) và chỉ số (*FEV1*); kiểm thử gõ tiếng Việt Telex/VNI tự động qua Chrome DevTools Protocol `Input.imeSetComposition` không bị mất dấu hay giật con trỏ. 16/16 unit tests và 4/4 E2E tests pass 100%, toàn bộ 283/283 tests monorepo pass 100%, 0 vi phạm depcruise, 0 lỗi eslint, Next.js build pass 100%. Giai đoạn 4 (Phase 4) chính thức hoàn tất.

---

### Phase 5: Động cơ QC & Bộ Xuất bản Đa định dạng `packages/exporters`

- [x] **Task 5.1: Xây dựng `packages/qc-engine` theo Specification Pattern**
  - **Files:**
    - Tạo: `packages/qc-engine/package.json`
    - Tạo: `packages/qc-engine/tsconfig.json`
    - Tạo: `packages/qc-engine/src/interfaces/rule.ts`
    - Tạo: `packages/qc-engine/src/rules/metadata-rules.ts`
    - Tạo: `packages/qc-engine/src/rules/numbering-rules.ts`
    - Tạo: `packages/qc-engine/src/rules/float-rules.ts`
    - Tạo: `packages/qc-engine/src/rules/reference-rules.ts`
    - Tạo: `packages/qc-engine/src/rules/structure-rules.ts`
    - Tạo: `packages/qc-engine/src/engine/scoring.ts`
    - Tạo: `packages/qc-engine/src/engine/qc-engine.ts`
    - Tạo: `packages/qc-engine/src/index.ts`
    - Sửa: `apps/web/src/components/editor/preflight-wrapper.ts` (kết nối trực tiếp sang `qc-engine`)
    - Test: `packages/qc-engine/tests/qc-rules.test.ts` (15/15 pass)
    - Test: `apps/web/tests/components/preflight-qc.test.tsx` (2/2 pass)
  - **Hoàn thành:** Đã khởi tạo hoàn chỉnh package `@structpaper/qc-engine` theo Specification Pattern. Triển khai các tập luật specification kiểm tra độ dài tóm tắt (275-500 từ theo profile VNUHCM-HS), từ khóa (3-5), tích hợp `computeNumbering` phát hiện trích dẫn dangling/uncited và firstMentionBeforeFloat, phát hiện ảnh DPI < 300 và bảng/hình thiếu caption. `QcEngine` chuẩn hóa bảng điểm 0-100/100 chia đều theo 6 trụ cột cấu trúc (IMRaD, Hình ảnh, Bảng biểu, Trích dẫn, Tác giả & Tóm tắt, Định dạng) và hỗ trợ quickFix. Nối trực tiếp vào `PreflightQCTab.tsx` bảo toàn 100% giao diện và nút "Sửa ngay". 17/17 tests mới và 300/300 tests monorepo pass 100%, 0 vi phạm depcruise, 0 lỗi eslint, Next.js build pass 100%.

- [x] **Task 5.2: Xây dựng Bộ Sinh Mã `LatexExporter` Hợp nhất & Tệp Khuôn mẫu `structpaper-hs.cls`**
  - **Files:**
    - Tạo: `packages/exporters/package.json`
    - Tạo: `packages/exporters/tsconfig.json`
    - Tạo: `packages/exporters/src/index.ts`
    - Tạo: `packages/exporters/src/latex/index.ts`
    - Tạo: `packages/exporters/src/latex/latex-exporter.ts`
    - Tạo: `packages/exporters/src/latex/escape-tex.ts`
    - Tạo: `packages/exporters/src/latex/templates/structpaper-hs.cls`
    - Tạo: `packages/exporters/src/latex/blocks/inlines-to-latex.ts`
    - Tạo: `packages/exporters/src/latex/blocks/equation-to-latex.ts`
    - Tạo: `packages/exporters/src/latex/blocks/figure-to-latex.ts`
    - Tạo: `packages/exporters/src/latex/blocks/table-to-latex.ts`
    - Tạo: `packages/exporters/src/latex/blocks/block-dispatcher.ts`
    - Tạo: `packages/exporters/src/latex/blocks/index.ts`
    - Sửa: `vitest.workspace.ts`
    - Test: `packages/exporters/tests/escape-tex.test.ts` (6/6 pass)
    - Test: `packages/exporters/tests/blocks-to-latex.test.ts` (12/12 pass)
    - Test: `packages/exporters/tests/latex-exporter.test.ts` (4/4 pass, bao gồm test biên dịch thực tế bằng Tectonic binary)
  - **Hoàn thành:** Khởi tạo thành công package độc lập `@structpaper/exporters` phụ thuộc `@structpaper/doc-model` và `@structpaper/journal-profiles` (0 phụ thuộc React/DOM). Triển khai `escapeTex` an toàn thoát 10 ký tự đặc biệt LaTeX (`%`, `&`, `_`, `#`, `$`, `\`, `^`, `{`, `}`, `~`) và bảo toàn công thức toán học inline/display. Xây dựng document class chuẩn `structpaper-hs.cls` (2 cột, font tiếng Việt Times New Roman qua `fontspec`, lề 20mm, macros `\spTitle`, `\spTitleEn`, `\spAuthors`, `\spAffiliations`, `\spAbstract`, `\spKeywords`, `\spDates`, `\spDoi`, `\spArticleType`, `\spJournal`, `\makeSPTitle`). Triển khai bộ chuyển đổi block-to-latex: `tableToLatex` (thuật toán ma trận ô 2D hỗ trợ colSpan `\multicolumn`, rowSpan `\multirow`, alignment, booktabs `\toprule`/`\midrule`/`\bottomrule`), `figureToLatex` (1 cột / 2 cột `figure*`, scale, caption, nguồn, cơ chế fallback an toàn tránh lỗi thiếu ảnh), `equationToLatex` (đánh số `\begin{equation}` hoặc `\[...\]`), `inlinesToLatex` (bold, italic, sup, sub, code, Vancouver cite `\cite{...}`, xref `\ref{...}`, math `$latex$`). `LatexExporter` tự động gắn comment ẩn `%%BLOCK:<id>` trước mỗi block phục vụ truy vết vị trí / SyncTeX, duyệt đệ quy các phân cấp đề mục (`\section`, `\subsection`, `\subsubsection`), render phần back matter và thư mục `\begin{thebibliography}`. 22/22 tests mới và 322/322 tests monorepo pass 100%, kiểm thử biên dịch TeX với `bin/tectonic.exe` tạo file PDF chuẩn `%PDF-` 0 lỗi syntax, 0 vi phạm depcruise, 0 lỗi eslint, Next.js build pass 100%.

- [ ] **Task 5.3: Xây dựng Exporters Cho JATS XML 1.3, Docx & Tích hợp `citeproc-js`**
  - **Files:**
    - Tạo: `packages/exporters/src/jats/jats-exporter.ts`
    - Tạo: `packages/exporters/src/docx/docx-exporter.ts`
    - Tạo: `packages/exporters/src/csl/csl-formatter.ts` (tích hợp `citeproc-js`)
    - Tạo: `packages/exporters/src/zip/zip-packager.ts`
    - Test: `packages/exporters/tests/jats-exporter.test.ts`
    - Test: `packages/exporters/tests/csl-formatter.test.ts`
  - **Bước 1:** Viết test xuất JATS XML và kiểm tra hợp lệ theo chuẩn DTD JATS 1.3.
  - **Bước 2:** Viết test xuất tài liệu tham khảo qua CSL `citeproc-js` với file `.csl` của Vancouver.
  - **Bước 3:** Triển khai `JatsExporter`, `DocxExporter`, `CslFormatter` và `ZipPackager`.
  - **Bước 4:** Chạy test kiểm tra toàn bộ exporters xanh.

---

### Phase 6: Backend Spring Boot & Dịch vụ Biên dịch Cách ly

- [ ] **Task 6.1: Tái cấu trúc Spring Boot sang Modular Monolith theo Cổng 2 OpenAPI**
  - **Files:**
    - Sửa: `apps/api/build.gradle` (thêm phụ thuộc JSON, Validation, S3 SDK)
    - Tạo: `apps/api/src/main/resources/db/migration/V1__init_schema.sql` (MySQL Flyway)
    - Tạo: `apps/api/src/main/java/vn/edu/vnu/structpaper/manuscript/` (Entity, Repository, Controller)
    - Tạo: `apps/api/src/main/java/vn/edu/vnu/structpaper/asset/` (SHA-256 asset storage)
    - Test: `apps/api/src/test/java/vn/edu/vnu/structpaper/manuscript/ManuscriptControllerTest.java`
  - **Bước 1:** Viết test mock MVC kiểm tra lưu và đọc bản thảo qua endpoint `/api/v1/manuscripts/{id}` với khóa lạc quan `If-Match: rev`.
  - **Bước 2:** Tạo Flyway migration script cho bảng `manuscripts` có cột `doc_json` (MySQL Native JSON) và các cột index quan hệ.
  - **Bước 3:** Triển khai `ManuscriptService` và `AssetService` lưu file theo SHA-256.
  - **Bước 4:** Chạy `./gradlew test` xác nhận test xanh 100%.

- [ ] **Task 6.2: Xây dựng Compile Service Cách ly (Sandbox, Hàng đợi Queue, Cache Hash & Hủy Job)**
  - **Files:**
    - Tạo: `apps/api/src/main/java/vn/edu/vnu/structpaper/compile/CompileQueueManager.java`
    - Tạo: `apps/api/src/main/java/vn/edu/vnu/structpaper/compile/CompileSandboxService.java`
    - Tạo: `apps/api/src/main/java/vn/edu/vnu/structpaper/compile/CompileCacheService.java`
    - Sửa: `apps/api/src/main/java/vn/edu/vnu/structpaper/controller/LatexCompilerController.java`
    - Test: `apps/api/src/test/java/vn/edu/vnu/structpaper/compile/CompileQueueTest.java`
  - **Bước 1:** Viết test kiểm tra hàng đợi biên dịch: chỉ cho phép 1 job đang chạy cho một bản thảo, tự động hủy job cũ khi có job mới, và trả kết quả tức thì nếu hash nội dung trùng khớp.
  - **Bước 2:** Cấu hình tiến trình chạy XeLaTeX/Tectonic với cờ an toàn `--no-shell-escape`, thư mục tạm riêng cho từng job, timeout 30 giây.
  - **Bước 3:** Triển khai endpoint biên dịch bất đồng bộ qua `/api/v1/compile`.
  - **Bước 4:** Chạy test kiểm tra toàn bộ pipeline biên dịch an toàn và có kiểm soát.

- [ ] **Task 6.3: Xây dựng AI Proxy Chính thức Phía Backend Spring Boot**
  - **Files:**
    - Tạo: `apps/api/src/main/java/vn/edu/vnu/structpaper/ai/AiProxyController.java`
    - Tạo: `apps/api/src/main/java/vn/edu/vnu/structpaper/ai/AiService.java`
    - Sửa: `apps/web/src/app/api/ai/proxy/route.ts` (chuyển tiếp sang Spring Boot API)
    - Test: `apps/api/src/test/java/vn/edu/vnu/structpaper/ai/AiProxyTest.java`
  - **Bước 1:** Triển khai controller nhận request từ client, kiểm tra whitelist action và gọi OpenAI qua HTTP client của Java.
  - **Bước 2:** Ghi log audit số lượng token tiêu thụ và địa chỉ IP gọi yêu cầu.
  - **Bước 3:** Thay thế route proxy tạm thời của Next.js để kết nối sang Spring Boot API.

---

### Phase 7: Prepress Xuất bản & Xử lý Batch Tự động

- [ ] **Task 7.1: Xây dựng Prepress Pipeline Xuất bản Chuẩn PDF/X qua Ghostscript**
  - **Files:**
    - Tạo: `apps/api/src/main/java/vn/edu/vnu/structpaper/prepress/PrepressService.java`
    - Test: `apps/api/src/test/java/vn/edu/vnu/structpaper/prepress/PrepressServiceTest.java`
  - **Bước 1:** Viết test chạy Ghostscript chuyển đổi file PDF thường sang PDF/X-1a hoặc PDF/A.
  - **Bước 2:** Kiểm tra 100% font chữ được nhúng, chuyển đổi hệ màu chuẩn CMYK/Grayscale và kiểm tra DPI ảnh $\ge 300$.
  - **Bước 3:** Trả về kết quả preflight post-compile cho màn hình QC.

- [ ] **Task 7.2: Xây dựng Dịch vụ Batch Ingest Nhiều Tệp DOCX**
  - **Files:**
    - Tạo: `apps/api/src/main/java/vn/edu/vnu/structpaper/batch/BatchIngestController.java`
    - Tạo: `apps/api/src/main/java/vn/edu/vnu/structpaper/batch/BatchWorker.java`
    - Test: `apps/api/src/test/java/vn/edu/vnu/structpaper/batch/BatchIngestTest.java`
  - **Bước 1:** Viết test nạp một file ZIP chứa 5 bài báo Word, kiểm tra hệ thống giải nén và xử lý tuần tự từng bài qua pipeline Ingest $\rightarrow$ QC $\rightarrow$ Compile.
  - **Bước 2:** Triển khai `BatchWorker` báo cáo tiến độ và xuất file tổng hợp kết quả.
  - **Bước 3:** Chạy test kiểm tra hoàn thành xử lý hàng loạt.

---

### Phase 8: Kiểm thử Toàn diện & Xác thực Trực tiếp trên Trình duyệt (Agent Omega)

- [ ] **Task 8.1: Chạy Toàn bộ Test Suite Monorepo & Kiểm tra Ranh giới Kiến trúc**
  - **Files:**
    - Test: Chạy `pnpm test` (Vitest trên tất cả packages)
    - Test: Chạy `pnpm depcruise` (kiểm tra ranh giới phụ thuộc)
    - Test: Chạy `pnpm lint` (kiểm tra giới hạn số dòng code tiered)
    - Test: Chạy `./gradlew test` (toàn bộ backend Spring Boot)
  - **Bước 1:** Chạy lệnh kiểm tra tổng thể toàn bộ hệ thống.
  - **Bước 2:** Xác nhận 100% các bài test xanh không có bất kỳ cảnh báo hay lỗi nào.

- [ ] **Task 8.2: Mở Trình duyệt Thực tế Kiểm thử Luồng Hoàn chỉnh (End-to-End Browser Verification)**
  - **Files:**
    - Test: Mở trình duyệt Chrome trên Windows, truy cập `http://localhost:3000`
  - **Bước 1:** Bật Backend Spring Boot (`:8080`) và Next.js Frontend (`:3000`).
  - **Bước 2:** Nạp lần lượt 4 file trong `docs/StandardTemplate/`:
    - `Template_EN.docx`
    - `Template_VI.docx`
    - `Bài mẫu template tiếng Anh.docx`
    - `Bài mẫu template tiếng Việt.docx`
  - **Bước 3:** Kiểm tra giao diện Editor:
    - Bố cục hai cột, Dock, các Tab Metadata, Authors, Sections, References hiển thị mượt mà.
    - Sửa tiêu đề, bôi nghiêng $H.\ pylori$, gắn chỉ số $\text{FEV}_1$.
    - Bấm `Ctrl+Z` (Undo) và `Ctrl+Y` (Redo) hoạt động tức thì.
    - F5 reload trang: dữ liệu còn nguyên 100%.
  - **Bước 4:** Bấm nút **Biên dịch LaTeX sang PDF**:
    - Kiểm tra PDF xem trước hiển thị đúng định dạng hai cột chuẩn của tạp chí.
    - Kiểm tra tải về file PDF thành phẩm và gói ZIP nộp bài.
  - **Bước 5:** Bàn giao hệ thống hoàn thiện trọn vẹn cho người dùng.
