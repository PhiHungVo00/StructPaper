import type { Manuscript, Inline, Block, TableBlock, FigureBlock } from '@structpaper/doc-model';
import type { Normalizer } from './types';
import { transformManuscriptBlocks } from './tree-utils';

/**
 * Regex matching hardcoded table and figure caption prefixes.
 * Captures:
 * 1. Label ("Bảng", "Table", "Hình", "Figure", "Fig.", "Đồ thị", "Sơ đồ")
 * 2. Number ("1", "2.1", "3-1", "1a", etc.)
 * 3. Separator (":", ".", "-", "–", "—", or whitespace)
 * 4. Remainder of caption text
 */
export const CAPTION_PREFIX_REGEX =
  /^(?:bảng|table|hình|figure|fig\.?|đồ\s+thị|sơ\s+đồ)\s+\d+(?:[\.\-]\d+)?(?:[a-zA-Z])?(?:\s*[:\.\-–—]\s*|\s+)(.*)$/i;

/**
 * Strips hardcoded number prefixes from an Inline[] caption.
 */
export function stripCaptionPrefix(caption: Inline[]): Inline[] {
  if (!caption || caption.length === 0) return caption;

  // Find first text inline
  const firstIdx = caption.findIndex((inline) => inline.t === 'text');
  if (firstIdx === -1) return caption;

  const firstTextInline = caption[firstIdx];
  if (firstTextInline.t !== 'text') return caption;

  const match = firstTextInline.v.match(CAPTION_PREFIX_REGEX);
  if (!match) return caption;

  const strippedText = match[1].trimStart();

  const newInlines = [...caption];
  if (strippedText.length > 0) {
    newInlines[firstIdx] = {
      ...firstTextInline,
      v: strippedText,
    };
  } else {
    // If the first inline only had the prefix, remove it if other inlines exist
    if (newInlines.length > 1) {
      newInlines.splice(firstIdx, 1);
    } else {
      newInlines[firstIdx] = {
        ...firstTextInline,
        v: '',
      };
    }
  }

  return newInlines;
}

/**
 * Normalizer that strips hardcoded prefixes ("Bảng 1:", "Table 2.", "Hình 3:")
 * from all table and figure captions across a Manuscript.
 */
export class CaptionNumberStripper implements Normalizer {
  public readonly name = 'caption-number-stripper';

  public normalize(doc: Manuscript): Manuscript {
    return transformManuscriptBlocks(doc, (block: Block) => {
      if (block.type === 'table') {
        const table = block as TableBlock;
        return {
          ...table,
          caption: stripCaptionPrefix(table.caption),
        };
      }
      if (block.type === 'figure') {
        const figure = block as FigureBlock;
        const newCaption = stripCaptionPrefix(figure.caption);
        const newPanels = figure.panels?.map((panel) => ({
          ...panel,
          caption: panel.caption ? stripCaptionPrefix(panel.caption) : undefined,
        }));
        return {
          ...figure,
          caption: newCaption,
          panels: newPanels,
        };
      }
      return block;
    });
  }
}

export function stripCaptionNumbers(doc: Manuscript): Manuscript {
  return new CaptionNumberStripper().normalize(doc);
}
