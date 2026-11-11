import { Paragraph, Table, TableRow, TableCell, TextRun, WidthType, ShadingType, AlignmentType, VerticalAlign } from 'docx';
import type { PaperTable, TableCell as PaperCell } from '@/types/paper';
import type { ResolvedTheme } from './theme-config';

import { stripCaptionLabel } from './docx-table-extras';
import { resolveBodyFill, rowIsTinted } from './table-fill';
const FONT_SERIF = 'Times New Roman';
const FONT_SANS = 'Calibri';

/** One Paragraph per line, so multi-line cells keep their line breaks in Word. */
function cellParagraphs(text: string, font: string, size: number, bold = false, center = false): Paragraph[] {
  return String(text ?? '')
    .split('\n')
    .map((line) => new Paragraph({ alignment: center ? AlignmentType.CENTER : undefined, children: [new TextRun({ text: line, font, size, bold })] }));
}

/** Cell rows with spans; plain string rows become one-cell-per-column rows. */
const asCells = (rows: string[][]): PaperCell[][] => rows.map((r) => r.map((text) => ({ text })));

/**
 * Word table block: caption, the table (header rows repeat on every page, rows never split,
 * merged cells kept: colSpan -> gridSpan, rowSpan -> vMerge), and the "Nguồn: …" source line.
 */
export function buildDocxTable(table: PaperTable, theme: ResolvedTheme, widthTwips?: number): Array<Paragraph | Table> {
  const out: Array<Paragraph | Table> = [];
  const bodyFill = resolveBodyFill(table);
  const COLOR_TITLE = theme.titleColor.slice(1);
  out.push(
    new Paragraph({
      style: 'TableCaption',
      keepNext: true,
      children: [
        new TextRun({ text: `Bảng ${table.num}: `, font: FONT_SANS, size: 17, bold: true, color: COLOR_TITLE }),
        new TextRun({ text: stripCaptionLabel(table.caption), font: FONT_SANS, size: 17, bold: true }),
      ],
      spacing: { before: 200, after: 100 },
    })
  );

  const headerRows: PaperCell[][] = table.headerRows && table.headerRows.length > 1 ? table.headerRows : [table.headers.map((text) => ({ text }))];
  const bodyRows: PaperCell[][] = table.bodyRows && table.bodyRows.length > 0 ? table.bodyRows : asCells(table.rows || []);
  const cols = Math.max(table.headers.length, ...bodyRows.map((r) => r.reduce((n, c) => n + (c.colSpan ?? 1), 0)), 1);

  const cell = (c: PaperCell, header: boolean, fill: string) =>
    new TableCell({
      shading: { type: ShadingType.CLEAR, fill, color: 'auto' },
      verticalAlign: VerticalAlign.CENTER,
      ...(c.colSpan && c.colSpan > 1 ? { columnSpan: c.colSpan } : {}),
      ...(c.rowSpan && c.rowSpan > 1 ? { rowSpan: c.rowSpan } : {}),
      children: cellParagraphs(c.text, header ? FONT_SANS : FONT_SERIF, 16, header, header || (c.colSpan ?? 1) > 1),
    });

  const tableRows: TableRow[] = [
    ...headerRows.map(
      (r) =>
        new TableRow({
          // Repeat the header rows on every page the table spans; never split a row.
          tableHeader: theme.repeatTableHeader,
          cantSplit: true,
          children: r.map((c) => cell(c, true, theme.tableHeaderColor.slice(1))),
        })
    ),
    ...bodyRows.map(
      (r, rIdx) =>
        new TableRow({
          cantSplit: true,
          children: r.map((c) => cell(c, false, rowIsTinted(bodyFill, rIdx) ? theme.tableZebraColor.slice(1) : 'FFFFFF')),
        })
    ),
  ];

  out.push(
    new Table({
      rows: tableRows,
      ...(widthTwips
        ? { width: { size: widthTwips, type: WidthType.DXA }, columnWidths: Array(cols).fill(Math.floor(widthTwips / cols)) }
        : { width: { size: 100, type: WidthType.PERCENTAGE } }),
    })
  );
  if (table.source && table.source.trim()) {
    out.push(
      new Paragraph({
        style: 'SourceLine',
        children: table.source.split('\n').flatMap((l, i) => [new TextRun({ text: l, font: FONT_SANS, size: 15, italics: true, break: i > 0 ? 1 : 0 })]),
        spacing: { before: 40, after: 160 },
      })
    );
  } else {
    out.push(new Paragraph({ spacing: { after: 120 }, children: [] }));
  }
  return out;
}
