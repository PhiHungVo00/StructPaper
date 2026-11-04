import { UniversalTemplateSchema, SemanticElement, LayoutZoneConfig } from '@/types/template-builder';

/**
 * Universal LaTeX XeTeX Code Generator
 * Compiles any arbitrary UniversalTemplateSchema into production-ready LaTeX XeTeX document markup.
 */
export function generateUniversalLatex(schema: UniversalTemplateSchema): string {
  const { pageArchitecture, zones, elements, primaryColor, secondaryColor } = schema;
  const { margins, headers, footers, pageNumbering, size } = pageArchitecture;

  const primaryHex = primaryColor.replace('#', '');
  const secondaryHex = (secondaryColor || primaryColor).replace('#', '');

  // Render zones
  const renderZoneLatex = (zone: LayoutZoneConfig) => {
    const zoneElements = elements
      .filter((el) => el.zoneId === zone.id && el.visible)
      .sort((a, b) => a.order - b.order);

    if (zone.type === 'sidebar-split') {
      const leftColWidth = (zone.sidebarWidthPercentage || 28) / 100;
      const rightColWidth = +(1 - leftColWidth - 0.04).toFixed(2);
      const leftElements = zoneElements.filter((el) => !el.spanColumns);
      const rightElements = zoneElements.filter((el) => el.spanColumns);

      return `% --- Zone: ${zone.name} (Sidebar Split ${zone.sidebarWidthPercentage}% / ${(100 - (zone.sidebarWidthPercentage || 28))}%) ---
\\noindent
\\begin{minipage}[t]{${leftColWidth}\\textwidth}
${leftElements.map(compileElementToLatex).join('\n')}
\\end{minipage}%
\\hfill
\\begin{minipage}[t]{${rightColWidth}\\textwidth}
${rightElements.map(compileElementToLatex).join('\n')}
\\end{minipage}
\\vspace{12pt}
`;
    }

    if (zone.type === 'multi-column') {
      return `% --- Zone: ${zone.name} (${zone.columns} Columns) ---
\\begin{multicols}{${zone.columns}}
${zoneElements.map(compileElementToLatex).join('\n')}
\\end{multicols}
\\vspace{12pt}
`;
    }

    // 1-column full width
    return `% --- Zone: ${zone.name} (Full Width 1-Column) ---
\\noindent
${zoneElements.map(compileElementToLatex).join('\n')}
\\vspace{10pt}
`;
  };

  const renderedZones = zones
    .sort((a, b) => a.order - b.order)
    .map(renderZoneLatex)
    .join('\n\n');

  return `% =====================================================================
% STRUCTPAPER UNIVERSAL LATEX XETEX TEMPLATE
% Template: ${schema.name} (Category: ${schema.category})
% Author: ${schema.author}
% Version: ${schema.version} | Generated: ${schema.updatedAt}
% =====================================================================
\\documentclass[10pt,${size.toLowerCase()}paper]{article}

% --- Essential Packages ---
\\usepackage{fontspec}
\\usepackage{xcolor}
\\usepackage{multicol}
\\usepackage{fancyhdr}
\\usepackage{titlesec}
\\usepackage{microtype}
\\usepackage{graphicx}
\\usepackage{booktabs}
\\usepackage{tcolorbox}
\\usepackage{caption}
\\usepackage{hyperref}

% --- Geometry Setup ---
\\usepackage[
  paper=${size.toLowerCase()}paper,
  top=${margins.top}mm,
  bottom=${margins.bottom}mm,
  left=${margins.left}mm,
  right=${margins.right}mm,
  headheight=14pt
]{geometry}

% --- Colors ---
\\definecolor{PrimaryColor}{HTML}{${primaryHex}}
\\definecolor{SecondaryColor}{HTML}{${secondaryHex}}

% --- Running Headers & Footers ---
\\pagestyle{fancy}
\\fancyhf{}
${
  headers.differentOddEven
    ? `\\fancyhead[LE]{\\footnotesize ${headers.evenPages.leftText.replace('{page_number}', '\\thepage')}}
\\fancyhead[RE]{\\footnotesize ${headers.evenPages.rightText.replace('{page_number}', '\\thepage')}}
\\fancyhead[LO]{\\footnotesize ${headers.oddPages.leftText.replace('{page_number}', '\\thepage')}}
\\fancyhead[RO]{\\footnotesize ${headers.oddPages.rightText.replace('{page_number}', '\\thepage')}}`
    : `\\fancyhead[L]{\\footnotesize ${headers.firstPage.leftText}}
\\fancyhead[R]{\\footnotesize ${headers.firstPage.rightText}}`
}
\\renewcommand{\\headrulewidth}{0.4pt}
\\fancyfoot[C]{\\footnotesize\\thepage}

% =====================================================================
\\begin{document}

${renderedZones}

\\end{document}
`;
}

function compileElementToLatex(el: SemanticElement): string {
  const { type, styling, specialProps } = el;

  switch (type) {
    case 'article-title':
      return `  {\\fontsize{${styling.fontSize}pt}{${styling.fontSize + 4}pt}\\selectfont\\bfseries\\color{PrimaryColor}
  Nghiên cứu ứng dụng bóc tách cấu trúc OpenXML và tự động dàn trang báo cáo khoa học chuẩn VNUHCM}
  ${
    specialProps.supportBilingual
      ? `\\\\
  \\vspace{4pt}
  {\\fontsize{${specialProps.bilingualFontSize || 12}pt}{${(specialProps.bilingualFontSize || 12) + 3}pt}\\selectfont\\itshape\\color{gray}
  ${specialProps.bilingualLabel || 'Automated Academic Typesetting and OpenXML Structural Extraction'}}`
      : ''
  }
  \\vspace{${styling.margin.bottom}pt}`;

    case 'author-block':
      return `  {\\fontsize{${styling.fontSize}pt}{${styling.fontSize + 3}pt}\\selectfont
  Nguyễn Hoàng Nam\\textsuperscript{1,*}, Trần Minh Tuấn\\textsuperscript{2}, Lê Thu Hương\\textsuperscript{1}}
  ${
    specialProps.showAffiliations
      ? `\\\\
  \\vspace{2pt}
  {\\footnotesize\\color{gray}
  \\textsuperscript{1}Khoa KH\\&KT Máy tính, ĐH Bách khoa, ĐHQG TP.HCM\\\\
  \\textsuperscript{2}Viện Khoa học Dữ liệu \\& AI, ĐHQG TP.HCM}`
      : ''
  }
  \\vspace{${styling.margin.bottom}pt}`;

    case 'metadata-grid':
      const fields = (specialProps.metadataFields || []).filter((f) => f.visible);
      return `  \\begin{tcolorbox}[colback=black!3!white,colframe=gray!30,arc=2pt,left=2mm,right=2mm,top=2mm,bottom=2mm]
    \\footnotesize
    ${fields.map((f) => `\\textbf{${f.label}:} ${f.defaultValue}\\\\`).join('\n    ')}
  \\end{tcolorbox}`;

    case 'abstract-box':
      return `  \\begin{tcolorbox}[
    colback=${styling.backgroundColor === 'transparent' ? 'white' : 'blue!4!white'},
    colframe=PrimaryColor,
    boxrule=${styling.borderStyle === 'left-solid' ? '0pt' : '0.8pt'},
    leftrule=${styling.borderStyle === 'left-solid' ? `${styling.borderWidth}pt` : '0.8pt'},
    arc=2pt,
    left=3mm,
    right=3mm
  ]
    {\\bfseries\\color{PrimaryColor} ${specialProps.abstractLabel || 'TÓM TẮT'}}\\\\
    {\\small\\itshape
    Bài báo này đề xuất giải pháp bóc tách cấu trúc tài liệu DOCX bán cấu trúc và tự động chuyển đổi sang khuôn mẫu xuất bản khoa học 2 cột. Hệ thống kết hợp phân tích cú pháp OpenXML nội bộ với mô hình ngôn ngữ lớn để bảo toàn hoàn chỉnh ảnh đồ họa vector, công thức toán học MathML và mạng lưới trích dẫn tài liệu tham khảo theo quy chuẩn VNUHCM.}
  \\end{tcolorbox}`;

    case 'keywords-group':
      return `  {\\small\\textbf{${specialProps.keywordLabel || 'Từ khoá:'}} OpenXML, LaTeX XeTeX, Dàn trang tự động, Bài báo khoa học, ĐHQG TP.HCM.}
  \\vspace{${styling.margin.bottom}pt}`;

    case 'heading':
      return `  \\section{Giới thiệu}`;

    case 'body-text':
      return `  \\setlength{\\parindent}{${styling.firstLineIndent ?? 4}mm}
  Văn bản khoa học đóng vai trò trung tâm trong công tác công bố và lan toả tri thức học thuật. Các tạp chí thuộc hệ sinh thái Đại học Quốc gia TP.HCM đòi hỏi quy chuẩn dàn trang nghiêm ngặt về số cột, lề trang, font chữ và phong cách trích dẫn.`;

    case 'callout-box':
      return `  \\begin{tcolorbox}[colback=orange!5!white,colframe=SecondaryColor,arc=3pt]
    \\textbf{${specialProps.calloutTitle || 'Điểm nhấn:'}}\\\\
    ${specialProps.customContentSample || 'Nghiên cứu mang tính đột phá.'}
  \\end{tcolorbox}`;

    case 'custom-field':
      return `  {\\small\\itshape\\color{gray} ${specialProps.customContentSample || el.name}}
  \\vspace{4pt}`;

    case 'references-block':
      return `  \\section*{${specialProps.referenceHeadingText || 'Tài liệu tham khảo'}}
  \\begin{thebibliography}{99}
  \\small
  \\bibitem{1} Nguyen, H. N., \\& Tran, M. T. (2025). Automated Academic Typesetting from DOCX Documents. \\textit{Sci. Tech. Dev. J.}, 28(2), 112-124.
  \\bibitem{2} VNU-HCM Publishing House. (2024). \\textit{Guidelines for Scientific Paper Formatting and Citation Standards}.
  \\end{thebibliography}`;

    default:
      return `  % Custom Element: ${el.name}`;
  }
}
