'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import type { ManuscriptRecord, ManuscriptInfo, WorkflowStatus } from '@structpaper/doc-model';
import {
  defaultDatabase,
  IndexedDbManuscriptRepo,
  IndexedDbAssetRepo,
  exportBackup,
} from '@structpaper/storage';
import { normalizeJournalId } from '@structpaper/journal-profiles';
import { toast } from '@/components/DynamicIslandToast';
import {
  RecentPapersRow,
  PaperFiltersBar,
  PaperCard,
  PaperTable,
  PaperQuickEditModal,
  EmptyPapersState,
  type FilterWorkflowStatus,
  type FilterJournal,
  type SortOption,
  type ViewMode,
  getManuscriptTitle,
  getManuscriptAuthors,
} from '@/components/papers';
import { SAMPLE_VNUHCM_RECORDS } from '@/lib/authoring/sample-records-seeder';
import { getAuthoringPapers } from '@/lib/authoring/paper-storage';

export const PaperHubView: React.FC = () => {
  const router = useRouter();

  // Storage Repositories
  const repo = useMemo(() => new IndexedDbManuscriptRepo(defaultDatabase), []);
  const assetRepo = useMemo(() => new IndexedDbAssetRepo(defaultDatabase), []);

  // Papers State
  const [records, setRecords] = useState<ManuscriptRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filter & View State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterWorkflowStatus>('all');
  const [journalFilter, setJournalFilter] = useState<FilterJournal>('all');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  // Menu & Modal State
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [editingPaper, setEditingPaper] = useState<ManuscriptRecord | null>(null);

  // Load records from IndexedDb, seeding samples if empty
  const loadRecords = async () => {
    try {
      let loaded = await repo.listRecords();

      // Seed sample records if storage is currently empty
      if (loaded.length === 0) {
        for (const sample of SAMPLE_VNUHCM_RECORDS) {
          await repo.save(sample.doc, sample.info);
        }

        // Also import any legacy papers from localStorage authoring papers
        const legacyPapers = getAuthoringPapers();
        const legacyStatusMap: Record<string, WorkflowStatus> = {
          ready: 'ready',
          review: 'in-review',
          'in-review': 'in-review',
          proofing: 'proofing',
          published: 'published',
          draft: 'draft',
        };
        for (const lp of legacyPapers) {
          if (!SAMPLE_VNUHCM_RECORDS.some((s) => s.info.id === lp.id)) {
            await repo.save(
              {
                schemaVersion: 2,
                id: lp.id,
                journalId: lp.metadata?.journalId || 'std',
                articleType: lp.metadata?.articleType || 'Research Article',
                meta: {
                  title: [{ t: 'text', v: lp.metadata?.title || 'Bài báo' }],
                  authors: (lp.metadata?.authors || []).map((a, i) => ({
                    id: a.id || `auth_${i + 1}`,
                    name: a.name,
                    affiliationIds: ['aff_1'],
                    isCorresponding: a.isCorresponding,
                    email: a.email,
                  })),
                  affiliations: [
                    { id: 'aff_1', institution: 'Đại học Quốc gia TP.HCM' },
                  ],
                  abstract: [
                    [{ t: 'text', v: lp.metadata?.abstract || '' }],
                  ],
                  keywords: lp.metadata?.keywords || [],
                  dates: lp.metadata?.dates || {},
                },
                body: [],
                back: [],
                references: [],
                assets: {},
              } as any,
              {
                id: lp.id,
                displayName: lp.metadata?.title || 'Bài báo nghiên cứu',
                submissionId: lp.metadata?.journalAbbv || 'DOC_01',
                tags: lp.metadata?.keywords || ['Khởi tạo'],
                workflowStatus: (lp.status && legacyStatusMap[lp.status]) || 'draft',
                pinned: false,
                archived: false,
                createdAt: lp.createdAt || new Date().toISOString(),
                updatedAt: lp.updatedAt || new Date().toISOString(),
              }
            );
          }
        }

        loaded = await repo.listRecords();
      }

      setRecords(loaded);
    } catch (err) {
      console.error('Failed to load manuscript records:', err);
      // Fallback in-memory sample records
      setRecords(SAMPLE_VNUHCM_RECORDS);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRecords();
  }, [repo]);

  // Close menus on click outside
  useEffect(() => {
    const handleOutsideClick = () => setActiveMenuId(null);
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

  // Handlers
  const handleOpenEditor = (id: string) => {
    router.push(`/papers/editor?id=${encodeURIComponent(id)}`);
  };

  const handleTogglePin = async (id: string, currentPinned: boolean) => {
    try {
      await repo.updateInfo(id, { pinned: !currentPinned });
      toast.success(
        !currentPinned ? 'Đã ghim bài báo lên đầu' : 'Đã bỏ ghim bài báo',
        'Danh sách đã được cập nhật thứ tự ưu tiên.'
      );
      await loadRecords();
    } catch (err: any) {
      toast.error('Lỗi ghim bài báo', err?.message);
    }
  };

  const handleSaveQuickEdit = async (
    id: string,
    patch: Partial<ManuscriptInfo>
  ) => {
    await repo.updateInfo(id, patch);
    toast.success(
      'Cập nhật thành công',
      'Thông tin bài báo đã được cập nhật trực tiếp vào cơ sở dữ liệu.'
    );
    await loadRecords();
  };

  const handleDuplicate = async (paper: ManuscriptRecord) => {
    try {
      const newId = `paper_${Date.now()}`;
      const newDoc = {
        ...paper.doc,
        id: newId,
        meta: {
          ...paper.doc.meta,
          title: [{ t: 'text', v: `${getManuscriptTitle(paper)} (Bản sao)` }],
        },
      };

      const newInfo: Partial<ManuscriptInfo> = {
        ...paper.info,
        id: newId,
        displayName: `${paper.info.displayName || getManuscriptTitle(paper)} (Bản sao)`,
        submissionId: paper.info.submissionId
          ? `${paper.info.submissionId}_copy`
          : undefined,
        pinned: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await repo.save(newDoc as any, newInfo);
      toast.success('Đã nhân bản bài báo', `Bản sao "${newInfo.displayName}" đã sẵn sàng.`);
      await loadRecords();
    } catch (err: any) {
      toast.error('Lỗi nhân bản bài báo', err?.message);
    }
  };

  const handleExportBackup = async (paper: ManuscriptRecord) => {
    try {
      const blob = await exportBackup(paper.doc, assetRepo);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const safeTitle = (paper.info.submissionId || paper.info.displayName || 'paper')
        .replace(/[^a-zA-Z0-9_-]/g, '_')
        .slice(0, 30);
      link.download = `${safeTitle}.structpaper`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(
        'Đã xuất bản sao lưu!',
        `Gói tệp "${link.download}" đã được tải về máy.`
      );
    } catch (err: any) {
      toast.error('Lỗi xuất bản sao lưu', err?.message);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await repo.delete(id);
      toast.info('Đã xóa bài báo', 'Bản thảo đã được gỡ bỏ khỏi kho lưu trữ.');
      await loadRecords();
    } catch (err: any) {
      toast.error('Lỗi xóa bài báo', err?.message);
    }
  };

  // Status Counts
  const countsByStatus = useMemo(() => {
    const counts: Partial<Record<FilterWorkflowStatus, number>> = {
      all: records.length,
      draft: 0,
      'in-review': 0,
      proofing: 0,
      ready: 0,
      published: 0,
    };
    for (const r of records) {
      const st = r.info.workflowStatus;
      if (st && typeof counts[st] === 'number') {
        counts[st] = (counts[st] || 0) + 1;
      }
    }
    return counts;
  }, [records]);

  // Filtered & Sorted Papers
  const filteredPapers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return records
      .filter((r) => {
        // Search query
        if (query) {
          const title = getManuscriptTitle(r).toLowerCase();
          const submissionId = (r.info.submissionId || '').toLowerCase();
          const authors = getManuscriptAuthors(r).toLowerCase();
          const tags = (r.info.tags || []).join(' ').toLowerCase();

          const matchesQuery =
            title.includes(query) ||
            submissionId.includes(query) ||
            authors.includes(query) ||
            tags.includes(query);

          if (!matchesQuery) return false;
        }

        // Status Filter
        if (statusFilter !== 'all' && r.info.workflowStatus !== statusFilter) {
          return false;
        }

        // Journal Filter
        if (journalFilter !== 'all') {
          const normCurrent = normalizeJournalId(r.doc.journalId);
          const normFilter = normalizeJournalId(journalFilter);
          if (normCurrent !== normFilter) return false;
        }

        return true;
      })
      .sort((a, b) => {
        // Always place pinned items at the top
        const aPinned = Boolean(a.info.pinned);
        const bPinned = Boolean(b.info.pinned);
        if (aPinned !== bPinned) return aPinned ? -1 : 1;

        if (sortBy === 'title') {
          return getManuscriptTitle(a).localeCompare(getManuscriptTitle(b));
        }
        if (sortBy === 'status') {
          return (a.info.workflowStatus || '').localeCompare(
            b.info.workflowStatus || ''
          );
        }
        // Default newest
        const timeA = new Date(a.info.updatedAt || a.info.createdAt).getTime();
        const timeB = new Date(b.info.updatedAt || b.info.createdAt).getTime();
        return timeB - timeA;
      });
  }, [records, searchQuery, statusFilter, journalFilter, sortBy]);

  return (
    <div className="max-w-7xl mx-auto space-y-7 pb-16 px-4 sm:px-6">
      {/* 1. Header Banner */}
      <div className="pt-2">
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
          <span>Quản lý Bài báo Khoa học</span>
          <span className="text-xs px-2.5 py-0.5 rounded-full font-extrabold bg-emerald-500/15 text-emerald-800">
            VNUHCM Academic Hub
          </span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Theo dõi tiến độ, phân loại bản thảo theo quy chuẩn 7 tạp chí ĐHQG-HCM và xuất bản sao lưu an toàn.
        </p>
      </div>

      {/* 2. Top Horizontal Recent Papers Row */}
      <RecentPapersRow
        papers={records}
        onOpenPaper={handleOpenEditor}
        onCreateNew={() => router.push('/templates')}
      />

      {/* 3. Filter Bar */}
      <PaperFiltersBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        journalFilter={journalFilter}
        onJournalFilterChange={setJournalFilter}
        sortBy={sortBy}
        onSortChange={setSortBy}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        countsByStatus={countsByStatus}
        onCreateFromTemplate={() => router.push('/templates')}
      />

      {/* 4. Papers List (Grid vs Table vs Empty) */}
      {filteredPapers.length === 0 ? (
        <EmptyPapersState
          isFiltered={Boolean(searchQuery || statusFilter !== 'all' || journalFilter !== 'all')}
          onResetFilters={() => {
            setSearchQuery('');
            setStatusFilter('all');
            setJournalFilter('all');
          }}
          onCreateFromTemplate={() => router.push('/templates')}
        />
      ) : viewMode === 'grid' ? (
        <div
          data-testid="papers-grid"
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
        >
          {filteredPapers.map((paper) => (
            <PaperCard
              key={paper.info.id}
              paper={paper}
              isMenuOpen={activeMenuId === paper.info.id}
              onToggleMenu={(e) => {
                e.stopPropagation();
                setActiveMenuId(activeMenuId === paper.info.id ? null : paper.info.id);
              }}
              onCloseMenu={() => setActiveMenuId(null)}
              onOpenEditor={handleOpenEditor}
              onQuickEdit={(p) => setEditingPaper(p)}
              onTogglePin={handleTogglePin}
              onDuplicate={handleDuplicate}
              onExportBackup={handleExportBackup}
              onDelete={handleDelete}
            />
          ))}
        </div>
      ) : (
        <PaperTable
          papers={filteredPapers}
          activeMenuId={activeMenuId}
          onToggleMenu={(id, e) => {
            e.stopPropagation();
            setActiveMenuId(activeMenuId === id ? null : id);
          }}
          onCloseMenu={() => setActiveMenuId(null)}
          onOpenEditor={handleOpenEditor}
          onQuickEdit={(p) => setEditingPaper(p)}
          onTogglePin={handleTogglePin}
          onDuplicate={handleDuplicate}
          onExportBackup={handleExportBackup}
          onDelete={handleDelete}
        />
      )}

      {/* 5. Quick Edit Modal */}
      {editingPaper && (
        <PaperQuickEditModal
          paper={editingPaper}
          isOpen={Boolean(editingPaper)}
          onClose={() => setEditingPaper(null)}
          onSave={handleSaveQuickEdit}
        />
      )}
    </div>
  );
};

export default PaperHubView;
