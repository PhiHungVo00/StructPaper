import { UniversalTemplateSchema, SemanticElement, LayoutZoneConfig } from '@/types/template-builder';

/**
 * Universal Typst Code Generator
 * Compiles any arbitrary UniversalTemplateSchema into idiomatic Typst markup.
 */
export function generateUniversalTypst(schema: UniversalTemplateSchema): string {
  if (schema.id === 'vnuhcm_health_sciences_id630') {
    return generateID630AuthenticTypst(schema);
  }

  const { pageArchitecture, zones, elements, primaryColor, secondaryColor } = schema;
  const { margins, headers, footers, pageNumbering, orientation, size } = pageArchitecture;

  // Margin expression
  const marginsStr = `(top: ${margins.top}mm, bottom: ${margins.bottom}mm, left: ${margins.left}mm, right: ${margins.right}mm)`;

  // Generate dynamic header Typst code
  const headerCode = `  header: locate(loc => {
    let p = loc.page()
    if p == 1 {
      #set text(size: ${headers.firstPage.fontSize}pt, fill: rgb("${headers.firstPage.textColor}"), font: "${headers.firstPage.fontFamily}")
      #grid(
        columns: (1fr, 1fr),
        align(left)[${headers.firstPage.leftText}],
        align(right)[${headers.firstPage.rightText}]
      )
      ${headers.firstPage.showDividerLine ? `#line(length: 100%, stroke: ${headers.firstPage.dividerLineThickness}pt + rgb("${headers.firstPage.dividerLineColor}"))` : ''}
    } else if calc.odd(p) {
      #set text(size: ${headers.oddPages.fontSize}pt, fill: rgb("${headers.oddPages.textColor}"))
      #grid(
        columns: (1fr, 1fr),
        align(left)[${headers.oddPages.leftText.replace('{page_number}', '#p')}],
        align(right)[${headers.oddPages.rightText.replace('{page_number}', '#p')}]
      )
      ${headers.oddPages.showDividerLine ? `#line(length: 100%, stroke: ${headers.oddPages.dividerLineThickness}pt + rgb("${headers.oddPages.dividerLineColor}"))` : ''}
    } else {
      #set text(size: ${headers.evenPages.fontSize}pt, fill: rgb("${headers.evenPages.textColor}"))
      #grid(
        columns: (1fr, 1fr),
        align(left)[${headers.evenPages.leftText.replace('{page_number}', '#p')}],
        align(right)[${headers.evenPages.rightText.replace('{page_number}', '#p')}]
      )
      ${headers.evenPages.showDividerLine ? `#line(length: 100%, stroke: ${headers.evenPages.dividerLineThickness}pt + rgb("${headers.evenPages.dividerLineColor}"))` : ''}
    }
  }),`;

  // Page numbering footer
  const footerCode = `  footer: locate(loc => {
    let p = loc.page()
    ${pageNumbering.suppressOnFirstPage ? 'if p > 1 {' : '{'}
      #align(${pageNumbering.position.includes('center') ? 'center' : pageNumbering.position.includes('left') ? 'left' : 'right'})[
        #set text(size: 8.5pt, fill: rgb("#64748B"))
        #text[${pageNumbering.prefixText}]#p
      ]
    }
  }),`;

  // Helper to render elements inside a specific zone
  const renderZoneElements = (zone: LayoutZoneConfig) => {
    // Nested Sub-Zones Support (Multi-level Hierarchical Layout)
    if (zone.subZones && zone.subZones.length > 0) {
      const subGrid = zone.subGridConfig || { columns: zone.subZones.length, rows: 1, colGap: 6 };
      const subZoneCols = Array(subGrid.columns).fill('1fr').join(', ');
      const renderedSubZones = zone.subZones
        .sort((a, b) => a.order - b.order)
        .map((sz) => {
          const szElements = elements.filter((el) => el.zoneId === sz.id && el.visible);
          return `  [\n${szElements.map(compileElementToTypst).join('\n')}\n  ]`;
        })
        .join(',\n');

      return `// --- Zone: ${zone.name} (Hierarchical Nested Sub-Grid: ${zone.subZones.length} Sub-zones) ---
#grid(
  columns: (${subZoneCols}),
  gutter: ${subGrid.colGap || 6}pt,
${renderedSubZones}
)
`;
    }

    const zoneElements = elements
      .filter((el) => el.zoneId === zone.id && el.visible)
      .sort((a, b) => a.order - b.order);

    // CSS Layout Grid mapping
    if (zone.cssLayout?.display === 'grid' && zone.cssLayout.grid) {
      const g = zone.cssLayout.grid;
      const cols = g.templateColumns
        .trim()
        .split(/\s+/)
        .map((c) => (c.endsWith('fr') ? c : c.endsWith('%') ? c : c.endsWith('px') ? `${Math.round(parseInt(c) * 0.264)}mm` : c))
        .join(', ');
      return `// --- Zone: ${zone.name} (Typst Grid: columns: (${cols})) ---
#grid(
  columns: (${cols}),
  gutter: ${g.columnGapMm || zone.columnGap}mm,
  [
${zoneElements.map(compileElementToTypst).join('\n')}
  ]
)
`;
    }

    // CSS Layout Flex mapping
    if (zone.cssLayout?.display === 'flex' && zone.cssLayout.flex) {
      const f = zone.cssLayout.flex;
      const dir = f.direction === 'row' ? 'ltr' : 'ttb';
      return `// --- Zone: ${zone.name} (Typst Stack: ${dir}) ---
#stack(
  dir: ${dir},
  spacing: ${f.gapMm || 4}mm,
${zoneElements.map(compileElementToTypst).join(',\n')}
)
`;
    }

    // CSS Layout Columns mapping
    if (zone.cssLayout?.display === 'columns' && zone.cssLayout.columns) {
      const c = zone.cssLayout.columns;
      return `// --- Zone: ${zone.name} (Typst Multi-column: ${c.columnCount} Cols) ---
#columns(${c.columnCount}, gutter: ${c.columnGapMm}mm)[
${zoneElements.map(compileElementToTypst).join('\n')}
]
`;
    }

    if (zone.type === 'sidebar-split') {
      const leftColWidth = zone.sidebarWidthPercentage || 28;
      const rightColWidth = 100 - leftColWidth;
      const leftElements = zoneElements.filter((el) => !el.spanColumns);
      const rightElements = zoneElements.filter((el) => el.spanColumns);

      return `// --- Zone: ${zone.name} (Sidebar Split ${leftColWidth}% / ${rightColWidth}%) ---
#grid(
  columns: (${leftColWidth}%, ${rightColWidth}%),
  gutter: ${zone.columnGap}mm,
  [
${leftElements.map(compileElementToTypst).join('\n')}
  ],
  [
${rightElements.map(compileElementToTypst).join('\n')}
  ]
)
`;
    }

    if (zone.type === 'multi-column') {
      return `// --- Zone: ${zone.name} (${zone.columns} Columns) ---
#columns(${zone.columns}, gutter: ${zone.columnGap}mm)[
${zoneElements.map(compileElementToTypst).join('\n')}
]
`;
    }

    // Full-width (1 column)
    return `// --- Zone: ${zone.name} (Full Width 1-Column) ---
#block(width: 100%)[
${zoneElements.map(compileElementToTypst).join('\n')}
]
`;
  };

  const renderedZones = zones
    .sort((a, b) => a.order - b.order)
    .map(renderZoneElements)
    .join('\n\n');

  return `// =====================================================================
// STRUCTPAPER UNIVERSAL TYPST TEMPLATE
// Template: ${schema.name} (Category: ${schema.category})
// Author: ${schema.author} ${schema.institution ? `(${schema.institution})` : ''}
// Version: ${schema.version} | Generated: ${schema.updatedAt}
// =====================================================================

#let primary-color = rgb("${primaryColor}")
#let secondary-color = rgb("${secondaryColor || primaryColor}")

// --- Global Page Master ---
#set page(
  paper: ${
    size === 'Custom'
      ? `(width: ${pageArchitecture.customDimensions?.width || 210}mm, height: ${pageArchitecture.customDimensions?.height || 297}mm)`
      : `"${size === 'Letter' ? 'us-letter' : size === 'Legal' ? 'us-legal' : size.toLowerCase()}"`
  },
  flipped: ${orientation === 'landscape'},
  margin: ${marginsStr},
${headerCode}
${footerCode}
)

#set text(
  font: ("Minion Pro", "Times New Roman", "DejaVu Sans"),
  size: 10pt,
  lang: "vi"
)

// =====================================================================
// DOCUMENT CONTENT ZONES
// =====================================================================

${renderedZones}
`;
}

/**
 * Compiles a single SemanticElement into Typst code
 */
function compileElementToTypst(el: SemanticElement): string {
  const { type, styling, specialProps } = el;

  switch (type) {
    case 'article-title':
      return `  // Element: ${el.name}
  #align(${styling.textAlign})[
    #block(spacing: 0pt, above: ${styling.margin.top}pt, below: ${styling.margin.bottom}pt)[
      #text(
        font: "${styling.fontFamily}",
        size: ${styling.fontSize}pt,
        weight: "${styling.fontWeight}",
        fill: rgb("${styling.textColor}")
      )[
        Nghiên cứu ứng dụng bóc tách cấu trúc OpenXML và tự động dàn trang báo cáo khoa học chuẩn VNUHCM
      ]
      ${
        specialProps.supportBilingual
          ? `\\
      #v(4pt)
      #text(size: ${specialProps.bilingualFontSize || 12}pt, style: "italic", fill: rgb("#475569"))[
        ${specialProps.bilingualLabel || 'Automated Academic Typesetting and Semantic OpenXML Extraction for VNUHCM Scientific Journals'}
      ]`
          : ''
      }
    ]
  ]`;

    case 'author-block':
      return `  // Element: ${el.name}
  #align(${styling.textAlign})[
    #block(above: ${styling.margin.top}pt, below: ${styling.margin.bottom}pt)[
      #text(size: ${styling.fontSize}pt, weight: "${styling.fontWeight}")[
        Nguyễn Hoàng Nam#super[1*], Trần Minh Tuấn#super[2], Lê Thu Hương#super[1]
      ] \\
      ${
        specialProps.showAffiliations
          ? `#v(2pt)
      #text(size: 8pt, fill: rgb("#64748B"))[
        #super[1] Khoa Khoa học & Kỹ thuật Máy tính, Trường Đại học Bách khoa, ĐHQG TP.HCM \\
        #super[2] Viện Khoa học Dữ liệu & Trí tuệ Nhân tạo, ĐHQG TP.HCM \\
        ${specialProps.showCorresponding ? '#super[*] Tác giả liên hệ: nam.nh@vnuhcm.edu.vn' : ''}
      ]`
          : ''
      }
    ]
  ]`;

    case 'metadata-grid':
      const fields = specialProps.metadataFields || [];
      return `  // Element: ${el.name}
  #block(
    fill: rgb("${styling.backgroundColor === 'transparent' ? '#FFFFFF' : styling.backgroundColor}"),
    inset: ${styling.padding.top}mm,
    radius: ${styling.borderRadius}pt,
    stroke: ${styling.borderStyle === 'all-borders' ? `1pt + rgb("${styling.borderColor}")` : 'none'}
  )[
    #set text(size: ${styling.fontSize}pt, fill: rgb("${styling.textColor}"))
    ${fields
      .filter((f) => f.visible)
      .map((f) => `#strong[${f.label}:] ${f.defaultValue} \\`)
      .join('\n    ')}
  ]`;

    case 'abstract-box':
      return `  // Element: ${el.name}
  #rect(
    width: 100%,
    fill: rgb("${styling.backgroundColor === 'transparent' ? '#FFFFFF' : styling.backgroundColor}"),
    stroke: ${
      styling.borderStyle === 'left-solid'
        ? `${styling.borderWidth}pt + rgb("${styling.borderColor}")`
        : styling.borderStyle === 'all-borders'
        ? `1pt + rgb("${styling.borderColor}")`
        : 'none'
    },
    inset: ${styling.padding.top}mm,
    radius: ${styling.borderRadius}pt
  )[
    #text(weight: "bold", size: ${styling.fontSize}pt, fill: primary-color)[${specialProps.abstractLabel || 'TÓM TẮT'}] \\
    #text(style: "${styling.fontStyle}", size: ${styling.fontSize}pt)[
      Bài báo này đề xuất giải pháp bóc tách cấu trúc tài liệu DOCX bán cấu trúc và tự động chuyển đổi sang khuôn mẫu xuất bản khoa học 2 cột. Hệ thống kết hợp phân tích cú pháp OpenXML nội bộ với mô hình ngôn ngữ lớn để bảo toàn hoàn chỉnh ảnh đồ họa vector, công thức toán học MathML và mạng lưới trích dẫn tài liệu tham khảo theo quy chuẩn VNUHCM.
    ]
  ]`;

    case 'keywords-group':
      return `  // Element: ${el.name}
  #block(above: ${styling.margin.top}pt, below: ${styling.margin.bottom}pt)[
    #set text(size: ${styling.fontSize}pt)
    #strong[${specialProps.keywordLabel || 'Từ khoá:'}] OpenXML, LaTeX XeTeX, Dàn trang tự động, Bài báo khoa học, ĐHQG TP.HCM
  ]`;

    case 'heading':
      const level = specialProps.headingLevel || 1;
      return `  // Element: ${el.name}
  #show heading.where(level: ${level}): it => block(above: ${styling.margin.top}pt, below: ${styling.margin.bottom}pt)[
    #set text(
      font: "${styling.fontFamily}",
      size: ${styling.fontSize}pt,
      weight: "${styling.fontWeight}",
      fill: rgb("${styling.textColor}")
    )
    ${styling.accentBar ? `#box(width: 3pt, height: 1.1em, fill: rgb("${styling.accentBarColor || styling.textColor}"), baseline: 15%) #h(4pt)` : ''}
    ${styling.textTransform === 'uppercase' ? '#upper(it.body)' : '#it.body'}
  ]`;

    case 'body-text':
      return `  // Element: ${el.name}
  #set par(
    justify: ${styling.textAlign === 'justify' ? 'true' : 'false'},
    leading: ${(styling.lineHeight - 1).toFixed(2)}em,
    first-line-indent: ${styling.firstLineIndent ?? 4}mm
  )
  Văn bản khoa học đóng vai trò trung tâm trong công tác công bố và lan toả tri thức học thuật. Các tạp chí thuộc hệ sinh thái Đại học Quốc gia TP.HCM đòi hỏi quy chuẩn dàn trang nghiêm ngặt về số cột, lề trang, font chữ và phong cách trích dẫn.

  Tuy nhiên, phần lớn tác giả nộp bản thảo dưới dạng Microsoft Word (.docx), trong khi khâu in ấn và xuất bản trực tuyến đòi hỏi định dạng PDF chất lượng cao biên dịch từ hệ thống LaTeX.`;

    case 'callout-box':
      return `  // Element: ${el.name}
  #rect(
    width: 100%,
    fill: rgb("${styling.backgroundColor === 'transparent' ? '#F8FAFC' : styling.backgroundColor}"),
    stroke: 1pt + rgb("${styling.borderColor}"),
    inset: ${styling.padding.top}mm,
    radius: ${styling.borderRadius}pt
  )[
    #text(weight: "bold", size: ${styling.fontSize}pt, fill: rgb("${styling.borderColor}"))[${specialProps.calloutTitle || '📌 Điểm nhấn nghiên cứu'}] \\
    #text(size: ${styling.fontSize}pt)[
      ${specialProps.customContentSample || 'Nghiên cứu mang tính đột phá và ứng dụng thực tiễn cao.'}
    ]
  ]`;

    case 'custom-field':
      return `  // Element: ${el.name}
  #block(above: ${styling.margin.top}pt, below: ${styling.margin.bottom}pt)[
    #set text(
      font: "${styling.fontFamily}",
      size: ${styling.fontSize}pt,
      weight: "${styling.fontWeight}",
      style: "${styling.fontStyle}",
      fill: rgb("${styling.textColor}")
    )
    ${specialProps.customContentSample || el.name}
  ]`;

    case 'references-block':
      return `  // Element: ${el.name}
  = ${specialProps.referenceHeadingText || 'Tài liệu tham khảo'}
  #set text(size: ${styling.fontSize}pt)
  #set par(first-line-indent: 0pt, hanging-indent: ${styling.hangingIndent || 4}mm)
  [1] Nguyen, H. N., & Tran, M. T. (2025). Automated Academic Typesetting from DOCX Documents. Sci. Tech. Dev. J., 28(2), 112-124. \\
  [2] VNU-HCM Publishing House. (2024). Guidelines for Scientific Paper Formatting and Citation Standards.`;

    default:
      return `  // Custom Element: ${el.name}
  #block[${specialProps.customContentSample || el.name}]`;
  }
}

/**
 * Generates the authentic Typst code matching 100% of the VNUHCM Health Sciences ID630 specification.
 */
function generateID630AuthenticTypst(schema?: UniversalTemplateSchema): string {
  const primary = schema?.primaryColor || '#2B74B7';
  const margins = schema?.pageArchitecture.margins || { top: 14.7, bottom: 12.5, left: 16.9, right: 13.1 };

  return `// =====================================================================
// STRUCTPAPER TYPST TEMPLATE: VNUHCM HEALTH SCIENCES (ID630)
// Chuẩn xuất bản Tạp chí Phát triển Khoa học & Công nghệ - Health Sciences
// Trích xuất 100% từ hồ sơ gốc LaTeX, DOCX, XML và PDF Nhà xuất bản ĐHQG-HCM
// =====================================================================

#let primary-color = rgb("${primary}")
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
  // Thiết lập trang vật lý theo thông số LaTeX geometry: 17mm left, 13mm right, 18mm top, 20mm bottom
  set page(
    paper: "a4",
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
            ] \\
            #box(height: 10pt, baseline: 2pt)[
              #image("/demo-assets/id630/image1.png", height: 8pt)
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
          #image("/demo-assets/id630/image2.png", fit: "contain")
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
        #text(weight: "bold", fill: primary-color)[Liên hệ] \\
        #strong[#correspondence-author], #affiliation \\
        Email: #link("mailto:" + correspondence-email)[#correspondence-email]
        #v(6pt)
        #text(weight: "bold", fill: primary-color)[Lịch sử] \\
        #text(fill: primary-color)[•] Ngày nhận: #history.received \\
        #text(fill: primary-color)[•] Ngày sửa đổi: #history.revised \\
        #text(fill: primary-color)[•] Ngày chấp nhận: #history.accepted \\
        #text(fill: primary-color)[•] Ngày đăng: #history.published
        #v(6pt)
        #text(weight: "bold", fill: primary-color)[DOI: ]
        #link(doi)[#text(size: 7pt, weight: "bold")[#doi]]
        #v(4pt)
        #image("/demo-assets/id630/image3.jpeg", width: 100pt)
        #v(4pt)
        #text(weight: "bold", fill: primary-color)[Bản quyền] \\
        #text(size: 6.8pt, fill: rgb("#475569"))[
          © ĐHQG Tp.HCM. Đây là bài báo công bố mở được phát hành theo các điều khoản của Creative Commons Attribution 4.0 International license.
        ]
        #v(6pt)
        #align(center)[#image("/demo-assets/id630/image4.jpeg", width: 90pt)]
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

// Khởi tạo bài viết với template chuẩn
#show: vnuhcm-journal.with(
  title: "Tổng quan về loét dạ dày tá tràng ở người cao tuổi và cập nhật trong điều trị",
  article-type: "Bài tổng quan",
  authors: ("Hà Vũ*", "Viên Vinh Phú"),
  affiliation: "Bộ môn Nội - Khoa Y – Trường Đại học Khoa học Sức khỏe - Đại học Quốc Gia Thành phố Hồ Chí Minh",
  correspondence-author: "Hà Vũ",
  correspondence-email: "hvu@uhsvnu.edu.vn"
)

// --- THÂN BÀI (TRANG 2 TRỞ ĐI) ---

#figure(
  image("/demo-assets/id630/image5.jpeg", width: 85%),
  caption: [Vị trí giải phẫu của loét dạ dày tá tràng. (Nguồn: Pilotto A FM. Upper Gastrointestinal Disorders. Hazzard's Geriatric Medicine and Gerontology, 8th, 2022. McGraw Hill)]
)

= SINH LÝ BỆNH VÀ PHÂN LOẠI:
Quá trình lão hóa gây ra những thay đổi cấu trúc và chức năng sâu sắc, ở dạ dày, lão hoá làm suy yếu hàng rào bảo vệ niêm mạc chủ yếu do các yếu tố: (1) Lão hóa miễn dịch, (2) Rối loạn vi tuần hoàn và (3) Tình trạng giảm toan và loạn khuẩn.

Từ đó giải thích cho hai yếu tố chính là tỷ lệ nhiễm H. pylori cao và việc sử dụng thường xuyên các thuốc gây tổn thương niêm mạc như NSAID và aspirin.

#figure(
  image("/demo-assets/id630/image6.jpeg", width: 85%),
  caption: [Tỷ lệ loét dạ dày và tá tràng ở bệnh nhân cao tuổi phân chia theo sự hiện diện của nhiễm H.pylori và/hoặc sử dụng NSAID.]
)

= BỆNH LOÉT DẠ DÀY LIÊN QUAN ĐẾN H. PYLORI:
Nhiễm Helicobacter pylori vẫn phổ biến ở người cao tuổi, mặc dù tỷ lệ nhiễm đã giảm ở các thế hệ trẻ nhờ cải thiện điều kiện vệ sinh.

= BỆNH LOÉT DẠ DÀY TÁ TRÀNG LIÊN QUAN ĐẾN NSAID/ASPIRIN:
Ở bệnh nhân cao tuổi, khoảng 25% loét tá tràng và 40% loét dạ dày có liên quan đến việc sử dụng NSAID và/hoặc aspirin.
`;
}
