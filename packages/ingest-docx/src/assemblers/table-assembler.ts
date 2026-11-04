import type { Cell, TableBlock } from '@structpaper/doc-model';
import type { RawCell, RawParagraph, RawTable } from '../types/raw-doc';
import type { RecognizedBlock } from './types';
import { paragraphToInlines } from './inline-utils';

export interface AssembleTableOptions {
  id?: string;
  captionBlock?: RecognizedBlock;
  noteBlock?: RecognizedBlock;
  sourceBlock?: RecognizedBlock;
  headerRows?: number;
}

/**
 * TableAssembler converts RawTable OOXML representations into normalized TableBlock
 * structures, resolving column spans (w:gridSpan) and vertical row merges (w:vMerge).
 */
export class TableAssembler {
  private idCounter = 0;

  /**
   * Assembles a RawTable into a TableBlock.
   */
  public assembleTable(
    rawTable: RawTable,
    options: AssembleTableOptions = {}
  ): TableBlock {
    const id = options.id || `tbl-${++this.idCounter}`;

    // Determine header rows count: options -> explicit isHeader -> default 1
    let headerRows = options.headerRows;
    if (headerRows === undefined) {
      let explicitHeaderCount = 0;
      for (const row of rawTable.rows) {
        if (row.isHeader) {
          explicitHeaderCount++;
        } else {
          break;
        }
      }
      headerRows = explicitHeaderCount > 0 ? explicitHeaderCount : rawTable.rows.length > 0 ? 1 : 0;
    }

    const grid = this.resolveMatrix(rawTable, headerRows);

    const caption = options.captionBlock?.raw.type === 'paragraph'
      ? paragraphToInlines(options.captionBlock.raw)
      : [];

    const notes = options.noteBlock?.raw.type === 'paragraph'
      ? paragraphToInlines(options.noteBlock.raw)
      : undefined;

    const source = options.sourceBlock?.raw.type === 'paragraph'
      ? paragraphToInlines(options.sourceBlock.raw)
      : undefined;

    return {
      type: 'table',
      id,
      caption,
      grid,
      headerRows,
      ...(notes && notes.length > 0 ? { notes } : {}),
      ...(source && source.length > 0 ? { source } : {}),
      layout: {
        columnSpan: '1-column',
        alignment: 'center',
      },
    };
  }

  /**
   * Resolves gridSpan and vMerge into a normalized Cell[][] matrix.
   */
  private resolveMatrix(rawTable: RawTable, headerRows: number): Cell[][] {
    const grid: Cell[][] = [];
    const activeMergeMap = new Map<number, Cell>();

    for (let r = 0; r < rawTable.rows.length; r++) {
      const rawRow = rawTable.rows[r];
      const rowCells: Cell[] = [];
      const isHeaderRow = rawRow.isHeader ?? (r < headerRows);

      let colCursor = 0;

      for (const rawCell of rawRow.cells) {
        // Skip columns currently occupied by vertical merges from earlier rows
        while (activeMergeMap.has(colCursor)) {
          // If the cell in activeMergeMap is NOT continuing at this row position, check:
          // In OOXML, if a continuation cell is present at this column, rawCell will match it.
          // If rawCell itself has vMerge === 'continue', it handles this column.
          if (rawCell.vMerge === 'continue') {
            break;
          }
          // Otherwise, previous merge continues past without explicit rawCell (rare edge case)
          colCursor++;
        }

        const colSpan = Math.max(1, rawCell.gridSpan || 1);
        const align = this.extractCellAlignment(rawCell);
        const content = rawCell.paragraphs.flatMap((p) => paragraphToInlines(p));

        if (rawCell.vMerge === 'continue') {
          // Continuation of an active vertical merge
          const parentCell = activeMergeMap.get(colCursor);
          if (parentCell) {
            parentCell.rowSpan += 1;
            if (content.length > 0) {
              parentCell.content.push(...content);
            }
          }
          // Advance past all columns covered by this continued cell
          colCursor += colSpan;
        } else if (rawCell.vMerge === 'restart') {
          // Origin of a new vertical merge
          const cell: Cell = {
            content,
            rowSpan: 1,
            colSpan,
            align,
            header: isHeaderRow,
          };
          rowCells.push(cell);

          for (let c = colCursor; c < colCursor + colSpan; c++) {
            activeMergeMap.set(c, cell);
          }
          colCursor += colSpan;
        } else {
          // Standard cell without vertical merge
          for (let c = colCursor; c < colCursor + colSpan; c++) {
            activeMergeMap.delete(c);
          }

          const cell: Cell = {
            content,
            rowSpan: 1,
            colSpan,
            align,
            header: isHeaderRow,
          };
          rowCells.push(cell);
          colCursor += colSpan;
        }
      }

      grid.push(rowCells);
    }

    return grid;
  }

  private extractCellAlignment(cell: RawCell): 'l' | 'c' | 'r' {
    for (const p of cell.paragraphs) {
      if (p.alignment === 'center') return 'c';
      if (p.alignment === 'right') return 'r';
    }
    return 'l';
  }
}
