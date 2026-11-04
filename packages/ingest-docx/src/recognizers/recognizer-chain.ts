import type { JournalProfile } from '@structpaper/journal-profiles';
import type { DocxPackage } from '../package/docx-package';
import type { StyleResolver } from '../ooxml/style-resolver';
import type { RawBlock } from '../types/raw-doc';
import { Claim, IngestContext, Recognizer } from './types';
import { StyleMapRecognizer } from './style-map-recognizer';
import { StructureRecognizer } from './structure-recognizer';

export interface BaseIngestContext {
  profile: JournalProfile;
  docxPackage?: DocxPackage;
  styleResolver: StyleResolver;
}

/**
 * RecognizerChain arbitrates claims across registered recognizers according to priority and confidence.
 */
export class RecognizerChain {
  private readonly recognizers: Recognizer[] = [];

  public constructor(recognizers?: Recognizer[]) {
    if (recognizers && recognizers.length > 0) {
      this.recognizers = [...recognizers].sort((a, b) => a.priority - b.priority);
    } else {
      this.recognizers = [new StyleMapRecognizer(), new StructureRecognizer()].sort(
        (a, b) => a.priority - b.priority
      );
    }
  }

  public addRecognizer(recognizer: Recognizer): void {
    this.recognizers.push(recognizer);
    this.recognizers.sort((a, b) => a.priority - b.priority);
  }

  /**
   * Evaluates all recognizers on a block and arbitrates to select the highest confidence claim.
   * If a recognizer yields confidence 1.0, it short-circuits immediately.
   */
  public recognizeBlock(block: RawBlock, ctx: IngestContext): Claim {
    let bestClaim: Claim | null = null;

    for (const recognizer of this.recognizers) {
      const claim = recognizer.recognize(block, ctx);
      if (claim) {
        // Exact match short-circuit
        if (claim.confidence >= 1.0) {
          return claim;
        }

        if (!bestClaim || claim.confidence > bestClaim.confidence) {
          bestClaim = claim;
        }
      }
    }

    if (bestClaim) {
      return bestClaim;
    }

    // Fallback for unassigned blocks
    if (block.type === 'table') {
      return {
        role: 'table.cell',
        confidence: 0.5,
        evidence: 'default:table',
      };
    }

    return {
      role: 'paragraph',
      confidence: 0.5,
      evidence: 'default:body',
    };
  }

  /**
   * Recognizes all blocks sequentially in a document, maintaining context across blocks.
   */
  public recognizeAll(blocks: RawBlock[], baseCtx: BaseIngestContext): Claim[] {
    const claims: Claim[] = [];
    const totalBlocks = blocks.length;

    for (let i = 0; i < totalBlocks; i++) {
      const block = blocks[i];
      const ctx: IngestContext = {
        profile: baseCtx.profile,
        docxPackage: baseCtx.docxPackage,
        styleResolver: baseCtx.styleResolver,
        blockIndex: i,
        totalBlocks,
        previousClaims: claims,
      };

      const claim = this.recognizeBlock(block, ctx);
      claims.push(claim);
    }

    return claims;
  }
}
