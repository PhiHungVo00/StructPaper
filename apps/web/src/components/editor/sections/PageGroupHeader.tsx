'use client';

import React from 'react';
import { RotateCcw, Scissors, Merge } from 'lucide-react';
import type { PaperSection, SectionPageLayout } from '@/types/paper';
import { groupColor, describeGroupLayout, type GroupColumns, type GroupOrientation } from '@/lib/editor/page-groups';
import { SegmentedOptions } from './SegmentedOptions';

/** Everything the card needs to know about its page group; all primitives so memoised cards stay quiet. */
export interface PageGroupInfo {
  groupIndex: number;
  /** Number of groups in the paper. */
  groupTotal: number;
  /** Sections in this group. */
  groupCount: number;
  columns: GroupColumns;
  orientation: GroupOrientation;
  explicit: boolean;
  inheritsColumns: boolean;
  inheritsOrientation: boolean;
}

type Update = (index: number, updated: PaperSection) => void;

const withLayout = (sec: PaperSection, layout: SectionPageLayout | undefined): PaperSection => {
  const { pageLayout: _drop, ...rest } = sec;
  return layout ? { ...rest, pageLayout: layout } : rest;
};

/**
 * Bar above the first section of a page group: what the group's pages look like and the controls for all
 * the sections in it at once. A group after the first starts a new page; its settings are the marker on
 * its first section, so changing them here changes every page of the group.
 */
export const PageGroupHeader: React.FC<{ sec: PaperSection; idx: number; info: PageGroupInfo; onUpdateSection: Update }> = ({
  sec,
  idx,
  info,
  onUpdateSection,
}) => {
  const color = groupColor(info.groupIndex);
  const layoutText = describeGroupLayout(info);

  if (!info.explicit) {
    return (
      <div
        data-testid="page-group-header"
        data-group={info.groupIndex}
        className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white/80 border border-zinc-200 text-[11px] text-zinc-600"
        style={{ borderLeft: `4px solid ${color}` }}
      >
        <span className="font-extrabold text-zinc-800">Nhóm {info.groupIndex + 1}</span>
        <span>· bố cục chung của tài liệu ({layoutText})</span>
        <span className="ml-auto text-zinc-400">{info.groupCount} mục · đổi ở Cài đặt dàn trang</span>
      </div>
    );
  }

  const base = sec.pageLayout ?? {};
  const set = (patch: SectionPageLayout) => onUpdateSection(idx, withLayout(sec, { ...base, ...patch }));

  return (
    <div
      data-testid="page-group-header"
      data-group={info.groupIndex}
      className="flex flex-wrap items-center gap-x-3 gap-y-1.5 px-3.5 py-2 rounded-2xl bg-white border border-zinc-200 shadow-2xs"
      style={{ borderLeft: `4px solid ${color}` }}
    >
      <span className="text-[11px] font-extrabold text-zinc-900 whitespace-nowrap">
        Nhóm {info.groupIndex + 1} <span className="font-semibold text-zinc-500">· trang mới</span>
      </span>
      <SegmentedOptions<GroupOrientation>
        ariaLabel="Hướng giấy của nhóm"
        value={info.orientation}
        onChange={(v) => set({ orientation: v })}
        options={[
          { value: 'portrait', label: 'Dọc', testId: 'page-group-orient-portrait' },
          { value: 'landscape', label: 'Ngang', testId: 'page-group-orient-landscape' },
        ]}
      />
      <SegmentedOptions<GroupColumns>
        ariaLabel="Số cột của nhóm"
        value={info.columns}
        onChange={(v) => set({ columns: v })}
        options={[
          { value: '1-column', label: '1 cột', testId: 'page-group-cols-1' },
          { value: '2-column', label: '2 cột', testId: 'page-group-cols-2' },
        ]}
      />
      <span className="text-[10px] text-zinc-500">
        {info.groupCount} mục
        {info.inheritsColumns || info.inheritsOrientation
          ? ` · ${[info.inheritsOrientation && 'hướng', info.inheritsColumns && 'cột'].filter(Boolean).join(' và ')} theo cài đặt chung`
          : ''}
      </span>
      <div className="ml-auto flex items-center gap-1.5">
        {(!info.inheritsColumns || !info.inheritsOrientation) && (
          <button
            type="button"
            data-testid="page-group-reset"
            onClick={() => onUpdateSection(idx, withLayout(sec, {}))}
            title="Bỏ hướng và số cột riêng, theo cài đặt chung (vẫn bắt đầu trang mới)"
            className="px-2 py-1 rounded-lg text-[10px] font-bold text-zinc-600 hover:bg-zinc-100 flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" /> Theo cài đặt chung
          </button>
        )}
        <button
          type="button"
          data-testid="page-group-merge"
          onClick={() => onUpdateSection(idx, withLayout(sec, undefined))}
          title="Không bắt đầu trang mới ở đây: gộp nhóm này vào nhóm trên"
          className="px-2 py-1 rounded-lg text-[10px] font-bold text-rose-600 hover:bg-rose-50 flex items-center gap-1 cursor-pointer"
        >
          <Merge className="w-3 h-3" /> Gộp vào nhóm trên
        </button>
      </div>
    </div>
  );
};

/** Starts a new page group at this section (adds an empty marker: new page, document layout). */
export const SplitGroupButton: React.FC<{ sec: PaperSection; idx: number; onUpdateSection: Update }> = ({ sec, idx, onUpdateSection }) => (
  <button
    type="button"
    data-testid="page-group-split"
    onClick={() => onUpdateSection(idx, withLayout(sec, {}))}
    title="Bắt đầu nhóm trang mới từ mục này (có thể chọn hướng giấy và số cột riêng)"
    className="px-2 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 text-zinc-500 hover:text-zinc-900 hover:bg-white/80 transition-all cursor-pointer"
  >
    <Scissors className="w-3.5 h-3.5 text-sky-600 -rotate-90" />
    <span className="text-[10px] hidden sm:inline whitespace-nowrap">Tách nhóm trang</span>
  </button>
);
