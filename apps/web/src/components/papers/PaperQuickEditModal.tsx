'use client';

import React, { useState } from 'react';
import type { ManuscriptRecord, WorkflowStatus, ManuscriptInfo } from '@structpaper/doc-model';
import { X, Sliders, Save, Tag, AlertCircle } from 'lucide-react';
import { WORKFLOW_STATUS_CONFIG } from './types';

interface PaperQuickEditModalProps {
  paper: ManuscriptRecord;
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string, patch: Partial<ManuscriptInfo>) => Promise<void>;
}

export const PaperQuickEditModal: React.FC<PaperQuickEditModalProps> = ({
  paper,
  isOpen,
  onClose,
  onSave,
}) => {
  const { info } = paper;

  const [displayName, setDisplayName] = useState(info.displayName || '');
  const [submissionId, setSubmissionId] = useState(info.submissionId || '');
  const [workflowStatus, setWorkflowStatus] = useState<WorkflowStatus>(
    info.workflowStatus || 'draft'
  );
  const [note, setNote] = useState(info.note || '');
  const [tags, setTags] = useState<string[]>(info.tags || []);
  const [newTagInput, setNewTagInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const trimmed = newTagInput.trim().replace(/^#/, '');
      if (trimmed && !tags.includes(trimmed)) {
        setTags([...tags, trimmed]);
      }
      setNewTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      setError('Vui lòng nhập tên hiển thị cho bài báo.');
      return;
    }

    try {
      setIsSaving(true);
      setError(null);
      await onSave(info.id, {
        displayName: displayName.trim(),
        submissionId: submissionId.trim() || undefined,
        workflowStatus,
        note: note.trim() || undefined,
        tags,
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Có lỗi xảy ra khi lưu thông tin bài báo.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      data-testid="quick-edit-modal-backdrop"
      className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
      onClick={onClose}
    >
      <div
        data-testid="quick-edit-modal"
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-900">
                Sửa thông tin nhanh
              </h3>
              <p className="text-[11px] text-slate-400">
                Cập nhật thông tin quản trị và trạng thái bài báo
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Display Name */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">
              Tên hiển thị bài báo <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              data-testid="quick-edit-displayname"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Nhập tên đại diện hoặc tiêu đề bài báo..."
              className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15 transition-all"
              required
            />
          </div>

          {/* Grid: Submission ID & Workflow Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Submission ID */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">
                Mã định danh nộp bài (Submission ID)
              </label>
              <input
                type="text"
                data-testid="quick-edit-submissionid"
                value={submissionId}
                onChange={(e) => setSubmissionId(e.target.value)}
                placeholder="VD: ID630_HS, STDJ_2026_01"
                className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 font-mono outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15 transition-all"
              />
            </div>

            {/* Workflow Status */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">
                Trạng thái quy trình xuất bản
              </label>
              <select
                data-testid="quick-edit-status"
                value={workflowStatus}
                onChange={(e) => setWorkflowStatus(e.target.value as WorkflowStatus)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15 transition-all cursor-pointer"
              >
                {(
                  [
                    'draft',
                    'in-review',
                    'proofing',
                    'ready',
                    'published',
                  ] as WorkflowStatus[]
                ).map((st) => (
                  <option key={st} value={st}>
                    {WORKFLOW_STATUS_CONFIG[st].label} ({st})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
              <span>Thẻ phân loại (Tags)</span>
              <span className="text-[10px] text-slate-400 font-normal">
                Nhấn Enter hoặc phẩy để thêm thẻ
              </span>
            </label>

            <div className="min-h-[40px] p-2 bg-slate-50 border border-slate-200 rounded-xl flex flex-wrap gap-1.5 items-center">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-white border border-slate-200/80 text-xs text-slate-700 font-medium shadow-2xs"
                >
                  <span>#{tag}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                  >
                    ×
                  </button>
                </span>
              ))}

              <input
                type="text"
                data-testid="quick-edit-tags-input"
                value={newTagInput}
                onChange={(e) => setNewTagInput(e.target.value)}
                onKeyDown={handleAddTag}
                placeholder={tags.length === 0 ? 'Thêm thẻ (VD: AI, IoT, Y Sinh)...' : ''}
                className="flex-1 min-w-[120px] bg-transparent text-xs text-slate-800 outline-none px-1"
              />
            </div>
          </div>

          {/* Admin Note */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">
              Ghi chú nội bộ / Tiến độ
            </label>
            <textarea
              data-testid="quick-edit-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              placeholder="Ghi chú về tiến độ phản biện, ý kiến ban biên tập..."
              className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15 transition-all resize-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              data-testid="quick-edit-submit"
              disabled={isSaving}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-2xs transition-all cursor-pointer disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Đang lưu...' : 'Lưu thông tin'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
