import {
  UniversalTemplateSchema,
  LayoutZoneConfig,
  SemanticElement,
} from '@/types/template-builder';
import {
  StructPaperTemplateFile,
  TemplateValidationResult,
  TemplateValidationError,
} from './types';

/**
 * Validates any template schema or file structure against the StructPaper Standard.
 * Detects structural errors, missing bindings, grid collisions, and invalid dimensions.
 */
export function validateTemplateSchema(
  data: unknown
): TemplateValidationResult {
  const errors: TemplateValidationError[] = [];
  const warnings: TemplateValidationError[] = [];

  if (!data || typeof data !== 'object') {
    return {
      valid: false,
      errors: [{ field: 'root', message: 'Template data must be an object', severity: 'error' }],
      warnings: [],
    };
  }

  const obj = data as Record<string, any>;

  // Check if it's wrapped in StructPaperTemplateFile format or raw UniversalTemplateSchema
  const isWrapped = obj.schemaVersion && obj.specification;
  const spec: UniversalTemplateSchema = isWrapped
    ? {
        id: obj.id,
        name: obj.name,
        category: obj.category || 'journal-article',
        description: obj.description || '',
        author: obj.author || 'Anonymous',
        institution: obj.institution,
        version: obj.version || '1.0.0',
        createdAt: obj.createdAt || new Date().toISOString(),
        updatedAt: obj.updatedAt || new Date().toISOString(),
        primaryColor: obj.primaryColor || '#2B74B7',
        secondaryColor: obj.secondaryColor || '#E65100',
        pageArchitecture: obj.specification.pageArchitecture,
        gridConfig: obj.specification.gridConfig,
        zones: obj.specification.zones || [],
        elements: obj.specification.elements || [],
        floatingRules: obj.specification.floatingRules,
      }
    : (obj as UniversalTemplateSchema);

  // 1. Basic Metadata validation
  if (!spec.id || typeof spec.id !== 'string') {
    errors.push({ field: 'id', message: 'Template ID is required', severity: 'error' });
  }
  if (!spec.name || typeof spec.name !== 'string') {
    errors.push({ field: 'name', message: 'Template name is required', severity: 'error' });
  }
  if (!spec.primaryColor || typeof spec.primaryColor !== 'string') {
    warnings.push({ field: 'primaryColor', message: 'Primary color missing, defaulting to #2B74B7', severity: 'warning' });
  }

  // 2. Page Architecture validation
  if (!spec.pageArchitecture || typeof spec.pageArchitecture !== 'object') {
    errors.push({ field: 'pageArchitecture', message: 'Page architecture configuration is missing', severity: 'error' });
  } else {
    const { margins, size, customDimensions } = spec.pageArchitecture;
    if (!margins || typeof margins.top !== 'number' || typeof margins.bottom !== 'number') {
      errors.push({ field: 'pageArchitecture.margins', message: 'Valid page margins (top, bottom, left, right) are required', severity: 'error' });
    }
    if (size === 'Custom' && (!customDimensions || customDimensions.width <= 0 || customDimensions.height <= 0)) {
      errors.push({ field: 'pageArchitecture.customDimensions', message: 'Custom page dimensions width and height must be positive', severity: 'error' });
    }
  }

  // 3. Grid Config validation
  const grid = spec.gridConfig;
  if (grid) {
    if (grid.columns < 1 || grid.rows < 1) {
      errors.push({ field: 'gridConfig', message: 'Grid columns and rows must be at least 1', severity: 'error' });
    }
  }

  // Collect all zone IDs (including recursive sub-zones)
  const zoneIdMap = new Set<string>();

  function collectZoneIds(zonesList: LayoutZoneConfig[], parentPath: string = 'zones') {
    for (let i = 0; i < zonesList.length; i++) {
      const zone = zonesList[i];
      const currentPath = `${parentPath}[${i}]`;

      if (!zone.id) {
        errors.push({ field: `${currentPath}.id`, message: 'Zone ID is required', severity: 'error' });
        continue;
      }
      if (zoneIdMap.has(zone.id)) {
        errors.push({ field: `${currentPath}.id`, message: `Duplicate zone ID detected: ${zone.id}`, severity: 'error' });
      }
      zoneIdMap.add(zone.id);

      // Validate grid area bounds
      if (zone.gridArea && grid && grid.enabled) {
        const { rowStart, colStart, rowSpan, colSpan } = zone.gridArea;
        if (rowStart < 1 || colStart < 1 || rowSpan < 1 || colSpan < 1) {
          errors.push({
            field: `${currentPath}.gridArea`,
            message: `Zone "${zone.name || zone.id}" has invalid 1-indexed coordinates: (${rowStart}, ${colStart}, span: ${rowSpan}x${colSpan})`,
            severity: 'error',
          });
        }
        if (rowStart + rowSpan - 1 > grid.rows) {
          warnings.push({
            field: `${currentPath}.gridArea.rowSpan`,
            message: `Zone "${zone.name || zone.id}" extends past grid rows (${rowStart + rowSpan - 1} > ${grid.rows})`,
            severity: 'warning',
          });
        }
        if (colStart + colSpan - 1 > grid.columns) {
          warnings.push({
            field: `${currentPath}.gridArea.colSpan`,
            message: `Zone "${zone.name || zone.id}" extends past grid columns (${colStart + colSpan - 1} > ${grid.columns})`,
            severity: 'warning',
          });
        }
      }

      // Recursive sub-zones validation
      if (zone.subZones && Array.isArray(zone.subZones) && zone.subZones.length > 0) {
        collectZoneIds(zone.subZones, `${currentPath}.subZones`);
      }
    }
  }

  // 4. Validate Zones
  if (!Array.isArray(spec.zones) || spec.zones.length === 0) {
    warnings.push({ field: 'zones', message: 'Template contains no layout zones', severity: 'warning' });
  } else {
    collectZoneIds(spec.zones);
  }

  // 5. Validate Semantic Elements
  if (Array.isArray(spec.elements)) {
    const elemIdMap = new Set<string>();

    for (let i = 0; i < spec.elements.length; i++) {
      const elem: SemanticElement = spec.elements[i];
      const elemPath = `elements[${i}]`;

      if (!elem.id) {
        errors.push({ field: `${elemPath}.id`, message: 'Element ID is required', severity: 'error' });
      } else if (elemIdMap.has(elem.id)) {
        errors.push({ field: `${elemPath}.id`, message: `Duplicate element ID: ${elem.id}`, severity: 'error' });
      } else {
        elemIdMap.add(elem.id);
      }

      if (!elem.type) {
        errors.push({ field: `${elemPath}.type`, message: 'Element type is required', severity: 'error' });
      }

      // Check if zoneId links to a valid zone
      if (elem.zoneId && !zoneIdMap.has(elem.zoneId)) {
        warnings.push({
          field: `${elemPath}.zoneId`,
          message: `Element "${elem.name || elem.id}" references non-existent zone "${elem.zoneId}"`,
          severity: 'warning',
        });
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
