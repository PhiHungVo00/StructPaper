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
  ExternalLink,
} from 'lucide-react';
import {
  getJournalColor,
  getJournalShortName,
  getManuscriptTitle,
  getManuscriptAuthors,
  getWorkflowStatusConfig,
  formatRelativeTime,
} from './types';

interface PaperTableProps {
  papers: ManuscriptRecord[];
  activeMenuId: string | null;
  onToggleMenu: (id: string, e: React.MouseEvent) => void;
  onCloseMenu: () => void;
  onOpenEditor: (id: string) => void;
  onQuickEdit: (paper: ManuscriptRecord) => void;
  onTogglePin: (id: string, currentPinned: boolean) => void;
  onDuplicate: (paper: ManuscriptRecord) => void;
  onExportBackup: (paper: ManuscriptRecord) => void;
  onDelete: (id: string) => void;
}

export const PaperTable: React.FC<PaperTableProps> = ({
  papers,
  activeMenuId,
  onToggleMenu,
  onCloseMenu,
  onOpenEditor,
  onQuickEdit,
  onTogglePin,
  onDuplicate,
  onExportBackup,
  onDelete,
}) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse" data-testid="papers-table">
          <thead>
            <tr className="border-b border-slate-200/80 bg-slate-50/75 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <th className="py-3 px-3 w-10 text-center">Ghim</th>
              <th className="py-3 px-4 min-w-[260px]">Tên bài báo & Mã bài</th>
              <th className="py-3 px-4 min-w-[130px]">Tạp chí</th>
              <th className="py-3 px-4 min-w-[120px]">Trạng thái</th>
              <th className="py-3 px-4 min-w-[180px]">Tác giả</th>
              <th className="py-3 px-4 min-w-[120px]">Cập nhật</th>
              <th className="py-3 px-3 w-28 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
            {papers.map((paper) => {
              const { info, doc } = paper;
              const title = getManuscriptTitle(paper);
              const authors = getManuscriptAuthors(paper);
              const journalColor = getJournalColor(doc.journalId);
              const journalShort = getJournalShortName(doc.journalId);
              const statusConfig = getWorkflowStatusConfig(info.workflowStatus);
              const relativeTime = formatRelativeTime(
                info.lastOpenedAt || info.updatedAt
              );
              const isMenuOpen = activeMenuId === info.id;

              return (
                <tr
                  key={info.id}
                  data-testid={`paper-row-${info.id}`}
                  onClick={() => onOpenEditor(info.id)}
                  className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                >
                  {/* Pin Column */}
                  <td
                    className="py-3 px-3 text-center"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => onTogglePin(info.id, info.pinned)}
                      className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                        info.pinned
                          ? 'text-amber-500 hover:text-amber-600 bg-amber-50'
                          : 'text-slate-300 hover:text-slate-600 hover:bg-slate-100'
                      }`}
                      title={info.pinned ? 'Bỏ ghim' : 'Ghim lên đầu'}
                    >
                      <Pin
                        className={`w-3.5 h-3.5 ${
                          info.pinned ? 'fill-amber-500 text-amber-500' : ''
                        }`}
                      />
                    </button>
                  </td>

                  {/* Title & Submission ID */}
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-900 group-hover:text-emerald-800 line-clamp-1 transition-colors">
                      {title}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      {info.submissionId && (
                        <span className="font-mono text-[10px] font-semibold text-slate-500">
                          {info.submissionId}
                        </span>
                      )}
                      {info.tags && info.tags.length > 0 && (
                        <div className="flex items-center gap-1">
                          {info.tags.slice(0, 2).map((t, idx) => (
                            <span
                              key={idx}
                              className="text-[9px] px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded"
                            >
                              #{t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Journal */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1.5">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: journalColor }}
                      />
                      <span
                        className="font-bold text-[11px]"
                        style={{ color: journalColor }}
                      >
                        {journalShort}
                      </span>
                    </div>
                  </td>

                  {/* Workflow Status */}
                  <td className="py-3 px-4">
                    <span
                      className={`font-semibold px-2 py-0.5 rounded-full text-[10px] border inline-flex items-center gap-1 ${statusConfig.chipBg} ${statusConfig.chipText} ${statusConfig.border}`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${statusConfig.dotBg}`}
                      />
                      {statusConfig.label}
                    </span>
                  </td>

                  {/* Authors */}
                  <td className="py-3 px-4 text-slate-500">
                    <span className="line-clamp-1 text-[11px]">{authors}</span>
                  </td>

                  {/* Updated Time */}
                  <td className="py-3 px-4 text-slate-500 text-[11px]">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>{relativeTime}</span>
                    </div>
                  </td>

                  {/* Actions */}
                  <td
                    className="py-3 px-3 text-right"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-end gap-1 relative">
                      {/* Quick Edit button */}
                      <button
                        onClick={() => onQuickEdit(paper)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                        title="Sửa thông tin nhanh"
                      >
                        <Sliders className="w-3.5 h-3.5" />
                      </button>

                      {/* 3-dot dropdown menu */}
                      <button
                        onClick={(e) => onToggleMenu(info.id, e)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                        title="Thao tác khác"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {/* Dropdown Menu */}
                      {isMenuOpen && (
                        <div className="absolute right-0 top-8 z-30 w-48 bg-white rounded-xl shadow-xl border border-slate-200 py-1 text-xs text-left text-slate-700 animate-in fade-in zoom-in-95">
                          <button
                            onClick={() => {
                              onOpenEditor(info.id);
                              onCloseMenu();
                            }}
                            className="w-full px-3 py-2 text-left hover:bg-slate-50 flex items-center gap-2 font-medium cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-blue-600" />
                            <span>Mở soạn thảo</span>
                          </button>

                          <button
                            onClick={() => {
                              onQuickEdit(paper);
                              onCloseMenu();
                            }}
                            className="w-full px-3 py-2 text-left hover:bg-slate-50 flex items-center gap-2 font-medium cursor-pointer"
                          >
                            <Sliders className="w-3.5 h-3.5 text-indigo-600" />
                            <span>Sửa thông tin nhanh</span>
                          </button>

                          <button
                            onClick={() => {
                              onTogglePin(info.id, info.pinned);
                              onCloseMenu();
                            }}
                            className="w-full px-3 py-2 text-left hover:bg-slate-50 flex items-center gap-2 font-medium cursor-pointer"
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
                            className="w-full px-3 py-2 text-left hover:bg-slate-50 flex items-center gap-2 font-medium cursor-pointer"
                          >
                            <Copy className="w-3.5 h-3.5 text-slate-600" />
                            <span>Nhân bản bài báo</span>
                          </button>

                          <button
                            onClick={() => {
                              onExportBackup(paper);
                              onCloseMenu();
                            }}
                            className="w-full px-3 py-2 text-left hover:bg-slate-50 flex items-center gap-2 font-medium cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Xuất .structpaper</span>
                          </button>

                          <div className="border-t border-slate-100 my-1" />

                          <button
                            onClick={() => {
                              onDelete(info.id);
                              onCloseMenu();
                            }}
                            className="w-full px-3 py-2 text-left hover:bg-rose-50 text-rose-600 flex items-center gap-2 font-medium cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Xóa bài báo</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
