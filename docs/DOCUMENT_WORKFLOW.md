# Quy trình làm việc theo tài liệu (kiểu Word)

Phần mềm tổ chức quanh **từng tài liệu**: tạo mới (đặt tên) → chỉnh sửa (tự động lưu) → lưu → mở lại → xuất Word / PDF / XML.

## 1. Vòng đời tài liệu

| Thao tác | Nơi thực hiện | Cách hoạt động |
| --- | --- | --- |
| **Mới** | `Tệp ▸ Mới…` hoặc nút tạo ở trang Bài báo | Hộp thoại có ô **Tên tài liệu**. Để trống thì lấy theo tiêu đề bài báo. |
| **Nhập Word gốc** | Hộp thoại Mới, bước tải tệp | Chạy **cổng kiểm tra đầu vào** (mục 3) trước khi vào chỉnh sửa. |
| **Chỉnh sửa** | Trình soạn thảo | Mọi thay đổi được **tự động lưu** sau ~1,2 giây ngừng gõ, và khi ẩn tab/đóng trang. |
| **Lưu** | `Tệp ▸ Lưu` / `Ctrl+S` | Lưu ngay và tạo thêm **bản chụp phiên bản** (file JSON trong kho tệp). |
| **Mở** | `Tệp ▸ Mở…` | Danh sách tài liệu đã lưu, gộp từ máy này (IndexedDB) và máy chủ; tìm theo tên. |
| **Đổi tên** | Ô tên trên thanh menu | Enter hoặc rời ô để xác nhận. |
| **Xuất** | `Tệp ▸ Xuất thành` | **Cổng kiểm tra đầu ra** (mục 4), rồi tải Word (.docx), PDF hoặc XML JATS; bản xuất cũng được lưu lên máy chủ. |

Chỉ báo trạng thái ở góc phải thanh menu:

| Trạng thái | Ý nghĩa |
| --- | --- |
| Đang chờ lưu / Đang lưu | Có thay đổi chưa ghi / đang ghi. |
| Đã lưu | Đã ghi trên máy **và** máy chủ. |
| Đã lưu trên máy | Máy chủ không với tới được; dữ liệu an toàn trên máy, tự thử lại ở lần lưu sau. |
| Xung đột phiên bản | Phiên khác đã lưu bản mới hơn. Nút **Ghi đè bằng bản của tôi** để chọn bản đang soạn. |
| Lưu thất bại | Không ghi được cả trên máy — cần xử lý ngay. |

## 2. Lưu trữ

* **Trên máy (ưu tiên, offline):** IndexedDB qua `@structpaper/storage`.
* **Máy chủ:** `apps/api`, module `document`.
  * **CSDL** (H2 khi dev, MySQL khi chạy thật; Flyway `V2__documents.sql`): bảng `documents` (tên, trạng thái, `rev`, nội dung JSON) và `document_exports`.
  * **Kho tệp** (`ObjectStorage`): **MinIO** khi `STRUCTPAPER_STORAGE_TYPE=minio`, mặc định lưu thư mục `./data/objects`. Chứa bản chụp phiên bản `documents/{id}/snapshots/{rev}.json` và các bản xuất `documents/{id}/exports/{id}.{docx|pdf|xml}`.
  * Hình ảnh được tải một lần theo **SHA-256** lên `/api/v1/assets/{sha256}`; JSON tài liệu chỉ giữ tham chiếu `asset:<sha256>` (không nhúng ảnh base64).
* Khoá lạc quan: `baseRev` trong `PUT /documents/{id}`; sai phiên bản trả **412**.

Khởi chạy MinIO: `docker compose -f docker-compose.minio.yml up -d`, rồi chạy API với các biến môi trường ghi trong tệp đó.

### API chính (`/api/v1/documents`)

| Phương thức | Đường dẫn | Mô tả |
| --- | --- | --- |
| GET | `/` | Danh sách (không kèm nội dung) cho hộp thoại Mở |
| POST | `/` | Tạo mới có tên |
| GET | `/{id}` | Mở (kèm nội dung) |
| PUT | `/{id}` | Tự động lưu / Lưu (upsert; `snapshot=true` ghi bản chụp) |
| DELETE | `/{id}` | Xóa mềm |
| POST/GET | `/{id}/exports` | Lưu / liệt kê bản xuất (multipart `format`, `file`) |
| GET | `/{id}/exports/{exportId}` | Tải bản xuất |

## 3. Cổng kiểm tra đầu vào (ngay sau khi nhập Word)

Chạy ngay khi nhập tệp, trước khi cho vào chỉnh sửa; **không chặn** (trừ tệp rỗng), nhưng liệt kê để sửa. Có nút **Tự động đánh lại số thứ tự**.

* Trường còn thiếu: tiêu đề, tác giả, đơn vị, tác giả liên hệ + email, tóm tắt (275–500 từ), 3–5 từ khóa, ngày nhận/sửa/chấp nhận (`dd/mm/yyyy`, đúng lịch, đúng thứ tự).
* **STT:** trích dẫn `[n]` theo thứ tự xuất hiện lần đầu (kiểu Vancouver); danh mục tham khảo liên tục; Bảng / Hình / Phương trình đánh số liên tục theo vị trí; mỗi đối tượng phải được nhắc trong văn bản **trước** khi xuất hiện; trích dẫn không có tài liệu tham khảo; tài liệu chưa được trích dẫn.
* Hình/Bảng thiếu dòng **Nguồn**; công thức sai cú pháp.

## 4. Cổng kiểm tra đầu ra (trước khi xuất)

Cùng bộ luật nhưng **mang tính cảnh báo**: bảng liệt kê mọi phần còn thiếu/sai, người dùng vẫn bấm **"Vẫn xuất"** được. Chỉ có một trường hợp không xuất được: PDF biên dịch lỗi (không có tệp để tải). Quy tắc nằm ở `apps/web/src/lib/validation/` (`numbering.ts`, `validators.ts`).

## 5. Công thức toán học

* Khối **Công thức** (`+ Công thức`): nhập LaTeX, xem KaTeX trực tiếp, đánh số tự động `(n)`.
* Công thức inline `$…$` và dòng riêng `$$…$$` trong đoạn văn cũng được hiển thị.
* **Nhập Word:** công thức Word (OMML) được chuyển sang LaTeX bằng bộ chuyển theo cấu trúc (`lib/omml.ts`) và chèn lại đúng vị trí. Công thức *nằm giữa dòng chữ* chưa được khôi phục (chỉ công thức trên dòng riêng).
* **Xuất:** LaTeX/PDF dùng môi trường `equation`; **Word** xuất công thức Word gốc (chỉnh sửa được); **XML** xuất `<disp-formula>` / `<inline-formula>` với `<tex-math>`.

## 6. Bảng: 1 cột / 2 cột / xoay ngang, và bảng dài

Mỗi bảng chọn được **1 cột**, **2 cột**, **xoay ngang** (Cài đặt bảng) và **Ngắt qua trang** (Tự động / Luôn cắt / Giữ nguyên). Bảng dài (mặc định > 12 hàng) được cắt qua trang giống PDF mẫu của tạp chí:

| Kiểu bảng | Cách dàn trang |
| --- | --- |
| Ngắn | Khối nổi, giữ nguyên (`table`, `table*`, `sidewaystable`) |
| Dài, 1 cột | Chảy trong cột (`supertabular`), lặp hàng tiêu đề |
| Dài, 2 cột | Trang riêng một cột, bảng rộng 2 cột (`longtable`), lặp hàng tiêu đề |
| Dài, xoay ngang | Các trang ngang (`landscape` + `longtable`), tiêu đề chạy dọc lề phải như bản mẫu |

Mỗi trang tiếp theo có dòng **"Table N continued"** phía trên và **"Continued on next page"** phía dưới (đúng chữ của PDF mẫu EBL ID1750; đổi được trong cài đặt giao diện). Độ rộng cột tự chia theo độ dài nội dung. Word: hàng tiêu đề lặp ở đầu mỗi trang, hàng không bị cắt.

## 7. Cấu hình động (không hard-code)

`Cài đặt dàn trang ▸ Màu sắc, phông chữ & lề` (lưu cùng tài liệu trong `layoutSettings.theme`):

| Thuộc tính | Mặc định |
| --- | --- |
| Màu tiêu đề/chú thích | màu tạp chí (hoặc `#2B74B7`) |
| Màu nền hàng tiêu đề bảng / hàng xen kẽ | `#E5E5E5` / `#E7ECF7` |
| Phông nội dung / tiêu đề | Times New Roman / Calibri |
| Lề trên, dưới, trái, phải (cm) | 1,8 / 2 / 1,7 / 1,3 |
| Lặp hàng tiêu đề bảng, ngưỡng "bảng dài" | bật, 12 hàng |

Giá trị được làm sạch (`lib/theme-config.ts`) trước khi chèn vào CSS/LaTeX.

## 8. XML (JATS)

Xuất theo JATS 1.2 (`lib/jats-export.ts`): `front` (tạp chí, tác giả, đơn vị, ngày, tóm tắt, từ khóa), `body` lồng mục đúng cấp, công thức, `fig`/`table-wrap` kèm nguồn, `ref-list` có `xref` tới `[n]`. Đường dẫn ảnh theo quy ước của hệ thống tạp chí khi biết mã bài (`a-#`):
`https://static.vnuhcmjournal.com.vn/articles/<viết tắt tạp chí>/v-<tập>/i-<số>/a-<mã bài>/img-<n>.<ext>`; nếu chưa có mã bài thì dùng `images/img-<n>.<ext>`. Kiểm tra bằng <https://jats4r.niso.org/jats4r-validator/>.

## 9. Nhập từ Word: những gì được khôi phục

Kiểm tra bằng bài mẫu EBL ID1750 (so với PDF của tạp chí):

* **Bảng:** nhãn trong ô tiêu đề được tách thành tên bảng (không còn "Bảng 2: Bảng 2"), ô nhiều dòng giữ nguyên từng dòng, bảng nằm trong **trang ngang** của Word được đặt **xoay ngang**, bảng hẹp (≤ 4 cột) để 1 cột và bảng rộng 2 cột, bảng bị bỏ sót được chèn đúng thứ tự số. Dòng "Chú thích:" / "Nguồn:" ngay sau bảng thuộc về bảng.
* **Hình:** mỗi hình ghép với ảnh gần nó nhất trong XML. Hình vẽ bằng khối Word (ô oval, mũi tên, ô chữ — không phải file ảnh, ví dụ mô hình nghiên cứu) được **vẽ lại**: đọc hình khối trong XML (`lib/drawingml.ts`), dựng SVG rồi chuyển thành PNG ngay trong trình duyệt. Nếu không vẽ được (khối lạ, hoặc chạy ngoài trình duyệt) thì hình để trống và báo "Hình trống" chứ không gắn nhầm ảnh khác.
* **Chỉ số trên/dưới** (f², R², CO₂…) giữ nguyên dạng công thức; công thức Word (OMML) trên dòng riêng thành khối công thức.
* **Tác giả/đơn vị:** sửa lỗi tên bị tách ("Nguyễ n"); đơn vị viết hai dòng Việt + Anh gộp thành một (tiếng Anh dùng cho trang tóm tắt cuối).
* **Không tự bịa** DOI, tập, số, trang, ngày nhận/sửa/chấp nhận/đăng: file Word thường không có, nên để trống, hiện "?" trên đầu trang và cảnh báo ở cổng kiểm tra.

### Trang tóm tắt tiếng Anh cuối bài
Nếu có tiêu đề + tóm tắt tiếng Anh, bài PDF kết thúc bằng trang tiếng Anh như bản in của tạp chí (tiêu đề, tác giả, khung Abstract, Key words, đơn vị tiếng Anh, Correspondence, History, DOI, Copyright, "Cite this article"). Tắt bằng `layoutSettings.theme.englishSummaryPage = false`. Thân bài dùng cỡ chữ 9pt thật (`extarticle`); máy biên dịch cần gói `extsizes` (MiKTeX tự cài lần đầu).

### Thông tin xuất bản, tiêu đề, số mục, nền bảng
* **Thông tin xuất bản** (DOI, tập, số, trang, ngày): chưa có thì ô hiện `?`; người dùng xóa `?` để nhập giá trị, hoặc xóa hết để **để trống** (in ra rỗng). Chưa đụng tới thì in `?`.
* **Mã QR** trang 1 tự tạo từ ô DOI (link `https://doi.org/…`), vẽ bằng nét TeX nên không cần ảnh/gói và giống nhau trên mọi bộ biên dịch. DOI còn "?" hoặc trống thì không in mã (không bao giờ in mã giả).
* **Tiêu đề viết hoa toàn bộ** trong Word được chuẩn hóa về dạng câu khi nhập (có nút hoàn tác về tiêu đề gốc).
* **Số mục** gõ trong Word ("4. Kết quả") không in theo tạp chí; bật "Giữ số thứ tự mục" trong Giao diện để giữ lại (áp dụng cho PDF, Word, XML, xem trước).
* **Nền thân bảng**: mặc định trắng; tùy chọn "xen kẽ" hoặc "tô toàn bộ" ở từng bảng. Bài cũ từng bật sọc vẫn giữ sọc.
* **Chữ 9pt** dựng trực tiếp (không cần gói `extsizes`). Dấu nháy cong được khai báo cho xeCJK nên không bị lỗi dấu nháy. Lần biên dịch PDF đầu có thể chậm vì phải tải gói; chạy `pnpm warmup:latex` một lần để tải sẵn.

### Bổ sung khi so với mẫu EES ID850 và bài mẫu template tiếng Việt
- Tài liệu tham khảo kết thúc bằng "DOI: …" không còn bị nuốt; DOI bài báo chỉ lấy từ dòng "DOI:" ở phần đầu (không lấy DOI của một tài liệu tham khảo, nên mã QR không bao giờ trỏ nhầm bài).
- Trang tiếng Anh sau tài liệu tham khảo ("Research Article", tiêu đề, ABSTRACT, Keywords – kể cả lỗi gõ "Keywwords") được đọc thành titleEn/abstractEn/keywordsEn/nameEn.
- Công thức Word (OMML) có số "(n)" gõ bên cạnh được nhận là công thức hiển thị và giữ đúng số (`	ag{n}`); dòng "n là …" ngắn dưới "Trong đó:" được giữ.
- Bảng chứa lưới hình + ô chú thích "Hình N" là một hình (các ô a/b/c được ghép thành một ảnh trong trình duyệt); mã trường "SEQ Bảng" không lọt vào chú thích; ô gộp (tiêu đề nhiều tầng, "Dự báo" gộp 2 dòng) được giữ ở PDF và Word; bảng "Danh mục từ viết tắt" được liệt kê dưới đề mục.
- Trang hướng dẫn tác giả của template (style GuideHeading/GuideText/Instruction) bị bỏ qua; các mục cuối bài (Đóng góp của các tác giả, Xung đột lợi ích, Tính khả dụng của dữ liệu, …) là đề mục.
- PDF: tên tạp chí tiếng Anh in như mẫu của từng tạp chí, mã QR 42 pt có logo VNUHCM Press ở giữa (mức sửa lỗi H, vẫn quét được), huy hiệu "Check for updates" và logo đóng gói sẵn trong API (`apps/api/src/main/resources/latex-assets`), số trang bắt đầu từ trang đầu trong số, tiêu đề "TÀI LIỆU THAM KHẢO".
- Word (.docx): dàn trang như bản in (khổ giấy, lề, đầu/chân trang trang 1 và chẵn/lẻ, cột bên trái có QR/Liên hệ/Lịch sử/DOI/Check for updates, khung tóm tắt, thân 2 cột có ảnh, công thức Word, bảng ô gộp, trang tiếng Anh) và dùng tên style của template.
- Khi biên dịch/xuất: khung xem trước hiện "Đang biên dịch… Ns", thanh menu hiện "Đang xuất PDF…", mục xuất bị khoá cho tới khi xong.

## 10. Kiểm tra tự động

| Kiểm tra | Lệnh |
| --- | --- |
| Unit + component + tích hợp | `pnpm test` |
| XML xuất ra hợp lệ theo **DTD JATS 1.2 chính thức** | `python scripts/jats/fetch-dtd.py scripts/jats/dtd` (một lần) rồi `pnpm test` (cần python + lxml; không có thì bỏ qua) |
| End-to-end trình duyệt (nhập Word → cổng kiểm tra → tự động lưu → xuất Word/XML/PDF → mở lại), cần API chạy ở :8080 | `pnpm exec playwright test e2e/document-workflow.spec.ts --project=chrome` |

Chạy cả hệ thống thật: `docker compose -f docker-compose.minio.yml up -d`, API với `STRUCTPAPER_STORAGE_TYPE=minio` (xem docker-compose), rồi `pnpm dev:web`. (Image `minio/minio` chính thức đã bị gỡ khỏi Docker Hub nên compose dùng bản Bitnami cố định.)

## 11. Ứng dụng đóng gói (Windows / macOS)
Bản desktop (Tauri) dùng bản xuất tĩnh của web: tự động lưu và lưu trữ chạy cục bộ (IndexedDB), biên dịch PDF dùng tectonic đi kèm; nếu cấu hình `NEXT_PUBLIC_API_BASE_URL` trỏ tới máy chủ thì đồng bộ DB + MinIO, nếu không thì chỉ hiện "Đã lưu trên máy". `node apps/web/scripts/export-desktop.mjs` vẫn build thành công với các thay đổi này (khâu đóng gói Tauri/Rust chưa chạy trong môi trường này).
