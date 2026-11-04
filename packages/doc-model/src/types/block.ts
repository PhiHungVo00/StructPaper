import type { Id, Inline } from './inline';

export interface Cell {
  content: Inline[];
  rowSpan: number;
  colSpan: number;
  align?: 'l' | 'c' | 'r';
  header?: boolean;
}

export interface ParagraphBlock {
  type: 'paragraph';
  id: Id;
  content: Inline[];
}

export interface ListBlock {
  type: 'list';
  id: Id;
  ordered: boolean;
  items: Block[][];
}

export interface QuoteBlock {
  type: 'quote';
  id: Id;
  content: Block[];
}

export interface BoxBlock {
  type: 'box';
  id: Id;
  content: Block[];
}

export interface EquationBlock {
  type: 'equation';
  id: Id;
  latex: string;
  omml?: string;
  numbered: boolean;
  label?: string;
  status: 'ok' | 'fallback-image';
}

export interface FigurePanel {
  id: Id;
  assetId: string;
  label?: string;
  caption?: Inline[];
}

export interface FigureLayout {
  columnSpan?: '1-column' | '2-column';
  alignment?: 'left' | 'center' | 'right';
  scalePercent?: number;
  [key: string]: unknown;
}

export interface FigureBlock {
  type: 'figure';
  id: Id;
  assetId: string;
  caption: Inline[];
  source?: Inline[];
  panels?: FigurePanel[];
  layout: FigureLayout | Record<string, unknown>;
}

export interface TableLayout {
  columnSpan?: '1-column' | '2-column';
  alignment?: 'left' | 'center' | 'right';
  [key: string]: unknown;
}

export interface TableBlock {
  type: 'table';
  id: Id;
  caption: Inline[];
  grid: Cell[][];
  headerRows: number;
  notes?: Inline[];
  source?: Inline[];
  layout: TableLayout | Record<string, unknown>;
}

export interface PageBreakBlock {
  type: 'pageBreak';
  id: Id;
}

export type Block =
  | ParagraphBlock
  | ListBlock
  | QuoteBlock
  | BoxBlock
  | EquationBlock
  | FigureBlock
  | TableBlock
  | PageBreakBlock;

export interface Section {
  id: Id;
  level: 1 | 2 | 3;
  title: Inline[];
  blocks: Block[];
  children: Section[];
}
