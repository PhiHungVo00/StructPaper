'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { CompletePaper, DEFAULT_LAYOUT_SETTINGS } from '@/types/paper';
import { exportToLatex } from '@/lib/exporters';
import {
  CompileScheduler,
  CompilerRouter,
  NetworkMonitor,
  RemoteCompiler,
  WasmCompiler,
  TauriDesktopCompiler,
  isTauriEnvironment,
} from '@structpaper/compiler-client';
import { toast } from '@/components/DynamicIslandToast';
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
  router?: CompilerRouter;
  networkMonitor?: NetworkMonitor;
  debounceMs?: number;
}

export function useEditorCompilation({
  paper,
  formData,
  onUpdatePaper,
  setIsDirty,
  router: customRouter,
  networkMonitor: customNetworkMonitor,
  debounceMs = 500,
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
          engineKind: 'server-native',
          engine: 'Server XeLaTeX',
          producedBy: {
            kind: 'server-native',
            environmentId: 'tl2026-server',
          },
        }
      : null
  );
  const [compileErrorInfo, setCompileErrorInfo] = useState<CompileErrorInfo | null>(null);

  const monitorRef = useRef<NetworkMonitor | null>(customNetworkMonitor ?? null);
  if (!monitorRef.current) {
    monitorRef.current = new NetworkMonitor({
      serverEndpoint: '/api/health',
      timeoutMs: 3000,
    });
  }

  const routerRef = useRef<CompilerRouter | null>(customRouter ?? null);
  if (!routerRef.current) {
    const monitor = monitorRef.current;
    const remoteCompiler = new RemoteCompiler({
      endpoint: '/api/compile-latex',
    });
    const wasmCompiler = new WasmCompiler();
    const isDesktop = isTauriEnvironment();
    const localCompiler = isDesktop ? new TauriDesktopCompiler() : wasmCompiler;

    routerRef.current = new CompilerRouter({
      local: localCompiler,
      server: remoteCompiler,
      getContext: () => ({
        online: monitor.isOnline(),
        serverReachable: monitor.isServerReachable(),
        localEnv: isDesktop ? 'ready' : typeof Worker !== 'undefined' ? 'ready' : 'missing',
        localEnvMatches: true,
        deviceScore: typeof Worker !== 'undefined' || isDesktop ? 100 : 'unsupported',
        pageEstimate: 5,
        assetBytes: 1024 * 1024,
        recentLocalFailures: [],
        userPreference: isDesktop ? 'local' : 'server',
        parity: 'same',
        localDisabledByFlag: false,
        saveData: false,
      }),
    });
  }

  const schedulerRef = useRef<CompileScheduler | null>(null);
  if (!schedulerRef.current) {
    schedulerRef.current = new CompileScheduler({
      compiler: routerRef.current,
      debounceMs,
    });
  }

  // NetworkMonitor subscription and Sticky Toast management
  useEffect(() => {
    const monitor = monitorRef.current;
    if (!monitor) return;

    let wasOfflineOrUnreachable = !monitor.isOnline() || !monitor.isServerReachable();

    if (wasOfflineOrUnreachable) {
      toast.sticky(
        'Đang ngoại tuyến',
        'Hệ thống tự động chuyển sang chế độ biên dịch trực tiếp trên trình duyệt (WASM)',
        { theme: 'warning', id: 'offline-compile-toast' }
      );
    }

    const unsubscribe = monitor.subscribe((state) => {
      const isOfflineOrUnreachable = !state.online || !state.serverReachable;

      if (isOfflineOrUnreachable) {
        wasOfflineOrUnreachable = true;
        toast.sticky(
          'Đang ngoại tuyến',
          'Hệ thống tự động chuyển sang chế độ biên dịch trực tiếp trên trình duyệt (WASM)',
          { theme: 'warning', id: 'offline-compile-toast' }
        );
      } else {
        toast.dismiss('offline-compile-toast');
        if (wasOfflineOrUnreachable) {
          toast.info(
            'Đã kết nối lại máy chủ',
            'Hệ thống đã sẵn sàng biên dịch chuẩn xuất bản trên máy chủ',
            { duration: 3000 }
          );
          wasOfflineOrUnreachable = false;
        }
      }
    });

    return () => {
      unsubscribe();
      if (!customNetworkMonitor) {
        monitor.dispose();
      }
    };
  }, [customNetworkMonitor]);

  // Clean up scheduler & router
  useEffect(() => {
    return () => {
      schedulerRef.current?.dispose();
      if (!customRouter) {
        routerRef.current?.dispose();
      }
    };
  }, [customRouter]);

  const compileLatexToPdf = useCallback(
    async (customPaperData?: CompletePaper): Promise<string | null> => {
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
          mode: 'draft',
        });

        if (result.status === 'success') {
          const url =
            result.pdfUrl ||
            (result.pdfBlob ? URL.createObjectURL(result.pdfBlob) : null);
          if (url) {
            setCompiledPdfUrl(url);
          }
          const engineKind = result.producedBy?.kind;
          const engineName =
            result.engine ||
            (engineKind === 'browser-wasm' ? 'XeLaTeX WASM' : 'Server XeLaTeX');

          setCompileStats({
            durationMs: result.durationMs,
            sizeKb: Math.round(
              (result.pdfBlob?.size ?? result.pdfBuffer?.length ?? 0) / 1024
            ),
            timestamp: new Date().toLocaleTimeString('vi-VN'),
            engineKind,
            engine: engineName,
            producedBy: result.producedBy,
          });
          return url;
        } else if (
          result.cancelled ||
          result.error === 'Compilation was aborted' ||
          result.error?.includes('superseded') ||
          result.error?.includes('aborted')
        ) {
          // Bỏ qua khi yêu cầu bị hủy hoặc thay thế bởi tác vụ mới (debounce)
          return null;
        } else {
          setCompileErrorInfo({
            error: result.error || 'Biên dịch thất bại',
            details: result.details,
            engine:
              result.engine ||
              (result.producedBy?.kind === 'browser-wasm' ? 'XeLaTeX WASM' : 'Tectonic'),
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
    networkMonitor: monitorRef.current,
    compilerRouter: routerRef.current,
  };
}
