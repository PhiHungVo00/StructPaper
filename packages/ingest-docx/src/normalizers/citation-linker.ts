import type { Manuscript, Inline, Reference } from '@structpaper/doc-model';
import { parseTextWithCitations } from '@structpaper/doc-model';
import type { Normalizer } from './types';
import { transformManuscriptInlines } from './tree-utils';

/**
 * Builds a lookup map from 1-based citation integer to Reference ID.
 */
export function buildReferenceIdMap(references: Reference[]): Map<number, string> {
  const map = new Map<number, string>();

  references.forEach((ref, index) => {
    // 1-based sequence index
    map.set(index + 1, ref.id);

    // If ref.id ends with number e.g. 'ref-5'
    const idMatch = ref.id.match(/\d+$/);
    if (idMatch) {
      map.set(parseInt(idMatch[0], 10), ref.id);
    }

    // If raw citation text begins with [5] or 5.
    if (ref.raw) {
      const rawMatch = ref.raw.trim().match(/^\[?(\d+)\]?[\.\s]/);
      if (rawMatch) {
        map.set(parseInt(rawMatch[1], 10), ref.id);
      }
    }
  });

  return map;
}

const CITATION_PATTERN = /\[\d+(?:\s*[,-–—]\s*\d+)*\]/;

/**
 * Scans an array of Inline nodes, detecting inline citation markers [1], [2, 3], [4-6]
 * and converting them into { t: 'cite', refIds: [...] } nodes linked to references.
 */
export function linkInlineCitations(
  inlines: Inline[],
  refIdMap: Map<number, string>
): Inline[] {
  const result: Inline[] = [];

  for (const inline of inlines) {
    if (inline.t === 'text') {
      if (!CITATION_PATTERN.test(inline.v)) {
        result.push(inline);
      } else {
        const parsed = parseTextWithCitations(inline.v, refIdMap);
        // Preserve marks on generated text chunks if original inline had marks
        const withMarks = parsed.map((node) => {
          if (node.t === 'text' && inline.marks && inline.marks.length > 0) {
            return {
              ...node,
              marks: [...inline.marks],
            };
          }
          return node;
        });
        result.push(...withMarks);
      }
    } else if (inline.t === 'link') {
      result.push({
        ...inline,
        content: linkInlineCitations(inline.content, refIdMap),
      });
    } else {
      result.push(inline);
    }
  }

  return result;
}

/**
 * Normalizer that links inline bracket citations [1], [2, 3], [4-6]
 * to references in Manuscript.references.
 */
export class CitationLinker implements Normalizer {
  public readonly name = 'citation-linker';

  public normalize(doc: Manuscript): Manuscript {
    const refIdMap = buildReferenceIdMap(doc.references);

    return transformManuscriptInlines(doc, (inlines) =>
      linkInlineCitations(inlines, refIdMap)
    );
  }
}

export function linkCitations(doc: Manuscript): Manuscript {
  return new CitationLinker().normalize(doc);
}
