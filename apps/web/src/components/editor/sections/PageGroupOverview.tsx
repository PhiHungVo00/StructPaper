'use client';

import React from 'react';
import { RectangleHorizontal, RectangleVertical } from 'lucide-react';
import { groupColor, describeGroupLayout, type PageGroup } from '@/lib/editor/page-groups';

/**
 * The whole paper at a glance: one chip per page group (colour, layout, how many sections), click to jump
 * to the group. Groups that share a layout are one unit, so a rotated or one-column stretch is visible
 * without scrolling through the sections.
 */
export const PageGroupOverview: React.FC<{ groups: PageGroup[]; onJump: (sectionId: string) => void }> = ({ groups, onJump }) => {
  if (groups.length === 0) return null;
  if (groups.length === 1) {
    return (
      <div data-testid="page-group-overview" className="text-[11px] text-zinc-500 px-1">
        Toàn bộ nội dung cùng một bố cục ({describeGroupLayout(groups[0])}). Dùng &quot;Tách nhóm trang&quot; trên một mục để
        bắt đầu trang mới với hướng giấy hoặc số cột riêng.
      </div>
    );
  }
  return (
    <div data-testid="page-group-overview" className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar" aria-label="Các nhóm trang">
      <span className="text-[10px] font-bold text-zinc-500 whitespace-nowrap pr-1">Nhóm trang</span>
      {groups.map((g) => {
        const Icon = g.orientation === 'landscape' ? RectangleHorizontal : RectangleVertical;
        return (
          <button
            key={g.startId}
            type="button"
            data-testid="page-group-pill"
            data-group={g.index}
            onClick={() => onJump(g.startId)}
            title={`Đến nhóm ${g.index + 1}: ${describeGroupLayout(g)}, ${g.count} mục${g.explicit ? ' (trang mới)' : ''}`}
            className="shrink-0 flex items-center gap-1.5 pl-2 pr-2.5 py-1 rounded-full bg-white border border-zinc-200 hover:border-zinc-400 text-[11px] font-bold text-zinc-800 cursor-pointer transition-colors"
          >
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: groupColor(g.index) }} />
            <span>{g.index + 1}</span>
            <Icon className="w-3.5 h-3.5 text-zinc-500" />
            <span className="font-semibold text-zinc-600">{g.columns === '1-column' ? '1 cột' : '2 cột'}</span>
            <span className="font-medium text-zinc-400">· {g.count} mục</span>
          </button>
        );
      })}
    </div>
  );
};
