/**
 * Modern CSS-Based Layout Mechanics for Scientific Paper Publishing
 * Supports CSS Grid, Flexbox, Multi-Column, Block/Inline-Block and Hybrid Blending.
 */

export type CssDisplayMode = 'grid' | 'flex' | 'columns' | 'block' | 'inline-block';

// --- 1. CSS GRID CONFIGURATION ---
export interface CssGridConfig {
  templateColumns: string; // e.g. "1fr 1fr", "240px 1fr", "repeat(3, 1fr)", "30% 70%"
  templateRows?: string;    // e.g. "auto 1fr", "repeat(4, auto)"
  columnGapMm: number;      // Khoảng cách cột (mm)
  rowGapMm: number;         // Khoảng cách dòng (mm)
  justifyItems?: 'start' | 'end' | 'center' | 'stretch';
  alignItems?: 'start' | 'end' | 'center' | 'stretch';
  autoFlow?: 'row' | 'column' | 'dense';
}

// --- 2. CSS FLEXBOX CONFIGURATION ---
export interface CssFlexConfig {
  direction: 'row' | 'column' | 'row-reverse' | 'column-reverse';
  wrap: 'nowrap' | 'wrap' | 'wrap-reverse';
  justifyContent: 'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around' | 'space-evenly';
  alignItems: 'stretch' | 'flex-start' | 'center' | 'flex-end' | 'baseline';
  gapMm: number; // Khoảng cách giữa các flex item (mm)
}

// --- 3. CSS MULTI-COLUMN CONFIGURATION ---
export interface CssColumnsConfig {
  columnCount: 1 | 2 | 3 | 4;
  columnGapMm: number; // in mm (e.g. 4.23mm = 1pc)
  columnRule: {
    show: boolean;
    style: 'solid' | 'dashed' | 'dotted' | 'double';
    color: string;
    widthPt: number;
  };
  columnFill: 'balance' | 'auto';
}

// --- 4. CSS BOX MODEL & DIMENSIONS ---
export interface CssBoxModelConfig {
  margin: {
    topMm: number;
    rightMm: number;
    bottomMm: number;
    leftMm: number;
  };
  padding: {
    topMm: number;
    rightMm: number;
    bottomMm: number;
    leftMm: number;
  };
  width?: string;         // e.g. "100%", "auto", "28%"
  minHeight?: string;     // e.g. "100%", "auto", "120mm"
  maxHeight?: string;
  overflow: 'visible' | 'hidden' | 'clip' | 'auto';
  backgroundColor?: string;
  border: {
    show: boolean;
    top: boolean;
    right: boolean;
    bottom: boolean;
    left: boolean;
    style: 'solid' | 'dashed' | 'dotted' | 'double' | 'none';
    color: string;
    widthPt: number;
    radiusPx: number;
  };
}

// --- 5. SUB-SLOT FOR HYBRID NESTING ---
export interface LayoutSubSlot {
  id: string;
  name: string;
  display: CssDisplayMode;
  grid?: CssGridConfig;
  flex?: CssFlexConfig;
  columns?: CssColumnsConfig;
  boxModel?: CssBoxModelConfig;
  elementTypes?: string[]; // Semantic elements placed in this sub-slot
}

// --- 6. UNIFIED ZONE CSS LAYOUT SPECIFICATION ---
export interface ZoneCssLayout {
  id: string;
  name: string;
  display: CssDisplayMode;
  grid?: CssGridConfig;
  flex?: CssFlexConfig;
  columns?: CssColumnsConfig;
  boxModel: CssBoxModelConfig;
  allowOverflowPush?: boolean;
  overflowBehavior?: 'push-down' | 'overflow-up' | 'clip' | 'auto-fit';
  subSlots?: LayoutSubSlot[]; // Cho phép hòa trộn đa cấp (Hybrid / Nesting)
}

// Standard Default Layout Presets for Academic Paper Zones
export const DEFAULT_FULL_WIDTH_BLOCK_LAYOUT: ZoneCssLayout = {
  id: 'layout-full-width',
  name: '1 Cột tràn trang (Block Flow)',
  display: 'block',
  boxModel: {
    margin: { topMm: 0, rightMm: 0, bottomMm: 2, leftMm: 0 },
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

export const DEFAULT_TWO_COLUMN_LAYOUT: ZoneCssLayout = {
  id: 'layout-2-column',
  name: '2 Cột bài báo khoa học (Multi-Column)',
  display: 'columns',
  columns: {
    columnCount: 2,
    columnGapMm: 6, // ~1pc
    columnRule: {
      show: false,
      style: 'solid',
      color: '#CBD5E1',
      widthPt: 0.5,
    },
    columnFill: 'balance',
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

export const DEFAULT_SIDEBAR_SPLIT_LAYOUT: ZoneCssLayout = {
  id: 'layout-sidebar-grid',
  name: 'Bố cục kết hợp (CSS Grid 2 cột + Flexbox Sidebar)',
  display: 'grid',
  grid: {
    templateColumns: '25% 1fr',
    columnGapMm: 6,
    rowGapMm: 4,
    justifyItems: 'stretch',
    alignItems: 'stretch',
  },
  boxModel: {
    margin: { topMm: 0, rightMm: 0, bottomMm: 0, leftMm: 0 },
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
  subSlots: [
    {
      id: 'sidebar-slot',
      name: 'Cột bên (Sidebar Flex)',
      display: 'flex',
      flex: {
        direction: 'column',
        wrap: 'nowrap',
        justifyContent: 'space-between',
        alignItems: 'stretch',
        gapMm: 3,
      },
      elementTypes: ['metadata-sidebar', 'affiliation-list'],
    },
    {
      id: 'main-content-slot',
      name: 'Cột nội dung chính (2 Cột nhỏ)',
      display: 'columns',
      columns: {
        columnCount: 2,
        columnGapMm: 4.5,
        columnRule: { show: false, style: 'solid', color: '#CBD5E1', widthPt: 0.5 },
        columnFill: 'auto',
      },
      elementTypes: ['abstract-box', 'keywords-group', 'heading-1', 'paragraph'],
    },
  ],
};
