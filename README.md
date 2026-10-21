# 🏛️ StructPaper - Hệ Thống Trích Xuất, Dàn Trang & Xuất Bản Báo Cáo Khoa Học VNUHCM

> Hệ thống chế bản học thuật tích hợp toàn diện theo quy chuẩn các tạp chí thuộc **Đại học Quốc gia TP.HCM (VNUHCM)** (Khoa học Sức khỏe, Khoa học Tự nhiên, Kỹ thuật & Công nghệ...).  
> Hỗ trợ trích xuất tự động văn bản từ tài liệu DOCX, biên tập bảng biểu khoa học chuẩn Booktabs, thiết kế mẫu dàn trang đa năng (Universal Template Engine), và biên dịch mã nguồn LaTeX / Typst sang ấn phẩm PDF vector chất lượng cao.

---

## 📑 Mục Lục
1. [Tổng Quan Kiến Trúc Dự Án](#-tổng-quan-kiến-trúc-dự-án)
2. [Cấu Trúc Thư Mục](#-cấu-trúc-thư-mục)
3. [Yêu Cầu Hệ Thống & Môi Trường](#-yêu-cầu-hệ-thống--môi-trường)
4. [Hướng Dẫn Cài Đặt & Khởi Chạy Chi Tiết](#-hướng-dẫn-cài-đặt--khởi-chạy-chi-tiết)
   - [Khởi chạy Backend (Spring Boot)](#1-khởi-chạy-backend-struct-paper-backend)
   - [Khởi chạy Frontend (Next.js)](#2-khởi-chạy-frontend-struct-paper-app)
   - [Khởi chạy Đồng thời cả FE và BE (One-Click Script)](#3-khởi-chạy-đồng-thời-bằng-powershell-script)
5. [Các Tính Năng Trọng Tâm](#-các-tính-năng-trọng-tâm)
6. [Danh Sách Đường Dẫn & API Endpoints](#-danh-sách-đường-dẫn--api-endpoints)
7. [Xử Lý Sự Cố Thường Gặp (Troubleshooting)](#-xử-lý-sự-cố-thường-gặp-troubleshooting)

---

## 🏗️ Tổng Quan Kiến Trúc Dự Án

Hệ thống được thiết kế theo mô hình kiến trúc phân tách hiện đại:
- **Frontend (`struct-paper-app`)**: Xây dựng trên nền tảng **Next.js 14 (App Router)**, **React 18**, **Tailwind CSS**, tích hợp trình biên dịch Typst, FortuneSheet Excel matrix, và bản vẽ tương tác Live A4 Preview với phong cách màu **Lime chủ đạo (`#78C841`)**.
- **Backend (`struct-paper-backend`)**: Xây dựng trên nền tảng **Java 21 LTS** và **Spring Boot 3.3.4**, chịu trách nhiệm xử lý biên dịch mã nguồn TeX sang PDF thông qua cơ chế động cơ kép (**XeLaTeX** và **Tectonic**), tự động ánh xạ font học thuật thông minh (**Smart Font Fallback**), cung cấp RESTful API và tài liệu Swagger UI.

---

## 📂 Cấu Trúc Thư Mục

```text
StructPaper/
├── README.md                                  # Tài liệu hướng dẫn chung toàn dự án
├── BAO_CAO_CONG_VIEC_HOAN_THANH.md           # Báo cáo các hạng mục công việc đã thực hiện
├── bin/                                       # Chứa động cơ TeX độc lập (tectonic.exe)
│   └── tectonic.exe
├── File demo/                                 # Các file bài báo mẫu (.docx, .pdf, .tex) của ĐHQG-HCM
│   ├── HS630/                                 # Bài báo mẫu tạp chí Khoa học Sức khỏe ID630
│   └── HS722/                                 # Bài báo mẫu ID722
├── Yêu cầu phần mềm, Template.../            # Quy định, thể thức xuất bản của Tạp chí ĐHQG-HCM
├── struct-paper-backend/                      # [BACKEND] Mã nguồn Java Spring Boot 3.3.4
│   ├── build.gradle                           # Cấu hình build Gradle & dependencies
│   ├── src/main/java/vn/edu/vnu/              # Controller, Service, Engine, Config
│   ├── src/main/resources/                    # application.properties, banner, mẫu .tex
│   └── README.md                              # Tài liệu kỹ thuật chi tiết của Backend
└── struct-paper-app/                          # [FRONTEND] Mã nguồn Next.js 14 App
    ├── package.json                           # Scripts & dependencies
    ├── src/app/                               # Các route: /, /editor, /templates/builder
    ├── src/components/template-builder/       # Bộ công cụ Universal Template Studio
    ├── src/components/editor/                 # Trình soạn thảo văn bản & TableSpreadsheetModal
    └── src/lib/template-engine/               # Finite Attribute Model (SciSpace standard)
```

---

## ⚙️ Yêu Cầu Hệ Thống & Môi Trường

Trước khi khởi chạy, máy tính của bạn cần cài đặt sẵn:
1. **Node.js**: Phiên bản `v18.x` hoặc `v20.x LTS` trở lên ([Tải tại đây](https://nodejs.org/)). Kiểm tra bằng:
   ```bash
   node -v
   npm -v
   ```
2. **Java JDK**: Phiên bản `JDK 21 LTS` (Eclipse Temurin 21 hoặc Oracle JDK 21) ([Tải tại đây](https://adoptium.net/temurin/releases/?version=21)). Kiểm tra bằng:
   ```bash
   java -version
   javac -version
   ```
3. **Gradle**: Đã kèm sẵn hoặc có thể dùng Gradle hệ thống (`gradle -v`).
4. **TeX Engine**:
   - Dự án đã tích hợp sẵn `tectonic.exe` trong thư mục `bin/` chạy độc lập, tự động nạp gói macro mà không bắt buộc cài đặt MiKTeX hay TeX Live.
   - (Tùy chọn) Cài đặt **MiKTeX** hoặc **TeX Live** nếu muốn sử dụng trực tiếp lệnh `xelatex`.

---

## 🚀 Hướng Dẫn Cài Đặt & Khởi Chạy Chi Tiết

### 1. Khởi chạy Backend (`struct-paper-backend`)

Backend chạy trên cổng mặc định **`8080`**.

#### Bước 1.1: Di chuyển vào thư mục backend
Mở cửa sổ Terminal hoặc PowerShell:
```bash
cd struct-paper-backend
```

#### Bước 1.2: Chạy ở chế độ Development
- **Trên Windows (PowerShell/CMD):**
  ```powershell
  gradle bootRun
  ```
  *(Nếu máy bạn chưa cấu hình Gradle biến môi trường, có thể dùng `gradlew bootRun`)*
- **Trên Linux/macOS:**
  ```bash
  ./gradlew bootRun
  ```

Khi màn hình xuất hiện thông báo:
```text
Started StructPaperBackendApplication in X.XXX seconds
```
Backend đã khởi chạy thành công tại `http://localhost:8080`.

#### Bước 1.3: Kiểm tra hoạt động của Backend
- Truy cập Swagger UI kiểm thử API trực quan: [http://localhost:8080/swagger-ui.html](http://localhost:8080/swagger-ui.html)
- Kiểm tra tình trạng động cơ TeX & RAM: [http://localhost:8080/api/v1/system/status](http://localhost:8080/api/v1/system/status)

#### Bước 1.4: Đóng gói và chạy Production Build (Tùy chọn)
```bash
gradle bootJar
java -Xmx384m -jar build/libs/struct-paper-backend-1.0.0-SNAPSHOT.jar
```

---

### 2. Khởi chạy Frontend (`struct-paper-app`)

Frontend chạy trên cổng mặc định **`3000`**.

#### Bước 2.1: Mở cửa sổ Terminal/PowerShell thứ hai
```bash
cd struct-paper-app
```

#### Bước 2.2: Cài đặt các gói phụ thuộc (Dependencies)
```bash
npm install
```

#### Bước 2.3: Khởi chạy ở chế độ Development Server
```bash
npm run dev
```

Khi màn hình xuất hiện thông báo:
```text
▲ Next.js 14.2.15
- Local:        http://localhost:3000
- Environments: .env
✓ Ready in 1.8s
```
Mở trình duyệt truy cập: **[http://localhost:3000](http://localhost:3000)**.

#### Bước 2.4: Đóng gói kiểm tra Production (Tùy chọn)
```bash
npm run build
npm run start
```

---

### 3. Khởi chạy Đồng thời bằng PowerShell Script

Để khởi chạy nhanh toàn bộ hệ thống bằng một câu lệnh duy nhất từ thư mục gốc `StructPaper`, bạn có thể tạo và chạy script sau trong PowerShell:

```powershell
# Chạy Backend ở tab terminal mới
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd struct-paper-backend; gradle bootRun"

# Chạy Frontend ở tab terminal hiện tại
cd struct-paper-app
npm run dev
```

---

## 🌟 Các Tính Năng Trọng Tâm

### 1. Universal Template Builder Studio (Dàn Trang Đa Năng 6 Bước)
Truy cập tại: `http://localhost:3000/templates/builder?preset=vnuhcm_health_sciences_id630`
- **Bước 1: Cấu trúc & Kích thước Trang (Page Architecture)**: Khổ giấy A4 / VNUHCM (8.51" x 11"), hướng ngang/dọc, tùy biến lề 4 phía, đầu trang (Running Header), chân trang & đánh số trang đối xứng.
- **Bước 2: Bố cục Lưới & Phân vùng (Grid Zones & Multi-Page Studio)**:
  - Chia trang thành lưới tọa độ trực quan (Columns × Rows).
  - Quét chuột tạo phân vùng trực tiếp trên giấy.
  - Phân vùng con đa cấp lồng nhau (Nested Sub-Zones / Sub-Grid Matrix).
  - Chuỗi dòng chảy 2 khối biệt lập (Secondary Overflow Chain: 1A ➔ 1B).
  - Thêm / bớt các trang (Trang 1, Trang 2, Trang 3...) linh hoạt trên cùng một bản vẽ.
- **Bước 3: Cấu trúc Thành phần (Dynamic Semantic Elements Tree)**:
  - Đánh số thứ tự nhận diện phân vùng (`1`, `2`, `3`...).
  - Hiển thị cây phân cấp các vùng con (`2.1`, `2.2`...) với nút thu gọn / mở rộng linh hoạt.
  - Mục **Khối Chưa Gán Phân Vùng**: Cho phép kéo thả trực tiếp phần tử bất kỳ từ cột trái vào phân vùng tương ứng trên bản vẽ bên phải.
- **Bước 4: Định dạng Sâu & Thuộc tính Typst (Finite Attribute Model)**:
  - Tách bạch cấu trúc văn bản với thuộc tính hiển thị (SciSpace Standard).
  - Tinh chỉnh chuẩn học thuật: Phông chữ, cỡ chữ (pt), độ đậm, khoảng cách đoạn (pt), thụt dòng (mm), căn lề, viền & màu nền.
  - Đồng bộ theme màu **Lime (`#78C841`)**.
- **Bước 5: Thành phần Nổi & Đặc biệt (Special Floating Elements)**:
  - Tùy biến quy chuẩn đồ họa vector, hình ảnh (Figures), công thức toán học MathML/LaTeX (Equations), hộp điểm nhấn (Highlights / Callouts).
- **Bước 6: Xuất bản & Biên dịch Đa Định Dạng**:
  - Xuất mã nguồn Typst (.typ), LaTeX (.tex) và JSON Universal Schema.
  - Tải file PDF biên dịch chất lượng cao.

### 2. Tương Tác Trực Tiếp Trên Bản Vẽ Giấy (Live A4 Preview Studio)
- **Sửa chữ trực tiếp (Inline Editing)**: Kích đúp vào bất kỳ khối thành phần nào trên bản vẽ (khi tắt lưới) để gõ sửa nội dung trực tiếp trên trang giấy; bấm Enter hoặc click ra ngoài để lưu tức thì.
- **Bảng công cụ định dạng nhanh kiểu Word / Excel (Right-Click Context Menu)**:
  - Nhấp chuột phải vào một khối thành phần bất kỳ trên trang giấy để mở popup định dạng nhanh (Toolbar phong cách Word/Excel, thiết kế đồng bộ với bảng tính Excel phóng to).
  - Cho phép đổi phông chữ, tăng/giảm cỡ chữ trực tiếp, bật/tắt in đậm (B), in nghiêng (I), gạch chân (U), đổi màu chữ qua bảng màu swatch, căn lề (trái/giữa/phải/căn đều), chỉnh lề trên/dưới, viền hộp và chuyển đổi 1 cột / tràn toàn trang (Span All).
- **Nút Bật / Tắt Lưới Phân Vùng**: Thiết kế màu Lime (`#78C841`) nổi bật, chuyển đổi tức thì giữa chế độ xem dàn trang thực tế và chế độ lưới kỹ thuật.
- **Chế độ So Sánh Song Song với PDF Gốc (PDF Comparison Mode)**: So khớp trực tiếp pixel bản dựng với PDF xuất bản chính thức của Tạp chí ĐHQG-HCM.

### 3. Trình Trích Xuất Văn Bản & Bảng Biểu (Document Editor)
Truy cập tại: `http://localhost:3000/editor`
- Tải lên tài liệu `.docx` của tác giả, hệ thống tự động phân tích OpenXML để trích xuất cấu trúc bài báo.
- **TableSpreadsheetModal**: Trình biên tập bảng biểu phóng to toàn màn hình tích hợp FortuneSheet, nhấp chuột phải để chèn/xóa hàng, cột, gộp/hủy gộp ô, và xuất bảng sang mã chuẩn LaTeX Booktabs (`\toprule`, `\midrule`, `\bottomrule`).

---

## 📡 Danh Sách Đường Dẫn & API Endpoints

### Frontend Routes
| Đường dẫn | Chức năng |
|-----------|-----------|
| `http://localhost:3000/` | Trang chủ giới thiệu & Thư viện mẫu tạp chí ĐHQG-HCM |
| `http://localhost:3000/editor` | Trình biên tập văn bản, trích xuất DOCX & bảng tính khoa học |
| `http://localhost:3000/templates/builder` | Trình thiết kế mẫu báo cáo Universal Template Builder Studio |

### Backend RESTful APIs (`http://localhost:8080`)
| Phương thức | Đường dẫn | Mô tả chức năng |
|-------------|-----------|-----------------|
| `POST` | `/api/v1/compile/latex` | Nhận JSON `{ texContent, jobName, autoFontFallback }`, trả về luồng PDF nhị phân |
| `POST` | `/api/v1/compile/latex/json` | Biên dịch và trả về JSON chứa PDF Base64 cùng thời gian thực thi và chi tiết log |
| `POST` | `/api/v1/compile/upload` | Tải trực tiếp file `.tex` (Multipart) để biên dịch sang PDF |
| `GET` | `/api/v1/system/status` | Kiểm tra trạng thái hoạt động của XeLaTeX, Tectonic, RAM và OS |
| `GET` | `/api/v1/system/health` | Healthcheck kiểm tra độ sẵn sàng của máy chủ |
| `GET` | `/api/v1/templates` | Lấy danh mục các preset tạp chí ĐHQG-HCM có sẵn |
| `GET` | `/swagger-ui.html` | Giao diện kiểm thử API tương tác trực quan qua trình duyệt |
| `GET` | `/v3/api-docs` | Đặc tả OpenAPI 3.0 định dạng JSON |

---

## 🛠️ Xử Lý Sự Cố Thường Gặp (Troubleshooting)

### 1. Trùng cổng (Port 8080 hoặc 3000 đang bận)
- **Nếu cổng 8080 bị chiếm dụng (Backend):**
  - Mở file `struct-paper-backend/src/main/resources/application.properties`.
  - Đổi sang cổng khác: `server.port=8081`.
- **Nếu cổng 3000 bị chiếm dụng (Frontend):**
  - Next.js sẽ tự động hỏi chuyển sang cổng `3001`, bạn chỉ cần nhấn `Y`. Hoặc chạy lệnh: `npm run dev -- -p 3001`.

### 2. Lỗi `JAVA_HOME is not set` hoặc sai phiên bản Java
- Kiểm tra phiên bản Java hiện tại: `java -version`. Dự án yêu cầu tối thiểu Java 21 LTS.
- Đặt biến môi trường `JAVA_HOME` trỏ tới thư mục cài đặt JDK 21 (Ví dụ trên Windows: `C:\Program Files\Eclipse Adoptium\jdk-21.x.x-hotspot`).

### 3. Về việc biên dịch Font chữ thương mại (Minion Pro, Myriad Pro)
- Các bài báo mẫu VNUHCM thường sử dụng bộ font thương mại Adobe (`Minion Pro`, `Myriad Pro`).
- Backend StructPaper đã được tích hợp sẵn cơ chế **Smart Font Fallback**: Nếu máy chủ hoặc máy phát triển chưa cài đặt các font bản quyền trên, hệ thống sẽ tự động ánh xạ thay thế bằng font học thuật tương thích (`Times New Roman`, `Arial`) mà không gây lỗi dừng tiến trình biên dịch.

---

## 👥 Nhóm Phát Triển & Bản Quyền
- **Dự án**: StructPaper (Hệ thống Trích xuất & Dàn trang Báo cáo Khoa học VNUHCM).
- **Bản quyền**: © 2026 StructPaper Team. Giấy phép mã nguồn mở theo các điều khoản tiêu chuẩn của Đại học Quốc gia TP.HCM.
