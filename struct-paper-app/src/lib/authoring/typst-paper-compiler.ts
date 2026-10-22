import { CompletePaper, PaperTable, PaperFigure } from '@/types/paper';
import { UniversalTemplateSchema } from '@/types/template-builder';

/**
 * Escapes text for Typst string or content
 */
function escapeTypstText(text: string): string {
  if (!text) return '';
  return text
    .replace(/\\/g, '\\\\')
    .replace(/\[/g, '\\[')
    .replace(/\]/g, '\\]')
    .replace(/\$/g, '\\$')
    .replace(/#/g, '\\#')
    .replace(/@/g, '\\@');
}

/**
 * Compiles a PaperTable into Typst #figure(table(...))
 */
function compileTableToTypst(table: PaperTable): string {
  const colCount = Math.max(
    table.headers.length,
    ...table.rows.map((r) => r.length),
    1
  );
  const colsSpec = Array(colCount).fill('1fr').join(', ');

  let out = `\n#figure(\n`;
  out += `  caption: [${escapeTypstText(table.caption || 'Bảng số liệu')}],\n`;
  out += `  table(\n`;
  out += `    columns: (${colsSpec}),\n`;
  out += `    stroke: (x, y) => if y == 0 { (top: 1.2pt + black, bottom: 0.8pt + black) } else if y == ${table.rows.length + 1} { (bottom: 1.2pt + black) } else { none },\n`;
  out += `    align: (col, row) => if row == 0 { center + horizon } else { left + horizon },\n`;

  // Headers
  if (table.headers && table.headers.length > 0) {
    for (const h of table.headers) {
      out += `    [*${escapeTypstText(h)}*],\n`;
    }
  }

  // Rows
  for (const row of table.rows) {
    for (let c = 0; c < colCount; c++) {
      const val = row[c] || '';
      out += `    [${escapeTypstText(val)}],\n`;
    }
  }

  out += `  )\n`;
  out += `)\n`;
  return out;
}

/**
 * Compiles a PaperFigure into Typst #figure(image(...))
 */
function compileFigureToTypst(fig: PaperFigure): string {
  const widthSpec = fig.isFullWidth ? '100%' : '85%';
  let out = `\n#figure(\n`;
  out += `  image("${fig.src || '/sample-media/default_fig.png'}", width: ${widthSpec}),\n`;
  out += `  caption: [${escapeTypstText(fig.caption || 'Hình minh họa')}],\n`;
  out += `)\n`;
  return out;
}

/**
 * Compiles a CompletePaper and a UniversalTemplateSchema into a production-ready, authentic Typst document (.typ)
 */
export function compilePaperToTypst(
  paper: CompletePaper,
  template?: UniversalTemplateSchema
): string {
  const meta = paper.metadata;
  const isVnuhcm = template?.id?.includes('vnuhcm') || meta.journalId?.includes('VNUHCM');
  const isIEEE = template?.id?.includes('ieee') || meta.journalId?.includes('IEEE');

  const topMargin = template?.pageArchitecture?.margins?.top ? `${template.pageArchitecture.margins.top}mm` : '20mm';
  const bottomMargin = template?.pageArchitecture?.margins?.bottom ? `${template.pageArchitecture.margins.bottom}mm` : '20mm';
  const leftMargin = template?.pageArchitecture?.margins?.left ? `${template.pageArchitecture.margins.left}mm` : '20mm';
  const rightMargin = template?.pageArchitecture?.margins?.right ? `${template.pageArchitecture.margins.right}mm` : '20mm';
  const primaryColor = template?.primaryColor || '#14532D';

  const authorNames = meta.authors.map((a) => a.name).join(', ') || 'Tác giả';
  const paperTitle = meta.title || 'Bài báo khoa học';

  let typst = `// ==========================================================================\n`;
  typst += `// STRUCTPAPER UNIVERSAL TYPST COMPILER\n`;
  typst += `// Template: ${template?.name || 'Default Academic Paper'}\n`;
  typst += `// Article: ${paperTitle}\n`;
  typst += `// Generated At: ${new Date().toISOString()}\n`;
  typst += `// ==========================================================================\n\n`;

  // 1. Document Metadata
  typst += `#set document(\n`;
  typst += `  title: "${escapeTypstText(paperTitle)}",\n`;
  typst += `  author: (${meta.authors.map((a) => `"${escapeTypstText(a.name)}"`).join(', ')}),\n`;
  typst += `  keywords: (${(meta.keywords || []).map((k) => `"${escapeTypstText(k)}"`).join(', ')}),\n`;
  typst += `)\n\n`;

  // 2. Page & Font Configuration
  typst += `#set page(\n`;
  typst += `  paper: "a4",\n`;
  typst += `  margin: (top: ${topMargin}, bottom: ${bottomMargin}, left: ${leftMargin}, right: ${rightMargin}),\n`;
  typst += `  header: locate(loc => {\n`;
  typst += `    if loc.page() > 1 [\n`;
  typst += `      #text(8pt, fill: luma(100), font: "Times New Roman")[\n`;
  typst += `        #grid(\n`;
  typst += `          columns: (1fr, auto),\n`;
  typst += `          align: (left, right),\n`;
  typst += `          [${escapeTypstText(meta.journalName || 'Tạp chí Khoa học & Công nghệ')}],\n`;
  typst += `          [${escapeTypstText(meta.year || '2026')} | Vol ${escapeTypstText(meta.volume || '1')} (No. ${escapeTypstText(meta.issue || '1')})]\n`;
  typst += `        )\n`;
  typst += `        #v(-2pt)#line(length: 100%, stroke: 0.5pt + luma(180))\n`;
  typst += `      ]\n`;
  typst += `    ]\n`;
  typst += `  }),\n`;
  typst += `  footer: locate(loc => {\n`;
  typst += `    text(8pt, fill: luma(120), font: "Times New Roman")[\n`;
  typst += `      #line(length: 100%, stroke: 0.5pt + luma(200))\n`;
  typst += `      #grid(\n`;
  typst += `        columns: (1fr, auto),\n`;
  typst += `        align: (left, right),\n`;
  typst += `        [DOI: #${meta.doi || '10.32508/structpaper'}],\n`;
  typst += `        [Trang #loc.page()]\n`;
  typst += `      )\n`;
  typst += `    ]\n`;
  typst += `  })\n`;
  typst += `)\n\n`;

  // 3. Typography & Paragraph Settings
  typst += `#set text(\n`;
  typst += `  font: "Times New Roman",\n`;
  typst += `  size: 10pt,\n`;
  typst += `  lang: "vi",\n`;
  typst += `  spacing: 120%,\n`;
  typst += `)\n\n`;

  typst += `#set par(\n`;
  typst += `  justify: true,\n`;
  typst += `  first-line-indent: 14pt,\n`;
  typst += `  leading: 0.65em,\n`;
  typst += `)\n\n`;

  // 4. Heading Rules
  typst += `#show heading.where(level: 1): it => block(above: 14pt, below: 8pt)[\n`;
  typst += `  #set text(fill: rgb("${primaryColor}"), weight: "bold", size: 11pt)\n`;
  typst += `  #it.body\n`;
  typst += `]\n\n`;

  typst += `#show heading.where(level: 2): it => block(above: 10pt, below: 6pt)[\n`;
  typst += `  #set text(fill: black, weight: "bold", size: 10pt)\n`;
  typst += `  #it.body\n`;
  typst += `]\n\n`;

  // 5. Front-matter Header (Journal Name & Type)
  typst += `// --- FRONT MATTER ---\n`;
  typst += `#place(top + left, float: false)[\n`;
  typst += `  #grid(\n`;
  typst += `    columns: (1fr, auto),\n`;
  typst += `    align: (left + horizon, right + horizon),\n`;
  typst += `    [\n`;
  typst += `      #text(9pt, weight: "bold", fill: rgb("${primaryColor}"))[${escapeTypstText(meta.journalName || 'Tạp chí Khoa học & Công nghệ')}]\n`;
  typst += `      #v(-3pt)\n`;
  typst += `      #text(8pt, style: "italic", fill: luma(80))[${escapeTypstText(meta.journalAbbv || '')}]\n`;
  typst += `    ],\n`;
  typst += `    [\n`;
  typst += `      #rect(radius: 4pt, fill: rgb("${primaryColor}").lighten(85%), stroke: 0.5pt + rgb("${primaryColor}"))[\n`;
  typst += `        #text(8pt, weight: "bold", fill: rgb("${primaryColor}"))[${escapeTypstText(meta.articleType || 'Bài báo nghiên cứu')}]\n`;
  typst += `      ]\n`;
  typst += `    ]\n`;
  typst += `  )\n`;
  typst += `]\n\n`;
  typst += `#v(8pt)\n\n`;

  // 6. Article Title
  typst += `// --- TITLE ---\n`;
  typst += `#align(center)[\n`;
  typst += `  #block(width: 90%)[\n`;
  typst += `    #text(16pt, weight: "bold", fill: rgb("${primaryColor}"))[${escapeTypstText(paperTitle)}]\n`;
  if (meta.titleEn) {
    typst += `    #v(4pt)\n`;
    typst += `    #text(11pt, style: "italic", fill: luma(60))[${escapeTypstText(meta.titleEn)}]\n`;
  }
  typst += `  ]\n`;
  typst += `]\n\n`;
  typst += `#v(10pt)\n\n`;

  // 7. Authors & Affiliations
  typst += `// --- AUTHORS & AFFILIATIONS ---\n`;
  typst += `#align(center)[\n`;
  const authorStrings = meta.authors.map((a) => {
    const affMarks = (a.affiliationIds || []).map((id) => `${id}`).join(',');
    const corrMark = a.isCorresponding ? "*" : "";
    return `*${escapeTypstText(a.name)}*#super[${affMarks}${corrMark}]`;
  });
  typst += `  #text(10.5pt)[${authorStrings.join(', ')}]\n`;
  typst += `]\n\n`;

  typst += `#v(4pt)\n`;
  typst += `#align(center)[\n`;
  for (const aff of meta.affiliations) {
    typst += `  #text(8.5pt, style: "italic", fill: luma(70))[#super[${aff.id}] ${escapeTypstText(aff.name)}]\n`;
  }
  if (meta.corresponding?.email) {
    typst += `  #text(8pt, fill: luma(90))[*Tác giả liên hệ: ${escapeTypstText(meta.corresponding.name || '')} (${escapeTypstText(meta.corresponding.email)})]\n`;
  }
  typst += `]\n\n`;
  typst += `#v(10pt)\n\n`;

  // 8. Abstract & Keywords Box
  typst += `// --- ABSTRACT & KEYWORDS ---\n`;
  typst += `#rect(width: 100%, stroke: 0.5pt + luma(180), radius: 4pt, fill: luma(250), inset: 10pt)[\n`;
  typst += `  #text(9pt, weight: "bold", fill: rgb("${primaryColor}"))[TÓM TẮT]\n`;
  typst += `  #v(2pt)\n`;
  typst += `  #text(9pt)[\n`;
  typst += `    ${escapeTypstText(meta.abstract || '')}\n`;
  typst += `  ]\n`;
  if (meta.keywords && meta.keywords.length > 0) {
    typst += `  #v(6pt)\n`;
    typst += `  #text(8.5pt)[*Từ khóa:* ${meta.keywords.map(escapeTypstText).join('; ')}]\n`;
  }
  typst += `]\n\n`;
  typst += `#v(12pt)\n\n`;

  // 9. Multi-column Body Setup (if template specifies multi-column)
  const isMultiCol = isIEEE || template?.zones?.some((z) => (z.columns || 1) > 1);
  if (isMultiCol) {
    typst += `// --- TWO-COLUMN BODY LAYOUT ---\n`;
    typst += `#show: columns.with(2, gutter: 16pt)\n\n`;
  }

  // 10. Sections Content
  typst += `// --- SECTIONS BODY ---\n`;
  for (const sec of paper.sections) {
    if (sec.type === 'h1') {
      typst += `\n= ${escapeTypstText(sec.title || '')}\n\n`;
    } else if (sec.type === 'h2') {
      typst += `\n== ${escapeTypstText(sec.title || '')}\n\n`;
    } else if (sec.type === 'h3') {
      typst += `\n=== ${escapeTypstText(sec.title || '')}\n\n`;
    } else if (sec.type === 'paragraph') {
      typst += `${escapeTypstText(sec.content)}\n\n`;
    } else if (sec.type === 'table' && sec.table) {
      typst += compileTableToTypst(sec.table);
    } else if (sec.type === 'figure' && sec.figure) {
      typst += compileFigureToTypst(sec.figure);
    }
  }

  // 11. References Section
  if (paper.references && paper.references.length > 0) {
    typst += `\n= TÀI LIỆU THAM KHẢO\n\n`;
    typst += `#set par(first-line-indent: 0pt, hanging-indent: 14pt)\n`;
    typst += `#text(8.5pt)[\n`;
    paper.references.forEach((ref, idx) => {
      typst += `  [${ref.id || idx + 1}] ${escapeTypstText(ref.raw || '')}\n\n`;
    });
    typst += `]\n`;
  }

  return typst;
}
