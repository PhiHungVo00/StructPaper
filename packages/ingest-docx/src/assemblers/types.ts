import type { RawBlock } from '../types/raw-doc';
import type { Claim } from '../recognizers/types';
import type {
  FrontMatter,
  Section,
  BackMatterItem,
  Reference,
  AssetMeta,
} from '@structpaper/doc-model';

/**
 * A raw block paired with its semantic claim and assigned stable ID.
 */
export interface RecognizedBlock {
  raw: RawBlock;
  claim: Claim;
  id: string;
}

/**
 * Result of the full document assembly pipeline.
 */
export interface AssembledDoc {
  meta: FrontMatter;
  body: Section[];
  back: BackMatterItem[];
  references: Reference[];
  assets: Record<string, AssetMeta>;
}
