import type { Manuscript } from '@structpaper/doc-model';
import type { Normalizer } from './types';

/**
 * Deeply normalizes all string values within an arbitrary structure to Unicode NFC.
 * Preserves ArrayBuffers, TypedArrays, Dates, RegExps, and primitives.
 */
export function deepNormalizeNfc<T>(val: T): T {
  if (typeof val === 'string') {
    return val.normalize('NFC') as unknown as T;
  }
  if (val === null || typeof val !== 'object') {
    return val;
  }
  if (ArrayBuffer.isView(val) || val instanceof ArrayBuffer) {
    return val;
  }
  if (val instanceof Date || val instanceof RegExp) {
    return val;
  }
  if (Array.isArray(val)) {
    return val.map((item) => deepNormalizeNfc(item)) as unknown as T;
  }

  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(val)) {
    result[key] = deepNormalizeNfc(value);
  }
  return result as T;
}

/**
 * Normalizer that ensures all string fields and Inline text nodes in a Manuscript
 * are converted to Unicode NFC canonical form.
 */
export class UnicodeNfcNormalizer implements Normalizer {
  public readonly name = 'unicode-nfc-normalizer';

  public normalize(doc: Manuscript): Manuscript {
    return deepNormalizeNfc(doc);
  }
}

export function normalizeUnicodeNfc(doc: Manuscript): Manuscript {
  return new UnicodeNfcNormalizer().normalize(doc);
}
