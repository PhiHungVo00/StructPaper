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

Cùng bộ luật, nhưng **lỗi sẽ chặn xuất** (nút bị khóa); cảnh báo cho phép "Vẫn xuất". PDF còn yêu cầu biên dịch thành công. Quy tắc nằm ở `apps/web/src/lib/validation/` (`numbering.ts`, `validators.ts`).

## 5. Công thức toán học

* Khối **Công thức** (`+ Công thức`): nhập LaTeX, xem KaTeX trực tiếp, đánh số tự động `(n)`.
* Công thức inline `$…$` và dòng riêng `$$…$$` trong đoạn văn cũng được hiển thị.
* **Nhập Word:** công thức Word (OMML) được chuyển sang LaTeX bằng bộ chuyển theo cấu trúc (`lib/omml.ts`) và chèn lại đúng vị trí. Công thức *nằm giữa dòng chữ* chưa được khôi phục (chỉ công thức trên dòng riêng).
* **Xuất:** LaTeX/PDF dùng môi trường `equation`; **Word** xuất công thức Word gốc (chỉnh sửa được); **XML** xuất `<disp-formula>` / `<inline-formula>` với `<tex-math>`.

## 6. Bảng dài

* Bảng nhiều hàng (mặc định > 12 hàng) được dàn thành bảng **ngắt được qua cột/trang** (`supertabular`), **lặp lại hàng tiêu đề** ở mỗi cột/trang, không cắt ngang hàng.
* Bảng ngắn vẫn giữ nguyên khối. Word: hàng tiêu đề đặt "lặp lại ở đầu mỗi trang" và hàng không bị cắt.
* Giới hạn: bảng dài luôn chảy theo **một cột** (kể cả khi đặt "chiếm 2 cột").

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
