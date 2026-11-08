import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  defaultDatabase,
  IndexedDbManuscriptRepo,
  IndexedDbAssetRepo,
  exportBackup,
} from '@structpaper/storage';
import type {
  ManuscriptRecord,
  ManuscriptInfo,
  WorkflowStatus,
} from '@structpaper/doc-model';
import { adaptV2toV1 } from '@structpaper/doc-model';
import { normalizeJournalId } from '@structpaper/journal-profiles';
import { ALL_SAMPLE_PAPERS } from '@/lib/sample-papers';
import { SAMPLE_VNUHCM_RECORDS } from '@/lib/authoring/sample-records-seeder';
import { getAuthoringPapers } from '@/lib/authoring/paper-storage';
import { usePaper } from '@/context/PaperContext';
import { toast } from '@/components/DynamicIslandToast';
import {
  FilterWorkflowStatus,
  FilterJournal,
  SortOption,
  ViewMode,
  getManuscriptTitle,
  getManuscriptAuthors,
} from '@/components/papers';

export function usePapersHub() {
  const router = useRouter();
  const { setPaper, setCurrentJournal } = usePaper();

  // Storage Repositories
  const repo = useMemo(() => new IndexedDbManuscriptRepo(defaultDatabase), []);
  const assetRepo = useMemo(() => new IndexedDbAssetRepo(defaultDatabase), []);

  // Papers State
  const [records, setRecords] = useState<ManuscriptRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Filter & View State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterWorkflowStatus>('all');
  const [journalFilter, setJournalFilter] = useState<FilterJournal>('all');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  // Menu & Modal State
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [editingPaper, setEditingPaper] = useState<ManuscriptRecord | null>(null);

  const isTestEnv = typeof process !== 'undefined' && process.env.NODE_ENV === 'test';

  const triggerFilterLoading = useCallback(() => {
    if (isTestEnv) return;
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 1500);
  }, [isTestEnv]);

  const handleSearchChange = useCallback((q: string) => {
    setSearchQuery(q);
    triggerFilterLoading();
  }, [triggerFilterLoading]);

  const handleStatusFilterChange = useCallback((st: FilterWorkflowStatus) => {
    setStatusFilter(st);
    triggerFilterLoading();
  }, [triggerFilterLoading]);

  const handleJournalFilterChange = useCallback((jf: FilterJournal) => {
    setJournalFilter(jf);
    triggerFilterLoading();
  }, [triggerFilterLoading]);

  const handleSortChange = useCallback((sb: SortOption) => {
    setSortBy(sb);
    triggerFilterLoading();
  }, [triggerFilterLoading]);

  // Load records from IndexedDb, seeding samples if empty
  const loadRecords = useCallback(async () => {
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
      setError(null);
    } catch (err: any) {
      console.error('Failed to load manuscript records:', err);
      setError(err instanceof Error ? err : new Error(String(err)));
      // Fallback in-memory sample records
      setRecords(SAMPLE_VNUHCM_RECORDS);
    } finally {
      if (!isTestEnv) {
        await new Promise((resolve) => setTimeout(resolve, 1500));
      }
      setIsLoading(false);
    }
  }, [repo, isTestEnv]);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  // Handlers
  const handleOpenEditor = useCallback((id: string) => {
    const record = records.find((r) => r.info.id === id);
    const sample = ALL_SAMPLE_PAPERS.find(
      (s) => s.paper.id === id || s.paper.metadata?.doi?.includes(id) || s.id === id
    );

    if (record) {
      try {
        const v1 = adaptV2toV1(record.doc as any);
        if (!v1.id) v1.id = record.info.id;
        if (record.info.displayName && v1.metadata && !v1.metadata.title) {
          v1.metadata.title = record.info.displayName;
        }
        setPaper(v1 as any);
        if (record.doc.journalId) {
          const norm = record.doc.journalId.toUpperCase().startsWith('VNUHCM-')
            ? record.doc.journalId
            : `VNUHCM-${record.doc.journalId.toUpperCase()}`;
          setCurrentJournal(norm);
        }
      } catch (err) {
        console.error('Failed to adapt v2 doc to v1:', err);
        if (sample) {
          setPaper(sample.paper);
          if (sample.journalId) {
            setCurrentJournal(sample.journalId);
          }
        }
      }
    } else if (sample) {
      setPaper(sample.paper);
      if (sample.journalId) {
        setCurrentJournal(sample.journalId);
      }
    }

    toast.success('Đã tải bài báo', 'Đang chuyển sang bộ soạn thảo StructPaper...');
    router.push('/editor');
  }, [records, setPaper, setCurrentJournal, router]);

  const handleTogglePin = useCallback(async (id: string, currentPinned: boolean) => {
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
  }, [repo, loadRecords]);

  const handleSaveQuickEdit = useCallback(async (
    id: string,
    patch: Partial<ManuscriptInfo>
  ) => {
    try {
      await repo.updateInfo(id, patch);
      toast.success(
        'Cập nhật thành công',
        'Thông tin bài báo đã được cập nhật trực tiếp vào cơ sở dữ liệu.'
      );
      await loadRecords();
    } catch (err: any) {
      toast.error('Lỗi cập nhật', err?.message);
    }
  }, [repo, loadRecords]);

  const handleDuplicate = useCallback(async (paper: ManuscriptRecord) => {
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
  }, [repo, loadRecords]);

  const handleExportBackup = useCallback(async (paper: ManuscriptRecord) => {
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
  }, [assetRepo]);

  const handleDelete = useCallback(async (id: string) => {
    try {
      await repo.delete(id);
      toast.info('Đã xóa bài báo', 'Bản thảo đã được gỡ bỏ khỏi kho lưu trữ.');
      await loadRecords();
    } catch (err: any) {
      toast.error('Lỗi xóa bài báo', err?.message);
    }
  }, [repo, loadRecords]);

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

  return {
    records,
    filteredPapers,
    isLoading,
    error,
    searchQuery,
    statusFilter,
    journalFilter,
    sortBy,
    viewMode,
    activeMenuId,
    editingPaper,
    countsByStatus,
    setSearchQuery: handleSearchChange,
    setStatusFilter: handleStatusFilterChange,
    setJournalFilter: handleJournalFilterChange,
    setSortBy: handleSortChange,
    setViewMode,
    setActiveMenuId,
    setEditingPaper,
    loadRecords,
    handleOpenEditor,
    handleTogglePin,
    handleSaveQuickEdit,
    handleDuplicate,
    handleExportBackup,
    handleDelete,
  };
}
