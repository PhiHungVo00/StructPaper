'use client';

import React from 'react';
import { PaperSection } from '@/types/paper';
import { AutoResizeTextarea } from './AutoResizeTextarea';
import { renderColoredParagraphCitations } from './utils';
import { ImageIcon, Bookmark, Link2 } from 'lucide-react';

interface ParagraphSectionItemProps {
  sec: PaperSection;
  idx: number;
  sections: PaperSection[];
  activeEditingParaId: string | null;
  setActiveEditingParaId: (id: string | null) => void;
  onUpdateSection: (index: number, updated: PaperSection) => void;
  onMergeParagraphIntoPrevFigure: (index: number) => void;
  onConvertToCitation?: (index: number) => void;
}

export const ParagraphSectionItem: React.FC<ParagraphSectionItemProps> = ({
  sec,
  idx,
  sections,
  activeEditingParaId,
  setActiveEditingParaId,
  onUpdateSection,
  onMergeParagraphIntoPrevFigure,
}) => {
  const secId = sec.id || `sec_${idx}`;
  const isEditing = activeEditingParaId === secId;

  return (
    <div className="space-y-2">
      {/* Smart assist: Figure source detection */}
      {idx > 0 &&
        sections[idx - 1]?.type === 'figure' &&
        (sec.content.trim().startsWith('(Nguồn') ||
          sec.content.trim().startsWith('Nguồn:') ||
          sec.content.trim().startsWith('(Source') ||
          sec.content.trim().startsWith('Source:') ||
          sec.content.trim().toLowerCase().startsWith('(nguồn') ||
          (sec.content.length < 120 && /\b(nguồn|source)\b/i.test(sec.content))) && (
          <div className="flex items-center justify-between p-2 rounded-xl bg-amber-50/90 border border-amber-200/90 text-amber-900 text-xs shadow-2xs">
            <div className="flex items-center gap-1.5 font-medium min-w-0">
              <ImageIcon className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
              <span className="truncate">
                Ghi chú nguồn cho{' '}
                {sections[idx - 1].figure?.caption
                  ? `"${sections[idx - 1].figure?.caption.slice(0, 30)}..."`
                  : 'Hình phía trên'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => onMergeParagraphIntoPrevFigure(idx)}
              className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-bold text-[11px] flex items-center gap-1 shadow-2xs transition-all cursor-pointer flex-shrink-0"
              title="Gộp đoạn này thành thuộc tính nguồn của Hình minh họa phía trên"
            >
              <Link2 className="w-3 h-3" />
              <span>Gộp vào Hình phía trên</span>
            </button>
          </div>
        )}

      {isEditing ? (
        <AutoResizeTextarea
          autoFocus
          value={sec.content || ''}
          onChange={(val) => onUpdateSection(idx, { ...sec, content: val })}
          onBlur={() => setActiveEditingParaId(null)}
          placeholder="Nội dung đoạn văn bản..."
          className="w-full p-3 rounded-2xl text-xs sm:text-sm text-zinc-900 bg-white leading-relaxed focus:outline-none focus:ring-4 focus:ring-blue-200 focus:border-blue-300 shadow-2xs"
        />
      ) : (
        <div
          onClick={() => setActiveEditingParaId(secId)}
          className="w-full p-3 rounded-2xl text-xs sm:text-sm text-zinc-900 bg-white leading-relaxed border border-transparent hover:border-zinc-200/80 shadow-2xs cursor-text select-text transition-all min-h-[3rem] whitespace-pre-wrap break-words"
        >
          {sec.content && sec.content.trim() ? (
            renderColoredParagraphCitations(sec.content, () => setActiveEditingParaId(secId))
          ) : (
            <span className="text-zinc-400 italic">Nhập nội dung đoạn văn bản...</span>
          )}
        </div>
      )}
    </div>
  );
};
