/**
 * Abstract Syntax Tree types for in-browser LaTeX parser
 */

export type ASTBlockType =
  | 'h1'
  | 'h2'
  | 'h3'
  | 'paragraph'
  | 'table'
  | 'figure'
  | 'reference';

export interface ASTTable {
  caption?: string;
  headers: string[];
  rows: string[][];
}

export interface ASTFigure {
  caption?: string;
  src?: string;
}

export interface ASTReference {
  id: string;
  text: string;
  num?: number;
}

export interface ASTBlock {
  id: string;
  type: ASTBlockType;
  title?: string;
  content?: string;
  table?: ASTTable;
  figure?: ASTFigure;
  reference?: ASTReference;
}

export interface ASTMetadata {
  title: string;
  authors: string[];
  affiliations: string[];
  abstract: string;
  keywords: string[];
  journalName?: string;
  journalShortName?: string;
  articleType?: string;
  doi?: string;
}

export interface PaperAST {
  metadata: ASTMetadata;
  blocks: ASTBlock[];
}
