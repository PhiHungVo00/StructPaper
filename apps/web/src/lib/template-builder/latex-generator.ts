import { DocumentTemplateSchema } from '@/types/template-builder';

/**
 * Generates an idiomatic, production-ready LaTeX XeTeX template (.tex / .cls)
 * based on the element-driven DocumentTemplateSchema.
 */
export function generateLatexTemplate(schema: DocumentTemplateSchema): string {
  const { pageSetup, title, authors, abstract, keywords, heading1, heading2, heading3, body, floats, references, primaryColor } = schema;

  // Geometry margins
  const geometryCode = `\\usepackage[
  paper=${pageSetup.size.toLowerCase()}paper,
  top=${pageSetup.margins.top}mm,
  bottom=${pageSetup.margins.bottom}mm,
  left=${pageSetup.margins.left}mm,
  right=${pageSetup.margins.right}mm,
  headheight=14pt
]{geometry}`;

  // Heading format
  let h1NumberFormat = '\\Roman{section}. ';
  if (heading1.numbering === 'ARABIC') h1NumberFormat = '\\arabic{section}. ';
  else if (heading1.numbering === 'LETTER') h1NumberFormat = '\\Alph{section}. ';
  else if (heading1.numbering === 'NONE') h1NumberFormat = '';

  const h1Case = heading1.textTransform === 'uppercase' ? '\\MakeUppercase' : '';

  // Hex color to LaTeX definecolor
  const primaryHex = primaryColor.replace('#', '');
  const isSplitLayout = pageSetup.firstPageLayout === 'sidebar-split';

  return `% =====================================================================
% STRUCTPAPER LATEX XETEX TEMPLATE
% Template: ${schema.name}
% Version: ${schema.version} | Generated: ${schema.updatedAt}
% =====================================================================
\\documentclass[10pt,${pageSetup.size.toLowerCase()}paper]{article}

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

% --- Page Geometry ---
${geometryCode}

% --- Typography & Fonts ---
\\setmainfont{${body.fontFamily}}
\\definecolor{PrimaryColor}{HTML}{${primaryHex}}

% --- Paragraph & Spacing ---
\\setlength{\\parindent}{${body.firstLineIndent}mm}
\\setlength{\\parskip}{${body.paragraphSpacing}pt}
\\linespread{${body.lineHeight}}

% --- Column Separation ---
\\setlength{\\columnsep}{${pageSetup.columnGap}mm}

% --- Header & Footer ---
\\pagestyle{fancy}
\\fancyhf{}
${
  pageSetup.showRunningHeader
    ? `\\fancyhead[L]{\\footnotesize\\textcolor{gray}{${pageSetup.journalName}}}
\\fancyhead[R]{\\footnotesize\\thepage}
\\renewcommand{\\headrulewidth}{0.4pt}`
    : `\\renewcommand{\\headrulewidth}{0pt}`
}
${
  pageSetup.showPageNumbers
    ? `\\fancyfoot[C]{\\footnotesize\\thepage}`
    : `\\fancyfoot{}`
}

% --- Section Heading Formatting ---
\\titleformat{\\section}
  {\\normalfont\\fontsize{${heading1.fontSize}pt}{${heading1.fontSize + 3}pt}\\selectfont\\bfseries\\color{PrimaryColor}}
  {${h1NumberFormat}}
  {0.5em}
  {${h1Case}}

\\titlespacing*{\\section}{0pt}{${heading1.spaceBefore}pt}{${heading1.spaceAfter}pt}

\\titleformat{\\subsection}
  {\\normalfont\\fontsize{${heading2.fontSize}pt}{${heading2.fontSize + 2}pt}\\selectfont\\bfseries}
  {\\thesubsection}
  {0.5em}
  {}

\\titlespacing*{\\subsection}{0pt}{${heading2.spaceBefore}pt}{${heading2.spaceAfter}pt}

% --- Caption Formatting ---
\\captionsetup{
  font={small},
  labelfont={bf,color=PrimaryColor},
  skip=${floats.spaceAround}pt
}

% =====================================================================
\\begin{document}

% --- Article Type Header ---
${pageSetup.articleType ? `\\noindent{\\sffamily\\bfseries\\color{PrimaryColor}\\footnotesize ${pageSetup.articleType}}\\\\` : ''}

% --- Title Block ---
\\begin{center}
  {\\fontsize{${title.fontSize}pt}{${title.fontSize + 4}pt}\\selectfont\\bfseries\\color{PrimaryColor}
  Nghiên cứu ứng dụng bóc tách cấu trúc OpenXML và tự động dàn trang báo cáo khoa học chuẩn VNUHCM}
  ${title.supportBilingual ? `\\\\
  \\vspace{4pt}
  {\\fontsize{${title.enTitleFontSize}pt}{${title.enTitleFontSize + 3}pt}\\selectfont\\itshape\\color{gray}
  Automated Academic Typesetting and OpenXML Structural Extraction for VNUHCM Scientific Journals}` : ''}
  
  \\vspace{10pt}
  {\\fontsize{${authors.fontSize}pt}{${authors.fontSize + 2}pt}\\selectfont
  Nguyễn Hoàng Nam\\textsuperscript{1,*}, Trần Minh Tuấn\\textsuperscript{2}, Lê Thu Hương\\textsuperscript{1}}
  
  \\vspace{4pt}
  {\\footnotesize\\color{gray}
  \\textsuperscript{1}Khoa Khoa học & Kỹ thuật Máy tính, Trường Đại học Bách khoa, ĐHQG TP.HCM\\\\
  \\textsuperscript{2}Viện Khoa học Dữ liệu & Trí tuệ Nhân tạo, ĐHQG TP.HCM}
\\end{center}

\\vspace{12pt}

% --- Abstract & Metadata Layout ---
${isSplitLayout ? `
\\noindent
\\begin{minipage}[t]{0.28\\textwidth}
  \\footnotesize
  \\textbf{Thông tin bài nộp}\\\\
  \\textcolor{gray}{Ngày nhận: 12/08/2026}\\\\
  \\textcolor{gray}{Ngày duyệt: 28/09/2026}\\\\
  \\vspace{6pt}
  \\textbf{DOI:} 10.32508/stdj.v28i2.630\\\\
  \\vspace{6pt}
  \\textbf{Bản quyền:}\\\\
  \\textcolor{gray}{\\copyright 2026 ĐHQG TP.HCM. CC-BY 4.0.}
\\end{minipage}%
\\hfill
\\begin{minipage}[t]{0.70\\textwidth}
  \\begin{tcolorbox}[
    colback=${abstract.backgroundColor === 'transparent' ? 'white' : 'blue!5!white'},
    colframe=PrimaryColor,
    boxrule=${abstract.borderStyle === 'left-solid' ? '0pt' : '0.8pt'},
    leftrule=${abstract.borderStyle === 'left-solid' ? '3pt' : '0.8pt'},
    arc=2pt,
    left=${abstract.padding}mm,
    right=${abstract.padding}mm
  ]
    {\\bfseries\\color{PrimaryColor} ${abstract.label}}\\\\
    {\\small\\itshape
    Bài báo này đề xuất giải pháp bóc tách cấu trúc tài liệu DOCX bán cấu trúc và tự động chuyển đổi sang khuôn mẫu xuất bản khoa học 2 cột. Hệ thống kết hợp phân tích cú pháp OpenXML nội bộ với mô hình ngôn ngữ lớn để bảo toàn hoàn chỉnh ảnh đồ họa vector, công thức toán học MathML và mạng lưới trích dẫn tài liệu tham khảo theo quy chuẩn VNUHCM.}\\\\
    \\vspace{4pt}
    {\\small\\textbf{${keywords.label}} OpenXML, LaTeX XeTeX, Dàn trang tự động, Bài báo khoa học, ĐHQG TP.HCM.}
  \\end{tcolorbox}
\\end{minipage}
` : `
\\begin{tcolorbox}[
  colback=${abstract.backgroundColor === 'transparent' ? 'white' : 'blue!5!white'},
  colframe=PrimaryColor,
  boxrule=${abstract.borderStyle === 'left-solid' ? '0pt' : '0.8pt'},
  leftrule=${abstract.borderStyle === 'left-solid' ? '3pt' : '0.8pt'},
  arc=2pt,
  left=${abstract.padding}mm,
  right=${abstract.padding}mm
]
  {\\bfseries\\color{PrimaryColor} ${abstract.label}:}
  {\\small\\itshape
  Bài báo này đề xuất giải pháp bóc tách cấu trúc tài liệu DOCX bán cấu trúc và tự động chuyển đổi sang khuôn mẫu xuất bản khoa học 2 cột. Hệ thống kết hợp phân tích cú pháp OpenXML nội bộ với mô hình ngôn ngữ lớn để bảo toàn hoàn chỉnh ảnh đồ họa vector, công thức toán học MathML và mạng lưới trích dẫn tài liệu tham khảo theo quy chuẩn VNUHCM.}\\\\
  \\vspace{4pt}
  {\\small\\textbf{${keywords.label}} OpenXML, LaTeX XeTeX, Dàn trang tự động, Bài báo khoa học, ĐHQG TP.HCM.}
\\end{tcolorbox}
`}

\\vspace{14pt}

% --- Main Body in Multicols ---
\\begin{multicols}{${pageSetup.columns}}

\\section{Giới thiệu}
Văn bản khoa học đóng vai trò trung tâm trong công tác công bố và lan toả tri thức học thuật. Các tạp chí thuộc hệ sinh thái Đại học Quốc gia TP.HCM đòi hỏi quy chuẩn dàn trang nghiêm ngặt về số cột, lề trang, font chữ và phong cách trích dẫn.

Tuy nhiên, phần lớn tác giả nộp bản thảo dưới dạng Microsoft Word (.docx), trong khi khâu in ấn và xuất bản trực tuyến đòi hỏi định dạng PDF chất lượng cao biên dịch từ hệ thống xuất bản chuyên nghiệp.

\\section{Phương pháp nghiên cứu}
Hệ thống trích xuất sử dụng kiến trúc phân tầng 3 bước:
\\begin{enumerate}
  \\item Phân tích cây DOM của tập tin Word OpenXML (.docx)
  \\item Nhận diện khối ngữ nghĩa tiêu đề, tóm tắt, bảng biểu và công thức toán
  \\item Ánh xạ sang các bộ tham số template tương ứng.
\\end{enumerate}

\\subsection{Cơ chế chia cột và đồng bộ hoá}
Khối tiêu đề và tóm tắt được định nghĩa ở chế độ full-width (span-columns), trong khi toàn bộ thân bài được chia tự động thành 2 cột với khoảng cách column-gap chuẩn xác.

\\section{Kết quả thử nghiệm}
Thử nghiệm trên 50 bản thảo DOCX thuộc tạp chí Sci. Tech. Dev. J. (STDJ) cho thấy thời gian xử lý trung bình đạt 2.8 giây, độ chính xác nhận diện phần tóm tắt đạt 98.4\\%, và bảo toàn 100\\% hình ảnh không bị méo tỷ lệ.

\\section*{${references.headingText}}
\\begin{thebibliography}{99}
\\small
\\bibitem{1} Nguyen, H. N., \\& Tran, M. T. (2025). Automated Academic Typesetting from DOCX Documents. \\textit{Sci. Tech. Dev. J.}, 28(2), 112-124.
\\bibitem{2} VNU-HCM Publishing House. (2024). \\textit{Guidelines for Scientific Paper Formatting and Citation Standards}.
\\bibitem{3} Knuth, D. E. (1984). \\textit{The TeXbook}. Addison-Wesley.
\\end{thebibliography}

\\end{multicols}

\\end{document}
`;
}
