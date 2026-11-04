/**
 * Raw Document Types for DOCX Ingest Pipeline
 * Represents unnormalized OOXML constructs extracted from word/document.xml
 */

export interface RawRun {
  text: string;
  bold?: boolean;
  italic?: boolean;
  sup?: boolean;
  sub?: boolean;
  code?: boolean;
  font?: string;
  size?: number;
}

export interface RawMath {
  omml: string;
  isBlock: boolean;
}

export interface RawDrawing {
  rId: string;
  filename?: string;
  description?: string;
  width?: number;
  height?: number;
}

export interface RawField {
  instruction: string;
  resultText: string;
}

export interface RawParagraph {
  type: 'paragraph';
  styleId?: string;
  styleName?: string;
  runs: RawRun[];
  math?: RawMath[];
  drawings?: RawDrawing[];
  fields?: RawField[];
  rawText: string;
  alignment?: string;
}

export interface RawCell {
  paragraphs: RawParagraph[];
  gridSpan: number;
  vMerge?: 'restart' | 'continue';
  width?: number;
}

export interface RawRow {
  cells: RawCell[];
  isHeader?: boolean;
}

export interface RawTable {
  type: 'table';
  rows: RawRow[];
  colCount: number;
  rowCount: number;
}

export type RawBlock = RawParagraph | RawTable;

export interface StyleInfo {
  id: string;
  name: string;
  basedOn?: string;
  type?: string;
  next?: string;
  isCustom?: boolean;
}

export interface RawDoc {
  blocks: RawBlock[];
  styles: Map<string, StyleInfo>;
  media: Map<string, Uint8Array>;
  rels: Map<string, string>;
}

export interface RawDocVisitorOptions {
  trackChanges?: 'acceptAll' | 'rejectAll';
}
