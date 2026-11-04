import type { Manuscript, Command, ComputedNumbering } from '@structpaper/doc-model';
import type { JournalProfile } from '@structpaper/journal-profiles';

export type QcCategory = 'metadata' | 'structure' | 'numbering' | 'floats' | 'references';

export type QcSeverity = 'error' | 'warning' | 'info';

export type QcPillarId =
  | 'imrad'
  | 'figures'
  | 'tables'
  | 'citations'
  | 'authors_abstract'
  | 'format'
  | string;

export interface QcIssue {
  id: string;
  ruleId: string;
  severity: QcSeverity;
  message: string;
  pillar: string;
  targetId?: string;
  fix?: Command;
  title?: string;
  suggestion?: string;
  fixTab?: string;
}

export interface QcContext {
  numbering?: ComputedNumbering;
  [key: string]: unknown;
}

export interface QcRule {
  id: string;
  name: string;
  category: QcCategory;
  check(doc: Manuscript, profile: JournalProfile, context?: QcContext): QcIssue[];
}

export interface QcPillarResult {
  name: string;
  score: number;
  maxScore: number;
  issuesCount: number;
}

export interface QcResult {
  score: number;
  valid: boolean;
  issues: QcIssue[];
  pillars: Record<string, QcPillarResult>;
}
