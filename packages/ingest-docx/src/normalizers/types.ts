import type { Manuscript } from '@structpaper/doc-model';

/**
 * Interface representing a Manuscript normalizer.
 */
export interface Normalizer {
  readonly name: string;
  normalize(doc: Manuscript): Manuscript;
}
