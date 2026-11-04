import {
  StandardSemanticElementType,
  SciSpaceElementAttributes,
} from '@/types/template-engine/elements';
import { FRONTMATTER_ATTRIBUTES } from './frontmatter';
import { HEADINGS_ATTRIBUTES } from './headings';
import { BODY_ATTRIBUTES } from './body';
import { FLOATS_ATTRIBUTES } from './floats';
import { BACKMATTER_ATTRIBUTES } from './backmatter';

export { createDefaultAttributes, BASE_ELEMENT_ATTRIBUTES } from './base';
export { FRONTMATTER_ATTRIBUTES } from './frontmatter';
export { HEADINGS_ATTRIBUTES } from './headings';
export { BODY_ATTRIBUTES } from './body';
export { FLOATS_ATTRIBUTES } from './floats';
export { BACKMATTER_ATTRIBUTES } from './backmatter';

/**
 * Aggregated Default Styles for Academic Journal Semantic Elements
 * Calibrated against international publishing guidelines and VNUHCM scientific journals.
 * Organized into modular domain packages for maximum maintainability and zero file bloating.
 */
export const DEFAULT_ELEMENT_ATTRIBUTES: Record<
  StandardSemanticElementType,
  SciSpaceElementAttributes
> = {
  ...FRONTMATTER_ATTRIBUTES,
  ...HEADINGS_ATTRIBUTES,
  ...BODY_ATTRIBUTES,
  ...FLOATS_ATTRIBUTES,
  ...BACKMATTER_ATTRIBUTES,
};
