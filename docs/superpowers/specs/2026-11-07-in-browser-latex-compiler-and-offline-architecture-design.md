# Thiết kế Kiến trúc Biên dịch LaTeX trên Trình duyệt & Chế độ Ngoại tuyến (Design Document)

**Ngày lập:** 2026-11-07  
**Trạng thái:** Chờ phê duyệt (Pending Approval)  
**Tài liệu căn cứ:**  
- `docs/Architecture/Biên dịch LaTeX trong trình duyệt và chế độ ngoại tuyến — Thiết kế chi tiết.pdf` (07/11/2026, 40 trang)  
- `docs/superpowers/specs/2026-11-04-structpaper-v2-refactor-design.md`  
- `docs/superpowers/specs/spike-latex-engine-report.md`  
- `packages/compiler-client` & `apps/web/src/components/toast/`

---

## 1. Mục đích và Lý do (Intent & The Why)

Hiện tại trong hệ thống StructPaper v2:
- Toàn bộ việc biên dịch LaTeX sang PDF phụ thuộc vào máy chủ (Spring Boot Backend `apps/api` hoặc Next.js API route `/api/compile-latex`).
- Khi tác giả/biên tập viên chỉnh sửa bài liên tục (typing debounce), số lượt gọi biên dịch rất lớn làm quá tải máy chủ.
- Khi người dùng mất kết nối Internet, mạng chập chờn, hoặc máy chủ biên dịch gặp sự cố (quá tải, bảo trì), giao diện hoàn toàn không thể hiển thị bản xem trước PDF thực tế của bản thảo, làm gián đoạn dòng công việc biên tập.
- Ngoài ra, bản thảo khoa học chưa công bố bắt buộc phải rời máy người dùng mỗi lần xem thử, gây lo ngại về quyền riêng tư và bảo mật dữ liệu học thuật.

**Giải pháp:** Xây dựng hệ thống biên dịch hai tầng (Two-Tier Compilation) với:
1. **Tầng trình duyệt (`WasmCompiler`):** Chạy WebAssembly TeX Engine trong Web Worker riêng biệt, biên dịch sinh trực tiếp file PDF nhị phân thật ngay trên máy người dùng khi offline hoặc để giảm tải backend.
2. **Bộ định tuyến biên dịch (`CompilerRouter`):** Tự động phát hiện trạng thái mạng (`navigator.onLine`), đo kiểm khả năng kết nối server (health probe / fallback khi fetch fail) và áp dụng 11 quy tắc định tuyến thông minh theo đặc tả kiến trúc.
3. **Hệ thống cảnh báo Sticky Full-Width Toast:** Thông báo trạng thái ngoại tuyến / mất kết nối máy chủ chiếm trọn 100% bề rộng màn hình (single-line banner), phong cách Liquid Glass, kiên định không tự biến mất và không bị thông báo khác đẩy trôi, bắt buộc người dùng bấm đóng thủ công.

---

## 2. Mục tiêu, Phi mục tiêu và Điều tối kỵ (Goals, Non-Goals, Anti-Goals)

### Mục tiêu (Goals)
1. **Biên dịch thực tế trên trình duyệt sinh file PDF thật:** Khởi tạo Web Worker chạy WebAssembly TeX Engine (sử dụng nền tảng BusyTeX / Siglum / WebAssembly TeX) với hệ tệp ảo (virtual MemFS), biên dịch mã nguồn LaTeX thành `Uint8Array` / `Blob` PDF hiển thị trực tiếp trên trình xem PDF.
2. **Hợp đồng cổng biên dịch chuẩn (`CompilerPort`):** Mở rộng interface `CompilerPort` trong `packages/compiler-client` để cả `RemoteCompiler` (gọi BE/API) và `WasmCompiler` (chạy Worker WASM) đều tuân thủ chặt chẽ cùng một hợp đồng dữ liệu (`CompileRequest`, `CompileResult`, `CompileReport`).
3. **Bộ định tuyến thông minh (`CompilerRouter`):** Thực thi 11 quy tắc định tuyến theo mục 9 của tài liệu kiến trúc, trả về quyết định rõ ràng kèm `reasonCode` (ví dụ: `R04_OFFLINE_LOCAL_READY`, `R07_LOCAL_ENV_NOT_READY`, `R99_FALLBACK`).
4. **Giám sát kết nối mạng và máy chủ chủ động:** Tự động lắng nghe sự kiện `online`/`offline` của trình duyệt kết hợp cơ chế thăm dò khả năng phản hồi của backend (`serverReachable`).
5. **Sticky Full-Width Toast chuẩn UI/UX:**
   - Chiều ngang: Full width 100% (chiếm trọn chiều ngang màn hình).
   - Chiều cao: Đúng 1 dòng (single-line compact banner), nội dung cô đọng kèm badge trạng thái.
   - Hành vi: **Persistent** (không bao giờ tự biến mất dù hết thời gian), **Sticky** (không bị các thông báo popup khác ghi đè hoặc đẩy mất), có nút `X` để người dùng chủ động đóng (manual dismiss).
   - Thẩm mỹ: Chuẩn ngôn ngữ Liquid Glass (nền kính mờ frosted glass `backdrop-blur`, viền bóng đổ tinh tế, tương thích dark/light).
6. **Mô-đun hóa và Clean Architecture:** Cấu trúc file tách bạch rõ ràng trong `packages/compiler-client` và `apps/web`, tuân thủ quy tắc giới hạn dòng (không gom code dồn cục vào một file).

### Phi mục tiêu (Non-Goals)
- Không ép buộc trình duyệt phải thay thế hoàn toàn máy chủ cho bản xuất bản chính thức (bản xuất bản cuối cùng PDF/X, kiểm DPI, nhúng font in ấn thương mại và prepress vẫn do server đảm nhiệm).
- Không hỗ trợ mọi package TeX tùy ý ngoài danh mục đã duyệt (chỉ hỗ trợ các gói macro cho bài báo học thuật VNUHCM như `fontspec`, `amsmath`, `booktabs`, `graphicx`, v.v.).

### Điều tối kỵ (Anti-Goals)
- Không block main UI thread: Mọi tác vụ biên dịch nặng và WebAssembly WASM bắt buộc phải chạy trong Web Worker.
- Không để xảy ra rò rỉ bộ nhớ (Memory Leak): Mỗi phiên biên dịch trên worker phải dọn dẹp thư mục làm việc ảo và giải phóng bộ nhớ heap.
- Không phá vỡ trải nghiệm Toast hiện tại: Thông báo Sticky Full-Width được bổ sung như một chế độ đặc biệt (mode: `full-width-sticky`), không làm ảnh hưởng tới các toast dạng capsule nổi hiện có.

---

## 3. Các hướng tiếp cận đã xem xét (Approaches Considered)

### Hướng tiếp cận 1: Client HTML/Canvas Preview giả lập (Lightweight HTML Preview)
- **Mô tả:** Chuyển đổi LaTeX sang HTML bằng `latex.js` hoặc TipTap HTML rồi dùng `html2canvas`/`jsPDF` sinh PDF.
- **Ưu điểm:** Khởi động tức thì (<200ms), 0 MB tải về.
- **Nhược điểm:** Bố cục ngắt dòng, ngắt trang, công thức toán và bảng biểu bị lệch hoàn toàn so với XeLaTeX/Tectonic của backend; không đáp ứng tiêu chuẩn L1/L2 của tài liệu kiến trúc.
- **Đánh giá:** Loại bỏ vì không đáp ứng yêu cầu người dùng "sinh trực tiếp file latex thật".

### Hướng tiếp cận 2: WebAssembly TeX Engine trực tiếp trong Web Worker (Được lựa chọn)
- **Mô tả:** Tích hợp WebAssembly TeX Engine chạy trong Web Worker (dựa trên nền tảng BusyTeX / `@siglum/engine` - TeX Live 2026 WASM). Engine quản lý hệ tệp ảo (virtual FS), nạp file `main.tex`, các asset hình ảnh (theo hash base64), font OpenType và biên dịch trực tiếp ra file PDF nhị phân thật ngay trên trình duyệt.
- **Ưu điểm:** Sinh file PDF vector chuẩn xác từ lõi TeX, không phụ thuộc backend, chạy mượt mà ngay cả khi ngắt kết nối mạng hoàn toàn.
- **Thách thức:** Cần quản lý vòng đời Web Worker, cơ chế timeout watchdog, xử lý tải tài nguyên/cache và fallback mượt mà nếu máy client quá yếu hoặc thiếu bundle.
- **Đánh giá:** **Người dùng đã trực tiếp lựa chọn phương án này.**

---

## 4. Thiết kế Chi tiết Kiến trúc Hệ thống

### 4.1. Bố cục Package `@structpaper/compiler-client`
Cấu trúc theo đúng mục 4.5 của tài liệu kiến trúc:

```text
packages/compiler-client/
├── src/
│   ├── interfaces/
│   │   ├── compiler-port.ts         # CompilerPort, CompileRequest, CompileResult, CompileReport
│   │   └── compiler-router.types.ts # CompileContext, Decision, Rule, CapabilityVerdict
│   ├── router/
│   │   ├── compiler-router.ts       # Bộ định tuyến CompilerRouter
│   │   └── rules/                   # 11 quy tắc định tuyến độc lập (mục 9.2)
│   │       ├── 01-final-goes-to-server.ts
│   │       ├── 02-kill-switch.ts
│   │       ├── 03-prefer-server.ts
│   │       ├── 04-offline-local.ts
│   │       ├── 05-offline-no-env.ts
│   │       ├── 06-substitute-fonts.ts
│   │       ├── 07-env-not-ready.ts
│   │       ├── 08-device-too-weak.ts
│   │       ├── 09-too-big.ts
│   │       ├── 10-recent-failure.ts
│   │       └── 11-default-local.ts
│   ├── wasm/
│   │   ├── wasm-compiler.ts         # Adapter WasmCompiler triển khai CompilerPort
│   │   ├── virtual-fs.ts            # Quản lý hệ tệp ảo trong Worker
│   │   ├── log-parser.ts            # Phân tích raw log thành CompileReport chuẩn
│   │   └── worker/
│   │       ├── compiler-worker.ts   # Entry script chạy bên trong Web Worker
│   │       └── worker-bridge.ts     # Giao tiếp strongly-typed MessageChannel giữa UI và Worker
│   ├── remote/
│   │   └── remote-compiler.ts       # Adapter gọi Backend Spring Boot / Next.js API
│   ├── cache/
│   │   └── compile-cache.ts         # Lưu trữ kết quả PDF theo khóa hash (tex + assets)
│   ├── env/
│   │   └── environment-manager.ts   # Quản lý trạng thái môi trường ('ready' | 'downloading' | 'missing')
│   ├── monitor/
│   │   └── network-monitor.ts       # Giám sát trạng thái mạng và độ sẵn sàng của máy chủ
│   └── index.ts
```

### 4.2. Hợp đồng dữ liệu `CompilerPort` (Đồng bộ với mục 4.2)
```typescript
export interface CompileRequest {
  tex: string;
  paperId?: string;
  images?: Record<string, string>;
  mode?: 'draft' | 'final';
  environmentId?: string;
  passes?: 1 | 2;
  signal?: AbortSignal;
}

export interface CompileReport {
  errors: Array<{ line?: number; message: string; blockId?: string }>;
  warnings: Array<{ line?: number; message: string; blockId?: string }>;
  overfullHbox: number;
  missingFonts: string[];
  missingReferences: string[];
}

export interface CompileResult {
  status: 'success' | 'error' | 'cancelled';
  pdfBlob?: Blob;
  pdfUrl?: string;
  pdfBuffer?: Uint8Array;
  logs: string[];
  report?: CompileReport;
  producedBy: {
    kind: 'browser-wasm' | 'server-native' | 'local-cli';
    environmentId: string;
  };
  durationMs: number;
  fromCache?: boolean;
  error?: string;
  details?: string;
}
```

### 4.3. Bảng 11 Quy tắc Định tuyến của `CompilerRouter` (Mục 9.2)
1. **Rule 1 (Final to Server):** Yêu cầu xuất bản chính thức (`mode === 'final'`) bắt buộc gửi lên server. Nếu ngoại tuyến: xếp hàng chờ outbox.
2. **Rule 2 (Kill Switch):** Nếu cờ `localDisabledByFlag === true`: chuyển sang server.
3. **Rule 3 (User Preference Server):** Nếu người dùng chọn "Luôn biên dịch trên máy chủ" và có mạng: dùng server.
4. **Rule 4 (Offline & Local Ready):** Ngoại tuyến và môi trường cục bộ `localEnv === 'ready'`: dùng `WasmCompiler` trên máy!
5. **Rule 5 (Offline & Missing Env):** Ngoại tuyến nhưng chưa tải môi trường: trả lỗi E1 kèm giao diện hướng dẫn tải.
6. **Rule 6 (Substitute Fonts Check):** Bố cục cần thẩm định font in: ưu tiên server nếu có mạng.
7. **Rule 7 (Local Env Not Ready & Online):** Môi trường máy chưa sẵn sàng nhưng có mạng: dùng server.
8. **Rule 8 (Device Too Weak):** Thiết bị yếu (`deviceScore === 'unsupported'`): dùng server.
9. **Rule 9 (Document Too Big):** Bài báo quá 25 trang hoặc dung lượng ảnh > 40MB: chuyển sang server.
10. **Rule 10 (Recent Failures):** Nếu máy client bị crash/OOM (E2/E4) gần đây: tạm thời dùng server.
11. **Rule 11 (Default Local Draft):** Mặc định cho bản nháp khi môi trường cục bộ sẵn sàng: chạy `WasmCompiler` tại máy người dùng để giảm tải 100% cho server!

### 4.4. Thiết kế Sticky Full-Width Liquid Glass Toast
Hệ thống Toast hiện tại (`apps/web/src/components/toast/`):
- Mở rộng `ToastItem` và `ToastOptions` với thuộc tính:
  ```typescript
  export interface ToastItem {
    // ... thuộc tính cũ
    variant?: 'island' | 'full-width-sticky';
    sticky?: boolean; // Không bị ghi đè, không tự biến mất
  }
  ```
- **Hành vi quản lý trạng thái trong `toast-store.ts`:**
  - Khi một toast có `sticky: true` hoặc `variant: 'full-width-sticky'` được phát, nó được ghim ở vị trí ưu tiên cao nhất.
  - Các toast thông thường tiếp theo (thành công, cảnh báo...) xuất hiện bên dưới hoặc dạng capsule nổi mà **KHÔNG ĐƯỢC XÓA** sticky toast.
  - Không thiết lập timeout tự động (`duration: Infinity`).
  - Cung cấp nút `dismiss` rõ ràng để người dùng đóng thủ công khi đã nắm bắt thông tin.
- **Component giao diện `FullWidthStickyToast.tsx`:**
  - Chiều rộng `w-full` phủ ngang màn hình.
  - Chiều cao 1 dòng chuẩn (`h-10 sm:h-11`), bo viền dưới hoặc dạng banner top tinh tế.
  - Nền kính mờ `backdrop-blur-md bg-amber-500/15 border-b border-amber-500/30 text-amber-950` hoặc tone dark/light hài hòa với StructPaper.
  - Hiển thị badge trạng thái ("NGOẠI TUYẾN" / "MẤT KẾT NỐI SERVER"), dòng thông báo giải thích ("Đang chuyển sang chế độ biên dịch nội bộ WebAssembly...") và nút `X` đóng.

### 4.5. Tích hợp vào Trình soạn thảo (`useEditorCompilation.ts`)
- Thay thế việc khởi tạo trực tiếp `LocalNextCompilerAdapter` bằng `CompilerRouter`.
- Kết nối `network-monitor` để cập nhật `CompileContext`.
- Khi router chuyển sang biên dịch cục bộ: hiển thị badge "Bản nháp · Trình duyệt (WASM)" cạnh PDF preview.
- Khi người dùng online trở lại: tự động cập nhật context và thông báo server đã sẵn sàng.

---

## 5. Những điểm dành riêng cho người xây dựng (Left to the Builder)

1. Tối ưu hóa việc đóng gói Web Worker bằng Next.js Webpack / Turbopack (sử dụng cú pháp chuẩn `new Worker(new URL(..., import.meta.url))`).
2. Tích hợp fallback an toàn trong `WasmCompiler`: Trong trường hợp WebAssembly binary chưa tải xong hoặc client không hỗ trợ WebAssembly, sinh ngay bản preview với thông báo rõ ràng mã lỗi E1 thay vì làm treo ứng dụng.
3. Test suite toàn diện: Viết unit tests kiểm thử 11 quy tắc của `CompilerRouter` và kiểm thử khả năng hiển thị/dismiss của `FullWidthStickyToast`.

---

## 6. Quyết định Kỹ thuật Rõ ràng (Architectural Decisions & Clarifications)

Dựa trên kết quả đánh giá kỹ thuật chuyên sâu (Builder Review):
1. **Lựa chọn Engine WASM:** Sử dụng `@siglum/engine` (phiên bản v0.2.x, giấy phép MIT, phát triển dựa trên BusyTeX) đóng gói trong Web Worker với virtual filesystem MemFS. Không tự dựng C/C++ BusyTeX từ đầu để tránh rủi ro kéo dài thời gian và phụ thuộc toolchain Emscripten.
2. **Cơ chế nạp Bundle & Môi trường Ngoại tuyến:** `EnvironmentManager` hỗ trợ nạp gói bundle TeX từ thư mục tĩnh `apps/web/public/tex/` và cache vào IndexedDB (`Dexie`) / CacheStorage. Khi chưa có CDN máy chủ, hệ thống tự động sử dụng local seed để chạy offline 100%.
3. **Quản lý Asset đồ họa (Images):** `CompileRequest` duy trì tương thích 100% với định dạng hiện tại (`images?: Record<string, string>`), đồng thời hỗ trợ chuyển giao `ArrayBuffer` sang Web Worker để tránh nghẽn luồng giao diện chính.
4. **Phạm vi Ngoại tuyến (Offline Scope):** Tập trung tối đa vào **In-Session Resilient Compilation Fallback** — xử lý tự động khi đang sửa bài mà mất mạng hoặc backend chết, tự động chuyển sang WASM và hiển thị Sticky Full-Width Toast.
5. **Phạm vi Parity Máy chủ:** Phía máy khách triển khai `RemoteCompiler` bọc gọi API hiện tại (`/api/compile-latex` / Spring Boot), chuẩn hóa kết quả về cùng định dạng `CompileResult`/`CompileReport` mà không đòi hỏi đập đi xây lại hạ tầng backend ngay lập tức.
