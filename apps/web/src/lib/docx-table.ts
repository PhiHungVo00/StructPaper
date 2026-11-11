import { Paragraph, Table, TableRow, TableCell, TextRun, WidthType, ShadingType } from 'docx';
import type { PaperTable } from '@/types/paper';
import type { ResolvedTheme } from './theme-config';

const FONT_SERIF = 'Times New Roman';
const FONT_SANS = 'Calibri';

/**
 * Word table block: caption, the table (header row repeats on every page and rows never split
 * across pages), and the "Nguồn: …" source line.
 */
export function buildDocxTable(table: PaperTable, theme: ResolvedTheme): Array<Paragraph | Table> {
  const out: Array<Paragraph | Table> = [];
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
              text: table.caption,
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
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: h,
                        font: FONT_SANS,
                        size: 16, // 8pt
                        bold: true,
                      }),
                    ],
                  }),
                ],
              })
          ),
        }),
      ];

      table.rows.forEach((row, rIdx) => {
        const fill = rIdx % 2 === 0 ? theme.tableZebraColor.slice(1) : 'FFFFFF';
        tableRows.push(
          new TableRow({
            cantSplit: true,
            children: row.map(
              (cell) =>
                new TableCell({
                  shading: { type: ShadingType.CLEAR, fill },
                  children: [
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: cell,
                          font: FONT_SERIF,
                          size: 16, // 8pt
                        }),
                      ],
                    }),
                  ],
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
            children: [new TextRun({ text: table.source, font: FONT_SANS, size: 15, italics: true })],
            spacing: { before: 40, after: 160 },
          })
        );
      }
  return out;
}
