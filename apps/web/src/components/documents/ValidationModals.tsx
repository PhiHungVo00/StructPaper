'use client';

import React from 'react';
import { AlertTriangle, XCircle, Info, Wand2, CheckCircle2, X } from 'lucide-react';
import { ModalPortal } from '@/components/modals/ModalPortal';
import type { ValidationIssue, ValidationReport } from '@/lib/validation/validators';

const SEVERITY_STYLE: Record<ValidationIssue['severity'], { box: string; icon: React.ReactNode; label: string }> = {
  error: { box: 'bg-red-50 border-red-200 text-red-800', icon: <XCircle className="w-4 h-4 text-red-500 shrink-0" />, label: 'Lỗi' },
  warning: { box: 'bg-amber-50 border-amber-200 text-amber-800', icon: <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />, label: 'Cảnh báo' },
  info: { box: 'bg-sky-50 border-sky-200 text-sky-800', icon: <Info className="w-4 h-4 text-sky-500 shrink-0" />, label: 'Gợi ý' },
};

export const ValidationReportView: React.FC<{
  report: ValidationReport;
  onFix?: (issue: ValidationIssue) => void;
}> = ({ report, onFix }) => {
  if (report.issues.length === 0) {
    return (
      <div className="flex items-center gap-2 rounded-2xl bg-lime-50 border border-lime-200 text-lime-800 px-4 py-3 text-sm font-semibold">
        <CheckCircle2 className="w-4 h-4" /> Không phát hiện vấn đề nào.
      </div>
    );
  }
  const order = { error: 0, warning: 1, info: 2 } as const;
  const sorted = [...report.issues].sort((a, b) => order[a.severity] - order[b.severity]);
  return (
    <ul className="space-y-2 max-h-[48vh] overflow-y-auto pr-1" data-testid="validation-issues">
      {sorted.map((issue) => {
        const st = SEVERITY_STYLE[issue.severity];
        return (
          <li key={issue.id} className={`rounded-2xl border px-3.5 py-2.5 ${st.box}`} data-severity={issue.severity}>
            <div className="flex items-start gap-2">
              {st.icon}
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-bold leading-snug">{issue.title}</p>
                <p className="text-xs opacity-90 mt-0.5">{issue.message}</p>
                {issue.suggestion && <p className="text-xs opacity-75 mt-0.5 italic">{issue.suggestion}</p>}
              </div>
              {issue.fixTab && onFix && (
                <button
                  type="button"
                  onClick={() => onFix(issue)}
                  className="shrink-0 px-2 py-0.5 rounded-lg bg-white/80 hover:bg-white text-[10px] font-bold border border-current/20"
                >
                  Đi tới
                </button>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
};

interface GateProps {
  isOpen: boolean;
  report: ValidationReport | null;
  onClose: () => void;
  /** Applies renumberPaper() and re-validates. */
  onAutoFix: () => void;
  onFix?: (issue: ValidationIssue) => void;
}

const Shell: React.FC<{ title: string; subtitle: string; onClose: () => void; children: React.ReactNode }> = ({
  title,
  subtitle,
  onClose,
  children,
}) => (
  <div className="bg-[#F8F9FA] w-full max-w-xl rounded-[32px] shadow-2xl border border-white/20 overflow-hidden" role="dialog" aria-label={title}>
    <div className="px-6 pt-5 pb-3 flex items-start justify-between gap-3">
      <div>
        <h3 className="text-lg font-black text-slate-900 tracking-tight">{title}</h3>
        <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
      </div>
      <button type="button" onClick={onClose} aria-label="Đóng" className="w-9 h-9 rounded-full bg-gray-200/70 flex items-center justify-center text-gray-500 hover:bg-gray-200">
        <X className="w-4 h-4" />
      </button>
    </div>
    <div className="px-6 pb-6 space-y-4">{children}</div>
  </div>
);

const Counts: React.FC<{ report: ValidationReport }> = ({ report }) => (
  <div className="flex gap-2 text-xs font-bold">
    <span className="px-2.5 py-1 rounded-full bg-red-100 text-red-700">{report.errorCount} lỗi</span>
    <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-700">{report.warningCount} cảnh báo</span>
  </div>
);

/** GATE 1 — shown after importing the original Word file, before the editor opens. */
export const ImportValidationModal: React.FC<
  GateProps & { onContinue: () => void; fileLabel?: string }
> = ({ isOpen, report, onClose, onContinue, onAutoFix, onFix, fileLabel }) => {
  if (!report) return null;
  const canFix = report.issues.some((i) => i.autoFixable);
  return (
    <ModalPortal isOpen={isOpen} onClose={onClose} zIndex={130}>
      <Shell
        title="Kiểm tra tài liệu vừa nhập"
        subtitle={`${fileLabel ? fileLabel + ' · ' : ''}Rà soát trường thông tin còn thiếu và số thứ tự trước khi vào soạn thảo`}
        onClose={onClose}
      >
        <Counts report={report} />
        <ValidationReportView report={report} onFix={onFix} />
        <div className="flex items-center justify-between gap-2 pt-1">
          {canFix ? (
            <button type="button" onClick={onAutoFix} className="px-3.5 py-2 rounded-full bg-white border border-zinc-200 text-xs font-bold text-zinc-800 flex items-center gap-1.5 hover:bg-zinc-50">
              <Wand2 className="w-3.5 h-3.5" /> Tự động đánh lại số thứ tự
            </button>
          ) : (
            <span />
          )}
          <button
            type="button"
            disabled={!report.canProceed}
            onClick={onContinue}
            className="px-5 py-2 rounded-full bg-[#78C841] text-zinc-950 text-xs font-black disabled:opacity-40 hover:brightness-95"
          >
            Vào chỉnh sửa
          </button>
        </div>
        {report.errorCount + report.warningCount > 0 && (
          <p className="text-[11px] text-slate-500">
            Các mục còn lại vẫn hiển thị ở thẻ “Kiểm tra” trong trình soạn thảo và sẽ được kiểm tra lại trước khi xuất file.
          </p>
        )}
      </Shell>
    </ModalPortal>
  );
};

/** GATE 2 — shown before producing the final Word / PDF / XML. Errors block, warnings need acknowledgement. */
export const ExportGateModal: React.FC<
  GateProps & { format: 'docx' | 'pdf' | 'xml'; onExport: () => void }
> = ({ isOpen, report, onClose, onExport, onAutoFix, onFix, format }) => {
  if (!report) return null;
  const canFix = report.issues.some((i) => i.autoFixable);
  const label = format === 'docx' ? 'Word' : format.toUpperCase();
  return (
    <ModalPortal isOpen={isOpen} onClose={onClose} zIndex={130}>
      <Shell
        title={`Kiểm tra trước khi xuất ${label}`}
        subtitle={report.canProceed ? 'Không còn lỗi chặn. Bạn có thể xuất file.' : 'Cần sửa các lỗi bên dưới trước khi xuất.'}
        onClose={onClose}
      >
        <Counts report={report} />
        <ValidationReportView report={report} onFix={onFix} />
        <div className="flex items-center justify-between gap-2 pt-1">
          <div className="flex gap-2">
            {canFix && (
              <button type="button" onClick={onAutoFix} className="px-3.5 py-2 rounded-full bg-white border border-zinc-200 text-xs font-bold text-zinc-800 flex items-center gap-1.5 hover:bg-zinc-50">
                <Wand2 className="w-3.5 h-3.5" /> Tự động đánh lại số thứ tự
              </button>
            )}
            <button type="button" onClick={onClose} className="px-3.5 py-2 rounded-full bg-white border border-zinc-200 text-xs font-bold text-zinc-700 hover:bg-zinc-50">
              Quay lại sửa
            </button>
          </div>
          <button
            type="button"
            disabled={!report.canProceed}
            onClick={onExport}
            className="px-5 py-2 rounded-full bg-[#78C841] text-zinc-950 text-xs font-black disabled:opacity-40 hover:brightness-95"
          >
            {report.warningCount > 0 ? `Vẫn xuất ${label}` : `Xuất ${label}`}
          </button>
        </div>
      </Shell>
    </ModalPortal>
  );
};
