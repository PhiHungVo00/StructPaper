import { UniversalTemplateSchema } from '@/types/template-builder';
import {
  StructPaperTemplateFile,
  TemplateManifest,
  TemplateValidationResult,
} from './types';
import { validateTemplateSchema } from './validator';

/**
 * Packages a UniversalTemplateSchema into a standardized StructPaperTemplateFile.
 */
export function serializeTemplatePackage(
  schema: UniversalTemplateSchema
): StructPaperTemplateFile {
  return {
    $schema: 'https://structpaper.org/schemas/template-v2.json',
    schemaVersion: '2.0.0',
    id: schema.id,
    name: schema.name,
    category: schema.category,
    description: schema.description,
    author: schema.author,
    institution: schema.institution,
    version: schema.version,
    createdAt: schema.createdAt,
    updatedAt: new Date().toISOString(),
    primaryColor: schema.primaryColor,
    secondaryColor: schema.secondaryColor,
    tags: [schema.category, schema.institution || 'Academia'],
    specification: {
      pageArchitecture: schema.pageArchitecture,
      gridConfig: schema.gridConfig || {
        enabled: true,
        columns: 4,
        rows: 5,
        rowGap: 8,
        colGap: 8,
        gapSync: true,
        unit: 'px',
      },
      zones: schema.zones,
      elements: schema.elements,
      floatingRules: schema.floatingRules,
    },
  };
}

/**
 * Converts a raw JSON string into a validated UniversalTemplateSchema.
 * Handles both wrapped format (StructPaperTemplateFile) and raw UniversalTemplateSchema.
 */
export function deserializeTemplatePackage(rawJson: string): {
  success: boolean;
  schema?: UniversalTemplateSchema;
  validation: TemplateValidationResult;
} {
  try {
    const parsed = JSON.parse(rawJson);
    const validation = validateTemplateSchema(parsed);

    if (!validation.valid) {
      return { success: false, validation };
    }

    // Unpack if wrapped format
    if (parsed.schemaVersion && parsed.specification) {
      const file = parsed as StructPaperTemplateFile;
      const schema: UniversalTemplateSchema = {
        id: file.id,
        name: file.name,
        category: file.category,
        description: file.description,
        author: file.author,
        institution: file.institution,
        version: file.version,
        createdAt: file.createdAt,
        updatedAt: file.updatedAt,
        primaryColor: file.primaryColor,
        secondaryColor: file.secondaryColor || '#E65100',
        pageArchitecture: file.specification.pageArchitecture,
        gridConfig: file.specification.gridConfig,
        zones: file.specification.zones,
        elements: file.specification.elements,
        floatingRules: file.specification.floatingRules,
      };
      return { success: true, schema, validation };
    }

    // Already in UniversalTemplateSchema format
    return { success: true, schema: parsed as UniversalTemplateSchema, validation };
  } catch (err: any) {
    return {
      success: false,
      validation: {
        valid: false,
        errors: [{ field: 'syntax', message: err?.message || 'Invalid JSON syntax', severity: 'error' }],
        warnings: [],
      },
    };
  }
}

/**
 * Extracts a lightweight manifest from any template schema.
 */
export function extractTemplateManifest(
  schema: UniversalTemplateSchema,
  isCustom: boolean = false
): TemplateManifest {
  // Count distinct pages defined across all zones
  const pageSet = new Set<number>();
  schema.zones.forEach((z) => {
    if (typeof z.page === 'number') pageSet.add(z.page);
  });

  return {
    id: schema.id,
    name: schema.name,
    category: schema.category,
    description: schema.description,
    author: schema.author,
    institution: schema.institution,
    version: schema.version,
    updatedAt: schema.updatedAt,
    primaryColor: schema.primaryColor,
    secondaryColor: schema.secondaryColor,
    pageCount: Math.max(1, pageSet.size),
    zonesCount: schema.zones.length,
    elementsCount: schema.elements.length,
    isCustom,
  };
}

/**
 * Triggers a browser download of the template file in standardized JSON format.
 */
export function exportTemplateToFile(
  schema: UniversalTemplateSchema,
  filename?: string
): void {
  if (typeof window === 'undefined') return;

  const pkg = serializeTemplatePackage(schema);
  const jsonStr = JSON.stringify(pkg, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const safeName = filename || `${schema.id || 'template'}.structpaper.json`;
  const a = document.createElement('a');
  a.href = url;
  a.download = safeName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Reads and parses a File object uploaded by the user in the browser.
 */
export function importTemplateFromFile(
  file: File
): Promise<{
  success: boolean;
  schema?: UniversalTemplateSchema;
  validation: TemplateValidationResult;
}> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const res = deserializeTemplatePackage(content);
      resolve(res);
    };
    reader.onerror = () => {
      resolve({
        success: false,
        validation: {
          valid: false,
          errors: [{ field: 'file', message: 'Failed to read uploaded file', severity: 'error' }],
          warnings: [],
        },
      });
    };
    reader.readAsText(file);
  });
}
