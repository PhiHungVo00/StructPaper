import {
  UniversalTemplateSchema,
  PageArchitectureConfig,
  LayoutZoneConfig,
  SemanticElement,
  TemplateGridConfig,
  FloatingElementsDesignRules,
} from '@/types/template-builder';

/**
 * Standard StructPaper Template File Format Specification (v2.0)
 * Represents a fully serializable, self-contained template document.
 */
export interface StructPaperTemplateFile {
  $schema?: string;
  schemaVersion: '2.0.0' | '1.0.0';
  id: string;
  name: string;
  category: 'journal-article' | 'conference-proceeding' | 'thesis-report' | 'custom-open';
  description: string;
  author: string;
  institution?: string;
  version: string;
  createdAt: string;
  updatedAt: string;
  primaryColor: string;
  secondaryColor?: string;
  previewThumbnail?: string;
  tags?: string[];

  // Core layout & design specifications
  specification: {
    pageArchitecture: PageArchitectureConfig;
    gridConfig: TemplateGridConfig;
    zones: LayoutZoneConfig[];
    elements: SemanticElement[];
    floatingRules?: FloatingElementsDesignRules;
  };
}

/**
 * Lightweight manifest metadata for template browsing/listing
 */
export interface TemplateManifest {
  id: string;
  name: string;
  category: string;
  description: string;
  author: string;
  institution?: string;
  version: string;
  updatedAt: string;
  primaryColor: string;
  secondaryColor?: string;
  pageCount?: number;
  zonesCount: number;
  elementsCount: number;
  isCustom?: boolean;
  filePath?: string;
}

/**
 * Template validation issue / error
 */
export interface TemplateValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

/**
 * Result of template schema validation
 */
export interface TemplateValidationResult {
  valid: boolean;
  errors: TemplateValidationError[];
  warnings: TemplateValidationError[];
}
