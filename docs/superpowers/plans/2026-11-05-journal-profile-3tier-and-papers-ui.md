# Kế Hoạch Triển Khai: Quản Lý Journal Profile 3 Tầng & Giao Diện Quản Lý Bài Báo V2

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Triển khai hoàn chỉnh kiến trúc Journal Profile 3 tầng (`base → journal → articleType`), mô hình tách biệt `ManuscriptRecord` (`doc` + `info`), cập nhật lược đồ Dexie v2, và tái cấu trúc 2 trang giao diện chính: Quản lý Bài báo (`/papers`) với hàng bài chỉnh sửa gần đây ở trên cùng, và Quản lý Template / Tạp chí (`/templates`) cho 7 tạp chí ĐHQG-HCM theo đúng tài liệu đề xuất kiến trúc v2 (49 trang).

**Architecture:** 
- Mô hình dữ liệu bản thảo phân tách `ManuscriptRecord = doc (content, rev, undo/redo) + info (ManuscriptInfo, UI metadata, workflowStatus)`.
- Kế thừa cấu hình 3 tầng `base → journal → articleType` cho 7 tạp chí VNUHCM (`std`, `hs`, `ssh`, `ebl`, `et`, `ees`, `arns`), hợp nhất bằng hàm thuần `resolveProfile()`.
- Dexie IndexedDB nâng cấp v2 đánh index cột phẳng `info`, hỗ trợ bảng `profiles` và `profileIndex`.
- Giao diện người dùng Next.js App Router: Tab Quản lý Bài báo (`/papers`) tích hợp hàng ngang Recent Papers và bảng lọc đầy đủ; Tab Quản lý Template (`/templates` + `/templates/journal/[id]`) theo phong cách chuyên nghiệp của Template Builder.

**Tech Stack:** TypeScript, Next.js 14 App Router, Dexie.js (IndexedDB), Tailwind CSS, Lucide Icons, Zod, Vitest, Playwright.

**Spec:** `docs/Architecture/StructPaper v2 — Đề xuất kiến trúc & design pattern (1).pdf` (Mục 3.6, Mục 5.1b, 5.1c, 5.1d, Mục 9.2).

## Global Constraints
- Tuân thủ nghiêm ngặt giới hạn dòng: File logic < 300 dòng cảnh báo / < 500 dòng tối đa; File UI < 400 dòng cảnh báo / < 700 dòng tối đa.
- Không được vi phạm phân tầng kiến trúc: `pnpm depcruise` đạt 0 violations.
- Giữ vững 100% test passing (hiện tại 37 file test, 340 test cases).
- Màu sắc và phong cách giao diện đồng bộ với chuẩn Zinc/Slate, Bo tròn mềm mại (`rounded-2xl`, `rounded-3xl`), Glassmorphism.

---

### Task 1: Định Nghĩa `ManuscriptRecord`, `ManuscriptInfo`, `ProfilePin` Trong `@structpaper/doc-model`

**Files:**
- Create: `packages/doc-model/src/types/manuscript-record.ts`
- Modify: `packages/doc-model/src/types/manuscript.ts`
- Modify: `packages/doc-model/src/types/index.ts`
- Modify: `packages/doc-model/src/schemas/manuscript.schema.ts`
- Create: `packages/doc-model/src/schemas/manuscript-record.schema.ts`
- Modify: `packages/doc-model/src/schemas/index.ts`
- Modify: `packages/doc-model/src/index.ts`
- Test: `packages/doc-model/tests/manuscript-record.test.ts`

- [ ] **Step 1.1:** Viết failing unit test trong `packages/doc-model/tests/manuscript-record.test.ts` kiểm chứng tạo `ManuscriptInfo`, `ProfilePin`, `ManuscriptRecord` và Zod schema validation.
- [ ] **Step 1.2:** Chạy test để đảm bảo test fail đúng dự kiến.
- [ ] **Step 1.3:** Tạo `packages/doc-model/src/types/manuscript-record.ts` định nghĩa `ProfilePin`, `WorkflowStatus`, `ManuscriptInfo`, `ManuscriptRecord`.
- [ ] **Step 1.4:** Bổ sung `profilePin?: ProfilePin` vào `Manuscript` interface trong `packages/doc-model/src/types/manuscript.ts`.
- [ ] **Step 1.5:** Tạo `packages/doc-model/src/schemas/manuscript-record.schema.ts` với `ProfilePinSchema`, `WorkflowStatusSchema`, `ManuscriptInfoSchema`, `ManuscriptRecordSchema`.
- [ ] **Step 1.6:** Export các types và schemas qua `index.ts`.
- [ ] **Step 1.7:** Chạy lại test `packages/doc-model/tests/manuscript-record.test.ts` và đảm bảo pass 100%.

---

### Task 2: Kiến Trúc 3 Tầng Kế Thừa Journal Profile Trong `@structpaper/journal-profiles`

**Files:**
- Create: `packages/journal-profiles/src/profiles/base.json`
- Create: `packages/journal-profiles/src/profiles/journals/std.json`
- Create: `packages/journal-profiles/src/profiles/journals/hs.json`
- Create: `packages/journal-profiles/src/profiles/journals/ssh.json`
- Create: `packages/journal-profiles/src/profiles/journals/ebl.json`
- Create: `packages/journal-profiles/src/profiles/journals/et.json`
- Create: `packages/journal-profiles/src/profiles/journals/ees.json`
- Create: `packages/journal-profiles/src/profiles/journals/arns.json`
- Create: `packages/journal-profiles/src/profiles/article-types/hs/research.json`
- Create: `packages/journal-profiles/src/profiles/article-types/hs/review.json`
- Create: `packages/journal-profiles/src/profiles/article-types/hs/editorial.json`
- Create: `packages/journal-profiles/src/profiles/article-types/hs/commentary.json`
- Create: `packages/journal-profiles/src/profiles/article-types/hs/letter.json`
- Create: `packages/journal-profiles/src/profiles/article-types/hs/correction.json`
- Create: `packages/journal-profiles/src/profiles/article-types/hs/methodology.json`
- Create: `packages/journal-profiles/src/profiles/article-types/hs/case-report.json`
- Modify: `packages/journal-profiles/src/types/profile.ts`
- Create: `packages/journal-profiles/src/resolve/resolve-profile.ts`
- Create: `packages/journal-profiles/src/resolve/index.ts`
- Modify: `packages/journal-profiles/src/index.ts`
- Test: `packages/journal-profiles/tests/resolve-profile.test.ts`

- [ ] **Step 2.1:** Viết failing unit test trong `packages/journal-profiles/tests/resolve-profile.test.ts` kiểm chứng việc gộp 3 tầng `base → journal → articleType → overrides`, hỗ trợ `$append`, xử lý giá trị `null` để tắt trường.
- [ ] **Step 2.2:** Chạy test để xác nhận fail.
- [ ] **Step 2.3:** Bổ sung kiểu `ProfileState`, `ProfileScopeType`, `ProfileLayer`, `ResolvedProfile`, `ThreeTierProfile` trong `packages/journal-profiles/src/types/profile.ts`.
- [ ] **Step 2.4:** Tạo dữ liệu `base.json`, 7 journal JSONs (`std`, `hs`, `ssh`, `ebl`, `et`, `ees`, `arns` với đúng mã màu chỉ định), và 8 article type JSONs cho `hs`.
- [ ] **Step 2.5:** Cài đặt hàm thuần `resolveProfile(journalId, articleTypeId, overrides)` trong `packages/journal-profiles/src/resolve/resolve-profile.ts`.
- [ ] **Step 2.6:** Tạo registry đóng gói sẵn và export trong `packages/journal-profiles/src/index.ts`.
- [ ] **Step 2.7:** Chạy test `resolve-profile.test.ts` và toàn bộ suite `profile.test.ts`, đảm bảo pass.

---

### Task 3: Nâng Cấp Tầng Lưu Trữ Dexie v2 & Repository Trong `@structpaper/storage`

**Files:**
- Modify: `packages/storage/src/db/types.ts`
- Modify: `packages/storage/src/db/structpaper-db.ts`
- Modify: `packages/storage/src/repositories/indexeddb-manuscript-repo.ts`
- Test: `packages/storage/tests/manuscript-record-repo.test.ts`

- [x] **Step 3.1:** Viết failing test trong `packages/storage/tests/manuscript-record-repo.test.ts` kiểm thử `updateInfo(id, patch)` mà không tăng `doc.rev`, kiểm thử `getRecord` và `listRecords`.
- [x] **Step 3.2:** Chạy test để xác nhận fail.
- [x] **Step 3.3:** Cập nhật `packages/storage/src/db/types.ts` bổ sung `StoredProfile`, `StoredProfileIndex`, và mở rộng `StoredManuscript` với các cột phẳng của `ManuscriptInfo`.
- [x] **Step 3.4:** Cập nhật `packages/storage/src/db/structpaper-db.ts` với Dexie version 2: thêm bảng `profiles`, `profileIndex`, và index mở rộng cho `manuscripts`.
- [x] **Step 3.5:** Cập nhật `packages/storage/src/repositories/indexeddb-manuscript-repo.ts`: cài đặt `updateInfo(id, patch)`, `getRecord(id)`, `listRecords()`.
- [x] **Step 3.6:** Chạy lại các tests trong `packages/storage/tests/` và xác nhận pass 100%.

---

### Task 4: Tái Cấu Trúc Giao Diện Quản Lý Bài Báo (`/papers`)

**Files:**
- Create: `apps/web/src/components/papers/RecentPapersRow.tsx`
- Create: `apps/web/src/components/papers/PaperFiltersBar.tsx`
- Create: `apps/web/src/components/papers/PaperCard.tsx`
- Create: `apps/web/src/components/papers/PaperTable.tsx`
- Create: `apps/web/src/components/papers/EmptyPapersState.tsx`
- Create: `apps/web/src/components/papers/PaperQuickEditModal.tsx`
- Modify: `apps/web/src/components/authoring/PaperHubView.tsx`
- Modify: `apps/web/src/app/history/page.tsx` (redirect hoặc render thống nhất)
- Test: `apps/web/tests/components/recent-papers-row.test.tsx`

- [ ] **Step 4.1:** Tạo component `RecentPapersRow.tsx` hiển thị thanh cuộn ngang các bài chỉnh sửa gần đây nhất (mini preview card có dải màu tạp chí, tên bài, thời gian, nút mở nhanh vào `/editor`).
- [ ] **Step 4.2:** Tạo component `PaperFiltersBar.tsx` với thanh tìm kiếm, filter chips trạng thái workflow (`Tất cả`, `Bản nháp`, `Đang duyệt`, `Hiệu đính`, `Sẵn sàng`, `Đã xuất bản`), dropdown lọc theo 7 tạp chí VNUHCM, và nút chuyển view Grid / List.
- [ ] **Step 4.3:** Tạo `PaperCard.tsx` và `PaperTable.tsx` hiển thị bài viết với badge trạng thái, tag, action ghim (pin to top), đổi tên gợi nhớ, nhân bản, xuất bản, và xóa.
- [ ] **Step 4.4:** Tạo `PaperQuickEditModal.tsx` cho phép đổi `displayName`, `workflowStatus`, `tags`, `note` gọi qua `updateInfo`.
- [ ] **Step 4.5:** Cập nhật `PaperHubView.tsx` ghép nối toàn bộ các thành phần trên, lấy dữ liệu trực tiếp từ `IndexedDbManuscriptRepo` (đồng bộ với editor thực tế).
- [ ] **Step 4.6:** Cập nhật `apps/web/src/app/history/page.tsx` chuyển hướng mượt mà hoặc nhúng `PaperHubView` để người dùng vào link cũ vẫn thấy giao diện mới.
- [ ] **Step 4.7:** Viết và chạy test UI cho `RecentPapersRow.tsx` và danh sách bài báo.

---

### Task 5: Xây Dựng Giao Diện Quản Lý Template / Tạp Chí (`/templates`) & Sidebar Navigation

**Files:**
- Modify: `apps/web/src/components/Sidebar.tsx`
- Create: `apps/web/src/components/templates/JournalProfileCard.tsx`
- Create: `apps/web/src/components/templates/JournalProfilesGrid.tsx`
- Create: `apps/web/src/components/templates/JournalDetailView.tsx`
- Create: `apps/web/src/components/templates/JournalEditModal.tsx`
- Modify: `apps/web/src/components/template-builder/TemplateHubView.tsx`
- Create: `apps/web/src/app/templates/journal/[id]/page.tsx`
- Test: `apps/web/tests/components/journal-profiles-view.test.tsx`

- [ ] **Step 5.1:** Cập nhật `Sidebar.tsx`:
  - Thêm tab `Quản lý Tạp chí & Template` (`/templates`) với icon `BookOpen`.
  - Cập nhật tab `Kho bài báo` dẫn tới `/papers` với icon `FolderArchive`.
- [ ] **Step 5.2:** Xây dựng `JournalProfileCard.tsx` hiển thị thông tin từng tạp chí trong 7 tạp chí VNUHCM: mã màu, tên song ngữ, trạng thái published, số lượng loại bài, tóm tắt quy chuẩn (số từ, từ khóa, kiểu trích dẫn).
- [ ] **Step 5.3:** Xây dựng `JournalProfilesGrid.tsx` và tích hợp vào tab Quản lý Tạp chí trong `/templates`.
- [ ] **Step 5.4:** Tạo modal / sub-page `apps/web/src/app/templates/journal/[id]/page.tsx` và `JournalDetailView.tsx` cho phép xem chi tiết quy định, cấu hình 3 tầng, danh sách chuyên mục, và tùy biến thông số (màu sắc, giới hạn từ, trạng thái draft/published).
- [ ] **Step 5.5:** Giữ liên kết mượt mà sang `Template Builder` (`/templates/builder`) khi người dùng muốn thiết kế layout trực quan.
- [ ] **Step 5.6:** Viết unit test trong `apps/web/tests/components/journal-profiles-view.test.tsx` kiểm thử hiển thị danh sách 7 tạp chí và tương tác modal.

---

### Task 6: Kiểm Thử Toàn Diện & Cập Nhật Báo Cáo Đối Chiếu Kiến Trúc V2

**Files:**
- Modify: `docs/Audit/BAO_CAO_DOI_CHIEU_KIEN_TRUC_V2.md`
- Test: E2E Playwright tests & Monorepo Vitest suite

- [ ] **Step 6.1:** Chạy toàn bộ test suite `pnpm test` (340+ tests).
- [ ] **Step 6.2:** Chạy `node scripts/verify-line-limits.js` xác nhận không có file nào vượt ngưỡng tối đa.
- [ ] **Step 6.3:** Chạy `pnpm depcruise` xác nhận 0 vi phạm kiến trúc Hexagonal.
- [ ] **Step 6.4:** Chạy Playwright E2E verification test cho luồng giao diện `/papers` và `/templates`.
- [ ] **Step 6.5:** Cập nhật tài liệu `docs/Audit/BAO_CAO_DOI_CHIEU_KIEN_TRUC_V2.md` bổ sung chi tiết:
  - Cập nhật theo tài liệu thiết kế mới (49 trang PDF).
  - Đối chiếu mô hình `ManuscriptRecord` & `ManuscriptInfo`.
  - Đối chiếu kế thừa 3 tầng Journal Profile 7 tạp chí VNUHCM.
  - Đối chiếu giao diện Quản lý Bài báo và Quản lý Template mới.
