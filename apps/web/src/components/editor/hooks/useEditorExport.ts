'use client';

import { useState, useCallback } from 'react';
import { CompletePaper } from '@/types/paper';
import { generateLatexPackageZip } from '@/lib/exporters';
import { exportPaperToDocx } from '@/lib/docx-export';
import { sileo } from '@/components/DynamicIslandToast';

export interface UseEditorExportOptions {
  formData: CompletePaper;
  compiledPdfUrl: string | null;
  compileLatexToPdf: (customPaper?: CompletePaper) => Promise<string | null>;
  onNotify?: (msg: string) => void;
}

export function useEditorExport({
  formData,
  compiledPdfUrl,
  compileLatexToPdf,
  onNotify,
}: UseEditorExportOptions) {
  const [isExportingDocx, setIsExportingDocx] = useState(false);
  const [isExportingZip, setIsExportingZip] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const notify = useCallback(
    (msg: string) => {
      if (onNotify) {
        onNotify(msg);
      } else {
        sileo.info({
          title: 'Thông báo hệ thống',
          description: msg,
        });
      }
    },
    [onNotify]
  );

  const handleDownloadDocx = useCallback(async () => {
    try {
      setIsExportingDocx(true);
      const blob = await exportPaperToDocx(formData);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${formData.metadata.journalId || 'Paper'}_${
        formData.metadata.doi?.split('/').pop() || 'Manuscript'
      }.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      notify('Đã xuất file Word (.docx) thành công!');
    } catch (e: any) {
      alert('Lỗi xuất DOCX: ' + (e?.message || String(e)));
    } finally {
      setIsExportingDocx(false);
    }
  }, [formData, notify]);

  const handleDownloadZip = useCallback(async () => {
    try {
      setIsExportingZip(true);
      const blob = await generateLatexPackageZip(formData);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${formData.metadata.journalId || 'Article'}_LaTeX_Package.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      notify('Đã tải gói nén ZIP LaTeX (.tex + .bib)!');
    } catch (e: any) {
      alert('Lỗi tạo gói ZIP: ' + (e?.message || String(e)));
    } finally {
      setIsExportingZip(false);
    }
  }, [formData, notify]);

  const handleDownloadPdf = useCallback(async () => {
    try {
      setIsExportingPdf(true);
      let targetUrl = compiledPdfUrl;
      if (!targetUrl) {
        notify('Đang biên dịch PDF trước khi tải...');
        targetUrl = await compileLatexToPdf(formData);
      }
      if (targetUrl) {
        const a = document.createElement('a');
        a.href = targetUrl;
        a.download = `${formData.metadata.journalId || 'Paper'}_${
          formData.metadata.doi?.split('/').pop() || 'Manuscript'
        }.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        notify('Đã tải xuống file PDF thành công!');
      } else {
        alert('Không thể tạo file PDF do lỗi biên dịch.');
      }
    } catch (e: any) {
      alert('Lỗi tải PDF: ' + (e?.message || String(e)));
    } finally {
      setIsExportingPdf(false);
    }
  }, [formData, compiledPdfUrl, compileLatexToPdf, notify]);

  return {
    isExportingDocx,
    isExportingZip,
    isExportingPdf,
    handleDownloadDocx,
    handleDownloadZip,
    handleDownloadPdf,
  };
}
