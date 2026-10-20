'use client';

import React, { useState, useEffect } from 'react';
import { LayoutZoneConfig } from '@/types/template-builder';
import { X, Layers, Edit2 } from 'lucide-react';

interface ChildSubZoneCardProps {
  subZone: LayoutZoneConfig;
  index: number;
  isSelected: boolean;
  isMoving?: boolean;
  isResizing?: boolean;
  maxCols: number;
  onSelect: (id: string) => void;
  onDrillDown?: (id: string) => void;
  onDelete?: (id: string) => void;
  onUpdateSubZone?: (id: string, updated: Partial<LayoutZoneConfig>) => void;
  onStartMove?: (id: string, e: React.MouseEvent) => void;
  onStartResize?: (id: string, handle: 'se' | 'nw', e: React.MouseEvent) => void;
  onAssignElementToZone?: (elementId: string, zoneId: string) => void;
}

const SUBZONE_TINTS = [
  {
    base: 'bg-[#78C841]/12 hover:bg-[#78C841]/22 border-[#78C841] hover:border-[#6cb938] text-zinc-950',
    selected: 'bg-[#78C841]/25 border-[#78C841] ring-2 ring-[#78C841]/60 shadow-md z-20',
    indexBg: 'bg-[#14532D] text-white',
    labelBg: 'bg-white/90 text-[#14532D] border-[#78C841]/40',
    badge: 'bg-white/90 text-[#14532D] border-[#78C841]/30',
  },
  {
    base: 'bg-blue-500/12 hover:bg-blue-500/22 border-blue-600/70 hover:border-blue-600 text-blue-950',
    selected: 'bg-blue-500/25 border-blue-600 ring-2 ring-blue-500/60 shadow-md z-20',
    indexBg: 'bg-blue-800 text-white',
    labelBg: 'bg-white/85 text-blue-950 border-blue-200/80',
    badge: 'bg-white/85 text-blue-900 border-blue-200/60',
  },
  {
    base: 'bg-purple-500/12 hover:bg-purple-500/22 border-purple-600/70 hover:border-purple-600 text-purple-950',
    selected: 'bg-purple-500/25 border-purple-600 ring-2 ring-purple-500/60 shadow-md z-20',
    indexBg: 'bg-purple-800 text-white',
    labelBg: 'bg-white/85 text-purple-950 border-purple-200/80',
    badge: 'bg-white/85 text-purple-900 border-purple-200/60',
  },
  {
    base: 'bg-amber-500/12 hover:bg-amber-500/22 border-amber-600/70 hover:border-amber-600 text-amber-950',
    selected: 'bg-amber-500/25 border-amber-600 ring-2 ring-amber-500/60 shadow-md z-20',
    indexBg: 'bg-amber-800 text-white',
    labelBg: 'bg-white/85 text-amber-950 border-amber-200/80',
    badge: 'bg-white/85 text-amber-900 border-amber-200/60',
  },
];

export const ChildSubZoneCard: React.FC<ChildSubZoneCardProps> = ({
  subZone,
  index,
  isSelected,
  isMoving = false,
  isResizing = false,
  onSelect,
  onDrillDown,
  onDelete,
  onUpdateSubZone,
  onStartMove,
  onStartResize,
  onAssignElementToZone,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempName, setTempName] = useState(subZone.name);
  const [isSubDropTarget, setIsSubDropTarget] = useState(false);

  const tint = SUBZONE_TINTS[index % SUBZONE_TINTS.length];

  useEffect(() => {
    setTempName(subZone.name);
  }, [subZone.name]);

  const handleFinishEditing = () => {
    setIsEditing(false);
    const trimmed = tempName.trim();
    if (trimmed && trimmed !== subZone.name) {
      onUpdateSubZone?.(subZone.id, { name: trimmed });
    } else {
      setTempName(subZone.name);
    }
  };

  const area = subZone.gridArea || {
    rowStart: 1,
    colStart: index + 1,
    rowSpan: 1,
    colSpan: 1,
  };

  return (
    <div
      onMouseDown={(e) => {
        const target = e.target as HTMLElement;
        if (target.closest('button, input, [data-sub-resize]')) return;
        e.stopPropagation();
        onStartMove?.(subZone.id, e);
      }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(subZone.id);
      }}
      onDragOver={(e) => {
        if (
          e.dataTransfer.types.includes('application/structpaper-element-id') ||
          e.dataTransfer.types.includes('text/plain')
        ) {
          e.preventDefault();
          e.stopPropagation();
          e.dataTransfer.dropEffect = 'copy';
          if (!isSubDropTarget) setIsSubDropTarget(true);
        }
      }}
      onDragLeave={(e) => {
        e.preventDefault();
        setIsSubDropTarget(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsSubDropTarget(false);
        const elemId =
          e.dataTransfer.getData('application/structpaper-element-id') ||
          e.dataTransfer.getData('text/plain');
        if (elemId && onAssignElementToZone) {
          onAssignElementToZone(elemId, subZone.id);
        }
      }}
      style={{
        gridRow: `${area.rowStart} / span ${area.rowSpan}`,
        gridColumn: `${area.colStart} / span ${area.colSpan}`,
      }}
      className={`group/subcard relative rounded-xl border-2 transition-all flex flex-col justify-between p-1.5 select-none ${
        isSubDropTarget
          ? 'ring-3 ring-[#78C841] bg-[#78C841]/25 border-[#78C841] z-50 shadow-lg'
          : isMoving || isResizing
            ? 'border-dashed border-[#78C841] bg-[#78C841]/20 opacity-50 scale-[0.98]'
            : isSelected
              ? tint.selected
              : `${tint.base} shadow-xs cursor-grab active:cursor-grabbing`
      }`}
      title={`Vùng con "${subZone.name}" (C${area.colStart}..${area.colStart + area.colSpan - 1} × R${area.rowStart}..${area.rowStart + area.rowSpan - 1}). Nhấp đúp tên để đổi tên, kéo góc để co giãn ô`}
    >
      {/* Drop Target Overlay */}
      {isSubDropTarget && (
        <div className="absolute inset-0 bg-[#78C841]/35 border-2 border-dashed border-[#78C841] rounded-lg z-50 flex items-center justify-center p-1 text-center pointer-events-none animate-fadeIn backdrop-blur-2xs shadow-xl">
          <div className="bg-white/95 text-[#14532D] text-[10px] font-black px-2 py-0.5 rounded-full shadow-md flex items-center gap-1 border border-[#78C841]/50">
            <span>📥</span>
            <span>Thả vào {subZone.name}</span>
          </div>
        </div>
      )}
      {/* 1. TOP-LEFT Corner Resize Handle (nw) */}
      <div
        data-sub-resize="nw"
        onMouseDown={(e) => {
          e.stopPropagation();
          onStartResize?.(subZone.id, 'nw', e);
        }}
        className="absolute top-0.5 left-0.5 w-3.5 h-3.5 rounded bg-white/90 border border-zinc-300 text-zinc-600 hover:text-[#78C841] hover:border-[#78C841] cursor-nw-resize shadow-2xs hover:scale-110 active:scale-95 transition-transform flex items-center justify-center z-30 pointer-events-auto"
        title="Kéo góc trên-trái để co giãn vùng con"
      >
        <div className="w-2 h-2 border-l-2 border-t-2 border-current rounded-tl-[1px]" />
      </div>

      {/* Header: Index pill, name (editable), drill-down, delete */}
      <div className="flex items-center justify-between gap-1 pl-3.5">
        <div className="flex items-center gap-1 min-w-0">
          <span className={`w-3.5 h-3.5 rounded ${tint.indexBg} text-white flex items-center justify-center text-[7.5px] font-mono font-bold shrink-0 shadow-2xs`}>
            {index + 1}
          </span>

          {isEditing ? (
            <input
              type="text"
              autoFocus
              value={tempName}
              onChange={(e) => setTempName(e.target.value)}
              onBlur={handleFinishEditing}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleFinishEditing();
                if (e.key === 'Escape') {
                  setTempName(subZone.name);
                  setIsEditing(false);
                }
              }}
              className="text-[8.5px] font-extrabold text-zinc-900 bg-white/95 border border-[#78C841] rounded px-1 py-0.2 outline-none w-20 shadow-2xs"
            />
          ) : (
            <span
              onDoubleClick={(e) => {
                e.stopPropagation();
                setIsEditing(true);
              }}
              className={`text-[8.5px] font-extrabold ${tint.labelBg} backdrop-blur-xs px-1.5 py-0.5 rounded-md border truncate max-w-[95px] cursor-text hover:underline shadow-2xs`}
              title="Nhấp đúp để đổi tên phân vùng con"
            >
              {subZone.name}
            </span>
          )}
        </div>

        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsEditing(true);
            }}
            className="p-0.5 rounded bg-white/70 hover:bg-white text-zinc-500 hover:text-zinc-900 border border-zinc-200/50 cursor-pointer opacity-0 group-hover/subcard:opacity-100 transition-opacity shadow-2xs"
            title="Đổi tên"
          >
            <Edit2 className="w-2.5 h-2.5" />
          </button>
          {onDrillDown && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDrillDown(subZone.id);
              }}
              className="p-0.5 rounded bg-white/70 hover:bg-white text-zinc-600 hover:text-zinc-900 border border-zinc-200/50 cursor-pointer shadow-2xs"
              title="Chia ô tiếp bên trong (Cấp L3)"
            >
              <Layers className="w-2.5 h-2.5 text-[#78C841]" />
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(subZone.id);
              }}
              className="p-0.5 rounded bg-white/70 hover:bg-red-50 text-zinc-400 hover:text-red-500 border border-zinc-200/50 cursor-pointer shadow-2xs"
              title="Xóa vùng con này"
            >
              <X className="w-2.5 h-2.5" />
            </button>
          )}
        </div>
      </div>

      {/* Footer: Coordinate tag & L3 depth info */}
      <div className="flex items-center justify-between text-[7px] font-mono font-bold mt-1 pr-3.5">
        <span className={`px-1 py-0.2 rounded border shadow-2xs backdrop-blur-xs ${tint.badge}`}>
          {area.colSpan}c×{area.rowSpan}r
        </span>
        {subZone.subZones && subZone.subZones.length > 0 && (
          <span className="text-[#14532D] bg-white/90 border border-[#78C841]/30 px-1 py-0.2 rounded font-extrabold shadow-2xs">
            {subZone.subZones.length} L3
          </span>
        )}
      </div>

      {/* 2. BOTTOM-RIGHT Corner Resize Handle (se) */}
      <div
        data-sub-resize="se"
        onMouseDown={(e) => {
          e.stopPropagation();
          onStartResize?.(subZone.id, 'se', e);
        }}
        className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 rounded bg-white/90 border border-zinc-300 text-zinc-600 hover:text-[#78C841] hover:border-[#78C841] cursor-se-resize shadow-2xs hover:scale-110 active:scale-95 transition-transform flex items-center justify-center z-30 pointer-events-auto"
        title="Kéo góc dưới-phải để co giãn vùng con"
      >
        <div className="w-2 h-2 border-r-2 border-b-2 border-current rounded-br-[1px]" />
      </div>
    </div>
  );
};
