import { RawBlock, RawParagraph } from '../types/raw-doc';
import { Claim, IngestContext, Recognizer, SemanticRole } from './types';

const TABLE_CAPTION_REGEX = /^(bảng|table)\s+\d+[:.]/i;
const FIGURE_CAPTION_REGEX = /^(hình|figure|fig\.)\s+\d+[:.]/i;
const KEYWORDS_REGEX = /^(từ khóa|keywords?)\s*[:]/i;
const REFERENCE_ITEM_REGEX = /^\[\d+\]/;
const ROMAN_HEADING_REGEX = /^(I|II|III|IV|V|VI|VII|VIII|IX|X)\.?\s+[A-ZÀ-Ỹ]/i;
const NUMERIC_HEADING_REGEX = /^(\d+(?:\.\d+)*)\.?\s+[A-ZÀ-Ỹ]/i;
const ABSTRACT_HEADING_REGEX = /^(tóm tắt|abstract)\s*[:]?\s*$/i;
const REFERENCES_HEADING_REGEX = /^(tài liệu tham khảo|references)\s*[:]?\s*$/i;

/**
 * StructureRecognizer implements fallback heuristic rules for unstyled or Normal blocks.
 * Priority 2 (lower priority than StyleMapRecognizer).
 */
export class StructureRecognizer implements Recognizer {
  public readonly id = 'structure';
  public readonly priority = 2;

  public recognize(block: RawBlock, ctx: IngestContext): Claim | null {
    // 1. Table blocks without style -> table.cell (confidence 0.9)
    if (block.type === 'table') {
      return {
        role: 'table.cell',
        confidence: 0.9,
        evidence: 'structure:table',
      };
    }

    const text = block.rawText.trim();
    if (!text) {
      return null;
    }

    // 2. Table captions (confidence 0.85)
    if (TABLE_CAPTION_REGEX.test(text)) {
      return {
        role: 'table.caption',
        confidence: 0.85,
        evidence: 'structure:table-caption',
      };
    }

    // 3. Figure captions (confidence 0.85)
    if (FIGURE_CAPTION_REGEX.test(text)) {
      return {
        role: 'figure.caption',
        confidence: 0.85,
        evidence: 'structure:figure-caption',
      };
    }

    // 4. Keywords (confidence 0.85)
    if (KEYWORDS_REGEX.test(text)) {
      return {
        role: 'keywords',
        confidence: 0.85,
        evidence: 'structure:keywords',
      };
    }

    // 5. Reference items [n] (confidence 0.8)
    if (REFERENCE_ITEM_REGEX.test(text)) {
      return {
        role: 'reference',
        confidence: 0.8,
        evidence: 'structure:reference-item',
      };
    }

    // 6. Section headings by numbering pattern (confidence 0.8)
    if (ROMAN_HEADING_REGEX.test(text)) {
      return {
        role: 'h1',
        confidence: 0.8,
        evidence: 'structure:heading-roman',
      };
    }

    const numMatch = text.match(NUMERIC_HEADING_REGEX);
    if (numMatch) {
      const parts = numMatch[1].split('.');
      const level = parts.length;
      const role: SemanticRole = level === 1 ? 'h1' : level === 2 ? 'h2' : 'h3';
      return {
        role,
        confidence: 0.8,
        evidence: `structure:heading-${role}`,
      };
    }

    // 7. Unstyled Abstract or References headings
    if (ABSTRACT_HEADING_REGEX.test(text)) {
      return {
        role: 'heading.abstract',
        confidence: 0.85,
        evidence: 'structure:heading-abstract',
      };
    }
    if (REFERENCES_HEADING_REGEX.test(text)) {
      return {
        role: 'heading.references',
        confidence: 0.85,
        evidence: 'structure:heading-references',
      };
    }

    // 8. Top of document heuristic for title (confidence 0.6)
    // when blockIndex < 5 and block is bold/centered and no title claimed yet
    if (ctx.blockIndex < 5) {
      const hasTitleClaimed = ctx.previousClaims.some(
        (c) => c.role === 'title' || c.role === 'titleEn'
      );
      if (!hasTitleClaimed && this.isBoldOrCentered(block)) {
        return {
          role: 'title',
          confidence: 0.6,
          evidence: 'structure:top-bold-centered-title',
          metadata: {
            alignment: block.alignment,
            isBold: this.hasBoldRuns(block),
          },
        };
      }
    }

    return null;
  }

  private isBoldOrCentered(block: RawParagraph): boolean {
    const isCentered = block.alignment === 'center';
    const isBold = this.hasBoldRuns(block);
    return isCentered || isBold;
  }

  private hasBoldRuns(block: RawParagraph): boolean {
    if (!block.runs || block.runs.length === 0) {
      return false;
    }
    return block.runs.some((r) => r.bold && r.text.trim().length > 0);
  }
}
