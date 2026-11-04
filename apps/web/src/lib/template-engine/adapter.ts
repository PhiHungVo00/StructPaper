import {
  SemanticElement,
  LayoutZoneConfig,
  ElementType,
  HeadingNumbering,
  CitationStyle,
  BorderStyle,
} from '@/types/template-builder';
import {
  StandardSemanticElementType,
  SciSpaceElementAttributes,
  SEMANTIC_ELEMENTS_CATALOG,
  SemanticElementMeta,
} from '@/types/template-engine/elements';
import {
  ZoneCssLayout,
  CssDisplayMode,
  DEFAULT_FULL_WIDTH_BLOCK_LAYOUT,
  DEFAULT_TWO_COLUMN_LAYOUT,
  DEFAULT_SIDEBAR_SPLIT_LAYOUT,
} from '@/types/template-engine/layout';
import { DEFAULT_ELEMENT_ATTRIBUTES } from './default-attributes';

/**
 * Maps legacy ElementType string to standard SciSpace semantic element type
 */
export function mapElementTypeToSemanticType(
  type: ElementType
): StandardSemanticElementType {
  switch (type) {
    case 'article-title':
      return 'article-title';
    case 'author-block':
      return 'author-list';
    case 'affiliation-list':
      return 'affiliation-list';
    case 'metadata-grid':
      return 'metadata-sidebar';
    case 'abstract-box':
      return 'abstract-box';
    case 'keywords-group':
      return 'keywords-group';
    case 'heading':
      return 'heading-1';
    case 'body-text':
      return 'paragraph';
    case 'figure-box':
      return 'figure-caption';
    case 'table-box':
      return 'table-caption';
    case 'equation-box':
      return 'equation-block';
    case 'callout-box':
      return 'callout-box';
    case 'references-block':
      return 'bibliography-item';
    case 'article-header-badge':
      return 'article-header-badge';
    case 'citation-strip':
      return 'citation-strip';
    case 'abbreviations-list':
      return 'abbreviations-list';
    case 'conflict-of-interest':
      return 'conflict-of-interest';
    case 'author-contribution':
      return 'author-contribution';
    case 'acknowledgement-box':
      return 'acknowledgement-box';
    default:
      return 'paragraph';
  }
}

/**
 * Maps standard SciSpace semantic element type back to legacy ElementType
 */
export function mapSemanticTypeToElementType(
  semType: StandardSemanticElementType
): ElementType {
  switch (semType) {
    case 'article-title':
      return 'article-title';
    case 'author-list':
      return 'author-block';
    case 'affiliation-list':
      return 'affiliation-list';
    case 'metadata-sidebar':
      return 'metadata-grid';
    case 'abstract-box':
      return 'abstract-box';
    case 'keywords-group':
      return 'keywords-group';
    case 'heading-1':
    case 'heading-2':
    case 'heading-3':
      return 'heading';
    case 'paragraph':
      return 'body-text';
    case 'figure-caption':
      return 'figure-box';
    case 'table-caption':
      return 'table-box';
    case 'equation-block':
      return 'equation-box';
    case 'callout-box':
      return 'callout-box';
    case 'bibliography-item':
      return 'references-block';
    case 'article-header-badge':
      return 'article-header-badge';
    case 'citation-strip':
      return 'citation-strip';
    case 'abbreviations-list':
      return 'abbreviations-list';
    case 'conflict-of-interest':
      return 'conflict-of-interest';
    case 'author-contribution':
      return 'author-contribution';
    case 'acknowledgement-box':
      return 'acknowledgement-box';
    default:
      return 'custom-block';
  }
}


/**
 * Converts a SemanticElement into standard SciSpace Element Attributes
 */
export function elementToSciSpaceAttributes(
  element: SemanticElement,
  primaryColorFallback: string = '#2B74B7'
): SciSpaceElementAttributes {
  const semType = mapElementTypeToSemanticType(element.type);
  const baseDefaults = DEFAULT_ELEMENT_ATTRIBUTES[semType] || DEFAULT_ELEMENT_ATTRIBUTES['paragraph'];

  // If explicit sciSpaceAttributes already exist on element, merge with defaults
  if (element.sciSpaceAttributes) {
    return {
      typography: {
        ...baseDefaults.typography,
        ...(element.sciSpaceAttributes.typography || {}),
      },
      spacing: {
        ...baseDefaults.spacing,
        ...(element.sciSpaceAttributes.spacing || {}),
      },
      layoutScope: {
        ...baseDefaults.layoutScope,
        ...(element.sciSpaceAttributes.layoutScope || {}),
      },
      decorations: {
        ...baseDefaults.decorations,
        ...(element.sciSpaceAttributes.decorations || {}),
      },
      numbering: {
        ...baseDefaults.numbering,
        ...(element.sciSpaceAttributes.numbering || {}),
      },
      customCss: element.sciSpaceAttributes.customCss,
    };
  }

  // Otherwise, construct from element.styling & specialProps
  const st = element.styling;
  const sp = element.specialProps || {};

  // Map font weight
  let weight: SciSpaceElementAttributes['typography']['fontWeight'] = '400';
  if (st.fontWeight === 'bold') weight = '700';
  else if (st.fontWeight === 'semibold') weight = '600';
  else if (st.fontWeight === 'medium') weight = '500';
  else if (st.fontWeight === 'extrabold' || st.fontWeight === 'black') weight = '900';
  else if (st.fontWeight === 'normal') weight = '400';

  // Map numbering scheme
  let scheme: SciSpaceElementAttributes['numbering']['scheme'] = 'none';
  if (sp.numberingFormat === 'ROMAN') scheme = 'roman';
  else if (sp.numberingFormat === 'ARABIC') scheme = 'arabic';
  else if (sp.numberingFormat === 'LEGAL') scheme = 'decimal';
  else if (sp.numberingFormat === 'LETTER') scheme = 'alphabet';

  const hasBorder = st.borderStyle && st.borderStyle !== 'none';

  return {
    typography: {
      fontFamily: st.fontFamily || baseDefaults.typography.fontFamily,
      fontSizePt: st.fontSize || baseDefaults.typography.fontSizePt,
      fontWeight: weight,
      fontStyle: st.fontStyle || 'normal',
      textTransform: st.textTransform || 'none',
      color: st.textColor || primaryColorFallback,
      lineHeight: st.lineHeight || 1.25,
      letterSpacingEm: st.letterSpacing,
    },
    spacing: {
      marginTopPt: st.margin?.top ?? baseDefaults.spacing.marginTopPt,
      marginBottomPt: st.margin?.bottom ?? baseDefaults.spacing.marginBottomPt,
      paddingTopMm: st.padding?.top ?? baseDefaults.spacing.paddingTopMm,
      paddingRightMm: st.padding?.right ?? baseDefaults.spacing.paddingRightMm,
      paddingBottomMm: st.padding?.bottom ?? baseDefaults.spacing.paddingBottomMm,
      paddingLeftMm: st.padding?.left ?? baseDefaults.spacing.paddingLeftMm,
      firstLineIndentMm: st.firstLineIndent ?? 0,
      hangingIndentMm: st.hangingIndent ?? 0,
      textAlign: (st.textAlign as any) || 'left',
    },
    layoutScope: {
      columnSpan: element.spanColumns ? 'all' : 'single',
      display: 'block',
    },
    decorations: {
      borderTop: hasBorder,
      borderBottom: hasBorder,
      borderLeft: Boolean(st.accentBar || hasBorder),
      borderRight: hasBorder,
      borderWidthPt: st.borderWidth || 1,
      borderStyle: (st.borderStyle as any) || 'none',
      borderColor: st.borderColor || '#CBD5E1',
      backgroundColor: st.backgroundColor || 'transparent',
      borderRadiusPx: st.borderRadius || 0,
    },
    numbering: {
      scheme,
      citationStyle: (sp.citationStyle?.toUpperCase() as any) || 'VANCOUVER',
    },
  };
}

/**
 * Applies SciSpace Element Attributes onto a SemanticElement (bidirectional sync)
 */
export function applySciSpaceAttributesToElement(
  element: SemanticElement,
  attrs: SciSpaceElementAttributes
): SemanticElement {
  const typo = attrs.typography;
  const sp = attrs.spacing;
  const dec = attrs.decorations;
  const scope = attrs.layoutScope;
  const num = attrs.numbering;

  let legacyWeight: SemanticElement['styling']['fontWeight'] = 'normal';
  if (typo.fontWeight === '700') legacyWeight = 'bold';
  else if (typo.fontWeight === '800' || typo.fontWeight === '900') legacyWeight = 'black';
  else if (typo.fontWeight === '600') legacyWeight = 'semibold';
  else if (typo.fontWeight === '500') legacyWeight = 'medium';

  let legacyNumbering: HeadingNumbering = 'NONE';
  if (num.scheme === 'roman') legacyNumbering = 'ROMAN';
  else if (num.scheme === 'arabic') legacyNumbering = 'ARABIC';
  else if (num.scheme === 'decimal') legacyNumbering = 'LEGAL';
  else if (num.scheme === 'alphabet') legacyNumbering = 'LETTER';

  const updatedStyling = {
    ...element.styling,
    fontFamily: typo.fontFamily,
    fontSize: typo.fontSizePt,
    fontWeight: legacyWeight,
    fontStyle: typo.fontStyle,
    textTransform: typo.textTransform,
    textColor: typo.color,
    lineHeight: typo.lineHeight,
    letterSpacing: typo.letterSpacingEm,
    textAlign: (sp.textAlign as any) || 'left',
    margin: {
      top: sp.marginTopPt,
      bottom: sp.marginBottomPt,
    },
    padding: {
      top: sp.paddingTopMm,
      right: sp.paddingRightMm,
      bottom: sp.paddingBottomMm,
      left: sp.paddingLeftMm,
    },
    firstLineIndent: sp.firstLineIndentMm,
    hangingIndent: sp.hangingIndentMm,
    backgroundColor: dec.backgroundColor,
    borderStyle: (dec.borderStyle as BorderStyle) || 'none',
    borderColor: dec.borderColor,
    borderWidth: dec.borderWidthPt,
    borderRadius: dec.borderRadiusPx,
    accentBar: dec.borderLeft && !dec.borderTop && !dec.borderRight,
    accentBarColor: dec.borderColor,
  };

  const updatedSpecial = {
    ...element.specialProps,
    numberingFormat: legacyNumbering,
    citationStyle: num.citationStyle?.toLowerCase() as CitationStyle,
  };

  return {
    ...element,
    spanColumns: scope.columnSpan === 'all',
    styling: updatedStyling,
    specialProps: updatedSpecial,
    sciSpaceAttributes: attrs,
  };
}

/**
 * Resolves a LayoutZoneConfig into a ZoneCssLayout
 */
export function zoneToCssLayout(zone: LayoutZoneConfig): ZoneCssLayout {
  if (zone.cssLayout) {
    return zone.cssLayout;
  }

  if (zone.type === 'sidebar-split') {
    return {
      ...DEFAULT_SIDEBAR_SPLIT_LAYOUT,
      id: zone.id,
      name: zone.name,
    };
  }

  if (zone.type === 'multi-column') {
    return {
      id: zone.id,
      name: zone.name,
      display: 'columns',
      columns: {
        columnCount: (zone.columns as any) || 2,
        columnGapMm: zone.columnGap || 6,
        columnRule: {
          show: zone.showColumnRule,
          style: 'solid',
          color: zone.columnRuleColor || '#CBD5E1',
          widthPt: 0.5,
        },
        columnFill: zone.balanceLastPageColumns !== false ? 'balance' : 'auto',
      },
      boxModel: {
        margin: { topMm: 2, rightMm: 0, bottomMm: 0, leftMm: 0 },
        padding: { topMm: 0, rightMm: 0, bottomMm: 0, leftMm: 0 },
        width: '100%',
        overflow: 'visible',
        border: {
          show: false,
          top: false,
          right: false,
          bottom: false,
          left: false,
          style: 'none',
          color: '#E2E8F0',
          widthPt: 0,
          radiusPx: 0,
        },
      },
    };
  }

  return {
    ...DEFAULT_FULL_WIDTH_BLOCK_LAYOUT,
    id: zone.id,
    name: zone.name,
  };
}

/**
 * Updates a LayoutZoneConfig with a new ZoneCssLayout
 */
export function applyCssLayoutToZone(
  zone: LayoutZoneConfig,
  cssLayout: ZoneCssLayout
): LayoutZoneConfig {
  const next: LayoutZoneConfig = {
    ...zone,
    cssLayout,
  };

  // Sync to legacy zone types for full backwards compatibility
  if (cssLayout.display === 'columns' && cssLayout.columns) {
    next.type = 'multi-column';
    next.columns = cssLayout.columns.columnCount <= 3 ? (cssLayout.columns.columnCount as 1 | 2 | 3) : 3;
    next.columnGap = cssLayout.columns.columnGapMm;
    next.showColumnRule = cssLayout.columns.columnRule.show;
    next.columnRuleColor = cssLayout.columns.columnRule.color;
  } else if (cssLayout.display === 'grid') {
    if (cssLayout.grid?.templateColumns?.includes('240px') || cssLayout.grid?.templateColumns?.includes('28%')) {
      next.type = 'sidebar-split';
    } else {
      next.type = 'asymmetric-grid';
    }
  } else if (cssLayout.display === 'block') {
    next.type = 'full-width';
  }

  return next;
}
