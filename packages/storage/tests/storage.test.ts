import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import type { Manuscript } from '@structpaper/doc-model';
import { StructPaperDatabase } from '../src/db/structpaper-db';
import { IndexedDbManuscriptRepo, extractTitle } from '../src/repositories/indexeddb-manuscript-repo';
import { IndexedDbAssetRepo } from '../src/repositories/indexeddb-asset-repo';
import { exportBackup, importBackup } from '../src/backup/zip-backup';

function createMockManuscript(id = 'doc_01HX9J00000000000000000001', title = 'Bài báo mẫu số 1'): Manuscript {
  return {
    schemaVersion: 2,
    id,
    lang: 'vi',
    journalId: 'vnuhcm-hs',
    articleType: 'Research Article',
    meta: {
      title: [{ t: 'text', v: title }],
      authors: [
        {
          id: 'auth_1',
          name: 'Nguyễn Văn A',
          affiliationIds: ['aff_1'],
          email: 'nva@vnuhcm.edu.vn',
          isCorresponding: true,
        },
      ],
      affiliations: [
        {
          id: 'aff_1',
          institution: 'Đại học Bách Khoa TP.HCM',
        },
      ],
      abstract: [
        [{ t: 'text', v: 'Tóm tắt bài báo nghiên cứu công nghệ khoa học.' }],
      ],
      keywords: ['AI', 'IndexedDB', 'Dexie'],
      dates: { received: '2026-11-04' },
    },
    body: [
      {
        id: 'sec_1',
        level: 1,
        title: [{ t: 'text', v: '1. Mở đầu' }],
        blocks: [
          {
            type: 'paragraph',
            id: 'p_1',
            content: [{ t: 'text', v: 'Nội dung đoạn mở đầu...' }],
          },
        ],
        children: [],
      },
    ],
    back: [],
    references: [],
    assets: {
      asset_img_1: {
        id: 'asset_img_1',
        sha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        mimeType: 'image/png',
        fileName: 'figure1.png',
        sizeBytes: 1024,
        width: 800,
        height: 600,
      },
    },
  };
}

describe('packages/storage - Dexie Storage & Repositories', () => {
  let db: StructPaperDatabase;
  let manuscriptRepo: IndexedDbManuscriptRepo;
  let assetRepo: IndexedDbAssetRepo;

  beforeEach(async () => {
    // Unique DB name per test run
    const dbName = `test_db_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    db = new StructPaperDatabase(dbName);
    manuscriptRepo = new IndexedDbManuscriptRepo(db);
    assetRepo = new IndexedDbAssetRepo(db);
    await db.open();
  });

  afterEach(async () => {
    if (db.isOpen()) {
      await db.delete();
    }
  });

  describe('StructPaperDatabase schema', () => {
    it('defines all 10 required tables', () => {
      expect(db.tables.map((t) => t.name).sort()).toEqual([
        'assetRefs',
        'assets',
        'compileCache',
        'ingestSources',
        'manuscripts',
        'outbox',
        'profileIndex',
        'profiles',
        'revisions',
        'settings',
      ]);
    });
  });

  describe('extractTitle helper', () => {
    it('extracts plain title from title inline array or string', () => {
      const doc = createMockManuscript('doc_1', 'Tiêu đề trích xuất');
      expect(extractTitle(doc)).toBe('Tiêu đề trích xuất');

      const docWithString = { ...doc, title: 'Tiêu đề trực tiếp' } as any;
      expect(extractTitle(docWithString)).toBe('Tiêu đề trực tiếp');

      const docEmpty = { ...doc, meta: { ...doc.meta, title: [] } };
      expect(extractTitle(docEmpty)).toBe('Untitled Manuscript');
    });
  });

  describe('IndexedDbManuscriptRepo', () => {
    it('saves manuscript and revision, links assetRefs, and retrieves by id', async () => {
      const doc = createMockManuscript('doc_1', 'Bài báo khoa học 1');
      await manuscriptRepo.save(doc);

      // Verify retrieval
      const loaded = await manuscriptRepo.getById('doc_1');
      expect(loaded).toBeDefined();
      expect(loaded?.id).toBe('doc_1');
      expect(loaded?.journalId).toBe('vnuhcm-hs');
      expect(extractTitle(loaded!)).toBe('Bài báo khoa học 1');

      // Verify revision was created
      const rev = await manuscriptRepo.getRevision('doc_1', 1);
      expect(rev).toBeDefined();
      expect(rev?.id).toBe('doc_1');

      const allRevs = await manuscriptRepo.listRevisions('doc_1');
      expect(allRevs.length).toBe(1);
      expect(allRevs[0].rev).toBe(1);

      // Verify assetRefs was populated
      const refs = await db.assetRefs.where('manuscriptId').equals('doc_1').toArray();
      expect(refs.length).toBe(1);
      expect(refs[0].hash).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
    });

    it('returns null for non-existent manuscript id', async () => {
      const result = await manuscriptRepo.getById('non_existent');
      expect(result).toBeNull();
    });

    it('listRecent returns summaries sorted by updatedAt descending', async () => {
      const doc1 = {
        ...createMockManuscript('doc_1', 'Bài 1'),
        updatedAt: '2026-11-01T10:00:00.000Z',
      } as any;
      const doc2 = {
        ...createMockManuscript('doc_2', 'Bài 2'),
        updatedAt: '2026-11-03T10:00:00.000Z',
      } as any;
      const doc3 = {
        ...createMockManuscript('doc_3', 'Bài 3'),
        updatedAt: '2026-11-02T10:00:00.000Z',
      } as any;

      await manuscriptRepo.save(doc1);
      await manuscriptRepo.save(doc2);
      await manuscriptRepo.save(doc3);

      const recent = await manuscriptRepo.listRecent();
      expect(recent.length).toBe(3);
      expect(recent[0].id).toBe('doc_2'); // Nov 3rd
      expect(recent[1].id).toBe('doc_3'); // Nov 2nd
      expect(recent[2].id).toBe('doc_1'); // Nov 1st

      expect(recent[0].title).toBe('Bài 2');
      expect(recent[0].journalId).toBe('vnuhcm-hs');

      // Test limit
      const limited = await manuscriptRepo.listRecent(2);
      expect(limited.length).toBe(2);
      expect(limited[0].id).toBe('doc_2');
      expect(limited[1].id).toBe('doc_3');
    });

    it('delete removes manuscript, revisions and assetRefs', async () => {
      const doc = createMockManuscript('doc_to_delete', 'Bài xóa');
      await manuscriptRepo.save(doc);

      expect(await manuscriptRepo.getById('doc_to_delete')).not.toBeNull();
      expect(await db.revisions.where('manuscriptId').equals('doc_to_delete').count()).toBe(1);
      expect(await db.assetRefs.where('manuscriptId').equals('doc_to_delete').count()).toBe(1);

      await manuscriptRepo.delete('doc_to_delete');

      expect(await manuscriptRepo.getById('doc_to_delete')).toBeNull();
      expect(await db.revisions.where('manuscriptId').equals('doc_to_delete').count()).toBe(0);
      expect(await db.assetRefs.where('manuscriptId').equals('doc_to_delete').count()).toBe(0);
    });
  });

  describe('IndexedDbAssetRepo', () => {
    it('saves and retrieves binary blob by SHA-256 hash', async () => {
      const hash = 'a591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146e';
      const binaryContent = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]); // PNG magic bytes
      const blob = new Blob([binaryContent], { type: 'image/png' });

      expect(await assetRepo.has(hash)).toBe(false);

      await assetRepo.save(hash, blob, {
        id: 'asset_1',
        sha256: hash,
        mimeType: 'image/png',
        width: 100,
        height: 100,
      });

      expect(await assetRepo.has(hash)).toBe(true);

      const retrieved = await assetRepo.getByHash(hash);
      expect(retrieved).not.toBeNull();
      expect(retrieved?.type).toBe('image/png');
      expect(retrieved?.size).toBe(binaryContent.length);

      const retrievedBuf = new Uint8Array(await retrieved!.arrayBuffer());
      expect(retrievedBuf).toEqual(binaryContent);

      // Test delete
      await assetRepo.delete(hash);
      expect(await assetRepo.has(hash)).toBe(false);
      expect(await assetRepo.getByHash(hash)).toBeNull();
    });
  });

  describe('ZIP Backup exportBackup & importBackup', () => {
    it('exports .structpaper archive and imports back with full fidelity', async () => {
      const doc = createMockManuscript('doc_backup_test', 'Bài kiểm tra sao lưu ZIP');
      const hash = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';

      const imageBytes = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]);
      const imageBlob = new Blob([imageBytes], { type: 'image/png' });

      // Save asset in repo
      await assetRepo.save(hash, imageBlob, doc.assets.asset_img_1);

      // Export to .structpaper
      const zipBlob = await exportBackup(doc, assetRepo);
      expect(zipBlob).toBeDefined();
      expect(zipBlob.size).toBeGreaterThan(0);

      // Verify ZIP header magic bytes (PK\x03\x04)
      const zipBytes = new Uint8Array(await zipBlob.arrayBuffer());
      expect(zipBytes[0]).toBe(0x50); // 'P'
      expect(zipBytes[1]).toBe(0x4b); // 'K'
      expect(zipBytes[2]).toBe(0x03);
      expect(zipBytes[3]).toBe(0x04);

      // Import back
      const imported = await importBackup(zipBlob);
      expect(imported.doc.id).toBe('doc_backup_test');
      expect(extractTitle(imported.doc)).toBe('Bài kiểm tra sao lưu ZIP');
      expect(imported.doc.journalId).toBe('vnuhcm-hs');

      // Verify imported assets
      expect(imported.assets.length).toBe(1);
      expect(imported.assets[0].hash).toBe(hash);
      expect(imported.assets[0].blob.type).toBe('image/png');

      const importedBytes = new Uint8Array(await imported.assets[0].blob.arrayBuffer());
      expect(importedBytes).toEqual(imageBytes);
    });

    it('throws error when importing an invalid zip archive without manuscript.json', async () => {
      const emptyZip = new Blob([new Uint8Array([0x50, 0x4b, 0x05, 0x06, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0])]);
      await expect(importBackup(emptyZip)).rejects.toThrow('manuscript.json not found');
    });
  });
});
