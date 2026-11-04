import type { Manuscript, Section, Block, TableBlock } from '@structpaper/doc-model';
import type { RawDoc } from '../types/raw-doc';
import type { Claim } from '../recognizers/types';

export interface IngestConfidenceScores {
  overall: number;
  title: number;
  authors: number;
  sections: number;
  tables: number;
}

export const CONFIDENCE_WEIGHTS = {
  title: 0.3,
  authors: 0.3,
  sections: 0.2,
  tables: 0.2,
} as const;

/**
 * Counts all table blocks recursively in an array of sections.
 */
function countTablesInSections(sections: Section[]): number {
  let count = 0;
  for (const sec of sections) {
    for (const b of sec.blocks) {
      if (b.type === 'table') count++;
      if (b.type === 'box') {
        const box = b as any;
        if (box.content) {
          count += box.content.filter((cb: Block) => cb.type === 'table').length;
        }
      }
    }
    if (sec.children && sec.children.length > 0) {
      count += countTablesInSections(sec.children);
    }
  }
  return count;
}

/**
 * Calculates weighted confidence scores for an assembled Manuscript.
 * - Title: 30%
 * - Authors: 30%
 * - Sections: 20%
 * - Tables: 20%
 */
export function calculateConfidence(
  doc: Manuscript,
  rawDoc?: RawDoc,
  claims?: Claim[]
): IngestConfidenceScores {
  // 1. Title Score (30%)
  let titleScore = 0;
  const titleText = doc.meta.title
    .filter((inline) => inline.t === 'text')
    .map((inline: any) => inline.v)
    .join('')
    .trim();

  if (titleText.length > 0) {
    // If claims are provided, take confidence of title claim
    const titleClaim = claims?.find((c) => c.role === 'title');
    titleScore = titleClaim ? titleClaim.confidence : 1.0;
  }

  // 2. Authors Score (30%)
  let authorsScore = 0;
  if (doc.meta.authors.length > 0) {
    const hasValidAuthor = doc.meta.authors.some(
      (a) => a.name && a.name.trim().length > 0
    );
    if (hasValidAuthor) {
      const authorClaim = claims?.find((c) => c.role === 'authors');
      authorsScore = authorClaim ? authorClaim.confidence : 1.0;
    }
  }

  // 3. Sections Score (20%)
  let sectionsScore = 0;
  if (doc.body.length > 0) {
    const hasContent = doc.body.some(
      (sec) => sec.blocks.length > 0 || sec.children.length > 0
    );
    if (hasContent) {
      sectionsScore = 1.0;
    }
  }

  // 4. Tables Score (20%)
  let tablesScore = 1.0;
  if (rawDoc) {
    const rawTableCount = rawDoc.blocks.filter((b) => b.type === 'table').length;
    if (rawTableCount > 0) {
      const extractedTableCount = countTablesInSections(doc.body);
      tablesScore = Math.min(1.0, extractedTableCount / rawTableCount);
    } else {
      // Document genuinely has no tables
      tablesScore = 1.0;
    }
  }

  // 5. Overall Weighted Score
  const overallRaw =
    CONFIDENCE_WEIGHTS.title * titleScore +
    CONFIDENCE_WEIGHTS.authors * authorsScore +
    CONFIDENCE_WEIGHTS.sections * sectionsScore +
    CONFIDENCE_WEIGHTS.tables * tablesScore;

  const overall = Math.round(overallRaw * 1000) / 1000;

  return {
    overall,
    title: Math.round(titleScore * 1000) / 1000,
    authors: Math.round(authorsScore * 1000) / 1000,
    sections: Math.round(sectionsScore * 1000) / 1000,
    tables: Math.round(tablesScore * 1000) / 1000,
  };
}
