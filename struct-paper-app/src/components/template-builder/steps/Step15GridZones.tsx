'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  LayoutZoneConfig,
  TemplateGridConfig,
  ZoneLayoutType,
  SemanticElement,
} from '@/types/template-builder';
import { GridZoneControls } from '../grid-zone-builder/GridZoneControls';
import { ZoneCssLayoutStudio } from '../layout-engine';
import { NestedZoneStudio } from '../nested-zones';
import { Select } from '@/components/ui/Select';
import { NumberInput } from '@/components/ui/NumberInput';
import {
  LayoutGrid,
  Columns,
  Trash2,
  ChevronUp,
  ChevronDown,
  Info,
  X,
  Combine,
  Link2,
  ArrowRight,
  ArrowLeft,
  ArrowUpFromLine,
  Sliders,
  Code2,
  Plus,
  Layers,
} from 'lucide-react';
import { toast } from '@/components/DynamicIslandToast';
import { getZoneAtCell } from '@/types/grid-zones';

interface Step15GridZonesProps {
  gridConfig?: TemplateGridConfig;
  zones: LayoutZoneConfig[];
  onZonesChange: (zones: LayoutZoneConfig[]) => void;
  onGridConfigChange: (config: TemplateGridConfig) => void;
  selectedZoneId?: string | null;
  onSelectZone?: (id: string) => void;
  onNavigateToBack?: () => void;
  onNavigateToElements?: () => void;
  elements?: SemanticElement[];
  onUpdateElement?: (id: string, updated: Partial<SemanticElement>) => void;
  focusedZoneId?: string | null;
  onFocusZone?: (zoneId: string | null) => void;
  currentPageNumber?: number;
}

export const Step15GridZones: React.FC<Step15GridZonesProps> = ({
  gridConfig,
  zones,
  onZonesChange,
  onGridConfigChange,
  selectedZoneId,
  onSelectZone,
  onNavigateToBack,
  onNavigateToElements,
  elements = [],
  onUpdateElement,
  focusedZoneId = null,
  onFocusZone,
  currentPageNumber = 1,
}) => {
  const [zoneEditModes, setZoneEditModes] = useState<Record<string, 'basic' | 'css-engine'>>({});
  const [showHelpPopup, setShowHelpPopup] = useState(false);
  const helpPopupRef = useRef<HTMLDivElement>(null);
  const helpBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!showHelpPopup) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        helpPopupRef.current &&
        !helpPopupRef.current.contains(e.target as Node) &&
        helpBtnRef.current &&
        !helpBtnRef.current.contains(e.target as Node)
      ) {
        setShowHelpPopup(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showHelpPopup]);
  const currentGridConfig: TemplateGridConfig = gridConfig || {
    enabled: true,
    columns: 5,
    rows: 5,
    rowGap: 8,
    colGap: 8,
    gapSync: true,
    unit: 'px',
  };

  // Update Grid Configuration
  const handleUpdateConfig = (updated: Partial<TemplateGridConfig>) => {
    onGridConfigChange({
      ...currentGridConfig,
      ...updated,
      enabled: true,
    });
  };

  // Reset grid
  const handleResetGrid = () => {
    const confirmed = window.confirm(
      'Bạn có chắc chắn muốn đặt lại toàn bộ lưới phân vùng về trạng thái ban đầu?'
    );
    if (!confirmed) return;

    onGridConfigChange({
      enabled: true,
      columns: 5,
      rows: 5,
      rowGap: 8,
      colGap: 8,
      gapSync: true,
      unit: 'px',
    });

    onZonesChange([]);
    toast.success('Đã đặt lại lưới', 'Đã xóa toàn bộ phân vùng trên lưới');
  };

  // Delete a zone
  const handleDeleteZone = (id: string) => {
    onZonesChange(zones.filter((z) => z.id !== id));
    toast.success('Đã xóa phân vùng');
  };

  // Move zone up/down
  const handleMoveZone = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= zones.length) return;
    const newZones = [...zones];
    const temp = newZones[index];
    newZones[index] = newZones[targetIdx];
    newZones[targetIdx] = temp;
    newZones.forEach((z, i) => (z.order = i + 1));
    onZonesChange(newZones);
  };

  // Update a single zone
  const handleUpdateZone = (id: string, updated: Partial<LayoutZoneConfig>) => {
    onZonesChange(
      zones.map((z) => (z.id === id ? { ...z, ...updated } : z))
    );
  };

  // Find first empty cell on the grid
  const findFirstEmptyCell = () => {
    const { columns, rows } = currentGridConfig;
    for (let r = 1; r <= rows; r++) {
      for (let c = 1; c <= columns; c++) {
        if (!getZoneAtCell(r, c, zones)) {
          return { rowStart: r, colStart: c, rowSpan: 1, colSpan: 1 };
        }
      }
    }
    return null;
  };

  // Add default zone with CSS Engine ready
  const handleAddDefaultZone = () => {
    const emptyCell = findFirstEmptyCell();
    const gridArea = emptyCell || {
      rowStart: 1,
      colStart: 1,
      rowSpan: Math.min(2, currentGridConfig.rows),
      colSpan: currentGridConfig.columns,
    };
    const targetPage = currentPageNumber || 1;
    const newZone: LayoutZoneConfig = {
      id: `zone-${Date.now()}`,
      name: `Phân vùng ${zones.length + 1}`,
      description: 'Phân vùng tạo mới',
      type: 'full-width',
      columns: 1,
      columnGap: 8,
      showColumnRule: false,
      columnRuleColor: '#E2E8F0',
      gridArea,
      page: targetPage,
      pageScope: targetPage === 1 ? 'first-page' : 'subsequent-pages',
      order: zones.length + 1,
      cssLayout: {
        id: `layout-${Date.now()}`,
        name: 'Mặc định Grid',
        display: 'grid',
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
      },
      subZones: [],
    };
    onZonesChange([...zones, newZone]);
    onSelectZone?.(newZone.id);
    setZoneEditModes((prev) => ({ ...prev, [newZone.id]: 'css-engine' }));
    toast.success('Đã thêm phân vùng mới', 'Đang mở chế độ Bố cục CSS Engine');
  };

  // Add a linked secondary block (Khối 2)
  const handleAddSecondaryBlock = (zoneId: string) => {
    const emptyCell = findFirstEmptyCell();
    if (!emptyCell) {
      toast.error(
        'Lưới đã kín ô',
        'Không còn ô trống trên lưới để tạo khối tiếp nối. Vui lòng tăng kích thước lưới hoặc thu nhỏ các phân vùng khác.'
      );
      return;
    }
    handleUpdateZone(zoneId, { secondaryGridArea: emptyCell });
    toast.success(
      'Đã liên kết Khối tiếp nối (2)',
      `Tạo Khối 2 tại Cột ${emptyCell.colStart}, Dòng ${emptyCell.rowStart}. Khi Khối 1 đầy nội dung, phần dư sẽ tự động đổ tiếp sang Khối 2!`
    );
  };

  // Remove secondary block
  const handleRemoveSecondaryBlock = (zoneId: string) => {
    handleUpdateZone(zoneId, { secondaryGridArea: undefined });
    toast.success('Đã gỡ khối tiếp nối', 'Phân vùng đã trở về dạng 1 khối đơn.');
  };

  // Merge another zone as a secondary block of targetZone
  const handleMergeWithZone = (targetZoneId: string, sourceZoneId: string) => {
    const sourceZone = zones.find((z) => z.id === sourceZoneId);
    if (!sourceZone || !sourceZone.gridArea) return;
    handleUpdateZone(targetZoneId, { secondaryGridArea: sourceZone.gridArea });
    onZonesChange(zones.filter((z) => z.id !== sourceZoneId));
    toast.success(
      'Đã ghép 2 khối thành 1 phân vùng',
      `Đã liên kết "${sourceZone.name}" làm Khối 2 của phân vùng này!`
    );
  };

  // If currently drilled-down into a specific zone, render isolated NestedZoneStudio
  if (focusedZoneId) {
    return (
      <div className="space-y-4 pb-8">
        <NestedZoneStudio
          zones={zones}
          onZonesChange={onZonesChange}
          focusedZoneId={focusedZoneId}
          onExitFocus={() => onFocusZone?.(null)}
          onFocusZone={(id) => onFocusZone?.(id)}
          elements={elements}
          onUpdateElement={onUpdateElement}
          currentPageNumber={currentPageNumber}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-8">

      {/* Top Banner Header (matching Step 2 style) */}
      <div className="relative z-30 focus-within:z-40 p-2 pb-4 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 relative">
            <LayoutGrid className="w-4 h-4 text-zinc-700" />
            <h3 className="font-extrabold text-sm sm:text-base text-zinc-900">
              Bước 2: Bố cục Lưới & Phân vùng ({zones.length} phân vùng)
            </h3>

            {/* Help (?) Button & Context-menu-style Popup */}
            <div className="relative inline-flex items-center">
              <button
                ref={helpBtnRef}
                type="button"
                onClick={() => setShowHelpPopup((prev) => !prev)}
                className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold transition-all cursor-pointer select-none ${showHelpPopup
                  ? 'bg-zinc-900 text-white shadow-xs scale-105'
                  : 'bg-zinc-200/80 hover:bg-zinc-300 text-zinc-700 hover:text-zinc-950 active:scale-95'
                  }`}
                title="Xem hướng dẫn thao tác Lưới Phân vùng"
                aria-label="Hướng dẫn thao tác"
              >
                ?
              </button>

              {/* Popup styled exactly like Excel table right-click context menu (TableSpreadsheetModal.tsx) */}
              {showHelpPopup && (
                <div
                  ref={helpPopupRef}
                  onClick={(e) => e.stopPropagation()}
                  className="w-80 bg-white/98 backdrop-blur-xl border border-zinc-200/90 rounded-2xl shadow-2xl p-2.5 text-xs text-zinc-800 space-y-1 animate-fadeIn select-none absolute left-0 top-full mt-2 z-50"
                >
                  <div className="px-2 py-1 text-[10px] font-bold text-zinc-400 uppercase tracking-wider select-none flex items-center justify-between">
                    <span>Hướng dẫn thao tác Lưới</span>
                    <button
                      type="button"
                      onClick={() => setShowHelpPopup(false)}
                      className="text-zinc-400 hover:text-zinc-700 cursor-pointer p-0.5 rounded-full hover:bg-zinc-100 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="border-t border-zinc-200 my-1" />

                  {/* 1. Tạo vùng nhanh */}
                  <div className="w-full px-2.5 py-2 rounded-xl hover:bg-lime-50/70 transition-colors flex items-start gap-2.5">
                    <div className="w-6 h-6 rounded-lg bg-lime-100 text-lime-800 font-extrabold flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                      +
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-zinc-900 text-xs">Tạo vùng nhanh (1×1)</div>
                      <div className="text-[11px] text-zinc-600 mt-0.5 leading-snug">
                        Nhấp vào ô dấu cộng <code className="bg-zinc-100 px-1 py-0.5 rounded font-mono font-bold">+</code> trên giấy để tạo ngay phân vùng một ô.
                      </div>
                    </div>
                  </div>

                  {/* 2. Kéo tạo vùng rộng */}
                  <div className="w-full px-2.5 py-2 rounded-xl hover:bg-blue-50/70 transition-colors flex items-start gap-2.5">
                    <div className="w-6 h-6 rounded-lg bg-blue-100 text-blue-800 font-extrabold flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                      <Combine className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-zinc-900 text-xs">Kéo tạo vùng rộng (m×n)</div>
                      <div className="text-[11px] text-zinc-600 mt-0.5 leading-snug">
                        Nhấp giữ chuột trên ô trống và kéo liên tục qua các ô lân cận để tạo vùng chiếm nhiều cột và dòng.
                      </div>
                    </div>
                  </div>

                  {/* 3. Co giãn kích thước */}
                  <div className="w-full px-2.5 py-2 rounded-xl hover:bg-amber-50/70 transition-colors flex items-start gap-2.5">
                    <div className="w-6 h-6 rounded-lg bg-amber-100 text-amber-800 font-extrabold flex items-center justify-center shrink-0 mt-0.5 shadow-2xs font-mono">
                      ⤡
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-zinc-900 text-xs">Co giãn từ 2 góc đối diện</div>
                      <div className="text-[11px] text-zinc-600 mt-0.5 leading-snug">
                        Kéo biểu tượng <code className="bg-zinc-100 px-1 py-0.5 rounded font-mono font-bold">⌜</code> ở góc trên-trái hoặc <code className="bg-zinc-100 px-1 py-0.5 rounded font-mono font-bold">⌟</code> ở góc dưới-phải để co giãn kích thước vùng cực kỳ linh hoạt.
                      </div>
                    </div>
                  </div>

                  {/* 4. Kéo thả di chuyển khối */}
                  <div className="w-full px-2.5 py-2 rounded-xl hover:bg-emerald-50/70 transition-colors flex items-start gap-2.5">
                    <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-800 font-extrabold flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                      <LayoutGrid className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-zinc-900 text-xs">Kéo thả di chuyển khối</div>
                      <div className="text-[11px] text-zinc-600 mt-0.5 leading-snug">
                        Nhấp giữ vào thân khối và kéo thả đến các ô trống mong muốn trên lưới. Hệ thống tự động bắt dính và kiểm tra tránh đè vùng khác.
                      </div>
                    </div>
                  </div>

                  {/* 5. Tràn lên phân vùng phía trên */}
                  <div className="w-full px-2.5 py-2 rounded-xl hover:bg-amber-50/70 transition-colors flex items-start gap-2.5">
                    <div className="w-6 h-6 rounded-lg bg-amber-100 text-amber-800 font-extrabold flex items-center justify-center shrink-0 mt-0.5 shadow-2xs font-mono">
                      ⤊
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-zinc-900 text-xs">Tràn lên phân vùng phía trên</div>
                      <div className="text-[11px] text-zinc-600 mt-0.5 leading-snug">
                        Trong cấu hình phân vùng, chọn cơ chế &quot;Tràn lên trên&quot; để phân vùng tự mở rộng ngược lên chiếm không gian phân vùng phía trên khi nội dung quá dài.
                      </div>
                    </div>
                  </div>

                  {/* 6. Hai khối biệt lập là 1 phân vùng (Chuỗi dòng chảy) */}
                  <div className="w-full px-2.5 py-2 rounded-xl hover:bg-blue-50/70 transition-colors flex items-start gap-2.5">
                    <div className="w-6 h-6 rounded-lg bg-blue-100 text-blue-800 font-extrabold flex items-center justify-center shrink-0 mt-0.5 shadow-2xs font-mono">
                      🔗
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-zinc-900 text-xs">2 khối biệt lập là 1 phân vùng (Dòng chảy)</div>
                      <div className="text-[11px] text-zinc-600 mt-0.5 leading-snug">
                        Bấm &quot;+ Thêm khối tiếp nối&quot; để tạo thêm Khối 2 độc lập trên lưới. Khi Khối 1 đầy nội dung, hệ thống sẽ tự động fill tiếp tục vào Khối 2!
                      </div>
                    </div>
                  </div>

                  {/* 7. Đổi tên hoặc Xóa */}
                  <div className="w-full px-2.5 py-2 rounded-xl hover:bg-rose-50/70 transition-colors flex items-start gap-2.5">
                    <div className="w-6 h-6 rounded-lg bg-rose-100 text-rose-800 font-extrabold flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                      <Trash2 className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-zinc-900 text-xs">Đổi tên hoặc Xóa</div>
                      <div className="text-[11px] text-zinc-600 mt-0.5 leading-snug">
                        Nhấp đúp vào nhãn tên khối để sửa trực tiếp, hoặc nhấn nút <code className="bg-rose-100 text-rose-700 px-1 py-0.5 rounded font-bold">×</code> ở góc trên phải để xóa.
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Grid Dimensions & Gap Settings (Columns, Rows, Gap controls) */}
      <div className="p-4 sm:p-5 rounded-[32px] bg-gray-200/50 space-y-3">
        <h3 className="text-xs font-extrabold text-zinc-800 uppercase tracking-wider flex items-center gap-2">
          <Columns className="w-3.5 h-3.5 text-zinc-500" />
          <span>Cấu hình Ma trận Lưới & Khoảng cách (Gap)</span>
        </h3>

        <GridZoneControls
          gridConfig={currentGridConfig}
          onUpdateGridConfig={handleUpdateConfig}
          onResetGrid={handleResetGrid}
        />
      </div>

      {/* 3. List of Configured Zones */}
      <div className="p-4 sm:p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-zinc-200/60 gap-2">
          <div className="flex items-center gap-2">
            <Columns className="w-4 h-4 text-zinc-700" />
            <h3 className="font-extrabold text-sm sm:text-base text-zinc-900">
              Danh sách Phân vùng ({zones.length})
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleAddDefaultZone}
              className="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs cursor-pointer transition-all active:scale-95"
            >
              <Plus className="w-3.5 h-3.5 text-[#78C841]" />
              <span>+ Thêm phân vùng</span>
            </button>
          </div>
        </div>

        {zones.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-zinc-50 border border-dashed border-zinc-300 space-y-3">
            <LayoutGrid className="w-8 h-8 text-zinc-400 mx-auto" />
            <p className="text-xs font-bold text-zinc-700">Chưa có phân vùng nào</p>
            <p className="text-[11px] text-zinc-500 max-w-sm mx-auto">
              Nhấp vào bất kỳ ô <code className="bg-zinc-200 px-1 rounded font-bold">+</code> trên tờ giấy bên phải để tạo phân vùng đầu tiên, hoặc bấm nút bên dưới để tạo nhanh.
            </p>
            <button
              type="button"
              onClick={handleAddDefaultZone}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-zinc-900 text-white text-xs font-bold shadow-xs hover:bg-zinc-800 cursor-pointer transition-all active:scale-95"
            >
              <Plus className="w-4 h-4 text-[#78C841]" />
              <span>Tạo phân vùng đầu tiên (Chế độ CSS Engine)</span>
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {zones.map((zone, index) => {
              const isSelected = selectedZoneId === zone.id;

              return (
                <div
                  key={zone.id}
                  onClick={() => onSelectZone?.(zone.id)}
                  className={`p-4 rounded-[28px] transition-all space-y-3 cursor-pointer ${isSelected
                    ? 'bg-gray-200/50 ring-2 ring-[#78C841] border border-[#78C841] shadow-sm'
                    : 'bg-gray-200/50 hover:bg-zinc-100 hover:border-zinc-300/80'
                    }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                      <span className="w-7 h-7 rounded-xl bg-zinc-900 text-white flex items-center justify-center text-xs font-extrabold font-mono shadow-2xs shrink-0">
                        {index + 1}
                      </span>
                      <input
                        type="text"
                        value={zone.name}
                        onChange={(e) => handleUpdateZone(zone.id, { name: e.target.value })}
                        onClick={(e) => e.stopPropagation()}
                        className="font-extrabold text-xs text-zinc-900 bg-transparent border-b border-transparent hover:border-zinc-300 focus:border-[#78C841] outline-none px-1.5 py-0.5 flex-1 min-w-0"
                      />
                    </div>

                    <div className="flex items-center gap-1">
                      {/* Drill down into sub-zones */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onFocusZone?.(zone.id);
                        }}
                        className="px-2.5 py-1 rounded-xl bg-white hover:bg-zinc-50 border border-zinc-200/90 text-zinc-800 hover:text-black text-xs font-bold shadow-2xs flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                        title="Đi vào chế độ phân chia vùng con đa cấp (Nested Sub-grid)"
                      >
                        <Layers className="w-3.5 h-3.5 text-[#78C841]" />
                        <span>
                          {zone.subZones && zone.subZones.length > 0
                            ? `${zone.subZones.length} vùng con`
                            : 'Chia vùng con'}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMoveZone(index, 'up');
                        }}
                        disabled={index === 0}
                        className="p-1.5 rounded-xl hover:bg-white text-zinc-500 hover:text-zinc-900 disabled:opacity-30 cursor-pointer transition-colors shadow-2xs"
                        title="Di chuyển lên trên"
                      >
                        <ChevronUp className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMoveZone(index, 'down');
                        }}
                        disabled={index === zones.length - 1}
                        className="p-1.5 rounded-xl hover:bg-white text-zinc-500 hover:text-zinc-900 disabled:opacity-30 cursor-pointer transition-colors shadow-2xs"
                        title="Di chuyển xuống dưới"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteZone(zone.id);
                        }}
                        className="p-1.5 rounded-xl hover:bg-red-50 text-red-500 cursor-pointer ml-1 transition-colors"
                        title="Xóa phân vùng này"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Zone Configuration Details */}
                  <div className="pt-2 border-t border-zinc-200/60 space-y-3">
                    <div className="flex items-center gap-1.5 p-1 bg-zinc-200/70 rounded-2xl w-fit">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setZoneEditModes((prev) => ({ ...prev, [zone.id]: 'basic' }));
                        }}
                        className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${(zoneEditModes[zone.id] || 'basic') === 'basic'
                            ? 'bg-zinc-900 text-white shadow-2xs'
                            : 'text-zinc-600 hover:text-zinc-900'
                          }`}
                      >
                        <Sliders className="w-3.5 h-3.5 text-zinc-400" />
                        <span>Cơ bản (Lưới trang)</span>
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setZoneEditModes((prev) => ({ ...prev, [zone.id]: 'css-engine' }));
                        }}
                        className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${zoneEditModes[zone.id] === 'css-engine'
                            ? 'bg-zinc-900 text-white shadow-2xs ring-2 ring-[#78C841]/50'
                            : 'text-zinc-600 hover:text-zinc-900'
                          }`}
                      >
                        <Code2 className="w-3.5 h-3.5 text-[#78C841]" />
                        <span>Bố cục CSS Engine (Grid / Flexbox / Box Model)</span>
                      </button>
                    </div>

                    {zoneEditModes[zone.id] === 'css-engine' ? (
                      <div onClick={(e) => e.stopPropagation()}>
                        <ZoneCssLayoutStudio
                          zone={zone}
                          allZones={zones}
                          elements={elements}
                          onUpdateZone={(uz) => handleUpdateZone(zone.id, uz)}
                          onUpdateElement={onUpdateElement || (() => { })}
                        />
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                            <Select
                              label="Kiểu chia phân vùng:"
                              labelClassName="text-[10px] font-bold text-zinc-600 mb-1"
                              value={zone.type}
                              onChange={(val) =>
                                handleUpdateZone(zone.id, {
                                  type: val as ZoneLayoutType,
                                })
                              }
                              variant="flat-white"
                              size="xs"
                              options={[
                                { value: 'full-width', label: '1 Cột toàn trang (100% Full Width)' },
                                { value: 'multi-column', label: 'Chia nhiều cột đều nhau (Multi-column)' },
                                { value: 'sidebar-split', label: 'Cột trái Sidebar + Cột phải Nội dung' },
                              ]}
                            />
                          </div>

                          {zone.type === 'multi-column' && (
                            <div>
                              <label className="block text-[10px] font-bold text-zinc-600 mb-1">
                                Số cột:
                              </label>
                              <div className="flex gap-1.5 bg-zinc-200/60 p-1 rounded-2xl select-none">
                                {[1, 2, 3].map((colNum) => (
                                  <button
                                    key={colNum}
                                    type="button"
                                    onClick={() => handleUpdateZone(zone.id, { columns: colNum as 1 | 2 | 3 })}
                                    className={`flex-1 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${zone.columns === colNum
                                      ? 'bg-zinc-900 text-white shadow-2xs font-extrabold'
                                      : 'text-zinc-600 hover:text-zinc-900 hover:bg-white/60'
                                      }`}
                                  >
                                    {colNum} cột
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                          {zone.type === 'sidebar-split' && (
                            <div>
                              <label className="block text-[10px] font-bold text-zinc-600 mb-1">
                                Tỷ lệ cột trái (%):
                              </label>
                              <NumberInput
                                min={20}
                                max={40}
                                step={1}
                                unit="%"
                                size="xs"
                                variant="flat-white"
                                value={zone.sidebarWidthPercentage || 28}
                                onChange={(val) =>
                                  handleUpdateZone(zone.id, {
                                    sidebarWidthPercentage: val,
                                  })
                                }
                              />
                            </div>
                          )}

                          <div>
                            <label className="block text-[10px] font-bold text-zinc-600 mb-1">
                              Khoảng cách cột (Gap mm):
                            </label>
                            <NumberInput
                              min={2}
                              max={15}
                              step={0.5}
                              unit="mm"
                              size="xs"
                              variant="flat-white"
                              value={zone.columnGap}
                              onChange={(val) =>
                                handleUpdateZone(zone.id, {
                                  columnGap: val,
                                })
                              }
                            />
                          </div>

                          {/* Cơ chế khi tràn (Overflow behavior) */}
                          <div>
                            <Select
                              label="Cơ chế tràn khi quá dài:"
                              labelClassName="text-[10px] font-bold text-zinc-600 mb-1"
                              value={
                                zone.overflowBehavior === 'auto-fit' || zone.autoFitHeight || zone.heightMode === 'auto'
                                  ? 'auto-fit'
                                  : (zone.overflowBehavior || 'push-down')
                              }
                              onChange={(val) =>
                                handleUpdateZone(zone.id, {
                                  overflowBehavior: val as 'push-down' | 'overflow-up' | 'clip' | 'auto-fit',
                                  allowOverflowPush: val === 'push-down' || val === 'overflow-up' || val === 'auto-fit',
                                  autoFitHeight: val === 'auto-fit',
                                  heightMode: val === 'auto-fit' ? 'auto' : 'grid',
                                })
                              }
                              variant="flat-white"
                              size="xs"
                              options={[
                                { value: 'push-down', label: '⤋ Tràn xuống (Tự đẩy phân vùng dưới)' },
                                { value: 'overflow-up', label: '⤊ Tràn lên trên (Tràn lên vùng phía trên)' },
                                { value: 'clip', label: '✂ Cắt gọn (Cố định trong ô, không tràn)' },
                                { value: 'auto-fit', label: '↕ Ôm sát nội dung (Tự co dãn khi tắt lưới)' },
                              ]}
                            />
                          </div>

                          {/* Chuỗi dòng chảy 2 khối biệt lập (Multi-block flow chain) */}
                          <div className="pt-2 sm:col-span-3 border-t border-zinc-200/60 space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5 text-xs font-extrabold text-zinc-800">
                                <Link2 className="w-3.5 h-3.5 text-[#78C841]" />
                                <span>Chuỗi dòng chảy 2 khối (Liên kết 2 khối biệt lập)</span>
                              </div>
                              {zone.secondaryGridArea && (
                                <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
                                  Đang liên kết 2 khối
                                </span>
                              )}
                            </div>

                            {zone.secondaryGridArea ? (
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-2xl bg-white border border-emerald-300 shadow-2xs">
                                <div className="text-xs text-zinc-800 space-y-0.5">
                                  <div className="font-extrabold flex items-center gap-1.5 text-emerald-900">
                                    <span className="px-1.5 py-0.5 rounded bg-emerald-700 text-white text-[10px]">1A</span>
                                    <span>Cột {zone.gridArea?.colStart}, Dòng {zone.gridArea?.rowStart}</span>
                                    <ArrowRight className="w-3.5 h-3.5 text-emerald-600" />
                                    <span className="px-1.5 py-0.5 rounded bg-emerald-700 text-white text-[10px]">1B</span>
                                    <span>
                                      Cột {zone.secondaryGridArea.colStart}, Dòng {zone.secondaryGridArea.rowStart} ({zone.secondaryGridArea.colSpan}c×{zone.secondaryGridArea.rowSpan}r)
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-zinc-500">
                                    Khi nội dung Khối 1A đầy, hệ thống sẽ tự động fill tiếp tục nội dung sang Khối 1B.
                                  </p>
                                </div>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRemoveSecondaryBlock(zone.id);
                                  }}
                                  className="px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition-colors cursor-pointer shrink-0"
                                >
                                  Gỡ khối 2
                                </button>
                              </div>
                            ) : (
                              <div className="flex flex-wrap items-center gap-2">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleAddSecondaryBlock(zone.id);
                                  }}
                                  className="px-3 py-1.5 rounded-xl bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-300 text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer hover:border-emerald-500"
                                >
                                  <Link2 className="w-3.5 h-3.5 text-[#78C841]" />
                                  <span>+ Thêm khối tiếp nối (Khối 2) trên lưới</span>
                                </button>

                                {/* Ghép với phân vùng khác có sẵn */}
                                {zones.filter((z) => z.id !== zone.id && !z.secondaryGridArea).length > 0 && (
                                  <div className="flex items-center gap-1.5 text-xs text-zinc-600">
                                    <span className="text-[11px] text-zinc-400">hoặc ghép:</span>
                                    <select
                                      defaultValue=""
                                      onChange={(e) => {
                                        if (e.target.value) {
                                          handleMergeWithZone(zone.id, e.target.value);
                                        }
                                      }}
                                      onClick={(e) => e.stopPropagation()}
                                      className="text-xs bg-white border border-zinc-300 rounded-xl px-2 py-1 outline-none text-zinc-800 font-bold cursor-pointer"
                                    >
                                      <option value="" disabled>
                                        Chọn phân vùng để gộp...
                                      </option>
                                      {zones
                                        .filter((z) => z.id !== zone.id && !z.secondaryGridArea)
                                        .map((other) => (
                                          <option key={other.id} value={other.id}>
                                            Gộp &quot;{other.name}&quot; vào làm Khối 2
                                          </option>
                                        ))}
                                    </select>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};
