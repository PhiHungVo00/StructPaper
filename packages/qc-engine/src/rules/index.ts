export * from './metadata-rules';
export * from './numbering-rules';
export * from './float-rules';
export * from './reference-rules';
export * from './structure-rules';

import { metadataRules } from './metadata-rules';
import { numberingRules } from './numbering-rules';
import { floatRules } from './float-rules';
import { referenceRules } from './reference-rules';
import { structureRules } from './structure-rules';
import type { QcRule } from '../interfaces/rule';

export const ALL_DEFAULT_QC_RULES: QcRule[] = [
  ...metadataRules,
  ...numberingRules,
  ...floatRules,
  ...referenceRules,
  ...structureRules,
];
