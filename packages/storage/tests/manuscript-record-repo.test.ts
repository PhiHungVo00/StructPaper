import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Dexie from 'dexie';
import type { Manuscript } from '@structpaper/doc-model';
import { StructPaperDatabase } from '../src/db/structpaper-db';
import { IndexedDbManuscriptRepo } from '../src/repositories/indexeddb-manuscript-repo';
import type { StoredProfile, StoredProfileIndex } from '../src/db/types';

function createMockManuscript(
  id = 'doc_01HX9J00000000000000000001',
  title = 'Nghiên cứu về Dexie v2',
  journalId = 'vnuhcm-std'
): Manuscript {
  return {
    schemaVersion: 2,
    id,
    lang: 'vi',
    journalId,
    articleType: 'Research Article',
    meta: {
      title: [{ t: 'text', v: title }],
      authors: [
        {
          id: 'auth_1',
          name: 'Trần Văn B',
          affiliationIds: ['aff_1'],
          email: 'tvb@vnuhcm.edu.vn',
          isCorresponding: true,
        },
      ],
      affiliations: [
        {
          id: 'aff_1',
          institution: 'Đại học Khoa học Tự nhiên TP.HCM',
        },
      ],
      abstract: [
        [{ t: 'text', v: 'Tóm tắt bài báo nghiên cứu lưu trữ offline.' }],
      ],
      keywords: ['Dexie', 'Storage', 'ManuscriptRecord'],
    },
    body: [
      {
        id: 'sec_1',
        level: 1,
        title: [{ t: 'text', v: '1. Đặt vấn đề' }],
        blocks: [
          {
            type: 'paragraph',
            id: 'p_1',
            content: [{ t: 'text', v: 'Nội dung đoạn văn...' }],
          },
        ],
        children: [],
      },
    ],
    back: [],
    references: [],
    assets: {},
  };
}

describe('ManuscriptRecord & Dexie v2 Storage (PDF Spec 3.6, 5.1d, 9.2)', () => {
  let db: StructPaperDatabase;
  let repo: IndexedDbManuscriptRepo;

  beforeEach(async () => {
    const dbName = `test_record_db_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    db = new StructPaperDatabase(dbName);
    repo = new IndexedDbManuscriptRepo(db);
    await db.open();
  });

  afterEach(async () => {
    if (db.isOpen()) {
      await db.delete();
    }
  });

  describe('ManuscriptRecord Repository Operations', () => {
    it('saves manuscript and returns complete ManuscriptRecord with default info', async () => {
      const doc = createMockManuscript('doc_rec_1', 'Bài báo thử nghiệm 1');
      await repo.save(doc);

      const record = await repo.getRecord('doc_rec_1');
      expect(record).not.toBeNull();
      expect(record?.doc.id).toBe('doc_rec_1');
      expect(record?.revision).toBe(1);

      // Verify info defaults
      expect(record?.info.id).toBe('doc_rec_1');
      expect(record?.info.displayName).toBe('Bài báo thử nghiệm 1');
      expect(record?.info.workflowStatus).toBe('draft');
      expect(record?.info.pinned).toBe(false);
      expect(record?.info.archived).toBe(false);
      expect(record?.info.tags).toEqual([]);
      expect(record?.info.createdAt).toBeDefined();
      expect(record?.info.updatedAt).toBeDefined();
    });

    it('saves manuscript with explicit custom ManuscriptInfo', async () => {
      const doc = createMockManuscript('doc_rec_2', 'Bài báo có cấu hình info');
      await repo.save(doc, {
        displayName: 'Tên hiển thị tùy chỉnh',
        workflowStatus: 'in-review',
        pinned: true,
        tags: ['AI', 'VNUHCM'],
        note: 'Ghi chú biên tập',
        color: '#00558F',
        submissionId: 'SUB-2026-001',
      });

      const record = await repo.getRecord('doc_rec_2');
      expect(record).not.toBeNull();
      expect(record?.info.displayName).toBe('Tên hiển thị tùy chỉnh');
      expect(record?.info.workflowStatus).toBe('in-review');
      expect(record?.info.pinned).toBe(true);
      expect(record?.info.tags).toEqual(['AI', 'VNUHCM']);
      expect(record?.info.note).toBe('Ghi chú biên tập');
      expect(record?.info.color).toBe('#00558F');
      expect(record?.info.submissionId).toBe('SUB-2026-001');
    });

    it('updateInfo modifies metadata WITHOUT bumping doc.rev or adding revision (Spec 3.6)', async () => {
      const doc = createMockManuscript('doc_rec_3', 'Bài kiểm tra updateInfo');
      await repo.save(doc);

      const initialRecord = await repo.getRecord('doc_rec_3');
      const initialRev = initialRecord?.revision;
      expect(initialRev).toBe(1);

      const revsBefore = await repo.listRevisions('doc_rec_3');
      expect(revsBefore.length).toBe(1);

      // Update info only
      await repo.updateInfo('doc_rec_3', {
        displayName: 'Tên mới sau khi cập nhật',
        workflowStatus: 'ready',
        pinned: true,
        note: 'Đã hoàn tất hiệu đính',
        tags: ['Final', 'Approved'],
      });

      // Verify info fields updated
      const updatedRecord = await repo.getRecord('doc_rec_3');
      expect(updatedRecord?.info.displayName).toBe('Tên mới sau khi cập nhật');
      expect(updatedRecord?.info.workflowStatus).toBe('ready');
      expect(updatedRecord?.info.pinned).toBe(true);
      expect(updatedRecord?.info.note).toBe('Đã hoàn tất hiệu đính');
      expect(updatedRecord?.info.tags).toEqual(['Final', 'Approved']);

      // CRITICAL SPEC CHECK: rev is NOT bumped and revisions table NOT modified
      expect(updatedRecord?.revision).toBe(1);
      const revsAfter = await repo.listRevisions('doc_rec_3');
      expect(revsAfter.length).toBe(1);
    });

    it('listRecords returns records sorted with pinned items first, then by updatedAt descending', async () => {
      const docA = createMockManuscript('doc_A', 'Bài A');
      (docA as any).updatedAt = '2026-11-01T10:00:00.000Z';
      await repo.save(docA, { pinned: false });

      const docB = createMockManuscript('doc_B', 'Bài B');
      (docB as any).updatedAt = '2026-11-05T10:00:00.000Z';
      await repo.save(docB, { pinned: false });

      const docC = createMockManuscript('doc_C', 'Bài C');
      (docC as any).updatedAt = '2026-11-02T10:00:00.000Z';
      await repo.save(docC, { pinned: true });

      const docD = createMockManuscript('doc_D', 'Bài D');
      (docD as any).updatedAt = '2026-11-04T10:00:00.000Z';
      await repo.save(docD, { pinned: true });

      const records = await repo.listRecords();
      expect(records.length).toBe(4);

      // Pinned items first, sorted by updatedAt desc: doc_D (Nov 4) then doc_C (Nov 2)
      // Followed by unpinned items, sorted by updatedAt desc: doc_B (Nov 5) then doc_A (Nov 1)
      expect(records.map((r) => r.info.id)).toEqual(['doc_D', 'doc_C', 'doc_B', 'doc_A']);
      expect(records[0].info.pinned).toBe(true);
      expect(records[1].info.pinned).toBe(true);
      expect(records[2].info.pinned).toBe(false);
      expect(records[3].info.pinned).toBe(false);
    });
  });

  describe('Dexie v2 Schema & Tables (profiles and profileIndex)', () => {
    it('defines profiles and profileIndex tables', () => {
      expect(db.profiles).toBeDefined();
      expect(db.profileIndex).toBeDefined();
    });

    it('supports CRUD operations on profiles table with compound key', async () => {
      const profile1: StoredProfile = {
        scopeType: 'journal',
        scopeId: 'vnuhcm-std',
        version: 1,
        state: 'published',
        data: { name: 'Khoa học Tự nhiên', color: '#00558F' },
        fetchedAt: '2026-11-05T00:00:00.000Z',
      };

      const profile2: StoredProfile = {
        scopeType: 'journal',
        scopeId: 'vnuhcm-std',
        version: 2,
        state: 'published',
        data: { name: 'Khoa học Tự nhiên v2', color: '#00558F' },
        fetchedAt: '2026-11-05T12:00:00.000Z',
      };

      await db.profiles.bulkPut([profile1, profile2]);

      // Get by compound key [scopeType, scopeId, version]
      const fetched = await db.profiles.get(['journal', 'vnuhcm-std', 2]);
      expect(fetched).toBeDefined();
      expect((fetched?.data as any)?.name).toBe('Khoa học Tự nhiên v2');

      // Query by scopeId index
      const stdProfiles = await db.profiles.where('scopeId').equals('vnuhcm-std').toArray();
      expect(stdProfiles.length).toBe(2);
    });

    it('supports CRUD operations on profileIndex table with compound key', async () => {
      const indexEntry: StoredProfileIndex = {
        scopeType: 'journal',
        scopeId: 'vnuhcm-std',
        checkedAt: '2026-11-05T14:00:00.000Z',
        latestVersion: 2,
        availableVersions: [1, 2],
      };

      await db.profileIndex.put(indexEntry);

      const fetched = await db.profileIndex.get(['journal', 'vnuhcm-std']);
      expect(fetched).toBeDefined();
      expect(fetched?.latestVersion).toBe(2);
      expect(fetched?.availableVersions).toEqual([1, 2]);
    });

    it('migrates v1 schema to v2 populating default ManuscriptInfo fields on existing records', async () => {
      const migrationDbName = `test_migration_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

      // 1. Create a DB with version 1 only
      const v1Db = new Dexie(migrationDbName);
      v1Db.version(1).stores({
        manuscripts:
          'id, [journalId+updatedAt], status, syncState, rev, schemaVersion, title, updatedAt',
        revisions: 'id, [manuscriptId+rev], manuscriptId, rev, createdAt',
      });
      await v1Db.open();

      // Put legacy record without displayName, workflowStatus, pinned, archived, tags
      await v1Db.table('manuscripts').put({
        id: 'legacy_doc_1',
        journalId: 'vnuhcm-std',
        title: 'Legacy Title V1',
        status: 'draft',
        syncState: 'synced',
        rev: 1,
        schemaVersion: 1,
        updatedAt: '2026-11-01T00:00:00.000Z',
        doc: createMockManuscript('legacy_doc_1', 'Legacy Title V1'),
      });
      await v1Db.close();

      // 2. Open with StructPaperDatabase (v2 with upgrade)
      const v2Db = new StructPaperDatabase(migrationDbName);
      await v2Db.open();

      const upgraded = await v2Db.manuscripts.get('legacy_doc_1');
      expect(upgraded).toBeDefined();
      expect(upgraded?.displayName).toBe('Legacy Title V1');
      expect(upgraded?.workflowStatus).toBe('draft');
      expect(upgraded?.pinned).toBe(false);
      expect(upgraded?.archived).toBe(false);
      expect(upgraded?.tags).toEqual([]);
      expect(upgraded?.createdAt).toBe('2026-11-01T00:00:00.000Z');

      await v2Db.delete();
    });
  });
});
