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
  figures: Map<Id, number>;
  tables: Map<Id, number>;
  equations: Map<Id, number>;
  citations: Map<Id, number>;
  citationOrder: Id[];
  citationLabels: Map<Id, string>;
  bibliographyOrder: Id[];
  uncitedRefs: Id[];
  danglingCites: Id[];
  xrefBroken: Id[];
  firstMentionBeforeFloat: Map<Id, boolean>;
}
