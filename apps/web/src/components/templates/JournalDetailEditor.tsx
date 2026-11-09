'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, RefreshCw, Save, Sliders, Eye } from 'lucide-react';
import { JournalProfile } from '@structpaper/journal-profiles';
import {
  ManagedJournalProfile,
  JournalStatus,
} from '@/lib/templates/journal-storage';
import { toast } from '@/components/DynamicIslandToast';
import { useManagedJournals } from '@/hooks';
import { JournalEditorDock } from './JournalEditorDock';
import { JournalEditorTopBar } from './JournalEditorTopBar';
import {
  JournalEditorTabNav,
  JournalEditorTabKey,
} from './JournalEditorTabNav';
import { JournalGeneralTab } from './tabs/JournalGeneralTab';
import { JournalFrontMatterTab } from './tabs/JournalFrontMatterTab';
import { JournalArticleTypesTab } from './tabs/JournalArticleTypesTab';
import { JournalLayoutTab } from './tabs/JournalLayoutTab';
import { ResizableSplitLayout } from '@/components/editor/ResizableSplitLayout';
import { LivePreviewPane } from '@/components/editor/LivePreviewPane';
import { generateSamplePaperForJournal } from '@/lib/templates/sample-template-paper';
import { useEditorCompilation } from '@/components/editor/hooks';
import { CompletePaper } from '@/types/paper';

interface JournalDetailEditorProps {
  initialManaged: ManagedJournalProfile;
  isNew?: boolean;
}

function getPrecompiledPdfForJournal(id: string): string | null {
  const code = (id || '').toLowerCase();
  if (code === 'std' || code === 'vnuhcm-std') return '/sample-pdfs/STD.pdf';
  if (code === 'hs' || code === 'vnuhcm-hs') return '/sample-pdfs/HS.pdf';
  if (code === 'arns' || code === 'vnuhcm-arns') return '/sample-pdfs/ARNS.pdf';
  if (code === 'ebl' || code === 'vnuhcm-ebl') return '/sample-pdfs/EBL.pdf';
  if (code === 'ees' || code === 'vnuhcm-ees') return '/sample-pdfs/EES.pdf';
  if (code === 'et' || code === 'vnuhcm-et') return '/sample-pdfs/ET.pdf';
  if (code === 'ssh' || code === 'vnuhcm-ssh') return '/sample-pdfs/SSH.pdf';
  return null;
}

export const JournalDetailEditor: React.FC<JournalDetailEditorProps> = ({
  initialManaged,
  isNew = false,
}) => {
  const router = useRouter();
  const { saveProfile, resetProfile } = useManagedJournals();

  const [managed, setManaged] = useState<ManagedJournalProfile>(initialManaged);
  const [activeTab, setActiveTab] = useState<JournalEditorTabKey>('general');
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Dynamic sample paper based on active in-memory profile
  const samplePaper = useMemo(
    () => generateSamplePaperForJournal(managed.profile),
    [managed.profile]
  );
  const [livePaper, setLivePaper] = useState<CompletePaper>(samplePaper);

  const {
    compiledPdfUrl,
    setCompiledPdfUrl,
    isCompilingPdf,
    compileStats,
    compileErrorInfo,
    setCompileErrorInfo,
    compileLatexToPdf,
  } = useEditorCompilation({
    paper: livePaper,
    formData: livePaper,
    onUpdatePaper: setLivePaper,
  });

  // Preload official precompiled PDF if available for instant display on mount
  useEffect(() => {
    const precompiled = getPrecompiledPdfForJournal(managed.id);
    if (precompiled && !compiledPdfUrl) {
      setCompiledPdfUrl(precompiled);
    }
  }, [managed.id, compiledPdfUrl, setCompiledPdfUrl]);

  const handleUpdateProfile = useCallback((patch: Partial<JournalProfile>) => {
    setManaged((prev) => ({
      ...prev,
      profile: {
        ...prev.profile,
        ...patch,
      },
    }));
    setIsDirty(true);
  }, []);

  const handleToggleStatus = useCallback(() => {
    const nextStatus: JournalStatus =
      managed.status === 'published' ? 'draft' : 'published';
    setManaged((prev) => ({ ...prev, status: nextStatus }));
    setIsDirty(true);
    toast.info(
      'Trạng thái mẫu',
      nextStatus === 'published'
        ? 'Chuyển sang: Đang phát hành (published)'
        : 'Chuyển sang: Bản nháp (draft)'
    );
  }, [managed.status]);

  const handleSave = useCallback(() => {
    setIsSaving(true);
    try {
      saveProfile(managed);
      setIsDirty(false);
      setSaveSuccess(true);
      toast.success(
        'Đã lưu thành công',
        `Đã lưu cấu hình hồ sơ tạp chí "${managed.profile.names?.short || managed.id}"`
      );
      setTimeout(() => setSaveSuccess(false), 2500);
      if (isNew) {
        router.push(`/templates/journal/${managed.id}`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi khi lưu dữ liệu';
      toast.error('Lưu thất bại', msg);
    } finally {
      setIsSaving(false);
    }
  }, [managed, isNew, router, saveProfile]);

  const handleReset = useCallback(() => {
    if (typeof window !== 'undefined') {
      const confirmed = window.confirm(
        'Bạn có chắc chắn muốn khôi phục về cấu hình Base mặc định của tạp chí này?'
      );
      if (confirmed) {
        try {
          const reset = resetProfile(managed.id);
          setManaged(reset);
          setIsDirty(false);
          const resetSample = generateSamplePaperForJournal(reset.profile);
          setLivePaper(resetSample);
          compileLatexToPdf(resetSample);
          toast.info('Đã khôi phục', 'Đã đặt lại thông số theo chuẩn gốc của hệ thống.');
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : 'Không thể khôi phục';
          toast.error('Lỗi', msg);
        }
      }
    }
  }, [managed.id, resetProfile, compileLatexToPdf]);

  const handleRecompile = useCallback(async () => {
    const updated = generateSamplePaperForJournal(managed.profile);
    setLivePaper(updated);
    await compileLatexToPdf(updated);
  }, [managed.profile, compileLatexToPdf]);

  // Left Side: Editor Form Tabs
  const leftEditorContent = (
    <div className="h-full flex flex-col min-h-0 min-w-0 w-full overflow-hidden space-y-3">
      <div className="flex-shrink-0">
        <JournalEditorTabNav
          activeTab={activeTab}
          onTabChange={setActiveTab}
          articleTypesCount={managed.profile.articleTypes?.length}
        />
      </div>

      <div className="flex-1 min-h-0 min-w-0 h-full w-full overflow-y-auto pr-1">
        {activeTab === 'general' && (
          <JournalGeneralTab
            profile={managed.profile}
            onChange={handleUpdateProfile}
            isNew={isNew}
          />
        )}
        {activeTab === 'frontmatter' && (
          <JournalFrontMatterTab
            profile={managed.profile}
            onChange={handleUpdateProfile}
          />
        )}
        {activeTab === 'article-types' && (
          <JournalArticleTypesTab
            profile={managed.profile}
            onChange={handleUpdateProfile}
          />
        )}
        {activeTab === 'layout' && (
          <JournalLayoutTab
            profile={managed.profile}
            onChange={handleUpdateProfile}
          />
        )}
      </div>
    </div>
  );

  // Right Side: Live XeLaTeX Preview
  const rightPreviewContent = (
    <div className="h-full flex flex-col min-h-0">
      <LivePreviewPane
        paper={livePaper}
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
    <div className="h-full w-full flex flex-row p-2 sm:p-3 min-h-0 gap-2 sm:gap-3 overflow-hidden bg-[#F8F9FA]">
      {/* Dedicated Left Toolbar Dock */}
      <JournalEditorDock
        status={managed.status}
        onToggleStatus={handleToggleStatus}
        onReset={handleReset}
        onRecompile={handleRecompile}
        isCompiling={isCompilingPdf}
        onSave={handleSave}
        isSaving={isSaving}
        isDirty={isDirty}
        saveSuccess={saveSuccess}
      />

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative z-10 gap-2 sm:gap-3">
        {/* Mobile Header Toolbar (Only visible on phones) */}
        <div className="flex sm:hidden flex-shrink-0 items-center justify-between p-1.5 bg-white/80 backdrop-blur-md rounded-2xl border border-zinc-200">
          <button
            type="button"
            onClick={() => router.back()}
            aria-label="Quay lại danh mục tạp chí"
            className="p-2 rounded-xl bg-white border border-zinc-200 text-zinc-700 font-bold text-xs flex items-center gap-1 shadow-2xs"
            title="Quay lại danh mục tạp chí"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleRecompile}
              disabled={isCompilingPdf}
              aria-label="Biên dịch lại xem thử (di động)"
              className="p-2 rounded-xl bg-white border border-zinc-200 text-zinc-700 shadow-2xs"
              title="Biên dịch lại xem thử"
            >
              <RefreshCw
                className={`w-4 h-4 ${isCompilingPdf ? 'animate-spin text-[#78C841]' : ''}`}
              />
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              aria-label="Lưu thay đổi (di động)"
              className="p-2 rounded-xl bg-[#78C841] text-zinc-950 font-bold shadow-2xs"
              title="Lưu thay đổi"
            >
              <Save className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Clean Header Bar: Journal Name + Badge + Straight Subtitle */}
        <JournalEditorTopBar
          profile={managed.profile}
          status={managed.status}
          isNew={isNew}
        />

        {/* Split View: Left Forms & Right Live XeLaTeX Preview */}
        <div className="flex-1 min-h-0 h-full w-full overflow-hidden">
          <ResizableSplitLayout
            className="h-full"
            storageKey="structpaper_template_split_v2"
            leftContent={leftEditorContent}
            rightContent={rightPreviewContent}
            defaultSplit={50}
            minPercent={28}
            maxPercent={72}
          />
        </div>
      </div>
    </div>
  );
};
