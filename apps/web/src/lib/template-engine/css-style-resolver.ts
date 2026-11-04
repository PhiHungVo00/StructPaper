import React from 'react';
import { SciSpaceElementAttributes } from '@/types/template-engine/elements';
import { ZoneCssLayout } from '@/types/template-engine/layout';

// Unit conversion constants: 1 inch = 25.4 mm = 72 pt = 96 px (standard CSS 96dpi)
export const PT_TO_PX = 96 / 72; // ~1.333 px per pt
export const MM_TO_PX = 96 / 25.4; // ~3.7795 px per mm

/**
 * Resolves finite element attributes into valid React CSS styles for DOM rendering
 */
export function resolveElementCssStyle(
  attrs?: Partial<SciSpaceElementAttributes>,
  primaryColorFallback?: string
): React.CSSProperties {
  if (!attrs) return {};

  const typo = attrs.typography;
  const sp = attrs.spacing;
  const dec = attrs.decorations;
  const scope = attrs.layoutScope;

  const style: React.CSSProperties = {};

  // 1. Typography
  if (typo) {
    if (typo.fontFamily) style.fontFamily = typo.fontFamily;
    if (typo.fontSizePt) style.fontSize = `${typo.fontSizePt}pt`;
    if (typo.fontWeight) style.fontWeight = typo.fontWeight;
    if (typo.fontStyle) style.fontStyle = typo.fontStyle;
    if (typo.textTransform) style.textTransform = typo.textTransform;
    if (typo.color) style.color = typo.color === 'PRIMARY' ? (primaryColorFallback || '#2B74B7') : typo.color;
    if (typo.lineHeight) style.lineHeight = typo.lineHeight;
    if (typo.letterSpacingEm !== undefined) style.letterSpacing = `${typo.letterSpacingEm}em`;
  }

  // 2. Spacing & Alignment
  if (sp) {
    if (sp.marginTopPt !== undefined) style.marginTop = `${sp.marginTopPt}pt`;
    if (sp.marginBottomPt !== undefined) style.marginBottom = `${sp.marginBottomPt}pt`;
    if (sp.paddingTopMm !== undefined) style.paddingTop = `${sp.paddingTopMm * MM_TO_PX}px`;
    if (sp.paddingRightMm !== undefined) style.paddingRight = `${sp.paddingRightMm * MM_TO_PX}px`;
    if (sp.paddingBottomMm !== undefined) style.paddingBottom = `${sp.paddingBottomMm * MM_TO_PX}px`;
    if (sp.paddingLeftMm !== undefined) style.paddingLeft = `${sp.paddingLeftMm * MM_TO_PX}px`;
    if (sp.textAlign) style.textAlign = sp.textAlign;
    if (sp.firstLineIndentMm) style.textIndent = `${sp.firstLineIndentMm * MM_TO_PX}px`;
  }

  // 3. Decorations
  if (dec) {
    if (dec.backgroundColor) style.backgroundColor = dec.backgroundColor;
    if (dec.borderRadiusPx) style.borderRadius = `${dec.borderRadiusPx}px`;

    const bStyle = dec.borderStyle && dec.borderStyle !== 'none' ? dec.borderStyle : 'solid';
    const bColor = dec.borderColor || '#CBD5E1';
    const bWidth = `${dec.borderWidthPt || 1}pt`;

    if (dec.borderTop) style.borderTop = `${bWidth} ${bStyle} ${bColor}`;
    if (dec.borderBottom) style.borderBottom = `${bWidth} ${bStyle} ${bColor}`;
    if (dec.borderLeft) style.borderLeft = `${bWidth} ${bStyle} ${bColor}`;
    if (dec.borderRight) style.borderRight = `${bWidth} ${bStyle} ${bColor}`;
    if (dec.boxShadow) style.boxShadow = dec.boxShadow;
  }

  // 4. Layout Scope
  if (scope) {
    if (scope.columnSpan === 'all') {
      (style as any).columnSpan = 'all';
    }
    if (scope.display) style.display = scope.display;
    if (scope.float && scope.float !== 'none') style.float = scope.float;
    if (scope.clear && scope.clear !== 'none') style.clear = scope.clear;
  }

  return style;
}

/**
 * Resolves Zone CSS Layout mechanics into modern CSS Grid / Flexbox / Columns / Block styles
 */
export function resolveZoneCssStyle(
  layout?: ZoneCssLayout,
  unitMultiplier: number = 1
): React.CSSProperties {
  if (!layout) {
    return { display: 'block', width: '100%', height: '100%' };
  }

  const style: React.CSSProperties = {
    width: layout.boxModel?.width || '100%',
    height: '100%',
    boxSizing: 'border-box',
  };

  // 1. Box Model (Margin & Padding)
  if (layout.boxModel) {
    const { margin, padding, border, overflow, backgroundColor } = layout.boxModel;
    if (margin) {
      style.marginTop = `${margin.topMm * MM_TO_PX * unitMultiplier}px`;
      style.marginRight = `${margin.rightMm * MM_TO_PX * unitMultiplier}px`;
      style.marginBottom = `${margin.bottomMm * MM_TO_PX * unitMultiplier}px`;
      style.marginLeft = `${margin.leftMm * MM_TO_PX * unitMultiplier}px`;
    }
    if (padding) {
      style.paddingTop = `${padding.topMm * MM_TO_PX * unitMultiplier}px`;
      style.paddingRight = `${padding.rightMm * MM_TO_PX * unitMultiplier}px`;
      style.paddingBottom = `${padding.bottomMm * MM_TO_PX * unitMultiplier}px`;
      style.paddingLeft = `${padding.leftMm * MM_TO_PX * unitMultiplier}px`;
    }
    if (overflow) style.overflow = overflow;
    if (backgroundColor) style.backgroundColor = backgroundColor;

    if (border?.show) {
      const bWidth = `${border.widthPt || 1}pt`;
      const bColor = border.color || '#CBD5E1';
      const bStyle = border.style || 'solid';
      if (border.top) style.borderTop = `${bWidth} ${bStyle} ${bColor}`;
      if (border.right) style.borderRight = `${bWidth} ${bStyle} ${bColor}`;
      if (border.bottom) style.borderBottom = `${bWidth} ${bStyle} ${bColor}`;
      if (border.left) style.borderLeft = `${bWidth} ${bStyle} ${bColor}`;
      if (border.radiusPx) style.borderRadius = `${border.radiusPx}px`;
    }
  }

  // 2. Display Modes
  switch (layout.display) {
    case 'grid': {
      style.display = 'grid';
      const grid = layout.grid;
      if (grid) {
        style.gridTemplateColumns = grid.templateColumns || '1fr 1fr';
        if (grid.templateRows) style.gridTemplateRows = grid.templateRows;
        style.columnGap = `${(grid.columnGapMm || 4) * MM_TO_PX * unitMultiplier}px`;
        style.rowGap = `${(grid.rowGapMm || 4) * MM_TO_PX * unitMultiplier}px`;
        if (grid.justifyItems) style.justifyItems = grid.justifyItems;
        if (grid.alignItems) style.alignItems = grid.alignItems;
        if (grid.autoFlow) style.gridAutoFlow = grid.autoFlow;
      }
      break;
    }

    case 'flex': {
      style.display = 'flex';
      const flex = layout.flex;
      if (flex) {
        style.flexDirection = flex.direction || 'row';
        style.flexWrap = flex.wrap || 'nowrap';
        style.justifyContent = flex.justifyContent || 'flex-start';
        style.alignItems = flex.alignItems || 'stretch';
        style.gap = `${(flex.gapMm || 3) * MM_TO_PX * unitMultiplier}px`;
      }
      break;
    }

    case 'columns': {
      const cols = layout.columns;
      if (cols) {
        style.columnCount = cols.columnCount || 2;
        style.columnGap = `${(cols.columnGapMm || 4.23) * MM_TO_PX * unitMultiplier}px`;
        style.columnFill = cols.columnFill || 'balance';
        if (cols.columnRule?.show) {
          style.columnRule = `${cols.columnRule.widthPt || 0.5}pt ${cols.columnRule.style || 'solid'} ${cols.columnRule.color || '#CBD5E1'}`;
        } else {
          style.columnRule = 'none';
        }
      }
      break;
    }

    case 'inline-block': {
      style.display = 'inline-block';
      break;
    }

    case 'block':
    default: {
      style.display = 'block';
      break;
    }
  }

  return style;
}
