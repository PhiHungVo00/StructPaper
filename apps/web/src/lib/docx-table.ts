import { Paragraph, Table, TableRow, TableCell, TextRun, WidthType, ShadingType } from 'docx';
import type { PaperTable } from '@/types/paper';
import type { ResolvedTheme } from './theme-config';

import { stripCaptionLabel } from './docx-table-extras';
import { resolveBodyFill, rowIsTinted } from './table-fill';
const FONT_SERIF = 'Times New Roman';
const FONT_SANS = 'Calibri';

/** One Paragraph per line, so multi-line cells keep their line breaks in Word. */
function cellParagraphs(text: string, font: string, size: number, bold = false): Paragraph[] {
  return String(text ?? '')
    .split('\n')
    .map((line) => new Paragraph({ children: [new TextRun({ text: line, font, size, bold })] }));
}

/**
 * Word table block: caption, the table (header row repeats on every page and rows never split
 * across pages), and the "Nguồn: …" source line.
 */
export function buildDocxTable(table: PaperTable, theme: ResolvedTheme): Array<Paragraph | Table> {
  const out: Array<Paragraph | Table> = [];
  const bodyFill = resolveBodyFill(table);
  const COLOR_TITLE = theme.titleColor.slice(1);
      out.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `Bảng ${table.num}: `,
              font: FONT_SANS,
              size: 17, // 8.5pt
              bold: true,
              color: COLOR_TITLE,
            }),
            new TextRun({
              text: stripCaptionLabel(table.caption),
              font: FONT_SANS,
              size: 17,
              bold: true,
            }),
          ],
          spacing: { before: 200, after: 100 },
        })
      );

      const tableRows: TableRow[] = [
        new TableRow({
          // Repeat the header row on every page the table spans; never split a row.
          tableHeader: theme.repeatTableHeader,
          cantSplit: true,
          children: table.headers.map(
            (h) =>
              new TableCell({
                shading: { type: ShadingType.CLEAR, fill: theme.tableHeaderColor.slice(1) },
                children: cellParagraphs(h, FONT_SANS, 16, true),
              })
          ),
        }),
      ];

      table.rows.forEach((row, rIdx) => {
        const fill = rowIsTinted(bodyFill, rIdx) ? theme.tableZebraColor.slice(1) : 'FFFFFF';
        tableRows.push(
          new TableRow({
            cantSplit: true,
            children: row.map(
              (cell) =>
                new TableCell({
                  shading: { type: ShadingType.CLEAR, fill },
                  children: cellParagraphs(cell, FONT_SERIF, 16),
                })
            ),
          })
        );
      });

      out.push(
        new Table({
          rows: tableRows,
          width: { size: 100, type: WidthType.PERCENTAGE },
        })
      );
      if (table.source && table.source.trim()) {
        out.push(
          new Paragraph({
            children: table.source.split('\n').flatMap((l, i) => [new TextRun({ text: l, font: FONT_SANS, size: 15, italics: true, break: i > 0 ? 1 : 0 })]),
            spacing: { before: 40, after: 160 },
          })
        );
      }
  return out;
}
