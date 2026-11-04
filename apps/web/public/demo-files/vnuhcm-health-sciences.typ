// =====================================================================
// STRUCTPAPER TYPST TEMPLATE: VNUHCM HEALTH SCIENCES (ID630)
// Chuẩn xuất bản Tạp chí Phát triển Khoa học & Công nghệ - Health Sciences
// Trích xuất 100% từ hồ sơ gốc LaTeX, DOCX, XML và PDF Nhà xuất bản ĐHQG-HCM
// =====================================================================

#let primary-color = rgb("#2B74B7")
#let united-nations-blue = rgb("#E7ECF7")
#let table-head-color = rgb("#E5E5E5")
#let text-dark = rgb("#1A1A1A")
#let border-color = rgb("#CBD5E1")

#let vnuhcm-journal(
  title: "Tổng quan về loét dạ dày tá tràng ở người cao tuổi và cập nhật trong điều trị",
  article-type: "Bài tổng quan",
  authors: ("Hà Vũ*", "Viên Vinh Phú"),
  affiliation: "Bộ môn Nội - Khoa Y – Trường Đại học Khoa học Sức khỏe - Đại học Quốc Gia Thành phố Hồ Chí Minh",
  correspondence-author: "Hà Vũ",
  correspondence-email: "hvu@uhsvnu.edu.vn",
  history: (
    received: "14-06-2025",
    revised: "10-02-2026",
    accepted: "14-04-2026",
    published: "07-05-2026"
  ),
  doi: "https://doi.org/10.32508/vnuhcmj-hs.v7i1.630",
  citation-text: "Vũ H, Phú V V. Tổng quan về loét dạ dày tá tràng ở người cao tuổi và cập nhật trong điều trị. Sci. Tech. Dev. J. - Health Sci. 2026; 7(2):804-816.",
  abstract-vn: [
    Bệnh loét dạ dày tá tràng hiện nay là một thách thức y tế lớn đối với người cao tuổi (từ 65 tuổi trở lên). Mặc dù tỷ lệ mắc bệnh chung có xu hướng giảm, nhưng tần suất biến chứng và tỷ lệ tử vong ở nhóm dân số già lại gia tăng rõ rệt, do sự suy giảm chức năng sinh lý dạ dày và tình trạng đa bệnh lý. Hai yếu tố gây bệnh hàng đầu là nhiễm vi khuẩn Helicobacter pylori (H.pylori) (chiếm khoảng 70% trường hợp) và việc sử dụng các thuốc gây tổn thương niêm mạc như thuốc kháng viêm non-steroide (NSAID) hoặc aspirin. Quá trình lão hóa gây ra những thay đổi sâu sắc như lão hóa miễn dịch, rối loạn vi tuần hoàn và tình trạng teo niêm mạc dẫn đến giảm tiết acid. Những thay đổi này làm suy yếu hàng rào bảo vệ tự nhiên, khiến niêm mạc dạ dày dễ bị tấn công bởi các yếu tố ăn mòn, gây ra các vết loét "vô căn" hoặc do thuốc. Ở người cao tuổi, các triệu chứng thường không điển hình và dễ bị che lấp bởi các bệnh lý đi kèm. Chỉ có khoảng 1/3 bệnh nhân xuất hiện cơn đau thượng vị điển hình; số còn lại thường biểu hiện mơ hồ như chán ăn, sụt cân hoặc thậm chí khởi phát bằng biến chứng nặng như xuất huyết, thủng dạ dày. Nội soi tiêu hóa trên kèm sinh thiết theo hệ thống Sydney cải tiến được coi là tiêu chuẩn vàng để xác định vị trí loét, loại trừ ung thư và đánh giá tình trạng nhiễm H. pylori.
  ],
  keywords-vn: (
    "Bệnh loét dạ dày tá tràng",
    "bệnh nhân cao tuổi",
    "Helicobacter pylori",
    "thuốc chống viêm không steroid",
    "thuốc ức chế bơm proton"
  ),
  body
) = {
  // Thiết lập trang vật lý theo thông số LaTeX geometry: 8.51in x 11in (216.15mm x 279.4mm)
  set page(
    width: 8.51in,
    height: 11in,
    margin: (
      top: 18mm,
      bottom: 20mm,
      left: 17mm,
      right: 13mm
    ),
    header: context {
      let p = counter(page).get().first()
      if p == 1 {
        // Header trang 1 (Bìa)
        grid(
          columns: (1fr, 1fr),
          align(left)[
            #text(size: 8pt, font: ("Myriad Pro", "PT Sans", "sans-serif"), weight: "bold", style: "italic")[
              Tạp chí Phát triển Khoa học và Công nghệ – Health Sciences 2026, 7(2):804-816
            ] \
            #box(height: 10pt, baseline: 2pt)[
              #image("/demo-assets/id630/open-access.png", height: 8pt)
            ]
            #text(size: 7.5pt, font: ("Myriad Pro", "PT Sans", "sans-serif"), weight: "bold", fill: luma(100))[
              Open Access Full Text Article
            ]
          ],
          align(right + top)[
            #text(size: 10.5pt, font: ("Minion Pro", "EB Garamond", "serif"), weight: "bold", style: "italic")[
              #underline(article-type)
            ]
          ]
        )
      } else {
        // Running Header từ trang 2 trở đi
        block(width: 100%, stroke: (bottom: 0.5pt + rgb("#CBD5E1")), inset: (bottom: 4pt))[
          #text(size: 8.5pt, font: ("Myriad Pro", "PT Sans", "sans-serif"), weight: "bold", style: "italic", fill: rgb("#334155"))[
            Tạp chí Phát triển Khoa học và Công nghệ – Health Sciences 2026, 7(2):804-816
          ]
        ]
      }
    },
    footer: context {
      let p = counter(page).get().first()
      if p == 1 {
        // Trang 1 có dải trích dẫn ở cuối
        none
      } else if calc.even(p) {
        // Trang chẵn: Số trang nằm ở góc dưới bên trái
        align(left)[
          #text(size: 9pt, font: ("Myriad Pro", "PT Sans", "sans-serif"), weight: "bold", fill: primary-color)[#p]
        ]
      } else {
        // Trang lẻ: Số trang nằm ở góc dưới bên phải
        align(right)[
          #text(size: 9pt, font: ("Myriad Pro", "PT Sans", "sans-serif"), weight: "bold", fill: primary-color)[#p]
        ]
      }
    }
  )

  // Typography cơ sở: Minion Pro 8.5pt, leading 0.58em, căn đều 2 bên, thụt đầu dòng 0pt (chuẩn \setlength{\parindent}{0pt})
  set text(
    font: ("Minion Pro", "EB Garamond", "Source Serif 4", "Times New Roman"),
    size: 8.5pt,
    fill: text-dark,
    lang: "vi"
  )
  set par(
    justify: true,
    leading: 0.58em,
    first-line-indent: 0pt
  )

  // Định dạng tiêu đề các cấp chuẩn 100% LaTeX XeTeX
  // Cấp 1 (\section*): Sans-serif, In hoa, Đậm, 11pt, Màu xanh chủ đạo (titlecolor)
  show heading.where(level: 1): it => block(
    above: 1.2em,
    below: 0.5em,
    sticky: true
  )[
    #set text(
      font: ("Myriad Pro", "PT Sans", "Source Sans 3", "sans-serif"),
      size: 11pt,
      weight: "bold",
      fill: primary-color
    )
    #upper(it.body)
  ]

  // Cấp 2 (\textbf{...}): Serif, Đậm, Màu đen chữ chính #1A1A1A, Cỡ chữ 8.5pt bằng thân bài
  show heading.where(level: 2): it => block(
    above: 0.9em,
    below: 0.35em,
    sticky: true
  )[
    #set text(
      font: ("Minion Pro", "EB Garamond", "Source Serif 4", "Times New Roman"),
      size: 8.5pt,
      weight: "bold",
      fill: text-dark
    )
    #it.body
  ]

  // Trích dẫn khoa học có màu xanh theo LaTeX hyperref citecolor=titlecolor
  show cite: set text(fill: primary-color)
  show ref: set text(fill: primary-color)
  show link: set text(fill: primary-color)

  // Figure styling: Khung nền United Nations Blue (#E7ECF7)
  show figure: it => block(
    width: 100%,
    fill: united-nations-blue,
    inset: 7pt,
    radius: 0pt,
    stroke: 0.5pt + border-color,
    spacing: 10pt
  )[
    #align(center)[#it.body]
    #v(4pt)
    #align(left)[
      #text(font: ("Myriad Pro", "PT Sans", "sans-serif"), size: 8.2pt, weight: "bold", fill: primary-color)[
        #it.caption
      ]
    ]
  ]

  // Table styling: Viền đen 1.5pt trên dưới, tiêu đề #E5E5E5
  show table: set table(
    stroke: (x, y) => if y == 0 { (bottom: 1pt + black, top: 1.5pt + black) } else { (bottom: 0.5pt + rgb("#CBD5E1")) },
    fill: (col, row) => if row == 0 { table-head-color } else if calc.odd(row) { rgb("#F8FAFC") } else { none }
  )

  // --- TRANG 1: FRONTMATTER & BỐ CỤC CHUẨN NXB ---
  {
    // Tiêu đề bài báo
    v(0.3cm)
    text(
      font: ("Myriad Pro", "PT Sans", "sans-serif"),
      size: 17.5pt,
      weight: "bold",
      fill: primary-color,
      spacing: 120%
    )[#title]
    v(0.2cm)

    // Tác giả
    text(
      font: ("Myriad Pro", "PT Sans", "sans-serif"),
      size: 11pt,
      weight: "bold",
      fill: primary-color
    )[#authors.join(", ")]
    v(0.4cm)

    // Hàng giữa: Mã QR bên trái (25%) & Khung Tóm tắt bên phải (75%)
    grid(
      columns: (25%, 72%),
      gutter: 3%,
      // Cột QR Code
      align(center + top)[
        #rect(width: 84pt, height: 84pt, stroke: 0.5pt + rgb("#E2E8F0"), fill: white, inset: 4pt)[
          #image("/demo-assets/id630/qr-code.png", fit: "contain")
        ]
        #v(4pt)
        #text(size: 7pt, font: ("Myriad Pro", "PT Sans", "sans-serif"), fill: rgb("#64748B"))[
          Use your smartphone to scan this QR code and download this article
        ]
      ],
      // Khung Tóm tắt (Abstract)
      rect(
        width: 100%,
        fill: united-nations-blue,
        stroke: 0.5pt + border-color,
        inset: 9pt,
        radius: 1pt
      )[
        #text(
          font: ("Myriad Pro", "PT Sans", "sans-serif"),
          size: 9pt,
          weight: "bold",
          fill: primary-color
        )[TÓM TẮT]
        #v(3pt)
        #set par(justify: true, leading: 0.52em, first-line-indent: 0pt)
        #text(size: 8.5pt)[#abstract-vn]
        #v(6pt)
        #text(font: ("Myriad Pro", "PT Sans", "sans-serif"), size: 8pt)[
          #strong[Từ khoá:] #keywords-vn.join(", ").
        ]
      ]
    )
    v(0.4cm)

    // Nửa dưới Trang 1: Sidebar trái (28%) & Thân bài 2 cột (72%)
    grid(
      columns: (28%, 69%),
      gutter: 3%,
      // Sidebar trái
      block(stroke: (top: 0.5pt + rgb("#CBD5E1")), inset: (top: 6pt))[
        #set text(font: ("Myriad Pro", "PT Sans", "sans-serif"), size: 7.5pt)
        #text(font: ("Minion Pro", "serif"), style: "italic", fill: rgb("#334155"))[#affiliation]
        #v(6pt)
        #text(weight: "bold", fill: primary-color)[Liên hệ] \
        #strong[#correspondence-author], #affiliation \
        Email: #link("mailto:" + correspondence-email)[#correspondence-email]
        #v(6pt)
        #text(weight: "bold", fill: primary-color)[Lịch sử] \
        #text(fill: primary-color)[•] Ngày nhận: #history.received \
        #text(fill: primary-color)[•] Ngày sửa đổi: #history.revised \
        #text(fill: primary-color)[•] Ngày chấp nhận: #history.accepted \
        #text(fill: primary-color)[•] Ngày đăng: #history.published
        #v(6pt)
        #text(weight: "bold", fill: primary-color)[DOI: ]
        #link(doi)[#text(size: 7pt, weight: "bold")[#doi]]
        #v(4pt)
        #image("/demo-assets/id630/check-update.jpeg", width: 100pt)
        #v(4pt)
        #text(weight: "bold", fill: primary-color)[Bản quyền] \
        #text(size: 6.8pt, fill: rgb("#475569"))[
          © ĐHQG Tp.HCM. Đây là bài báo công bố mở được phát hành theo các điều khoản của Creative Commons Attribution 4.0 International license.
        ]
        #v(6pt)
        #align(center)[#image("/demo-assets/id630/logo-vnuhcmpress-color.png", width: 90pt)]
      ],
      // Thân bài 2 cột Trang 1 + Trích dẫn cuối trang
      [
        #columns(2, gutter: 11pt)[
          #heading(level: 1)[GIỚI THIỆU VỀ BỆNH LOÉT DẠ DÀY TÁ TRÀNG:]
          Loét dạ dày tá tràng là tình trạng tổn thương niêm mạc dạ dày hoặc tá tràng. Theo vị trí giải phẫu, loét dạ dày được chia thành loét dạ dày ở phình vị, thân hoặc hang vị, loét tiền môn vị và môn vị.

          Ở người cao tuổi, loét dạ dày tá tràng không chỉ đơn thuần là sự xuất hiện tổn thương niêm mạc mà là một thực thể lâm sàng riêng biệt, gắn liền với sự suy giảm sinh lý dạ dày, đa bệnh lý và sử dụng nhiều loại thuốc.

          #heading(level: 1)[DỊCH TỄ HỌC:]
          Dịch tễ học của loét dạ dày tá tràng ở bệnh nhân lớn tuổi cho thấy một bức tranh phức tạp. Tỷ lệ mắc toàn cầu dao động từ 0,1% đến 4,7%, với tỷ lệ mắc mới khoảng 0,19–0,3%.

          Mặc dù tỷ lệ chung có xu hướng giảm, tần suất biến chứng và tỷ lệ tử vong lại tăng rõ rệt theo tuổi, đặc biệt ở người từ 65 tuổi trở lên.
        ]

        #v(1fr)
        // Dải trích dẫn chân trang 1
        #rect(
          width: 100%,
          fill: united-nations-blue,
          stroke: 0.5pt + border-color,
          inset: (x: 8pt, y: 4pt),
          radius: 1pt
        )[
          #grid(
            columns: (1fr, auto),
            text(size: 7.5pt, font: ("Myriad Pro", "PT Sans", "sans-serif"))[
              #strong[Trích dẫn bài báo này: ] #citation-text
            ],
            text(size: 9.5pt, font: ("Myriad Pro", "PT Sans", "sans-serif"), weight: "bold", fill: primary-color)[1]
          )
        ]
      ]
    )
  }

  pagebreak()

  // --- CÁC TRANG TIẾP THEO (TRANG 2 - 13): BỐ CỤC 2 CỘT LIÊN TỤC ---
  columns(2, gutter: 12pt)[
    #body
  ]
}
