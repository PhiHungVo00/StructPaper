'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Home, Layers, Sliders } from 'lucide-react';
import { CompletePaper, PaperSection, LayoutSettings, DEFAULT_LAYOUT_SETTINGS } from '@/types/paper';
import { computePreflightCheck } from '@/lib/docx-extractor';
import { JOURNAL_TEMPLATES } from '@/lib/templates';
import { usePaper } from '@/context/PaperContext';
import { sileo } from '@/components/DynamicIslandToast';
import { EditorTabKey } from './types';
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
import { LivePreviewPane } from './LivePreviewPane';
import { ResizableSplitLayout } from './ResizableSplitLayout';
import { generateStandardCitation } from './sections/utils';
import { useEditorCompilation, useEditorExport, useEditorShortcuts } from './hooks';

interface UnifiedEditorViewProps {
  paper: CompletePaper;
  onUpdatePaper: (updated: CompletePaper) => void;
  onGoToPreview?: () => void;
}

export const UnifiedEditorView: React.FC<UnifiedEditorViewProps> = ({ paper, onUpdatePaper }) => {
  const { currentJournal, setCurrentJournal } = usePaper();
  const [formData, setFormData] = useState<CompletePaper>(() => JSON.parse(JSON.stringify(paper)));
  const [isDirty, setIsDirty] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isSettingsDrawerOpen, setIsSettingsDrawerOpen] = useState(false);
  const [isExtractedDrawerOpen, setIsExtractedDrawerOpen] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<EditorTabKey>('metadata');
  const [mobilePane, setMobilePane] = useState<'editor' | 'preview'>('editor');

  const { compiledPdfUrl, isCompilingPdf, compileStats, compileErrorInfo, setCompileErrorInfo, compileLatexToPdf, handleRecompile } =
    useEditorCompilation({ paper, formData, onUpdatePaper, setIsDirty });

  const { isExportingDocx, isExportingZip, isExportingPdf, handleDownloadDocx, handleDownloadZip, handleDownloadPdf } =
    useEditorExport({ formData, compiledPdfUrl, compileLatexToPdf });

  const handleSave = useCallback(() => {
    onUpdatePaper(formData);
    setIsDirty(false);
    setSaveSuccess(true);
    sileo.success({ title: 'Đã lưu thay đổi', description: 'Bản thảo bài báo đã được cập nhật thành công vào hệ thống' });
    setTimeout(() => setSaveSuccess(false), 2500);
  }, [formData, onUpdatePaper]);

  useEditorShortcuts({ onSave: handleSave });
  useEffect(() => { setFormData(JSON.parse(JSON.stringify(paper))); setIsDirty(false); }, [paper.id]);
  const preflight = computePreflightCheck(formData);

  const handleApplyLayoutSettings = (newSettings: LayoutSettings, newJournalId?: string) => {
    const journalIdToUse = newJournalId || formData.metadata.journalId || currentJournal;
    const tmpl = JOURNAL_TEMPLATES[journalIdToUse] || JOURNAL_TEMPLATES['VNUHCM-HS'];
    const updated: CompletePaper = {
      ...formData,
      layoutSettings: newSettings,
      metadata: { ...formData.metadata, journalId: journalIdToUse, journalName: tmpl.name, journalAbbv: tmpl.shortName },
    };
    setFormData(updated);
    setIsDirty(true);
    onUpdatePaper(updated);
    if (newJournalId && newJournalId !== currentJournal) setCurrentJournal(newJournalId);
    compileLatexToPdf(updated);
  };

  const citationSection = formData.sections.find((s) => s.type === 'citation');
  const citationText = citationSection?.content ?? (formData.metadata ? generateStandardCitation(formData.metadata) : '');

  const handleUpdateCitation = (updatedText: string) => {
    const list = [...formData.sections];
    const existingIdx = list.findIndex((s) => s.type === 'citation');
    if (existingIdx >= 0) {
      list[existingIdx] = { ...list[existingIdx], content: updatedText };
    } else {
      list.unshift({ id: `sec_citation_${Date.now()}`, type: 'citation', title: 'Trích dẫn bài báo này', content: updatedText });
    }
    setFormData((prev) => ({ ...prev, sections: list }));
    setIsDirty(true);
  };

  const leftEditorContent = (
    <div className="h-full flex flex-col min-h-0 min-w-0 w-full overflow-hidden space-y-2">
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
      <div className="flex-1 min-h-0 min-w-0 h-full w-full overflow-hidden">
        {activeSubTab === 'metadata' && (
          <MetadataTab
            metadata={formData.metadata}
            showAbstractAndKeywords={false}
            onChange={(m) => {
              setFormData((p) => ({ ...p, metadata: m }));
              setIsDirty(true);
            }}
          />
        )}
        {activeSubTab === 'authors' && <AuthorsTab metadata={formData.metadata} onChange={(m) => { setFormData((p) => ({ ...p, metadata: m })); setIsDirty(true); }} />}
        {activeSubTab === 'abstract' && <AbstractTab metadata={formData.metadata} onChange={(m) => { setFormData((p) => ({ ...p, metadata: m })); setIsDirty(true); }} />}
        {activeSubTab === 'sections' && <SectionsTab sections={formData.sections} onChange={(s) => { setFormData((p) => ({ ...p, sections: s })); setIsDirty(true); }} metadata={formData.metadata} references={formData.references} />}
        {activeSubTab === 'refs' && <ReferencesTab references={formData.references} onChange={(r) => { setFormData((p) => ({ ...p, references: r })); setIsDirty(true); }} />}
        {activeSubTab === 'citation' && <CitationTab citationText={citationText} onChange={handleUpdateCitation} metadata={formData.metadata} />}
        {activeSubTab === 'preflight' && <PreflightQCTab preflight={preflight} onNavigateTab={setActiveSubTab} />}
      </div>
    </div>
  );

  const rightPreviewContent = (
    <div className="h-full flex flex-col min-h-0">
      <LivePreviewPane
        paper={formData}
        compiledPdfUrl={compiledPdfUrl}
        isCompilingPdf={isCompilingPdf}
        compileStats={compileStats}
        compileErrorInfo={compileErrorInfo}
        onRecompile={() => handleRecompile(formData)}
        onClearError={() => setCompileErrorInfo(null)}
      />
    </div>
  );

  return (
    <div className="h-full w-full flex flex-row p-3 min-h-0 gap-2 sm:gap-3 overflow-hidden">
      <EditorLeftDock
        onOpenExtractedDrawer={() => setIsExtractedDrawerOpen(true)}
        onOpenLayoutSettings={() => setIsSettingsDrawerOpen(true)}
        onSave={handleSave}
        saveSuccess={saveSuccess}
        isDirty={isDirty}
        onRecompile={() => handleRecompile(formData)}
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

      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative z-10">
        <div className="flex sm:hidden flex-shrink-0 items-center justify-between p-1.5 mb-1.5 bg-white/70 backdrop-blur-md rounded-2xl border border-zinc-200">
          <Link href="/upload" className="p-2 rounded-xl bg-white border border-zinc-200 text-zinc-700 font-bold text-xs flex items-center gap-1 shadow-2xs" title="Quay lại trang chủ">
            <Home className="w-4 h-4" />
          </Link>
          <div className="flex items-center gap-1 bg-zinc-200/70 p-0.5 rounded-xl">
            <button type="button" onClick={() => setMobilePane('editor')} className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${mobilePane === 'editor' ? 'bg-white text-zinc-900 shadow-2xs' : 'text-zinc-600'}`}>Soạn thảo</button>
            <button type="button" onClick={() => setMobilePane('preview')} className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${mobilePane === 'preview' ? 'bg-white text-zinc-900 shadow-2xs' : 'text-zinc-600'}`}>PDF</button>
          </div>
          <div className="flex items-center gap-1">
            <button type="button" onClick={() => setIsExtractedDrawerOpen(true)} className="p-2 rounded-xl bg-white border border-zinc-200 text-zinc-700 shadow-2xs" title="Nội dung trích xuất"><Layers className="w-4 h-4" /></button>
            <button type="button" onClick={() => setIsSettingsDrawerOpen(true)} className="p-2 rounded-xl bg-white border border-zinc-200 text-zinc-700 shadow-2xs" title="Cài đặt dàn trang"><Sliders className="w-4 h-4" /></button>
          </div>
        </div>

        <div className="hidden sm:flex flex-1 min-h-0 h-full w-full overflow-hidden">
          <ResizableSplitLayout className="h-full" leftContent={leftEditorContent} rightContent={rightPreviewContent} defaultSplit={50} minPercent={28} maxPercent={72} />
        </div>

        <div className="block sm:hidden flex-1 min-h-0 overflow-y-auto">
          {mobilePane === 'editor' ? leftEditorContent : rightPreviewContent}
        </div>
      </div>

      <ExtractedContentDrawer isOpen={isExtractedDrawerOpen} onClose={() => setIsExtractedDrawerOpen(false)} paper={formData} />
      <LayoutSettingsDrawer isOpen={isSettingsDrawerOpen} onClose={() => setIsSettingsDrawerOpen(false)} settings={formData.layoutSettings || DEFAULT_LAYOUT_SETTINGS} journalId={formData.metadata.journalId || currentJournal} onApplySettings={handleApplyLayoutSettings} isCompiling={isCompilingPdf} />
    </div>
  );
};
