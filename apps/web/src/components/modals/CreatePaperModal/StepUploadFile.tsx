'use client';

import React, { useRef, useState } from 'react';
import { UploadCloud, FileText, Loader2, Sparkles, FilePlus, AlertCircle } from 'lucide-react';
import { parseDocxFile } from '@/lib/docx-parser';
import type { CompletePaper } from '@/types/paper';

interface StepUploadFileProps {
  onSuccess: (result: { parsedPaper?: CompletePaper; isBlank: boolean }) => void;
  targetJournalName?: string;
  targetJournalCode?: string;
}

export const StepUploadFile: React.FC<StepUploadFileProps> = ({
  onSuccess,
  targetJournalName,
  targetJournalCode,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [statusText, setStatusText] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    if (!file.name.endsWith('.docx') && !file.name.endsWith('.doc')) {
      setErrorMsg('Vui lòng chọn tệp Word định dạng .docx hoặc .doc');
      return;
    }

    setErrorMsg(null);
    setIsParsing(true);
    setStatusText('Đang đọc tệp Word...');

    try {
      const buffer = await file.arrayBuffer();
      setStatusText('Đang phân tích cấu trúc OpenXML...');
      const parsed = await parseDocxFile(buffer, file.name);

      if (targetJournalCode) {
        parsed.metadata.journalId = targetJournalCode;
      }
      if (targetJournalName) {
        parsed.metadata.journalName = targetJournalName;
      }

      onSuccess({ parsedPaper: parsed, isBlank: false });
    } catch (err: any) {
      console.error('Lỗi khi đọc file DOCX:', err);
      setErrorMsg(err.message || 'Không thể trích xuất cấu trúc tệp Word');
    } finally {
      setIsParsing(false);
      setStatusText('');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="space-y-4">
      {/* Upload Dropzone */}
      <div
        data-testid="create-paper-dropzone"
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => !isParsing && fileInputRef.current?.click()}
        className={`w-full rounded-3xl p-8 sm:p-10 text-center cursor-pointer transition-all border-2 border-dashed flex flex-col items-center justify-center relative select-none ${
          dragOver
            ? 'border-[#78C841] bg-[#78C841]/5 scale-[1.01]'
            : isParsing
            ? 'border-[#78C841] bg-slate-50 cursor-wait'
            : 'border-slate-200 hover:border-[#78C841] bg-white hover:bg-slate-50/50 shadow-xs hover:shadow-md'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".docx,.doc"
          className="hidden"
          disabled={isParsing}
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              handleFile(e.target.files[0]);
            }
          }}
        />

        {/* Icon Animation */}
        <div
          className={`w-16 h-16 rounded-3xl flex items-center justify-center mb-3 shadow-xs transition-all ${
            isParsing
              ? 'bg-zinc-900 text-[#78C841] animate-pulse'
              : 'bg-[#78C841]/10 text-[#78C841]'
          }`}
        >
          {isParsing ? (
            <Loader2 className="w-8 h-8 animate-spin" />
          ) : (
            <UploadCloud className="w-8 h-8" />
          )}
        </div>

        <h4 className="text-base font-bold text-slate-900 mb-1">
          {isParsing ? (statusText || 'Đang xử lý...') : 'Kéo thả file .docx vào đây'}
        </h4>

        <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4 leading-relaxed">
          {isParsing
            ? 'Hệ thống đang trích xuất văn bản, bảng biểu, ảnh vector và công thức toán...'
            : targetJournalName
            ? `Trích xuất OpenXML tự động cấu trúc cho ${targetJournalName}.`
            : 'Hỗ trợ bóc tách đề mục, tác giả, tóm tắt và tài liệu tham khảo theo chuẩn ĐHQG-HCM.'}
        </p>

        {!isParsing && (
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-extrabold bg-[#78C841] hover:bg-[#6cb43a] text-zinc-950 shadow-md shadow-[#78C841]/20 hover:scale-102 active:scale-98 transition-all">
            <FileText className="w-3.5 h-3.5" />
            <span>Chọn file Word từ máy tính</span>
          </div>
        )}

        {errorMsg && (
          <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>

      {/* Alternative Option: Skip to Blank Document */}
      <div className="text-center pt-2">
        <button
          type="button"
          data-testid="skip-to-blank-btn"
          disabled={isParsing}
          onClick={() => onSuccess({ isBlank: true })}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors p-2 rounded-xl hover:bg-slate-100 cursor-pointer"
        >
          <FilePlus className="w-4 h-4 text-slate-400" />
          <span>Bỏ qua &amp; Bắt đầu bằng bản thảo trắng</span>
        </button>
      </div>
    </div>
  );
};
