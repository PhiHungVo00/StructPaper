'use client';

import React from 'react';
import type { ManuscriptRecord } from '@structpaper/doc-model';
import {
  Pin,
  PinOff,
  MoreVertical,
  Edit3,
  Sliders,
  Copy,
  Download,
  Trash2,
  ArrowRight,
} from 'lucide-react';
import {
  getJournalColor,
  getJournalShortName,
  getManuscriptTitle,
  getManuscriptAuthors,
  getWorkflowStatusConfig,
  formatRelativeTime,
} from './types';

interface PaperCardProps {
  paper: ManuscriptRecord;
  isMenuOpen: boolean;
  onToggleMenu: (e: React.MouseEvent) => void;
  onCloseMenu: () => void;
  onOpenEditor: (id: string) => void;
  onQuickEdit: (paper: ManuscriptRecord) => void;
  onTogglePin: (id: string, currentPinned: boolean) => void;
  onDuplicate: (paper: ManuscriptRecord) => void;
  onExportBackup: (paper: ManuscriptRecord) => void;
  onDelete: (id: string) => void;
}

export const PaperCard: React.FC<PaperCardProps> = ({
  paper,
  isMenuOpen,
  onToggleMenu,
  onCloseMenu,
  onOpenEditor,
  onQuickEdit,
  onTogglePin,
  onDuplicate,
  onExportBackup,
  onDelete,
}) => {
  const { info, doc } = paper;
  const title = getManuscriptTitle(paper);
  const authors = getManuscriptAuthors(paper);
  const journalColor = getJournalColor(doc.journalId);
  const journalShort = getJournalShortName(doc.journalId);
  const statusConfig = getWorkflowStatusConfig(info.workflowStatus);
  const relativeTime = formatRelativeTime(info.lastOpenedAt || info.updatedAt);

  return (
    <div
      data-testid={`paper-card-${info.id}`}
      onClick={() => onOpenEditor(info.id)}
      className="bg-gray-200/50 p-4 rounded-3xl transition-all cursor-pointer flex flex-col justify-between hover:shadow-md hover:bg-white hover:ring-2 hover:ring-[#78C841]/20 group relative"
    >
      <div>
        {/* Top Badges & Actions matching UploadView */}
        <div className="flex items-center justify-between mb-2">
          {/* Journal Badge */}
          <span
            className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold text-white shadow-2xs"
            style={{ backgroundColor: journalColor }}
          >
            {journalShort}
          </span>

          {/* Right Badges & Context Menu */}
          <div
            className="flex items-center gap-1.5"
            onClick={(e) => e.stopPropagation()}
          >
            {info.pinned && (
              <span title="Đã ghim" className="text-amber-500">
                <Pin className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
              </span>
            )}

            <span className="text-[10px] font-extrabold text-[#14532D] bg-[#D9F99D] px-2 py-0.5 rounded-full">
              {statusConfig.label}
            </span>

            {/* Subtle Menu Button */}
            <div className="relative">
              <button
                data-testid={`menu-trigger-${info.id}`}
                onClick={onToggleMenu}
                className="w-6 h-6 rounded-full hover:bg-gray-300/60 text-zinc-500 hover:text-zinc-800 flex items-center justify-center transition-colors cursor-pointer"
                title="Thao tác khác"
              >
                <MoreVertical className="w-3.5 h-3.5" />
              </button>

              {/* Context Dropdown Menu */}
              {isMenuOpen && (
                <div
                  data-testid={`paper-menu-${info.id}`}
                  className="absolute right-0 top-7 z-30 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 p-1.5 text-xs text-zinc-700 animate-in fade-in zoom-in-95"
                >
                  <button
                    onClick={() => {
                      onOpenEditor(info.id);
                      onCloseMenu();
                    }}
                    className="w-full px-2.5 py-1.5 text-left hover:bg-zinc-100 rounded-xl flex items-center gap-2 font-medium cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-blue-600" />
                    <span>Mở soạn thảo</span>
                  </button>

                  <button
                    data-testid={`quick-edit-${info.id}`}
                    onClick={() => {
                      onQuickEdit(paper);
                      onCloseMenu();
                    }}
                    className="w-full px-2.5 py-1.5 text-left hover:bg-zinc-100 rounded-xl flex items-center gap-2 font-medium cursor-pointer"
                  >
                    <Sliders className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Sửa thông tin nhanh</span>
                  </button>

                  <button
                    data-testid={`pin-toggle-${info.id}`}
                    onClick={() => {
                      onTogglePin(info.id, info.pinned);
                      onCloseMenu();
                    }}
                    className="w-full px-2.5 py-1.5 text-left hover:bg-zinc-100 rounded-xl flex items-center gap-2 font-medium cursor-pointer"
                  >
                    {info.pinned ? (
                      <>
                        <PinOff className="w-3.5 h-3.5 text-amber-600" />
                        <span>Bỏ ghim</span>
                      </>
                    ) : (
                      <>
                        <Pin className="w-3.5 h-3.5 text-amber-600" />
                        <span>Ghim lên đầu</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => {
                      onDuplicate(paper);
                      onCloseMenu();
                    }}
                    className="w-full px-2.5 py-1.5 text-left hover:bg-zinc-100 rounded-xl flex items-center gap-2 font-medium cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5 text-zinc-600" />
                    <span>Nhân bản bài báo</span>
                  </button>

                  <button
                    onClick={() => {
                      onExportBackup(paper);
                      onCloseMenu();
                    }}
                    className="w-full px-2.5 py-1.5 text-left hover:bg-zinc-100 rounded-xl flex items-center gap-2 font-medium cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-[#14532D]" />
                    <span>Xuất file .structpaper</span>
                  </button>

                  <div className="border-t border-zinc-100 my-1" />

                  <button
                    data-testid={`delete-paper-${info.id}`}
                    onClick={() => {
                      onDelete(info.id);
                      onCloseMenu();
                    }}
                    className="w-full px-2.5 py-1.5 text-left hover:bg-rose-50 rounded-xl text-rose-600 flex items-center gap-2 font-medium cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Xóa bài báo</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Paper Display Title */}
        <h4
          className="font-bold text-xs text-[#1A1A1A] line-clamp-2 mb-1.5 leading-snug"
          title={title}
        >
          {title}
        </h4>

        {/* Authors */}
        <p className="text-[11px] text-zinc-500 line-clamp-2 mb-2">
          {authors || 'Tác giả bài báo'}
        </p>

        {/* Metadata stats row matching UploadView */}
        <div className="flex items-center gap-2 text-[10px] text-zinc-400 font-semibold mb-2 flex-wrap">
          <span>{relativeTime}</span>
          {info.submissionId && <span>• {info.submissionId}</span>}
          {info.tags && info.tags.length > 0 && (
            <span>• #{info.tags[0]}</span>
          )}
        </div>
      </div>

      {/* Action Footer matching UploadView exactly */}
      <div className="mt-3 pt-2.5 border-t border-gray-300/50 flex items-center justify-between text-xs font-bold text-zinc-800">
        <span>Mở soạn thảo</span>
        <ArrowRight className="w-3.5 h-3.5 text-[#78C841]" />
      </div>
    </div>
  );
};
