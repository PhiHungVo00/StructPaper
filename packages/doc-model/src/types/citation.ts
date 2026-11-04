import type { Id } from './inline';

export interface Reference {
  id: Id;
  raw: string;
  csl?: Record<string, unknown>;
  doi?: string;
  url?: string;
  parse: 'ok' | 'partial' | 'failed';
}

export interface CitationStyle {
  name: string;
  formatCitation(numbers: number[]): string;
}

export interface ComputedNumbering {
  figures: Record<Id, number>;
  tables: Record<Id, number>;
  equations: Record<Id, number>;
  citations: Record<Id, number>;
  citationOrder: Id[];
  uncitedRefs: Id[];
  danglingCites: Id[];
}
