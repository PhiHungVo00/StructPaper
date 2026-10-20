import { SciSpaceElementAttributes } from '@/types/template-engine/elements';

/**
 * Base template attribute specification.
 * Provides sensible fallback values for typography, spacing, layout, decorations, and numbering.
 */
export const BASE_ELEMENT_ATTRIBUTES: SciSpaceElementAttributes = {
  typography: {
    fontFamily: 'Arial, Helvetica, sans-serif',
    fontSizePt: 10,
    fontWeight: '400',
    fontStyle: 'normal',
    textTransform: 'none',
    color: '#0F172A',
    lineHeight: 1.25,
  },
  spacing: {
    marginTopPt: 3,
    marginBottomPt: 3,
    paddingTopMm: 0,
    paddingRightMm: 0,
    paddingBottomMm: 0,
    paddingLeftMm: 0,
    firstLineIndentMm: 0,
    textAlign: 'left',
  },
  layoutScope: {
    columnSpan: 'single',
    display: 'block',
  },
  decorations: {
    borderTop: false,
    borderBottom: false,
    borderLeft: false,
    borderRight: false,
    borderWidthPt: 0,
    borderStyle: 'none',
    borderColor: '#E2E8F0',
    backgroundColor: 'transparent',
    borderRadiusPx: 0,
  },
  numbering: {
    scheme: 'none',
  },
};

/**
 * Factory helper function to create academic element attributes with clean overrides.
 * Eliminates repetitive boilerplate across hundreds of attribute fields.
 */
export function createDefaultAttributes(
  overrides: {
    typography?: Partial<SciSpaceElementAttributes['typography']>;
    spacing?: Partial<SciSpaceElementAttributes['spacing']>;
    layoutScope?: Partial<SciSpaceElementAttributes['layoutScope']>;
    decorations?: Partial<SciSpaceElementAttributes['decorations']>;
    numbering?: Partial<SciSpaceElementAttributes['numbering']>;
  }
): SciSpaceElementAttributes {
  return {
    typography: {
      ...BASE_ELEMENT_ATTRIBUTES.typography,
      ...(overrides.typography || {}),
    },
    spacing: {
      ...BASE_ELEMENT_ATTRIBUTES.spacing,
      ...(overrides.spacing || {}),
    },
    layoutScope: {
      ...BASE_ELEMENT_ATTRIBUTES.layoutScope,
      ...(overrides.layoutScope || {}),
    },
    decorations: {
      ...BASE_ELEMENT_ATTRIBUTES.decorations,
      ...(overrides.decorations || {}),
    },
    numbering: {
      ...BASE_ELEMENT_ATTRIBUTES.numbering,
      ...(overrides.numbering || {}),
    },
  };
}
