import vnuhcmHealthSciences from './vnuhcm-health-sciences-id630.json';
import natureSpringer from './nature-springer-modern.json';
import ieeeTransactions from './ieee-transactions-standard.json';
import customBlank from './custom-blank-canvas.json';
import { UniversalTemplateSchema } from '@/types/template-builder';
import { deserializeTemplatePackage } from '@/lib/template-engine/storage';

function unpackTemplate(rawJson: any): UniversalTemplateSchema {
  const { schema } = deserializeTemplatePackage(JSON.stringify(rawJson));
  if (!schema) {
    throw new Error(`Failed to unpack template: ${rawJson?.id}`);
  }
  return schema;
}

export const VNUHCM_HEALTH_SCIENCES_TEMPLATE = unpackTemplate(vnuhcmHealthSciences);
export const NATURE_SPRINGER_TEMPLATE = unpackTemplate(natureSpringer);
export const IEEE_TRANSACTIONS_TEMPLATE = unpackTemplate(ieeeTransactions);
export const CUSTOM_BLANK_TEMPLATE = unpackTemplate(customBlank);

/**
 * Built-in templates unpacked directly from their JSON specifications
 */
export const BUILT_IN_TEMPLATES: UniversalTemplateSchema[] = [
  VNUHCM_HEALTH_SCIENCES_TEMPLATE,
  NATURE_SPRINGER_TEMPLATE,
  IEEE_TRANSACTIONS_TEMPLATE,
  CUSTOM_BLANK_TEMPLATE,
];
