'use client';

import React from 'react';
import { PaperSection } from '@/types/paper';
import { TemporaryParagraphInput } from './TemporaryParagraphInput';
import { ImageIcon, Link2 } from 'lucide-react';

export interface ParagraphSectionItemProps {
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

      <TemporaryParagraphInput
        value={sec.content || ''}
        isEditing={isEditing}
        onStartEdit={() => setActiveEditingParaId(secId)}
        onBlur={() => setActiveEditingParaId(null)}
        onChange={(_inlines, plainText) => onUpdateSection(idx, { ...sec, content: plainText })}
        placeholder="Nội dung đoạn văn bản..."
      />
    </div>
  );
};
