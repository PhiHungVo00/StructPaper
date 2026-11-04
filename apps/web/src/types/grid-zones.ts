import { GridAreaCoords, LayoutZoneConfig, TemplateGridConfig } from './template-builder';

export interface GridCellCoord {
  row: number; // 1-indexed
  col: number; // 1-indexed
}

export interface GridDragSelection {
  isDragging: boolean;
  startCell: GridCellCoord | null;
  currentCell: GridCellCoord | null;
  mode: 'create' | 'resize';
  resizeZoneId?: string;
  originalArea?: GridAreaCoords;
}

export interface GridPresetOption {
  id: string;
  name: string;
  description: string;
  columns: number;
  rows: number;
  rowGap: number;
  colGap: number;
  zones: Array<{
    name: string;
    gridArea: GridAreaCoords;
    columns?: 1 | 2 | 3;
  }>;
}

/**
 * Checks if two grid areas overlap in row/col coordinates
 */
export function doGridAreasOverlap(a: GridAreaCoords, b: GridAreaCoords): boolean {
  const aRowEnd = a.rowStart + a.rowSpan;
  const aColEnd = a.colStart + a.colSpan;
  const bRowEnd = b.rowStart + b.rowSpan;
  const bColEnd = b.colStart + b.colSpan;

  const rowOverlap = a.rowStart < bRowEnd && aRowEnd > b.rowStart;
  const colOverlap = a.colStart < bColEnd && aColEnd > b.colStart;

  return rowOverlap && colOverlap;
}

/**
 * Normalizes two diagonal cells into a valid GridAreaCoords
 */
export function normalizeSelectionToArea(
  start: GridCellCoord,
  end: GridCellCoord
): GridAreaCoords {
  const rowStart = Math.min(start.row, end.row);
  const rowEnd = Math.max(start.row, end.row);
  const colStart = Math.min(start.col, end.col);
  const colEnd = Math.max(start.col, end.col);

  return {
    rowStart,
    colStart,
    rowSpan: rowEnd - rowStart + 1,
    colSpan: colEnd - colStart + 1,
  };
}

/**
 * Finds which zone occupies a specific grid cell
 */
export function getZoneAtCell(
  row: number,
  col: number,
  zones: LayoutZoneConfig[],
  excludeZoneId?: string
): LayoutZoneConfig | undefined {
  return zones.find((z) => {
    if (excludeZoneId && z.id === excludeZoneId) return false;
    const inPrimary =
      z.gridArea &&
      row >= z.gridArea.rowStart &&
      row < z.gridArea.rowStart + z.gridArea.rowSpan &&
      col >= z.gridArea.colStart &&
      col < z.gridArea.colStart + z.gridArea.colSpan;
    const inSecondary =
      z.secondaryGridArea &&
      row >= z.secondaryGridArea.rowStart &&
      row < z.secondaryGridArea.rowStart + z.secondaryGridArea.rowSpan &&
      col >= z.secondaryGridArea.colStart &&
      col < z.secondaryGridArea.colStart + z.secondaryGridArea.colSpan;
    return inPrimary || inSecondary;
  });
}

/**
 * Common scholarly presets for quick grid construction
 */
export const GRID_ZONE_PRESETS: GridPresetOption[] = [
  {
    id: 'vnuhcm-5x5',
    name: 'Lưới 5×5 Chuẩn Tạp chí',
    description: 'Bố cục 5 dòng × 5 cột tương tự ảnh mẫu, linh hoạt chia khối tiêu đề & 2-3 cột',
    columns: 5,
    rows: 5,
    rowGap: 8,
    colGap: 8,
    zones: [
      {
        name: 'Phân vùng 1 (Tiêu đề lớn)',
        gridArea: { rowStart: 1, colStart: 1, rowSpan: 2, colSpan: 2 },
        columns: 1,
      },
      {
        name: 'Phân vùng 2 (Tác giả & Metadata)',
        gridArea: { rowStart: 1, colStart: 3, rowSpan: 1, colSpan: 1 },
        columns: 1,
      },
      {
        name: 'Phân vùng 3 (Tóm tắt Abstract)',
        gridArea: { rowStart: 2, colStart: 3, rowSpan: 1, colSpan: 1 },
        columns: 1,
      },
      {
        name: 'Phân vùng 4 (Thân bài cột phải)',
        gridArea: { rowStart: 2, colStart: 4, rowSpan: 1, colSpan: 1 },
        columns: 1,
      },
      {
        name: 'Phân vùng 5 (Nội dung chi tiết)',
        gridArea: { rowStart: 3, colStart: 3, rowSpan: 1, colSpan: 1 },
        columns: 1,
      },
    ],
  },
  {
    id: 'academic-2col-standard',
    name: 'Học thuật 2 Cột Chuẩn (IEEE)',
    description: 'Tiêu đề toàn trang ở trên (Row 1), Thân bài 2 cột đều nhau ở dưới (Row 2-4)',
    columns: 4,
    rows: 4,
    rowGap: 10,
    colGap: 12,
    zones: [
      {
        name: 'Phân vùng Đầu bài (Front Matter)',
        gridArea: { rowStart: 1, colStart: 1, rowSpan: 1, colSpan: 4 },
        columns: 1,
      },
      {
        name: 'Thân bài Cột Trái',
        gridArea: { rowStart: 2, colStart: 1, rowSpan: 3, colSpan: 2 },
        columns: 1,
      },
      {
        name: 'Thân bài Cột Phải',
        gridArea: { rowStart: 2, colStart: 3, rowSpan: 3, colSpan: 2 },
        columns: 1,
      },
    ],
  },
  {
    id: 'sidebar-magazine',
    name: 'Sidebar Trái + Nội dung Chính',
    description: 'Cột trái dành cho Tóm tắt, DOI, Lịch sử duyệt bài; cột phải dành cho bài báo',
    columns: 4,
    rows: 4,
    rowGap: 8,
    colGap: 10,
    zones: [
      {
        name: 'Sidebar Thông tin Bài báo',
        gridArea: { rowStart: 1, colStart: 1, rowSpan: 4, colSpan: 1 },
        columns: 1,
      },
      {
        name: 'Tiêu đề & Tác giả Chính',
        gridArea: { rowStart: 1, colStart: 2, rowSpan: 1, colSpan: 3 },
        columns: 1,
      },
      {
        name: 'Nội dung Bài báo (2 cột)',
        gridArea: { rowStart: 2, colStart: 2, rowSpan: 3, colSpan: 3 },
        columns: 2,
      },
    ],
  },
  {
    id: 'nature-style',
    name: 'Chuẩn Nature / Springer 3 Cột',
    description: 'Khối tiêu đề tràn trang, 3 cột nội dung song song bên dưới',
    columns: 3,
    rows: 4,
    rowGap: 8,
    colGap: 8,
    zones: [
      {
        name: 'Khối Tiêu đề & Abstract',
        gridArea: { rowStart: 1, colStart: 1, rowSpan: 1, colSpan: 3 },
        columns: 1,
      },
      {
        name: 'Nội dung Cột 1',
        gridArea: { rowStart: 2, colStart: 1, rowSpan: 3, colSpan: 1 },
        columns: 1,
      },
      {
        name: 'Nội dung Cột 2',
        gridArea: { rowStart: 2, colStart: 2, rowSpan: 3, colSpan: 1 },
        columns: 1,
      },
      {
        name: 'Nội dung Cột 3',
        gridArea: { rowStart: 2, colStart: 3, rowSpan: 3, colSpan: 1 },
        columns: 1,
      },
    ],
  },
];
