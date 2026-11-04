import {
  StandardSemanticElementType,
  SciSpaceElementAttributes,
} from './elements';
import { ZoneCssLayout } from './layout';
import { PageArchitectureConfig, FloatingElementsDesignRules } from '@/types/template-builder';

/**
 * Unified SciSpace-Style Template Schema
 * Represents the clean separation of Document Data, Element Style Rulesets, and CSS Layouts.
 */
export interface SciSpaceTemplateSchema {
  id: string;
  name: string;
  shortName: string;
  description: string;
  journalId?: string;
  primaryColor: string;
  accentColor: string;
  version: string; // e.g. "2.0.0"

  // Page level setup (dimensions, margins, headers, footers, page numbering)
  pageArchitecture: PageArchitectureConfig;

  // The CSS Layout architecture (Grid, Flex, Multi-column zones)
  layoutZones: ZoneCssLayout[];

  // Element Attribute Mapping: Pure ruleset assigning style attributes to each Semantic Element
  elementRules: Record<StandardSemanticElementType, SciSpaceElementAttributes>;

  // Floating elements design rules (Footnotes, Table/Figure floats)
  floatingRules?: FloatingElementsDesignRules;

  createdAt?: string;
  updatedAt?: string;
}
