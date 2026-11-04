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

- [ ] **Task 0.4: Thiết lập Bộ Golden Fixtures (11 file bài báo thật) & Baseline Characterization Test**
  - **Files:**
    - Tạo: `fixtures/golden/templates/` (sao chép 4 file template)
    - Tạo: `fixtures/golden/papers/` (sao chép 7 file bài báo Word thật, loại trừ `Yêu cầu phần mềm.docx`)
    - Tạo: `apps/web/src/tests/baseline-parser.test.ts`
  - **Bước 1:** Sao chép và tổ chức 11 file Word vào thư mục `fixtures/golden/`.
  - **Bước 2:** Viết test chạy bộ bóc tách cũ `docx-parser.ts` trên các file mẫu, ghi nhận kết quả baseline JSON làm mốc đối chứng.
  - **Bước 3:** Chạy test baseline và lưu lại snapshot kết quả.

---

### Phase 1: Lõi Miền `packages/doc-model` & `packages/journal-profiles` (CỔNG 1)

- [ ] **Task 1.1: Khởi tạo Package `packages/doc-model` với Zod Schemas & TypeScript Types**
  - **Files:**
    - Tạo: `packages/doc-model/package.json`
    - Tạo: `packages/doc-model/tsconfig.json`
    - Tạo: `packages/doc-model/src/types/manuscript.ts`
    - Tạo: `packages/doc-model/src/types/block.ts`
    - Tạo: `packages/doc-model/src/types/inline.ts`
    - Tạo: `packages/doc-model/src/types/citation.ts`
    - Tạo: `packages/doc-model/src/schemas/manuscript.schema.ts`
    - Tạo: `packages/doc-model/src/utils/id-generator.ts`
    - Test: `packages/doc-model/tests/manuscript.schema.test.ts`
  - **Bước 1:** Viết test kiểm tra Zod validation: tạo đối tượng `Manuscript` hợp lệ, kiểm tra validate lỗi khi thiếu ID, sai cấu trúc `Block` hoặc `Inline`.
  - **Bước 2:** Định nghĩa các interface TypeScript theo đặc tả mục 3.2 của Design Doc: `Manuscript`, `FrontMatter`, `Section`, `Block`, `Inline`, `Cell`, `Reference`.
  - **Bước 3:** Triển khai Zod schemas tương ứng với các kiểu trên.
  - **Bước 4:** Xây dựng interface `IdGenerator` với cài đặt mặc định `UlidIdGenerator` và mock `DeterministicIdGenerator` cho testing.
  - **Bước 5:** Chạy `vitest run` kiểm tra toàn bộ schemas pass 100%.

- [ ] **Task 1.2: Xây dựng Hàm Thuần túy `computeNumbering` (Derived Numbering)**
  - **Files:**
    - Tạo: `packages/doc-model/src/numbering/compute-numbering.ts`
    - Test: `packages/doc-model/tests/compute-numbering.test.ts`
    - Test: `packages/doc-model/tests/compute-numbering.property.test.ts` (dùng `fast-check`)
  - **Bước 1:** Viết test kiểm tra:
    - Bài có 3 Hình, 2 Bảng, 4 Công thức: hàm gán đúng số thứ tự `1, 2, 3...` theo thứ tự xuất hiện lần đầu.
    - Chèn thêm một hình mới vào giữa bài: số thứ tự các hình sau tự động tăng thêm 1.
    - Xóa một tài liệu tham khảo: phát hiện `danglingCites` và cập nhật lại `citationOrder`.
    - Phát hiện `uncitedRefs` khi tài liệu không được nhắc tới.
  - **Bước 2:** Triển khai hàm pure function `computeNumbering(doc: Manuscript, citationStyle: CitationStyle)`.
  - **Bước 3:** Viết Property-based test dùng `fast-check` chèn/xóa ngẫu nhiên các block và kiểm tra tính liên tục, không trùng lặp của số thứ tự.
  - **Bước 4:** Chạy test kiểm tra toàn bộ suite xanh.

- [ ] **Task 1.3: Khởi tạo Package `packages/journal-profiles` & Schema Profile `VNUHCM-HS`**
  - **Files:**
    - Tạo: `packages/journal-profiles/package.json`
    - Tạo: `packages/journal-profiles/src/types/profile.ts`
    - Tạo: `packages/journal-profiles/src/schemas/profile.schema.ts`
    - Tạo: `packages/journal-profiles/src/profiles/vnuhcm-hs.json`
    - Tạo: `packages/journal-profiles/src/index.ts`
    - Test: `packages/journal-profiles/tests/profile.test.ts`
  - **Bước 1:** Viết test validate file JSON profile với Zod schema của `JournalProfile`.
  - **Bước 2:** Khai báo cấu hình `vnuhcm-hs.json` chứa:
    - Quy định tóm tắt: min 275, max 500 từ.
    - `styleMap`: ánh xạ toàn bộ ~35 style chuẩn Word (`ArticleTitle`, `Authors`, `Affiliation`, `SectionAbstract`, `TableCaption`, `TableNote`, `SourceLine`, `FigureCaption`, `Equation`, `Reference`,...).
    - Quy chuẩn LaTeX: class `structpaper-hs.cls`, font Times New Roman, engine XeLaTeX.
  - **Bước 3:** Chạy test kiểm tra profile hợp lệ 100%.

- [ ] **Task 1.4: Định nghĩa Hợp đồng Chung (Common Interfaces) & Bộ Chuyển đổi V1 $\leftrightarrow$ V2**
  - **Files:**
    - Tạo: `packages/doc-model/src/interfaces/command.ts` (Command, Patch, InversePatch)
    - Tạo: `packages/doc-model/src/interfaces/repository.ts` (ManuscriptRepository, AssetRepository)
    - Tạo: `packages/doc-model/src/adapters/migrate-v1-to-v2.ts`
    - Tạo: `packages/doc-model/src/adapters/adapt-v2-to-v1.ts`
    - Test: `packages/doc-model/tests/adapters.test.ts`
  - **Bước 1:** Định nghĩa các interface `Command`, `Patch`, `InversePatch`, `ManuscriptRepository`, `AssetRepository`.
  - **Bước 2:** Viết test kiểm tra chuyển đổi từ dữ liệu phẳng `CompletePaper` (v1) sang cây `Manuscript` (v2) và ngược lại: tách trích dẫn `[1, 2]` thành node cite, chuyển đổi ảnh base64 sang asset metadata.
  - **Bước 3:** Triển khai `migrateV1toV2` và `adaptV2toV1`.
  - **Bước 4:** Chạy test xác nhận chuyển đổi hai chiều bảo toàn dữ liệu.
  - **Bước 5: KHÓA CỔNG 1 (Gate 1 Closed).**

---

### Phase 2: Engine Spike, Cổng 2 OpenAPI, Minimal Store/Bus & Lưu trữ Offline-first

- [ ] **Task 2.1: LaTeX Engine Spike (XeLaTeX, Tectonic, WasmCompiler)**
  - **Files:**
    - Tạo: `scripts/spikes/latex-engine-spike.ts`
    - Tạo: `docs/superpowers/specs/spike-latex-engine-report.md`
  - **Bước 1:** Viết script benchmark chạy biên dịch bài mẫu chứa tiếng Việt Unicode, font OpenType và công thức toán với:
    - Engine 1: `xelatex` (local TeX Live).
    - Engine 2: `tectonic.exe` (đã có sẵn trong thư mục `bin/tectonic.exe`).
  - **Bước 2:** So sánh thời gian biên dịch, dung lượng PDF và độ trung thực font chữ tiếng Việt.
  - **Bước 3:** Ghi nhận báo cáo, chốt sử dụng **XeLaTeX** làm engine chính thức và **Tectonic** làm engine dev offline siêu tốc.

- [ ] **Task 2.2: Thiết lập Hợp đồng API `contracts/openapi.yaml` (CỔNG 2)**
  - **Files:**
    - Tạo: `contracts/openapi.yaml`
    - Sửa: `apps/web/package.json` (thêm script sinh client `openapi-typescript`)
    - Test: `contracts/tests/openapi-validation.test.ts`
  - **Bước 1:** Viết `contracts/openapi.yaml` đặc tả đầy đủ endpoints:
    - `/api/v1/manuscripts/{id}` (GET, PUT với `If-Match: rev`)
    - `/api/v1/assets/{sha256}` (HEAD, PUT upload theo hash)
    - `/api/v1/compile` (POST nạp job, GET lấy PDF / SSE trạng thái)
    - `/api/v1/ai/extract` (POST proxy trích xuất)
    - Schema `Manuscript` tham chiếu trực tiếp từ Zod schema của `doc-model`.
  - **Bước 2:** Viết test validate cú pháp OpenAPI 3.0.
  - **Bước 3: KHÓA CỔNG 2 (Gate 2 Closed).**

- [ ] **Task 2.3: Xây dựng Bản Tối thiểu của `packages/editor-core` (Store, CommandBus, History)**
  - **Files:**
    - Tạo: `packages/editor-core/package.json`
    - Tạo: `packages/editor-core/src/store/manuscript-store.ts` (Zustand + Immer)
    - Tạo: `packages/editor-core/src/bus/command-bus.ts`
    - Tạo: `packages/editor-core/src/history/history-manager.ts`
    - Tạo: `packages/editor-core/src/commands/base-commands.ts`
    - Test: `packages/editor-core/tests/command-bus.test.ts`
    - Test: `packages/editor-core/tests/history-manager.test.ts`
  - **Bước 1:** Viết test kiểm tra:
    - Dispatch lệnh `metadata/updateTitle` cập nhật store và sinh ra cặp `patches` / `inversePatches`.
    - Gọi `historyManager.undo()` đưa store trở lại giá trị ban đầu.
    - Gọi `historyManager.redo()` khôi phục lại thay đổi.
  - **Bước 2:** Triển khai Zustand store bọc bởi `produceWithPatches` của Immer.
  - **Bước 3:** Xây dựng `CommandBus` điều phối các commands và thông báo luồng patch cho các listener.
  - **Bước 4:** Triển khai `HistoryManager` quản lý undo/redo stack tối đa 100 bước.
  - **Bước 5:** Chạy test kiểm tra toàn bộ suite xanh.

- [ ] **Task 2.4: Xây dựng Package `packages/storage` (Dexie IndexedDB & Autosave)**
  - **Files:**
    - Tạo: `packages/storage/package.json`
    - Tạo: `packages/storage/src/db/structpaper-db.ts` (Dexie 8 bảng)
    - Tạo: `packages/storage/src/repositories/indexeddb-manuscript-repo.ts`
    - Tạo: `packages/storage/src/repositories/indexeddb-asset-repo.ts`
    - Tạo: `packages/storage/src/autosave/autosave-engine.ts`
    - Tạo: `packages/storage/src/backup/zip-backup.ts` (xuất `.structpaper`)
    - Test: `packages/storage/tests/storage.test.ts`
    - Test: `packages/storage/tests/autosave.test.ts`
  - **Bước 1:** Viết test kiểm tra ghi/đọc bản thảo từ Dexie (dùng `fake-indexeddb`).
  - **Bước 2:** Viết test kiểm tra Autosave: lắng nghe luồng patch từ `CommandBus`, debounce 1 giây và lưu tự động vào bảng `manuscripts` và `revisions`.
  - **Bước 3:** Triển khai `StructPaperDatabase` kế thừa `Dexie` với 8 bảng theo đặc tả mục 9.2 của Design Doc.
  - **Bước 4:** Triển khai `IndexedDbManuscriptRepo` và `IndexedDbAssetRepo` (lưu Blob ảnh theo SHA-256).
  - **Bước 5:** Triển khai hàm xuất file sao lưu nén `.structpaper` (ZIP chứa `manuscript.json` và thư mục `assets/`).
  - **Bước 6:** Chạy test xác nhận test xanh 100%.

- [ ] **Task 2.5: Viết Kiểm thử E2E Đầu tiên (Chống mất Dữ liệu F5)**
  - **Files:**
    - Tạo: `apps/web/tests/e2e/data-persistence.spec.ts` (Playwright)
  - **Bước 1:** Viết kịch bản Playwright E2E:
    - Mở ứng dụng `http://localhost:3000`.
    - Tải một bản thảo mẫu vào hệ thống.
    - Sửa tiêu đề bài báo.
    - Đợi 1.5 giây để Autosave hoàn tất ghi xuống IndexedDB.
    - Thực hiện Reload trang (F5).
    - Kiểm tra tiêu đề vừa sửa vẫn hiển thị nguyên vẹn 100%.
  - **Bước 2:** Chạy kiểm thử Playwright và xác nhận tính bền vững của dữ liệu.

---

### Phase 3: Pipeline Bóc tách DOCX Đa tầng `packages/ingest-docx`

- [ ] **Task 3.1: Xây dựng Package Layer & OOXML Reader với `fast-xml-parser`**
  - **Files:**
    - Tạo: `packages/ingest-docx/package.json`
    - Tạo: `packages/ingest-docx/src/package/docx-package.ts`
    - Tạo: `packages/ingest-docx/src/ooxml/raw-doc-visitor.ts`
    - Tạo: `packages/ingest-docx/src/ooxml/style-resolver.ts`
    - Test: `packages/ingest-docx/tests/ooxml-reader.test.ts`
  - **Bước 1:** Viết test mở file `.docx` mẫu, kiểm tra đọc được các part: `document.xml`, `styles.xml`, `numbering.xml`, và trích xuất các asset ảnh trong `word/media/`.
  - **Bước 2:** Triển khai `DocxPackage` bọc JSZip để đọc nhanh các part nhị phân.
  - **Bước 3:** Triển khai `RawDocVisitor` duyệt XML bằng `fast-xml-parser`, phân giải cây kế thừa `w:basedOn`, gỡ bỏ `w:sdt`, và bóc tách `w:instrText` (REF, SEQ, EndNote).
  - **Bước 4:** Chạy test kiểm tra trả về danh sách `RawBlock[]` thô chuẩn xác.

- [ ] **Task 3.2: Xây dựng `StyleMapRecognizer` cho ~35 Word Styles Chuẩn & StructureRecognizer**
  - **Files:**
    - Tạo: `packages/ingest-docx/src/recognizers/style-map-recognizer.ts`
    - Tạo: `packages/ingest-docx/src/recognizers/structure-recognizer.ts`
    - Tạo: `packages/ingest-docx/src/recognizers/recognizer-chain.ts`
    - Test: `packages/ingest-docx/tests/style-map-recognizer.test.ts`
  - **Bước 1:** Viết test với dữ liệu từ `Template_EN.docx` và `Template_VI.docx`:
    - Đoạn có style `ArticleTitle` nhận diện đúng vai trò Title (confidence 1.0).
    - Đoạn có style `Authors`, `Affiliation`, `SectionAbstract` nhận diện đúng FrontMatter.
    - Các đoạn mang style `Guide*` hoặc `Instruction` bị loại bỏ sạch sẽ.
    - Đoạn không có style chuẩn thì chuyển qua `StructureRecognizer` phỏng đoán bằng regex (Table N., Hình N.).
  - **Bước 2:** Triển khai `StyleMapRecognizer` đọc bản đồ `styleMap` từ `packages/journal-profiles`.
  - **Bước 3:** Triển khai `StructureRecognizer` theo Chain of Responsibility.
  - **Bước 4:** Chạy test xác nhận nhận diện chính xác 100% các đoạn mẫu.

- [ ] **Task 3.3: Xây dựng Bộ Assemblers (Table, Figure, Equation, Reference, Section)**
  - **Files:**
    - Tạo: `packages/ingest-docx/src/assemblers/front-matter-assembler.ts`
    - Tạo: `packages/ingest-docx/src/assemblers/section-tree-assembler.ts`
    - Tạo: `packages/ingest-docx/src/assemblers/table-assembler.ts` (lưới `rowSpan`/`colSpan`)
    - Tạo: `packages/ingest-docx/src/assemblers/figure-assembler.ts` (SHA-256 asset hash)
    - Tạo: `packages/ingest-docx/src/assemblers/equation-assembler.ts` (OMML $\rightarrow$ MathML $\rightarrow$ LaTeX)
    - Tạo: `packages/ingest-docx/src/assemblers/reference-assembler.ts`
    - Test: `packages/ingest-docx/tests/assemblers.test.ts`
  - **Bước 1:** Viết test dựng ma trận bảng có `w:gridSpan` và `w:vMerge` thành ma trận `Cell[][]` có `colSpan`/`rowSpan` chuẩn.
  - **Bước 2:** Viết test chuyển đổi công thức OMML phức tạp (phân số, căn bậc hai, tích phân) sang mã LaTeX.
  - **Bước 3:** Triển khai toàn bộ các class Assembler gom nhóm các `RawBlock` đã được nhận diện vào cấu trúc `Manuscript`.
  - **Bước 4:** Chạy test xác nhận cây bài báo được dựng hoàn chỉnh.

- [ ] **Task 3.4: Xây dựng Normalizers, Fallback Parser & Đóng gói Web Worker**
  - **Files:**
    - Tạo: `packages/ingest-docx/src/normalizers/unicode-nfc-normalizer.ts`
    - Tạo: `packages/ingest-docx/src/normalizers/vietnamese-spacing-normalizer.ts`
    - Tạo: `packages/ingest-docx/src/normalizers/caption-number-stripper.ts`
    - Tạo: `packages/ingest-docx/src/pipeline/ingest-pipeline.ts`
    - Tạo: `packages/ingest-docx/src/worker/ingest-worker.ts`
    - Test: `packages/ingest-docx/tests/golden-fixtures.test.ts`
  - **Bước 1:** Viết test kiểm tra:
    - Tiếng Việt dạng NFD được chuyển chuẩn sang NFC.
    - Lỗi dãn chữ do Word (`Nguy ễ n`) được sửa thành `Nguyễn`.
    - Số cứng "Bảng 1:" trong caption được bóc tách khỏi nội dung.
  - **Bước 2:** Triển khai cơ chế Fallback an toàn: Tính điểm tin cậy tổng thể (Title 30%, Authors 30%, Sections 20%, Tables 20%). Nếu < 0.85, tự động kích hoạt parser cũ (kết quả đi qua `migrateV1toV2`) và xuất `IngestReport`.
  - **Bước 3:** Đóng gói pipeline chạy qua Web Worker bằng Comlink.
  - **Bước 4:** Chạy Golden test trên toàn bộ 11 file mẫu: 4 file template đạt 100% trường dữ liệu, 7 file thật đạt kết quả ngang bằng hoặc tốt hơn parser cũ.

---

### Phase 4: Hoàn thiện Editor Core, Phân rã Giao diện & Tích hợp TipTap Rich-Text

- [ ] **Task 4.1: Xây dựng `packages/compiler-client` & Compile Scheduler**
  - **Files:**
    - Tạo: `packages/compiler-client/package.json`
    - Tạo: `packages/compiler-client/src/interfaces/compiler-port.ts`
    - Tạo: `packages/compiler-client/src/scheduler/compile-scheduler.ts`
    - Tạo: `packages/compiler-client/src/adapters/local-next-compiler.ts`
    - Test: `packages/compiler-client/tests/compile-scheduler.test.ts`
  - **Bước 1:** Viết test kiểm tra: gọi compile liên tục 3 lần trong 500ms thì chỉ có job cuối cùng được thực thi, các job trước bị hủy (cancel), kết quả giống nhau được lấy từ cache.
  - **Bước 2:** Triển khai `compileScheduler` quản lý debounce, cache hash, và AbortController.
  - **Bước 3:** Nối `compileScheduler` vào `PreviewActionsToolbar` và `LivePreviewPane` trong `apps/web`.

- [ ] **Task 4.2: Refactor UI Modals, Drawers & Rút gọn `UnifiedEditorView.tsx` (< 200 dòng)**
  - **Files:**
    - Sửa: `apps/web/src/components/editor/TableSpreadsheetModal.tsx` (đọc ghi ma trận `Cell[][]` mới)
    - Sửa: `apps/web/src/components/editor/TableSettingsModal.tsx`
    - Sửa: `apps/web/src/components/editor/FigureSettingsModal.tsx` (dùng asset hash SHA-256)
    - Sửa: `apps/web/src/components/editor/LayoutSettingsDrawer.tsx`
    - Sửa: `apps/web/src/components/editor/UnifiedEditorView.tsx` (rút gọn thành layout shell)
    - Test: `apps/web/tests/components/unified-editor-view.test.tsx`
  - **Bước 1:** Viết test render `UnifiedEditorView` kiểm tra nạp đúng các tab và dock layout.
  - **Bước 2:** Chuyển đổi các modal và drawer sang đọc/ghi dữ liệu thông qua `CommandBus` của `packages/editor-core`.
  - **Bước 3:** Tách toàn bộ logic nghiệp vụ (lưu bài, compile, preflight) ra khỏi `UnifiedEditorView.tsx`, rút gọn file còn dưới 200 dòng code.
  - **Bước 4:** Kiểm tra giao diện người dùng hiển thị không đổi 1px nào so với bản cũ.

- [ ] **Task 4.3: Refactor Các Tab Giao diện (`MetadataTab`, `AuthorsTab`, `ReferencesTab`) sang CommandBus**
  - **Files:**
    - Sửa: `apps/web/src/components/editor/MetadataTab.tsx`
    - Sửa: `apps/web/src/components/editor/AuthorsTab.tsx`
    - Sửa: `apps/web/src/components/editor/ReferencesTab.tsx`
    - Sửa: `apps/web/src/components/editor/PreflightQCTab.tsx` (dùng wrapper tạm cho `computePreflightCheck`)
    - Test: `apps/web/tests/components/editor-tabs.test.tsx`
  - **Bước 1:** Viết unit test cho các thao tác trên từng tab: thêm/sửa tác giả, sửa ngày nhận bài, thêm/xóa tài liệu tham khảo qua CommandBus.
  - **Bước 2:** Thay thế toàn bộ lời gọi `setFormData` hoặc `setPaper` trong các tab bằng các selectors và hàm `dispatch` của `editor-core`.
  - **Bước 3:** Chạy test xác nhận các tab hoạt động trơn tru và hỗ trợ Undo/Redo tức thì.

- [ ] **Task 4.4: Refactor `SectionsTab` với Khung Danh sách Block & Ô Đoạn văn Tạm thời**
  - **Files:**
    - Sửa: `apps/web/src/components/editor/SectionsTab.tsx`
    - Tạo: `apps/web/src/components/editor/sections/TemporaryParagraphInput.tsx`
    - Test: `apps/web/tests/components/sections-tab.test.tsx`
  - **Bước 1:** Viết test cho `SectionsTab`: thêm đoạn văn mới, xóa đoạn văn, di chuyển thứ tự section.
  - **Bước 2:** Xây dựng `TemporaryParagraphInput` đọc ghi trực tiếp kiểu `Inline[]` (chuyển đổi `Inline[]` $\leftrightarrow$ string tạm thời, bảo tồn in nghiêng bằng markdown đơn giản).
  - **Bước 3:** Tích hợp vào `SectionsTab`.
  - **Bước 4: GỠ BỎ HOÀN TOÀN `adaptV2toV1`** (Toàn bộ ứng dụng giờ đây chạy 100% trên Manuscript v2).

- [ ] **Task 4.5: Tích hợp TipTap Rich-Text Editor cho Đoạn văn & Kiểm thử IME Tiếng Việt**
  - **Files:**
    - Tạo: `apps/web/src/components/editor/sections/TipTapParagraphEditor.tsx`
    - Tạo: `apps/web/src/components/editor/sections/tiptap-schema.ts`
    - Sửa: `apps/web/src/components/editor/SectionsTab.tsx` (thay thế ô tạm bằng TipTap)
    - Test: `apps/web/tests/e2e/ime-vietnamese.spec.ts` (Playwright CDP)
  - **Bước 1:** Cài đặt các gói tối thiểu của `@tiptap/core`, `@tiptap/starter-kit`.
  - **Bước 2:** Xây dựng TipTap schema ánh xạ 1-1 với `Inline[]` (marks: `b`, `i`, `sup`, `sub`; nodes: `cite`, `xref`, `math`, `footnote`).
  - **Bước 3:** Tạo styling CSS cho TipTap editor khớp 100% viền, font, padding của khung `<AutoResizeTextarea>` cũ.
  - **Bước 4:** Xử lý sự kiện gõ `[` mở popup chọn tài liệu tham khảo; phím tắt `Ctrl+B`, `Ctrl+I`.
  - **Bước 5:** Xử lý sự kiện dán (paste) từ Word lọc style rác, giữ in nghiêng/chỉ số.
  - **Bước 6:** Viết test Playwright tự động dùng Chrome DevTools Protocol (`Input.imeSetComposition`) mô phỏng gõ tiếng Việt Telex/VNI.
  - **Bước 7:** Thực hiện manual checklist trên Windows kiểm tra gõ Unikey/EVKey mượt mà, không giật trỏ chuột.

---

### Phase 5: Động cơ QC & Bộ Xuất bản Đa định dạng `packages/exporters`

- [ ] **Task 5.1: Xây dựng `packages/qc-engine` theo Specification Pattern**
  - **Files:**
    - Tạo: `packages/qc-engine/package.json`
    - Tạo: `packages/qc-engine/src/interfaces/rule.ts`
    - Tạo: `packages/qc-engine/src/engine/qc-engine.ts`
    - Tạo: `packages/qc-engine/src/rules/metadata-rules.ts`
    - Tạo: `packages/qc-engine/src/rules/numbering-rules.ts`
    - Tạo: `packages/qc-engine/src/rules/reference-rules.ts`
    - Tạo: `packages/qc-engine/src/rules/float-rules.ts`
    - Sửa: `apps/web/src/components/editor/PreflightQCTab.tsx` (nối sang `qc-engine` chính thức)
    - Test: `packages/qc-engine/tests/qc-rules.test.ts`
  - **Bước 1:** Viết test cho các luật QC:
    - Báo lỗi khi tóm tắt vượt quá 500 từ theo profile `VNUHCM-HS`.
    - Báo lỗi khi có trích dẫn `[5]` mà danh mục chỉ có 4 bài.
    - Báo lỗi khi ảnh có DPI < 300.
    - Cung cấp `fix` Command cho nút "Sửa nhanh".
  - **Bước 2:** Triển khai `QcEngine` và các class Specification rules.
  - **Bước 3:** Nối trực tiếp vào `PreflightQCTab` trên giao diện người dùng.
  - **Bước 4:** Chạy test kiểm tra toàn bộ luật QC pass 100%.

- [ ] **Task 5.2: Xây dựng Bộ Sinh Mã `LatexExporter` Hợp nhất & Tệp Khuôn mẫu `structpaper-hs.cls`**
  - **Files:**
    - Tạo: `packages/exporters/package.json`
    - Tạo: `packages/exporters/src/latex/latex-exporter.ts`
    - Tạo: `packages/exporters/src/latex/escape-tex.ts`
    - Tạo: `packages/exporters/src/latex/templates/structpaper-hs.cls`
    - Tạo: `packages/exporters/src/latex/blocks/table-to-latex.ts`
    - Tạo: `packages/exporters/src/latex/blocks/figure-to-latex.ts`
    - Tạo: `packages/exporters/src/latex/blocks/equation-to-latex.ts`
    - Test: `packages/exporters/tests/latex-exporter.test.ts`
  - **Bước 1:** Viết golden test xuất mã LaTeX từ cây `Manuscript` mẫu, đối chiếu với file TeX kỳ vọng.
  - **Bước 2:** Xây dựng hàm an toàn `escapeTex` bắt buộc cho mọi chuỗi văn bản (thoát các ký tự `%`, `&`, `_`, `#`, `$` an toàn).
  - **Bước 3:** Chèn ghi chú ẩn `%%BLOCK:<id>` trước mỗi block phục vụ tính năng SyncTeX và tra cứu ngược vị trí lỗi.
  - **Bước 4:** Triển khai `structpaper-hs.cls` định nghĩa các macro trang bìa `\spTitle`, `\spAuthors`, `\spAbstract`.
  - **Bước 5:** Chạy test xuất LaTeX và kiểm tra biên dịch XeLaTeX thành công.

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
