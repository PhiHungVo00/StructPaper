'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { CompletePaper, PaperSection, LayoutSettings, DEFAULT_LAYOUT_SETTINGS } from '@/types/paper';
import { computePreflightCheck } from '@/lib/docx-extractor';
import { exportToLatex, generateLatexPackageZip } from '@/lib/exporters';
import { exportPaperToDocx } from '@/lib/docx-export';
import {
  EditorTabKey,
  CompileStats,
  CompileErrorInfo,
} from './types';
import { EditorLeftDock } from './EditorLeftDock';
import { ExtractedContentDrawer } from './ExtractedContentDrawer';
import { LayoutSettingsDrawer } from './LayoutSettingsDrawer';
import { EditorTabNav } from './EditorTabNav';
import { MetadataTab } from './MetadataTab';
import { AuthorsTab } from './AuthorsTab';
import { AbstractTab } from './AbstractTab';
import { SectionsTab } from './SectionsTab';
import { ReferencesTab } from './ReferencesTab';
import { CitationTab } from './CitationTab';
import { PreflightQCTab } from './PreflightQCTab';
import { generateStandardCitation } from './sections/utils';
import { LivePreviewPane } from './LivePreviewPane';
import { ResizableSplitLayout } from './ResizableSplitLayout';
import { FileText, Eye, CheckCircle2, Home, Layers, Sliders, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { usePaper } from '@/context/PaperContext';
import { JOURNAL_TEMPLATES } from '@/lib/templates';
import { sileo } from '@/components/DynamicIslandToast';

interface UnifiedEditorViewProps {
  paper: CompletePaper;
  onUpdatePaper: (updated: CompletePaper) => void;
  onGoToPreview?: () => void;
}

export const UnifiedEditorView: React.FC<UnifiedEditorViewProps> = ({
  paper,
  onUpdatePaper,
}) => {
  const { currentJournal, setCurrentJournal } = usePaper();
  // Local editable draft of the paper
  const [formData, setFormData] = useState<CompletePaper>(() =>
    JSON.parse(JSON.stringify(paper))
  );
  const [isDirty, setIsDirty] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isSettingsDrawerOpen, setIsSettingsDrawerOpen] = useState(false);
  const [isExtractedDrawerOpen, setIsExtractedDrawerOpen] = useState(false);

  // Export progress states
  const [isExportingDocx, setIsExportingDocx] = useState(false);
  const [isExportingZip, setIsExportingZip] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  // Editor subtab state
  const [activeSubTab, setActiveSubTab] = useState<EditorTabKey>('metadata');

  // Mobile active pane switch: 'editor' | 'preview'
  const [mobilePane, setMobilePane] = useState<'editor' | 'preview'>('editor');

  // Default pre-compiled sample PDF only if default HS630
  const isDefaultHs630 =
    formData.id === 'hs630' || formData.metadata.doi?.includes('630');
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

  const isCompilingRef = useRef(false);

  const showNotification = (msg: string) => {
    sileo.info({
      title: 'Thông báo hệ thống',
      description: msg,
    });
  };

  // Compile LaTeX to PDF
  const compileLatexToPdf = async (customPaperData?: CompletePaper): Promise<string | null> => {
    if (isCompilingRef.current) return null;
    isCompilingRef.current = true;

    const paperToCompile = customPaperData || formData;
    const settings = paperToCompile.layoutSettings || DEFAULT_LAYOUT_SETTINGS;

    try {
      setIsCompilingPdf(true);
      setCompileErrorInfo(null);
      const startTime = Date.now();
      const texContent = exportToLatex(paperToCompile, settings);

      const images: Record<string, string> = {};
      let figIdx = 1;
      (paperToCompile.sections || []).forEach((sec, idx) => {
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

              // Map all possible alias names so LaTeX will definitely find it
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

      const response = await fetch('/api/compile-latex', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tex: texContent,
          paperId: paperToCompile.id,
          images,
        }),
      });

      const clientDuration = Date.now() - startTime;

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        setCompileErrorInfo({
          error: errData.error || `Biên dịch thất bại (${response.status})`,
          details: errData.details,
          engine: errData.engine || 'Tectonic',
          rawLog: errData.rawLog,
        });
        return null;
      }

      const serverDuration = response.headers.get('x-compilation-time-ms');
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setCompiledPdfUrl(url);

      setCompileStats({
        durationMs: serverDuration ? parseInt(serverDuration, 10) : clientDuration,
        sizeKb: Math.round(blob.size / 1024),
        timestamp: new Date().toLocaleTimeString('vi-VN'),
      });
      return url;
    } catch (e: any) {
      setCompileErrorInfo({
        error: 'Lỗi kết nối máy chủ biên dịch',
        details: e.message || 'Không thể gửi yêu cầu biên dịch tới backend.',
      });
      return null;
    } finally {
      setIsCompilingPdf(false);
      isCompilingRef.current = false;
    }
  };

  // Keep formData in sync if incoming paper.id changes and recompile if needed
  useEffect(() => {
    const fresh = JSON.parse(JSON.stringify(paper));
    setFormData(fresh);
    setIsDirty(false);

    const isHs630 = fresh.id === 'hs630' || fresh.metadata?.doi?.includes('630');
    if (isHs630) {
      setCompiledPdfUrl('/demo-files/ID630_HS-2026-10-02-07-07.pdf');
    } else {
      setCompiledPdfUrl(null);
      compileLatexToPdf(fresh);
    }
  }, [paper.id]);

  // Compute preflight checklist
  const preflight = computePreflightCheck(formData);

  // Handle Save
  const handleSave = useCallback(() => {
    onUpdatePaper(formData);
    setIsDirty(false);
    setSaveSuccess(true);
    sileo.success({
      title: 'Đã lưu thay đổi',
      description: 'Bản thảo bài báo đã được cập nhật thành công vào hệ thống',
    });
    setTimeout(() => setSaveSuccess(false), 2500);
  }, [formData, onUpdatePaper]);

  // Keyboard shortcut: Ctrl + S (or Cmd + S on Mac) to auto-save
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSave]);

  // Handle Recompile (Saves then triggers PDF compilation)
  const handleRecompile = () => {
    onUpdatePaper(formData);
    setIsDirty(false);
    compileLatexToPdf(formData);
  };

  // Handle applying layout settings from Drawer
  const handleApplyLayoutSettings = (newSettings: LayoutSettings, newJournalId?: string) => {
    const journalIdToUse = newJournalId || formData.metadata.journalId || currentJournal;
    const tmpl = JOURNAL_TEMPLATES[journalIdToUse] || JOURNAL_TEMPLATES['VNUHCM-HS'];

    const updated: CompletePaper = {
      ...formData,
      layoutSettings: newSettings,
      metadata: {
        ...formData.metadata,
        journalId: journalIdToUse,
        journalName: tmpl.name,
        journalAbbv: tmpl.shortName,
      },
    };
    setFormData(updated);
    setIsDirty(true);
    onUpdatePaper(updated);
    if (newJournalId && newJournalId !== currentJournal) {
      setCurrentJournal(newJournalId);
    }
    compileLatexToPdf(updated);
  };

  // Export DOCX
  const handleDownloadDocx = async () => {
    try {
      setIsExportingDocx(true);
      const blob = await exportPaperToDocx(formData);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${formData.metadata.journalId || 'Paper'}_${formData.metadata.doi?.split('/').pop() || 'Manuscript'}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showNotification('Đã xuất file Word (.docx) thành công!');
    } catch (e: any) {
      alert('Lỗi xuất DOCX: ' + e.message);
    } finally {
      setIsExportingDocx(false);
    }
  };

  // Export LaTeX ZIP
  const handleDownloadZip = async () => {
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
      showNotification('Đã tải gói nén ZIP LaTeX (.tex + .bib)!');
    } catch (e: any) {
      alert('Lỗi tạo gói ZIP: ' + e.message);
    } finally {
      setIsExportingZip(false);
    }
  };

  // Export PDF
  const handleDownloadPdf = async () => {
    try {
      setIsExportingPdf(true);
      let targetUrl = compiledPdfUrl;
      if (!targetUrl) {
        showNotification('Đang biên dịch PDF trước khi tải...');
        targetUrl = await compileLatexToPdf(formData);
      }
      if (targetUrl) {
        const a = document.createElement('a');
        a.href = targetUrl;
        a.download = `${formData.metadata.journalId || 'Paper'}_${formData.metadata.doi?.split('/').pop() || 'Manuscript'}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        showNotification('Đã tải xuống file PDF thành công!');
      } else {
        alert('Không thể tạo file PDF do lỗi biên dịch.');
      }
    } catch (e: any) {
      alert('Lỗi tải PDF: ' + e.message);
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Handle Metadata change
  const handleMetadataChange = (newMeta: any) => {
    setFormData((prev) => ({ ...prev, metadata: newMeta }));
    setIsDirty(true);
  };

  // Handle Sections change
  const handleSectionsChange = (newSections: any) => {
    setFormData((prev) => ({ ...prev, sections: newSections }));
    setIsDirty(true);
  };

  // Handle References change
  const handleReferencesChange = (newRefs: any) => {
    setFormData((prev) => ({ ...prev, references: newRefs }));
    setIsDirty(true);
  };

  // Find or derive citation text from sections
  const citationSection = formData.sections.find((s) => s.type === 'citation');
  const citationText =
    citationSection?.content ??
    (formData.metadata ? generateStandardCitation(formData.metadata) : '');

  const handleUpdateCitation = (updatedText: string) => {
    const list = [...formData.sections];
    const existingIdx = list.findIndex((s) => s.type === 'citation');
    if (existingIdx >= 0) {
      list[existingIdx] = {
        ...list[existingIdx],
        content: updatedText,
      };
    } else {
      const newSec: PaperSection = {
        id: `sec_citation_${Date.now()}`,
        type: 'citation',
        title: 'Trích dẫn bài báo này',
        content: updatedText,
      };
      list.unshift(newSec);
    }
    handleSectionsChange(list);
  };

  // Left column editor content
  const leftEditorContent = (
    <div className="h-full flex flex-col min-h-0 min-w-0 w-full overflow-hidden space-y-2">
      {/* Subtabs Navigation (Fixed height, no browser scrollbars) */}
      <div className="flex-shrink-0">
        <EditorTabNav
          activeTab={activeSubTab}
          onTabChange={setActiveSubTab}
          authorsCount={formData.metadata.authors.length}
          sectionsCount={formData.sections.filter((s) => s.type !== 'citation').length}
          referencesCount={formData.references.length}
          preflight={preflight}
        />
      </div>

      {/* Active Tab Card - Fills remaining height down to bottom with internal scroll */}
      <div className="flex-1 min-h-0 min-w-0 h-full w-full overflow-hidden">
        {activeSubTab === 'metadata' && (
          <MetadataTab
            metadata={formData.metadata}
            onChange={handleMetadataChange}
          />
        )}

        {activeSubTab === 'authors' && (
          <AuthorsTab
            metadata={formData.metadata}
            onChange={handleMetadataChange}
          />
        )}

        {activeSubTab === 'abstract' && (
          <AbstractTab
            metadata={formData.metadata}
            onChange={handleMetadataChange}
          />
        )}

        {activeSubTab === 'sections' && (
          <SectionsTab
            sections={formData.sections}
            onChange={handleSectionsChange}
            metadata={formData.metadata}
            references={formData.references}
          />
        )}

        {activeSubTab === 'refs' && (
          <ReferencesTab
            references={formData.references}
            onChange={handleReferencesChange}
          />
        )}

        {activeSubTab === 'citation' && (
          <CitationTab
            citationText={citationText}
            onChange={handleUpdateCitation}
            metadata={formData.metadata}
          />
        )}

        {activeSubTab === 'preflight' && (
          <PreflightQCTab
            preflight={preflight}
            onNavigateTab={(tab) => setActiveSubTab(tab)}
          />
        )}
      </div>
    </div>
  );

  // Right column preview content
  const rightPreviewContent = (
    <div className="h-full flex flex-col min-h-0">
      <LivePreviewPane
        paper={formData}
        compiledPdfUrl={compiledPdfUrl}
        isCompilingPdf={isCompilingPdf}
        compileStats={compileStats}
        compileErrorInfo={compileErrorInfo}
        onRecompile={handleRecompile}
        onClearError={() => setCompileErrorInfo(null)}
      />
    </div>
  );

  return (
    <div className="h-full w-full flex flex-row p-3 min-h-0 gap-2 sm:gap-3 overflow-hidden">
      {/* 1. LEFT VERTICAL DOCK (Desktop/Tablet) */}
      <EditorLeftDock
        onOpenExtractedDrawer={() => setIsExtractedDrawerOpen(true)}
        onOpenLayoutSettings={() => setIsSettingsDrawerOpen(true)}
        onSave={handleSave}
        saveSuccess={saveSuccess}
        isDirty={isDirty}
        onRecompile={handleRecompile}
        isCompiling={isCompilingPdf}
        onDownloadDocx={handleDownloadDocx}
        isExportingDocx={isExportingDocx}
        onDownloadZip={handleDownloadZip}
        isExportingZip={isExportingZip}
        onDownloadPdf={handleDownloadPdf}
        isExportingPdf={isExportingPdf}
        compiledPdfUrl={compiledPdfUrl}
        qcScore={preflight.score}
        hasErrors={preflight.issues?.some((i) => i.severity === 'error')}
        hasWarnings={preflight.issues?.some((i) => i.severity === 'warning')}
        errorCount={preflight.issues?.filter((i) => i.severity === 'error').length || 0}
        warningCount={preflight.issues?.filter((i) => i.severity === 'warning').length || 0}
        onOpenQCTab={() => setActiveSubTab('preflight')}
      />

      {/* 2. MAIN WORKSPACE: Fills 100% of height and width right up to the top edge */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative z-10">
        {/* Mobile Top Header (only on very small screens where left dock is hidden) */}
        <div className="flex sm:hidden flex-shrink-0 items-center justify-between p-1.5 mb-1.5 bg-white/70 backdrop-blur-md rounded-2xl border border-zinc-200">
          <Link
            href="/upload"
            className="p-2 rounded-xl bg-white border border-zinc-200 text-zinc-700 font-bold text-xs flex items-center gap-1 shadow-2xs"
            title="Quay lại trang chủ"
          >
            <Home className="w-4 h-4" />
          </Link>

          <div className="flex items-center gap-1 bg-zinc-200/70 p-0.5 rounded-xl">
            <button
              type="button"
              onClick={() => setMobilePane('editor')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${mobilePane === 'editor' ? 'bg-white text-zinc-900 shadow-2xs' : 'text-zinc-600'
                }`}
            >
              Soạn thảo
            </button>
            <button
              type="button"
              onClick={() => setMobilePane('preview')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${mobilePane === 'preview' ? 'bg-white text-zinc-900 shadow-2xs' : 'text-zinc-600'
                }`}
            >
              PDF
            </button>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setIsExtractedDrawerOpen(true)}
              className="p-2 rounded-xl bg-white border border-zinc-200 text-zinc-700 shadow-2xs"
              title="Nội dung trích xuất"
            >
              <Layers className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setIsSettingsDrawerOpen(true)}
              className="p-2 rounded-xl bg-white border border-zinc-200 text-zinc-700 shadow-2xs"
              title="Cài đặt dàn trang"
            >
              <Sliders className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Desktop Split View: Fills 100% of height directly from the top edge */}
        <div className="hidden sm:flex flex-1 min-h-0 h-full w-full overflow-hidden">
          <ResizableSplitLayout
            className="h-full"
            leftContent={leftEditorContent}
            rightContent={rightPreviewContent}
            defaultSplit={50}
            minPercent={28}
            maxPercent={72}
          />
        </div>

        {/* Mobile single pane view */}
        <div className="block sm:hidden flex-1 min-h-0 overflow-y-auto">
          {mobilePane === 'editor' ? leftEditorContent : rightPreviewContent}
        </div>
      </div>

      {/* 3. EXTRACTED CONTENT BOTTOM DRAWER (95vh) */}
      <ExtractedContentDrawer
        isOpen={isExtractedDrawerOpen}
        onClose={() => setIsExtractedDrawerOpen(false)}
        paper={formData}
      />

      {/* 4. LAYOUT & PAPER SETTINGS DRAWER */}
      <LayoutSettingsDrawer
        isOpen={isSettingsDrawerOpen}
        onClose={() => setIsSettingsDrawerOpen(false)}
        settings={formData.layoutSettings || DEFAULT_LAYOUT_SETTINGS}
        journalId={formData.metadata.journalId || currentJournal}
        onApplySettings={handleApplyLayoutSettings}
        isCompiling={isCompilingPdf}
      />
    </div>
  );
};
