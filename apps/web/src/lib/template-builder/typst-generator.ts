import { DocumentTemplateSchema } from '@/types/template-builder';

/**
 * Generates an idiomatic, production-ready Typst document template (.typ)
 * based on the element-driven DocumentTemplateSchema.
 */
export function generateTypstTemplate(schema: DocumentTemplateSchema): string {
  const { pageSetup, title, authors, abstract, keywords, heading1, heading2, heading3, body, floats, references, primaryColor, secondaryColor } = schema;

  // Margin string for Typst
  const marginsStr = `(top: ${pageSetup.margins.top}mm, bottom: ${pageSetup.margins.bottom}mm, left: ${pageSetup.margins.left}mm, right: ${pageSetup.margins.right}mm)`;

  // Page header / footer setup
  const headerCode = pageSetup.showRunningHeader
    ? `  header: locate(loc => {
    if loc.page() > 1 [
      #set text(size: 8pt, fill: rgb("#64748B"), font: "${body.fontFamily}")
      #grid(
        columns: (1fr, 1fr),
        align(left)[#smallcaps("${pageSetup.journalName}")],
        align(right)[#loc.page()]
      )
      #line(length: 100%, stroke: 0.4pt + rgb("#CBD5E1"))
    ]
  }),`
    : '';

  const footerCode = pageSetup.showPageNumbers
    ? `  footer: locate(loc => {
    if loc.page() == 1 [
      #align(${pageSetup.pageNumberPosition === 'bottom-center' ? 'center' : 'right'})[
        #set text(size: 8.5pt, fill: rgb("#64748B"))
        #loc.page()
      ]
    ]
  }),`
    : '';

  // Heading numbering logic
  let h1Numbering = 'none';
  if (heading1.numbering === 'ROMAN') h1Numbering = '"I."';
  else if (heading1.numbering === 'ARABIC') h1Numbering = '"1."';
  else if (heading1.numbering === 'LETTER') h1Numbering = '"A."';

  // Heading accent bar style
  const h1Accent = heading1.accentBar
    ? `  #box(width: 4pt, height: 1.1em, fill: rgb("${heading1.accentColor}"), baseline: 15%) #h(4pt)`
    : '';

  // Abstract styling block
  const isSplitLayout = pageSetup.firstPageLayout === 'sidebar-split';

  return `// =====================================================================
// STRUCTPAPER TYPST TEMPLATE
// Template: ${schema.name} (v${schema.version})
// Author: ${schema.author}
// Generated: ${schema.updatedAt}
// =====================================================================

#let primary-color = rgb("${primaryColor}")
#let secondary-color = rgb("${secondaryColor || primaryColor}")

// --- Page & Document Setup ---
#set page(
  paper: "${pageSetup.size.toLowerCase()}",
  margin: ${marginsStr},
${headerCode}
${footerCode}
)

#set text(
  font: ("${body.fontFamily}", "Times New Roman", "DejaVu Sans"),
  size: ${body.fontSize}pt,
  lang: "vi"
)

#set par(
  justify: ${body.align === 'justify' ? 'true' : 'false'},
  leading: ${(body.lineHeight - 1).toFixed(2)}em,
  first-line-indent: ${body.firstLineIndent}mm
)

// --- Headings Configuration ---
#show heading.where(level: 1): it => block(above: ${heading1.spaceBefore}pt, below: ${heading1.spaceAfter}pt)[
  #set text(
    font: "${heading1.fontFamily}",
    size: ${heading1.fontSize}pt,
    weight: "${heading1.fontWeight}",
    fill: rgb("${heading1.accentColor}")
  )
${h1Accent}#counter(heading).display(${h1Numbering}) #h(4pt) ${
    heading1.textTransform === 'uppercase' ? '#upper(it.body)' : '#it.body'
  }
]

#show heading.where(level: 2): it => block(above: ${heading2.spaceBefore}pt, below: ${heading2.spaceAfter}pt)[
  #set text(
    font: "${heading2.fontFamily}",
    size: ${heading2.fontSize}pt,
    weight: "${heading2.fontWeight}",
    fill: rgb("#1E293B")
  )
  #counter(heading).display("1.1.") #h(4pt) #it.body
]

#show heading.where(level: 3): it => block(above: ${heading3.spaceBefore}pt, below: ${heading3.spaceAfter}pt)[
  #set text(
    font: "${heading3.fontFamily}",
    size: ${heading3.fontSize}pt,
    weight: "${heading3.fontWeight}",
    fill: rgb("#334155")
  )
  #it.body
]

// --- Tables & Figures Captioning ---
#show figure.caption: it => [
  #set text(size: ${floats.captionFontSize}pt, weight: "${floats.captionWeight}")
  #strong("${floats.captionPrefix} ") #it.counter.display(): #it.body
]

// --- Article Header & Metadata ---
${pageSetup.articleType ? `
#text(size: 8.5pt, weight: "bold", fill: rgb("${pageSetup.articleTypeColor || primaryColor}"))[
  #upper("${pageSetup.articleType}")
]
#v(4pt)
` : ''}
#align(${title.align})[
  #block(width: 100%, spacing: 0pt)[
    #text(
      font: "${title.fontFamily}",
      size: ${title.fontSize}pt,
      weight: "${title.fontWeight}",
      fill: rgb("${title.color}")
    )[
      Nghiên cứu ứng dụng bóc tách cấu trúc OpenXML và tự động dàn trang báo cáo khoa học chuẩn VNUHCM
    ]
    ${title.supportBilingual ? `
    #v(4pt)
    #text(size: ${title.enTitleFontSize}pt, style: "italic", fill: rgb("#475569"))[
      Automated Academic Typesetting and OpenXML Structural Extraction for VNUHCM Scientific Journals
    ]
    ` : ''}
  ]
]

#v(${title.spaceAfter}pt)

// --- Authors & Affiliations Block ---
#align(${authors.align})[
  #text(size: ${authors.fontSize}pt, weight: "${authors.fontWeight}")[
    Nguyễn Hoàng Nam#super[1*], Trần Minh Tuấn#super[2], Lê Thu Hương#super[1]
  ] \\
  #v(2pt)
  #text(size: 8pt, fill: rgb("#64748B"))[
    #super[1] Khoa Khoa học & Kỹ thuật Máy tính, Trường Đại học Bách khoa, ĐHQG TP.HCM \\
    #super[2] Viện Khoa học Dữ liệu & Trí tuệ Nhân tạo, ĐHQG TP.HCM \\
    #super[*] Tác giả liên hệ: nam.nh@vnuhcm.edu.vn
  ]
]

#v(${authors.spaceAfter}pt)

// --- First-Page Abstract Layout (${isSplitLayout ? 'Sidebar Split 28/72' : 'Full Width Span'}) ---
${isSplitLayout ? `
#grid(
  columns: (28%, 72%),
  gutter: 14pt,
  [
    // Left History / Journal Info Sidebar
    #rect(width: 100%, stroke: (right: 0.5pt + rgb("#CBD5E1")), inset: (right: 8pt))[
      #set text(size: 7.5pt, fill: rgb("#475569"))
      #strong[Thông tin bài nộp] \\
      #text(fill: rgb("#64748B"))[Ngày nhận: 12/08/2026] \\
      #text(fill: rgb("#64748B"))[Ngày chấp nhận: 28/09/2026] \\
      #text(fill: rgb("#64748B"))[Xuất bản trực tuyến: 15/10/2026] \\
      #v(6pt)
      #strong[DOI:] 10.32508/stdj.v28i2.630 \\
      #v(6pt)
      #strong[Bản quyền:] © 2026 ĐHQG TP.HCM. Phát hành theo giấy phép Creative Commons CC-BY 4.0.
    ]
  ],
  [
    // Right Abstract Panel
    #rect(
      width: 100%,
      fill: rgb("${abstract.backgroundColor === 'transparent' ? '#FFFFFF' : abstract.backgroundColor}"),
      stroke: ${abstract.borderStyle === 'left-solid' ? `(left: 3pt + rgb("${abstract.borderColor}"), rest: none)` : abstract.borderStyle === 'all-borders' ? `1pt + rgb("${abstract.borderColor}")` : 'none'},
      inset: ${abstract.padding}mm,
      radius: 4pt
    )[
      #text(weight: "${abstract.labelWeight}", size: ${abstract.fontSize}pt, fill: primary-color)[${abstract.label}] \\
      #text(style: "${abstract.fontStyle}", size: ${abstract.fontSize}pt)[
        Bài báo này đề xuất giải pháp bóc tách cấu trúc tài liệu DOCX bán cấu trúc và tự động chuyển đổi sang khuôn mẫu xuất bản khoa học 2 cột. Hệ thống kết hợp phân tích cú pháp OpenXML nội bộ với mô hình ngôn ngữ lớn để bảo toàn hoàn chỉnh ảnh đồ họa vector, công thức toán học MathML và mạng lưới trích dẫn tài liệu tham khảo theo quy chuẩn VNUHCM.
      ]
      #v(6pt)
      #text(weight: "${keywords.labelBold ? 'bold' : 'normal'}", size: ${keywords.fontSize}pt)[${keywords.label}]
      #text(size: ${keywords.fontSize}pt)[OpenXML, LaTeX XeTeX, Dàn trang tự động, Bài báo khoa học, ĐHQG TP.HCM]
    ]
  ]
)
` : `
#rect(
  width: 100%,
  fill: rgb("${abstract.backgroundColor === 'transparent' ? '#FFFFFF' : abstract.backgroundColor}"),
  stroke: ${abstract.borderStyle === 'left-solid' ? `(left: 3pt + rgb("${abstract.borderColor}"), rest: none)` : abstract.borderStyle === 'all-borders' ? `1pt + rgb("${abstract.borderColor}")` : 'none'},
  inset: ${abstract.padding}mm,
  radius: 4pt
)[
  #text(weight: "${abstract.labelWeight}", size: ${abstract.fontSize}pt, fill: primary-color)[${abstract.label}: ]
  #text(style: "${abstract.fontStyle}", size: ${abstract.fontSize}pt)[
    Bài báo này đề xuất giải pháp bóc tách cấu trúc tài liệu DOCX bán cấu trúc và tự động chuyển đổi sang khuôn mẫu xuất bản khoa học 2 cột. Hệ thống kết hợp phân tích cú pháp OpenXML nội bộ với mô hình ngôn ngữ lớn để bảo toàn hoàn chỉnh ảnh đồ họa vector, công thức toán học MathML và mạng lưới trích dẫn tài liệu tham khảo theo quy chuẩn VNUHCM.
  ]
  #v(4pt)
  #text(weight: "${keywords.labelBold ? 'bold' : 'normal'}", size: ${keywords.fontSize}pt)[${keywords.label}]
  #text(size: ${keywords.fontSize}pt)[OpenXML, LaTeX XeTeX, Dàn trang tự động, Bài báo khoa học, ĐHQG TP.HCM]
]
`}

#v(${abstract.spaceAfter}pt)

// --- Main Body Section (2-Column or 1-Column) ---
#columns(${pageSetup.columns}, gutter: ${pageSetup.columnGap}mm)[
  = Giới thiệu
  Văn bản khoa học đóng vai trò trung tâm trong công tác công bố và lan toả tri thức học thuật. Các tạp chí thuộc hệ sinh thái Đại học Quốc gia TP.HCM đòi hỏi quy chuẩn dàn trang nghiêm ngặt về số cột, lề trang, font chữ và phong cách trích dẫn.

  Tuy nhiên, phần lớn tác giả nộp bản thảo dưới dạng Microsoft Word (.docx), trong khi khâu in ấn và xuất bản trực tuyến đòi hỏi định dạng PDF chất lượng cao biên dịch từ hệ thống xuất bản chuyên nghiệp.

  = Phương pháp nghiên cứu
  Hệ thống trích xuất sử dụng kiến trúc phân tầng 3 bước:
  1. Phân tích cây DOM của tập tin Word OpenXML (.docx)
  2. Nhận diện khối ngữ nghĩa tiêu đề, tóm tắt, bảng biểu và công thức toán
  3. Ánh xạ sang các bộ tham số template tương ứng.

  == Cơ chế chia cột và đồng bộ hoá
  Khối tiêu đề và tóm tắt được định nghĩa ở chế độ full-width (span-columns), trong khi toàn bộ thân bài được chia tự động thành 2 cột với khoảng cách column-gap chuẩn xác.

  = Kết quả thử nghiệm
  Thử nghiệm trên 50 bản thảo DOCX thuộc tạp chí Sci. Tech. Dev. J. (STDJ) cho thấy thời gian xử lý trung bình đạt 2.8 giây, độ chính xác nhận diện phần tóm tắt đạt 98.4%, và bảo toàn 100% hình ảnh không bị méo tỷ lệ.

  = ${references.headingText}
  #set text(size: ${references.fontSize}pt)
  #set par(first-line-indent: 0pt, hanging-indent: ${references.hangingIndent}mm)
  [1] Nguyen, H. N., & Tran, M. T. (2025). Automated Academic Typesetting from DOCX Documents. Sci. Tech. Dev. J., 28(2), 112-124. \\
  [2] VNU-HCM Publishing House. (2024). Guidelines for Scientific Paper Formatting and Citation Standards. \\
  [3] Knuth, D. E. (1984). The TeXbook. Addison-Wesley Professional.
]
`;
}
