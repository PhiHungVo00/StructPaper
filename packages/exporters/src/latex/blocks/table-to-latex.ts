/**
 * Table Block to LaTeX Converter
 *
 * Converts TableBlock AST nodes into booktabs-styled LaTeX tabular environments.
 * Correctly calculates 2D placement matrix to support colSpan (\multicolumn)
 * and rowSpan (\multirow) merges, alignments, captions, notes, and sources.
 */

import type { Cell, TableBlock } from '@structpaper/doc-model';
import { formatLatexKey } from '../escape-tex';
import { inlinesToLatex } from './inlines-to-latex';

interface Slot {
  cell: Cell;
  isOrigin: boolean;
  isRowContinuation: boolean;
  isColContinuation: boolean;
}

/**
 * Resolves a 2D matrix of CellSlots accounting for rowSpan and colSpan.
 */
function resolveSlotMatrix(grid: Cell[][]): { slots: (Slot | null)[][]; numCols: number } {
  const numRows = grid.length;
  const slots: (Slot | null)[][] = Array.from({ length: numRows }, () => []);

  for (let r = 0; r < numRows; r++) {
    let cellIdx = 0;
    let c = 0;

    while (cellIdx < grid[r].length) {
      // Find next free column in row r
      while (slots[r][c] != null) {
        c++;
      }

      const cell = grid[r][cellIdx++];
      const rSpan = Math.max(1, cell.rowSpan || 1);
      const cSpan = Math.max(1, cell.colSpan || 1);

      for (let dr = 0; dr < rSpan; dr++) {
        const targetR = r + dr;
        if (!slots[targetR]) {
          slots[targetR] = [];
        }
        for (let dc = 0; dc < cSpan; dc++) {
          const targetC = c + dc;
          slots[targetR][targetC] = {
            cell,
            isOrigin: dr === 0 && dc === 0,
            isRowContinuation: dr > 0 && dc === 0,
            isColContinuation: dc > 0,
          };
        }
      }
      c += cSpan;
    }
  }

  const numCols = Math.max(1, ...slots.map((row) => row.length));
  return { slots, numCols };
}

/**
 * Infers the column alignment specifier from the slots.
 */
function inferColSpec(slots: (Slot | null)[][], numCols: number): string {
  const specs: string[] = [];
  for (let c = 0; c < numCols; c++) {
    let align = 'l';
    for (let r = 0; r < slots.length; r++) {
      const slot = slots[r]?.[c];
      if (slot?.isOrigin && slot.cell.align) {
        align = slot.cell.align;
        break;
      }
    }
    specs.push(align);
  }
  return specs.join('');
}

/**
 * Converts a TableBlock into standard booktabs LaTeX table markup.
 */
export function tableToLatex(block: TableBlock): string {
  const marker = `%%BLOCK:${block.id}\n`;
  const isTwoColumn = block.layout?.columnSpan === '2-column';
  const env = isTwoColumn ? 'table*' : 'table';
  const labelKey = formatLatexKey(block.id, 'tab');
  const captionText = inlinesToLatex(block.caption);

  if (!block.grid || block.grid.length === 0) {
    return `${marker}\\begin{${env}}[htbp]\n\\centering\n\\caption{${captionText}}\n\\label{${labelKey}}\n\\textit{[Bảng trống]}\n\\end{${env}}`;
  }

  const { slots, numCols } = resolveSlotMatrix(block.grid);
  const colSpec = inferColSpec(slots, numCols);
  const headerRows = Math.max(0, block.headerRows ?? 1);

  const rowLines: string[] = [];
  rowLines.push('\\toprule');

  for (let r = 0; r < slots.length; r++) {
    const rowTokens: string[] = [];
    let c = 0;

    while (c < numCols) {
      const slot = slots[r]?.[c];
      if (!slot) {
        rowTokens.push('');
        c++;
        continue;
      }

      if (slot.isColContinuation) {
        c++;
        continue;
      }

      if (slot.isRowContinuation) {
        const cSpan = Math.max(1, slot.cell.colSpan || 1);
        if (cSpan > 1) {
          const align = slot.cell.align || 'l';
          rowTokens.push(`\\multicolumn{${cSpan}}{${align}}{}`);
          c += cSpan;
        } else {
          rowTokens.push('');
          c++;
        }
        continue;
      }

      // Origin cell
      let content = inlinesToLatex(slot.cell.content);
      const isHeader = slot.cell.header || r < headerRows;
      if (isHeader && content.trim() && !content.startsWith('\\textbf{')) {
        content = `\\textbf{${content}}`;
      }

      const rSpan = Math.max(1, slot.cell.rowSpan || 1);
      const cSpan = Math.max(1, slot.cell.colSpan || 1);
      const align = slot.cell.align || 'l';

      if (rSpan > 1 && cSpan > 1) {
        rowTokens.push(`\\multicolumn{${cSpan}}{${align}}{\\multirow{${rSpan}}{*}{${content}}}`);
        c += cSpan;
      } else if (cSpan > 1) {
        rowTokens.push(`\\multicolumn{${cSpan}}{${align}}{${content}}`);
        c += cSpan;
      } else if (rSpan > 1) {
        rowTokens.push(`\\multirow{${rSpan}}{*}{${content}}`);
        c++;
      } else {
        rowTokens.push(content);
        c++;
      }
    }

    rowLines.push(rowTokens.join(' & ') + ' \\\\');

    // Add midrule after header rows
    if (headerRows > 0 && r === headerRows - 1 && r < slots.length - 1) {
      rowLines.push('\\midrule');
    }
  }

  rowLines.push('\\bottomrule');

  const lines: string[] = [
    marker + `\\begin{${env}}[htbp]`,
    '\\centering',
    `\\caption{${captionText}}`,
    `\\label{${labelKey}}`,
    `\\begin{tabular}{${colSpec}}`,
    ...rowLines,
    '\\end{tabular}',
  ];

  if (block.notes && block.notes.length > 0) {
    lines.push(`\\vspace{3pt}\\par{\\footnotesize\\textit{Ghi chú: ${inlinesToLatex(block.notes)}}}\\par`);
  }

  if (block.source && block.source.length > 0) {
    lines.push(`\\vspace{2pt}\\par{\\footnotesize\\textit{Nguồn: ${inlinesToLatex(block.source)}}}\\par`);
  }

  lines.push(`\\end{${env}}`);

  return lines.join('\n');
}
