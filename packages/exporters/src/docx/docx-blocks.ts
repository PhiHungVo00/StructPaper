/**
 * Blocks & Sections to docx Paragraph and Table converter
 */

import {
  AlignmentType,
  BorderStyle,
  HeadingLevel,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from 'docx';
import type { Block, Section, Cell } from '@structpaper/doc-model';
import {
  inlinesToDocx,
  inlinesToPlainText,
  type DocxInlineContext,
} from './docx-inlines';

export type DocxElement = Paragraph | Table;

/**
 * Converts a table cell to docx TableCell.
 */
function cellToDocx(cell: Cell, isHeader: boolean, ctx: DocxInlineContext): TableCell {
  const align =
    cell.align === 'c'
      ? AlignmentType.CENTER
      : cell.align === 'r'
        ? AlignmentType.RIGHT
        : AlignmentType.LEFT;

  const contentParagraph = new Paragraph({
    alignment: align,
    children: inlinesToDocx(cell.content, ctx),
  });

  return new TableCell({
    children: [contentParagraph],
    columnSpan: cell.colSpan > 1 ? cell.colSpan : undefined,
    rowSpan: cell.rowSpan > 1 ? cell.rowSpan : undefined,
    shading:
      isHeader || cell.header
        ? { fill: 'F0F4F8', type: ShadingType.CLEAR }
        : undefined,
    margins: {
      top: 100,
      bottom: 100,
      left: 120,
      right: 120,
    },
  });
}

/**
 * Converts a single Block to an array of docx Elements (Paragraphs/Tables).
 */
export function blockToDocx(block: Block, ctx: DocxInlineContext): DocxElement[] {
  switch (block.type) {
    case 'paragraph': {
      return [
        new Paragraph({
          children: inlinesToDocx(block.content, ctx),
          spacing: { after: 120, line: 276 },
        }),
      ];
    }

    case 'list': {
      const elements: DocxElement[] = [];
      for (const itemBlocks of block.items) {
        for (const b of itemBlocks) {
          if (b.type === 'paragraph') {
            elements.push(
              new Paragraph({
                bullet: { level: 0 },
                children: inlinesToDocx(b.content, ctx),
                spacing: { after: 60, line: 276 },
              })
            );
          } else {
            elements.push(...blockToDocx(b, ctx));
          }
        }
      }
      return elements;
    }

    case 'quote': {
      const elements: DocxElement[] = [];
      for (const b of block.content) {
        if (b.type === 'paragraph') {
          elements.push(
            new Paragraph({
              indent: { left: 720 },
              children: inlinesToDocx(b.content, ctx),
              spacing: { before: 60, after: 60, line: 276 },
            })
          );
        } else {
          elements.push(...blockToDocx(b, ctx));
        }
      }
      return elements;
    }

    case 'box': {
      const elements: DocxElement[] = [];
      for (const b of block.content) {
        if (b.type === 'paragraph') {
          elements.push(
            new Paragraph({
              indent: { left: 360, right: 360 },
              border: {
                left: {
                  style: BorderStyle.SINGLE,
                  size: 16,
                  color: '003366',
                },
              },
              children: inlinesToDocx(b.content, ctx),
              spacing: { before: 60, after: 60, line: 276 },
            })
          );
        } else {
          elements.push(...blockToDocx(b, ctx));
        }
      }
      return elements;
    }

    case 'equation': {
      const runs: TextRun[] = [
        new TextRun({
          text: block.latex,
          italics: true,
          font: { name: 'Cambria Math' },
        }),
      ];
      if (block.numbered && block.label) {
        runs.push(
          new TextRun({
            text: `    ${block.label}`,
            bold: true,
          })
        );
      }
      return [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 140, after: 140 },
          children: runs,
        }),
      ];
    }

    case 'figure': {
      const elements: DocxElement[] = [];
      // Figure caption
      elements.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 140, after: 60 },
          children: [
            new TextRun({ text: 'Hình: ', bold: true }),
            ...inlinesToDocx(block.caption, ctx),
          ],
        })
      );
      if (block.source) {
        elements.push(
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 140 },
            children: [
              new TextRun({ text: 'Nguồn: ', italics: true }),
              ...inlinesToDocx(block.source, ctx),
            ],
          })
        );
      }
      return elements;
    }

    case 'table': {
      const elements: DocxElement[] = [];

      // Caption
      elements.push(
        new Paragraph({
          spacing: { before: 140, after: 60 },
          children: [
            new TextRun({ text: 'Bảng: ', bold: true }),
            ...inlinesToDocx(block.caption, ctx),
          ],
        })
      );

      // Table grid
      const rows = block.grid.map((row, rowIndex) => {
        const isHeaderRow = rowIndex < block.headerRows;
        return new TableRow({
          tableHeader: isHeaderRow,
          children: row.map((c) => cellToDocx(c, isHeaderRow, ctx)),
        });
      });

      elements.push(
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows,
        })
      );

      if (block.notes) {
        elements.push(
          new Paragraph({
            spacing: { before: 60, after: 60 },
            children: [
              new TextRun({ text: 'Ghi chú: ', italics: true }),
              ...inlinesToDocx(block.notes, ctx),
            ],
          })
        );
      }

      if (block.source) {
        elements.push(
          new Paragraph({
            spacing: { after: 140 },
            children: [
              new TextRun({ text: 'Nguồn: ', italics: true }),
              ...inlinesToDocx(block.source, ctx),
            ],
          })
        );
      }

      return elements;
    }

    case 'pageBreak':
      return [];

    default:
      return [];
  }
}

/**
 * Converts a Section and its nested children to docx elements.
 */
export function sectionToDocx(
  section: Section,
  ctx: DocxInlineContext
): DocxElement[] {
  const elements: DocxElement[] = [];

  const headingLevel =
    section.level === 1
      ? HeadingLevel.HEADING_1
      : section.level === 2
        ? HeadingLevel.HEADING_2
        : HeadingLevel.HEADING_3;

  // Section Heading
  elements.push(
    new Paragraph({
      heading: headingLevel,
      spacing: { before: 240, after: 120 },
      children: inlinesToDocx(section.title, ctx),
    })
  );

  // Section Blocks
  for (const block of section.blocks || []) {
    elements.push(...blockToDocx(block, ctx));
  }

  // Children Sections
  for (const child of section.children || []) {
    elements.push(...sectionToDocx(child, ctx));
  }

  return elements;
}
