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
  Clock,
  Users,
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
      className="bg-white rounded-3xl border border-zinc-200/80 hover:border-[#78C841] hover:shadow-md transition-all duration-200 p-4 flex flex-col justify-between cursor-pointer group relative overflow-hidden"
    >
      {/* Top Journal Color Stripe */}
      <div
        className="absolute top-0 left-0 right-0 h-1"
        style={{ backgroundColor: journalColor }}
      />

      {/* Card Header: Badges & Actions */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-2 pt-1">
          <div className="flex items-center gap-1.5 flex-wrap min-w-0">
            {/* Journal Badge */}
            <span
              className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full text-white shrink-0 shadow-2xs"
              style={{ backgroundColor: journalColor }}
            >
              {journalShort}
            </span>

            {/* Submission ID */}
            {info.submissionId && (
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-700 truncate max-w-[130px]">
                {info.submissionId}
              </span>
            )}
          </div>

          {/* Right Header: Pin button & Context Menu button */}
          <div
            className="flex items-center gap-1 shrink-0 relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Pin Toggle Button */}
            <button
              data-testid={`pin-toggle-${info.id}`}
              onClick={(e) => {
                e.stopPropagation();
                onTogglePin(info.id, info.pinned);
              }}
              className={`p-1.5 rounded-xl transition-colors cursor-pointer ${
                info.pinned
                  ? 'text-amber-500 bg-amber-50 hover:bg-amber-100'
                  : 'text-zinc-300 hover:text-zinc-600 hover:bg-zinc-100'
              }`}
              title={info.pinned ? 'Bỏ ghim' : 'Ghim lên đầu'}
            >
              <Pin
                className={`w-3.5 h-3.5 ${
                  info.pinned ? 'fill-amber-500 text-amber-500' : ''
                }`}
              />
            </button>

            {/* 3-dot Menu Trigger */}
            <button
              data-testid={`menu-trigger-${info.id}`}
              onClick={onToggleMenu}
              className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors cursor-pointer"
              title="Thao tác khác"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {/* Context Dropdown Menu */}
            {isMenuOpen && (
              <div
                data-testid={`paper-menu-${info.id}`}
                className="absolute right-0 top-8 z-30 w-52 bg-white rounded-2xl shadow-xl border border-zinc-200 p-1 text-xs text-zinc-700 animate-in fade-in zoom-in-95"
              >
                <button
                  onClick={() => {
                    onOpenEditor(info.id);
                    onCloseMenu();
                  }}
                  className="w-full px-3 py-2 text-left hover:bg-zinc-50 rounded-xl flex items-center gap-2.5 font-medium cursor-pointer"
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
                  className="w-full px-3 py-2 text-left hover:bg-zinc-50 rounded-xl flex items-center gap-2.5 font-medium cursor-pointer"
                >
                  <Sliders className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Sửa thông tin nhanh</span>
                </button>

                <button
                  onClick={() => {
                    onTogglePin(info.id, info.pinned);
                    onCloseMenu();
                  }}
                  className="w-full px-3 py-2 text-left hover:bg-zinc-50 rounded-xl flex items-center gap-2.5 font-medium cursor-pointer"
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
                  className="w-full px-3 py-2 text-left hover:bg-zinc-50 rounded-xl flex items-center gap-2.5 font-medium cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5 text-zinc-600" />
                  <span>Nhân bản bài báo</span>
                </button>

                <button
                  onClick={() => {
                    onExportBackup(paper);
                    onCloseMenu();
                  }}
                  className="w-full px-3 py-2 text-left hover:bg-zinc-50 rounded-xl flex items-center gap-2.5 font-medium cursor-pointer"
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
                  className="w-full px-3 py-2 text-left hover:bg-rose-50 rounded-xl text-rose-600 flex items-center gap-2.5 font-medium cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Xóa bài báo</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Paper Display Title */}
        <h3
          className="font-bold text-xs text-[#1A1A1A] group-hover:text-zinc-950 line-clamp-2 leading-snug mb-1.5 transition-colors"
          title={title}
        >
          {title}
        </h3>

        {/* Authors */}
        <p className="text-[11px] text-zinc-500 line-clamp-1 mb-2 font-medium flex items-center gap-1.5">
          <Users className="w-3 h-3 text-zinc-400 shrink-0" />
          <span>{authors || 'Chưa cập nhật tác giả'}</span>
        </p>

        {/* Tags */}
        {info.tags && info.tags.length > 0 && (
          <div className="flex items-center gap-1 flex-wrap mb-2">
            {info.tags.slice(0, 3).map((tag, idx) => (
              <span
                key={idx}
                className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600 font-medium"
              >
                #{tag}
              </span>
            ))}
            {info.tags.length > 3 && (
              <span className="text-[10px] text-zinc-400 font-medium">
                +{info.tags.length - 3}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Card Bottom: Relative time & Status pill */}
      <div>
        <div className="flex items-center justify-between text-[10px] text-zinc-400 font-semibold mb-2 pt-1">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3 text-zinc-400" />
            <span>{relativeTime}</span>
          </span>

          <span
            className={`font-extrabold px-2 py-0.5 rounded-full text-[10px] border flex items-center gap-1 ${statusConfig.chipBg} ${statusConfig.chipText} ${statusConfig.border}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dotBg}`} />
            {statusConfig.label}
          </span>
        </div>

        {/* Action Link Row matching UploadView */}
        <div className="pt-2 border-t border-zinc-100 flex items-center justify-between text-xs font-bold text-zinc-800">
          <span>Mở soạn thảo</span>
          <ArrowRight className="w-3.5 h-3.5 text-[#78C841]" />
        </div>
      </div>
    </div>
  );
};
