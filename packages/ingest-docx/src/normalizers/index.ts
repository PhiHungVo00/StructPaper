import type { Manuscript } from '@structpaper/doc-model';
import type { Normalizer } from './types';
import { UnicodeNfcNormalizer, normalizeUnicodeNfc } from './unicode-nfc-normalizer';
import { VietnameseSpacingNormalizer, normalizeVietnameseSpacing } from './vietnamese-spacing-normalizer';
import { CaptionNumberStripper, stripCaptionNumbers } from './caption-number-stripper';
import { CitationLinker, linkCitations } from './citation-linker';

export * from './types';
export * from './tree-utils';
export * from './unicode-nfc-normalizer';
export * from './vietnamese-spacing-normalizer';
export * from './caption-number-stripper';
export * from './citation-linker';

/**
 * Default ordered pipeline of normalizers.
 */
export const DEFAULT_NORMALIZERS: Normalizer[] = [
  new UnicodeNfcNormalizer(),
  new VietnameseSpacingNormalizer(),
  new CaptionNumberStripper(),
  new CitationLinker(),
];

/**
 * Runs a sequence of normalizers sequentially on a Manuscript.
 */
export function runNormalizers(
  doc: Manuscript,
  normalizers: Normalizer[] = DEFAULT_NORMALIZERS
): Manuscript {
  let current = doc;
  for (const normalizer of normalizers) {
    current = normalizer.normalize(current);
  }
  return current;
}
