'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { CompletePaper, DEFAULT_LAYOUT_SETTINGS } from '@/types/paper';
import { exportToLatex } from '@/lib/exporters';
import {
  CompileScheduler,
  LocalNextCompilerAdapter,
} from '@structpaper/compiler-client';
import { CompileStats, CompileErrorInfo } from '../types';

function extractPaperImages(paper: CompletePaper): Record<string, string> {
  const images: Record<string, string> = {};
  let figIdx = 1;
  (paper.sections || []).forEach((sec, idx) => {
    if (sec.type === 'figure' && sec.figure?.src) {
      const num = sec.figure.num || figIdx++;
      if (sec.figure.src.startsWith('data:image')) {
        const parts = sec.figure.src.split(',');
        if (parts[1]) {
          const base64Data = parts[1];
          const isJpg =
            sec.figure.src.startsWith('data:image/jpeg') ||
            sec.figure.src.startsWith('data:image/jpg');
          const ext = isJpg ? 'jpg' : 'png';

          images[`fig${num}.${ext}`] = base64Data;
          images[`fig${num}.png`] = base64Data;
          images[`fig${num}.jpg`] = base64Data;
          images[`image${num}.${ext}`] = base64Data;
          images[`image${idx + 1}.${ext}`] = base64Data;
          images[`fig${idx + 1}.png`] = base64Data;
          images[`fig${idx + 1}.jpg`] = base64Data;
        }
      }
    }
  });
  return images;
}

export interface UseEditorCompilationOptions {
  paper: CompletePaper;
  formData: CompletePaper;
  onUpdatePaper: (updated: CompletePaper) => void;
  setIsDirty?: (dirty: boolean) => void;
}

export function useEditorCompilation({
  paper,
  formData,
  onUpdatePaper,
  setIsDirty,
}: UseEditorCompilationOptions) {
  const isDefaultHs630 =
    formData.id === 'hs630' || formData.metadata?.doi?.includes('630');
  const defaultPdf = isDefaultHs630
    ? '/demo-files/ID630_HS-2026-10-02-07-07.pdf'
    : null;

  const [compiledPdfUrl, setCompiledPdfUrl] = useState<string | null>(defaultPdf);
  const [isCompilingPdf, setIsCompilingPdf] = useState(false);
  const [compileStats, setCompileStats] = useState<CompileStats | null>(
    defaultPdf
      ? {
          durationMs: 1845,
          sizeKb: 1447,
          timestamp: 'Sẵn sàng',
        }
      : null
  );
  const [compileErrorInfo, setCompileErrorInfo] = useState<CompileErrorInfo | null>(null);

  const schedulerRef = useRef<CompileScheduler | null>(null);
  const isCompilingRef = useRef(false);

  // Initialize scheduler with LocalNextCompilerAdapter
  if (!schedulerRef.current) {
    const adapter = new LocalNextCompilerAdapter({
      endpoint: '/api/compile-latex',
      fetchFn: typeof window !== 'undefined' && typeof window.fetch === 'function' ? window.fetch.bind(window) : undefined,
    });
    schedulerRef.current = new CompileScheduler({
      compiler: adapter,
      debounceMs: 500,
    });
  }

  useEffect(() => {
    return () => {
      schedulerRef.current?.dispose();
    };
  }, []);

  const compileLatexToPdf = useCallback(
    async (customPaperData?: CompletePaper): Promise<string | null> => {
      if (isCompilingRef.current) return null;
      isCompilingRef.current = true;

      const paperToCompile = customPaperData || formData;
      const settings = paperToCompile.layoutSettings || DEFAULT_LAYOUT_SETTINGS;

      try {
        setIsCompilingPdf(true);
        setCompileErrorInfo(null);
        const texContent = exportToLatex(paperToCompile, settings);
        const images = extractPaperImages(paperToCompile);

        const scheduler = schedulerRef.current;
        if (!scheduler) return null;

        const result = await scheduler.compileNow({
          tex: texContent,
          paperId: paperToCompile.id,
          images,
        });

        if (result.status === 'success') {
          const url =
            result.pdfUrl ||
            (result.pdfBlob ? URL.createObjectURL(result.pdfBlob) : null);
          if (url) {
            setCompiledPdfUrl(url);
          }
          setCompileStats({
            durationMs: result.durationMs,
            sizeKb: Math.round(
              (result.pdfBlob?.size ?? result.pdfBuffer?.length ?? 0) / 1024
            ),
            timestamp: new Date().toLocaleTimeString('vi-VN'),
          });
          return url;
        } else if (result.cancelled) {
          // Bỏ qua khi yêu cầu bị hủy hoặc thay thế bởi tác vụ mới (debounce)
          return null;
        } else {
          setCompileErrorInfo({
            error: result.error || 'Biên dịch thất bại',
            details: result.details,
            engine: result.engine || 'Tectonic',
            rawLog: result.logs?.join('\n'),
          });
          return null;
        }
      } catch (e: any) {
        if (
          e?.name === 'CompileAbortError' ||
          e?.name === 'AbortError' ||
          e?.message?.includes('aborted') ||
          e?.message?.includes('superseded')
        ) {
          // Yêu cầu bị hủy bình thường do debounce hoặc chuyển bản thảo
          return null;
        }
        setCompileErrorInfo({
          error: 'Lỗi kết nối máy chủ biên dịch',
          details: e?.message || 'Không thể gửi yêu cầu biên dịch tới backend.',
        });
        return null;
      } finally {
        setIsCompilingPdf(false);
        isCompilingRef.current = false;
      }
    },
    [formData]
  );

  // Sync with paper changes and compile initial
  useEffect(() => {
    const isHs630 = paper.id === 'hs630' || paper.metadata?.doi?.includes('630');
    if (isHs630) {
      setCompiledPdfUrl('/demo-files/ID630_HS-2026-10-02-07-07.pdf');
    } else {
      setCompiledPdfUrl(null);
      compileLatexToPdf(paper);
    }
  }, [paper.id]);

  const handleRecompile = useCallback(
    (customPaper?: CompletePaper) => {
      const target = customPaper || formData;
      onUpdatePaper(target);
      setIsDirty?.(false);
      compileLatexToPdf(target);
    },
    [formData, onUpdatePaper, setIsDirty, compileLatexToPdf]
  );

  return {
    compiledPdfUrl,
    setCompiledPdfUrl,
    isCompilingPdf,
    compileStats,
    setCompileStats,
    compileErrorInfo,
    setCompileErrorInfo,
    compileLatexToPdf,
    handleRecompile,
  };
}
