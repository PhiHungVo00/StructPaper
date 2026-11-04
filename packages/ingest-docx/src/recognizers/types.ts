import type { JournalProfile } from '@structpaper/journal-profiles';
import type { DocxPackage } from '../package/docx-package';
import type { StyleResolver } from '../ooxml/style-resolver';
import type { RawBlock } from '../types/raw-doc';

export type SemanticRole =
  | 'title'
  | 'titleEn'
  | 'authors'
  | 'affiliations'
  | 'corresponding'
  | 'date.received'
  | 'date.revised'
  | 'date.accepted'
  | 'date.published'
  | 'heading.abstract'
  | 'abstract'
  | 'keywords'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'paragraph'
  | 'equation'
  | 'table.caption'
  | 'table.cell'
  | 'table.note'
  | 'source'
  | 'figure.caption'
  | 'figure.placeholder'
  | 'reference'
  | 'heading.references'
  | 'back.ethics'
  | 'back.acknowledgments'
  | 'back.funding'
  | 'back.contributions'
  | 'back.conflict'
  | 'back.data_availability'
  | 'ignore'
  | 'unknown';

export interface Claim {
  role: SemanticRole;
  confidence: number;
  evidence: string;
  metadata?: Record<string, unknown>;
}

export interface IngestContext {
  profile: JournalProfile;
  docxPackage?: DocxPackage;
  styleResolver: StyleResolver;
  blockIndex: number;
  totalBlocks: number;
  previousClaims: Claim[];
}

export interface Recognizer {
  readonly id: string;
  readonly priority: number;
  recognize(block: RawBlock, ctx: IngestContext): Claim | null;
}
