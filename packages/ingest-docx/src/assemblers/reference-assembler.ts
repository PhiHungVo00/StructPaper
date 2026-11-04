import type { Reference } from '@structpaper/doc-model';
import type { RecognizedBlock } from './types';

/**
 * ReferenceAssembler processes recognized bibliography blocks, strips citation index markers,
 * extracts DOIs and URLs, and formats clean Reference records.
 */
export class ReferenceAssembler {
  private idCounter = 0;

  /**
   * Assembles an array of Reference items from recognized blocks.
   */
  public assembleReferences(blocks: RecognizedBlock[]): Reference[] {
    const references: Reference[] = [];

    for (const block of blocks) {
      if (block.claim.role !== 'reference') continue;

      const rawText = block.raw.type === 'paragraph' ? block.raw.rawText : '';
      if (!rawText || !rawText.trim()) continue;

      const ref = this.parseReferenceString(rawText, `ref-${references.length + 1}`);
      references.push(ref);
    }

    return references;
  }

  /**
   * Parses a single bibliography entry string into a Reference object.
   */
  public parseReferenceString(rawText: string, blockId?: string): Reference {
    const id = blockId || `ref-${++this.idCounter}`;
    const trimmed = rawText.trim();

    // 1. Strip leading [1], 1., [1]., (1) prefixes
    const cleanRaw = trimmed
      .replace(/^\[?\d+\]?\.?\s*/, '')
      .replace(/^\(\d+\)\.?\s*/, '')
      .trim();

    // 2. Extract DOI (10.xxxx/...)
    let doi: string | undefined;
    const doiMatch = cleanRaw.match(
      /(?:doi:\s*|https?:\/\/(?:dx\.)?doi\.org\/)?(10\.\d{4,9}\/[-._;()/:A-Za-z0-9]+)/i
    );
    if (doiMatch) {
      doi = doiMatch[1].replace(/[.,;)]+$/, '');
    }

    // 3. Extract URL (http:// or https://)
    let url: string | undefined;
    const urlMatch = cleanRaw.match(/(https?:\/\/[^\s<>"]+)/i);
    if (urlMatch) {
      const candidateUrl = urlMatch[1].replace(/[.,;)]+$/, '');
      // Only set URL if it's not simply the DOI link itself when DOI is present
      if (!doi || !candidateUrl.includes(doi)) {
        url = candidateUrl;
      } else if (!url) {
        url = candidateUrl;
      }
    }

    // 4. Determine parsing status
    let parse: 'ok' | 'partial' | 'failed' = 'ok';
    if (!cleanRaw) {
      parse = 'failed';
    } else if (cleanRaw.length < 15 && !doi && !url) {
      parse = 'partial';
    }

    return {
      id,
      raw: cleanRaw,
      ...(doi ? { doi } : {}),
      ...(url ? { url } : {}),
      parse,
    };
  }
}
