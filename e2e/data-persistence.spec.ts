import { test, expect } from '@playwright/test';

test.describe('E2E Data Persistence & Reload Verification (Chống Mất Dữ Liệu F5)', () => {
  test.beforeEach(async ({ page }) => {
    // 1. Navigate to the persistence test harness
    await page.goto('/dev-persistence-test');
    await expect(page.getByTestId('ready-indicator')).toHaveText('READY', {
      timeout: 10000,
    });

    // 2. Clear any lingering database state from previous runs
    await page.evaluate(async () => {
      if (window.__STRUCTPAPER_TEST__) {
        await window.__STRUCTPAPER_TEST__.clearDatabase();
      }
    });
  });

  test('1. Test IndexedDB Persistence on Page Reload (F5): retains manuscript and revision history', async ({
    page,
  }) => {
    const docId = 'doc_e2e_f5_reload_01';
    const sampleTitle = 'Nghiên cứu lâm sàng F5 - Khảo sát cấu trúc y sinh';

    // Seed manuscript into IndexedDB via IndexedDbManuscriptRepo
    await page.evaluate(
      async ({ id, title }) => {
        if (!window.__STRUCTPAPER_TEST__) throw new Error('Harness not loaded');
        await window.__STRUCTPAPER_TEST__.seedManuscript({
          id,
          journalId: 'vnuhcm-hs',
          meta: {
            title: [{ t: 'text', v: title }],
            authors: [
              {
                id: 'auth_1',
                name: 'GS. Nguyễn Văn B',
                affiliationIds: ['aff_1'],
                email: 'nvb@vnuhcm.edu.vn',
                isCorresponding: true,
              },
            ],
            affiliations: [
              { id: 'aff_1', institution: 'Đại học Khoa học Sức khỏe' },
            ],
            abstract: [
              [{ t: 'text', v: 'Tóm tắt bài báo kiểm thử độ bền bỉ dữ liệu khi F5.' }],
            ],
            keywords: ['F5', 'IndexedDB', 'Playwright'],
          },
        });
      },
      { id: docId, title: sampleTitle }
    );

    // Verify initial UI state
    await expect(page.getByTestId('doc-id')).toHaveText(docId);
    await expect(page.getByTestId('store-title')).toHaveText(sampleTitle);
    await expect(page.getByTestId('loaded-revision-count')).toHaveText('1');

    // Verify raw IndexedDB record before reload
    const initialRecord = await page.evaluate(async (id) => {
      const db = window.__STRUCTPAPER_TEST__!.db;
      const manuscript = await db.manuscripts.get(id);
      const revisions = await db.revisions.where('manuscriptId').equals(id).toArray();
      return { manuscript, revisionCount: revisions.length };
    }, docId);

    expect(initialRecord.manuscript).toBeDefined();
    expect(initialRecord.manuscript?.id).toBe(docId);
    expect(initialRecord.manuscript?.title).toBe(sampleTitle);
    expect(initialRecord.revisionCount).toBe(1);

    // ==========================================
    // ACTION: Simulate User Page Reload (F5)
    // ==========================================
    await page.reload();

    // Wait for the reloaded page to initialize from IndexedDB
    await expect(page.getByTestId('ready-indicator')).toHaveText('READY', {
      timeout: 10000,
    });

    // Verify that after F5 reload, the UI still displays the intact manuscript
    await expect(page.getByTestId('doc-id')).toHaveText(docId);
    await expect(page.getByTestId('store-title')).toHaveText(sampleTitle);
    await expect(page.getByTestId('loaded-revision-count')).toHaveText('1');

    // Verify IndexedDB database still retains the record and revision
    const postReloadRecord = await page.evaluate(async (id) => {
      const db = window.__STRUCTPAPER_TEST__!.db;
      const manuscript = await db.manuscripts.get(id);
      const revisions = await db.revisions.where('manuscriptId').equals(id).toArray();
      return {
        manuscript,
        revisionCount: revisions.length,
        firstRevisionDocTitle: revisions[0]?.doc?.meta?.title,
      };
    }, docId);

    expect(postReloadRecord.manuscript).not.toBeNull();
    expect(postReloadRecord.manuscript?.id).toBe(docId);
    expect(postReloadRecord.manuscript?.title).toBe(sampleTitle);
    expect(postReloadRecord.manuscript?.rev).toBe(1);
    expect(postReloadRecord.revisionCount).toBe(1);
    expect(postReloadRecord.firstRevisionDocTitle).toEqual([
      { t: 'text', v: sampleTitle },
    ]);
  });

  test('2. Test Autosave Lifecycle: debounces user edit, persists to IndexedDB, and survives reload', async ({
    page,
  }) => {
    const docId = 'doc_e2e_autosave_lifecycle';
    const initialTitle = 'Tiêu đề ban đầu chưa sửa';
    const editedTitle = 'Tiêu đề bài báo sau khi chỉnh sửa tự động lưu';

    // 1. Seed initial manuscript
    await page.evaluate(
      async ({ id, title }) => {
        if (!window.__STRUCTPAPER_TEST__) throw new Error('Harness not loaded');
        await window.__STRUCTPAPER_TEST__.seedManuscript({
          id,
          meta: {
            title: [{ t: 'text', v: title }],
            authors: [],
            affiliations: [],
            abstract: [],
            keywords: [],
          },
        });
      },
      { id: docId, title: initialTitle }
    );

    await expect(page.getByTestId('doc-id')).toHaveText(docId);
    await expect(page.getByTestId('store-title')).toHaveText(initialTitle);
    await expect(page.getByTestId('store-is-dirty')).toHaveText('false');
    await expect(page.getByTestId('store-rev')).toHaveText('0');

    // 2. Simulate user editing action: type new title into input
    const input = page.getByTestId('input-title');
    await input.fill(editedTitle);

    // Verify store immediately enters dirty state and increments rev
    await expect(page.getByTestId('store-is-dirty')).toHaveText('true');
    await expect(page.getByTestId('store-rev')).toHaveText('1');
    await expect(page.getByTestId('store-title')).toHaveText(editedTitle);

    // 3. Wait 1.2s for debounced autosave (debounce is 1000ms)
    await page.waitForTimeout(1200);

    // Verify autosave completes: status becomes 'saved', dirty flag clears, savedRev matches rev
    await expect(page.getByTestId('autosave-status')).toHaveText('saved', {
      timeout: 5000,
    });
    await expect(page.getByTestId('store-is-dirty')).toHaveText('false');
    await expect(page.getByTestId('store-saved-rev')).toHaveText('1');

    // 4. Verify updated record in IndexedDB
    const dbRecord = await page.evaluate(async (id) => {
      const db = window.__STRUCTPAPER_TEST__!.db;
      const manuscript = await db.manuscripts.get(id);
      const revisions = await db.revisions.where('manuscriptId').equals(id).toArray();
      return { manuscript, revisions };
    }, docId);

    expect(dbRecord.manuscript?.title).toBe(editedTitle);
    expect(dbRecord.manuscript?.rev).toBe(1);
    expect(dbRecord.revisions.length).toBeGreaterThanOrEqual(1);

    // 5. Reload the page (F5) to verify data persistence
    await page.reload();
    await expect(page.getByTestId('ready-indicator')).toHaveText('READY', {
      timeout: 10000,
    });

    // 6. Verify after reload: the edited title is intact and loaded from IndexedDB
    await expect(page.getByTestId('doc-id')).toHaveText(docId);
    await expect(page.getByTestId('store-title')).toHaveText(editedTitle);
    await expect(page.getByTestId('store-is-dirty')).toHaveText('false');
  });

  test('3. Test Asset Binary Persistence: stores Blob by SHA-256 and preserves binary bytes across reload', async ({
    page,
  }) => {
    const assetHash = 'a69f73cca23a9ac5c8b567dc185a756e97a9fb34a8ce3be8302c2dd550ced6c2';
    const originalByteCount = 256;

    // 1. Store a binary Blob asset by SHA-256 in assets table
    await page.evaluate(
      async ({ hash, size }) => {
        if (!window.__STRUCTPAPER_TEST__) throw new Error('Harness not loaded');

        // Create deterministic binary byte sequence
        const bytes = new Uint8Array(size);
        for (let i = 0; i < size; i++) {
          bytes[i] = (i * 31 + 7) & 0xff;
        }

        const blob = new Blob([bytes], { type: 'image/png' });
        await window.__STRUCTPAPER_TEST__.storeAsset(hash, blob, {
          mimeType: 'image/png',
          sizeBytes: size,
          width: 800,
          height: 600,
          dpi: 300,
        });
      },
      { hash: assetHash, size: originalByteCount }
    );

    // Verify asset status indicator in UI
    await expect(page.getByTestId('asset-status')).toHaveText(`stored_${assetHash.slice(0, 8)}`);

    // Verify in IndexedDB before reload
    const initialAssetCheck = await page.evaluate(async (hash) => {
      const assetRepo = window.__STRUCTPAPER_TEST__!.assetRepo;
      const blob = await assetRepo.getByHash(hash);
      return {
        exists: blob !== null,
        size: blob?.size,
        type: blob?.type,
      };
    }, assetHash);

    expect(initialAssetCheck.exists).toBe(true);
    expect(initialAssetCheck.size).toBe(originalByteCount);
    expect(initialAssetCheck.type).toBe('image/png');

    // ==========================================
    // ACTION: Simulate User Page Reload (F5)
    // ==========================================
    await page.reload();
    await expect(page.getByTestId('ready-indicator')).toHaveText('READY', {
      timeout: 10000,
    });

    // Verify after reload: the binary asset is intact and byte-exact
    const postReloadAssetCheck = await page.evaluate(
      async ({ hash, expectedSize }) => {
        const db = window.__STRUCTPAPER_TEST__!.db;
        const record = await db.assets.get(hash);
        if (!record || !record.blob) {
          return { found: false, matches: false, size: 0, mime: '' };
        }

        const buffer = await record.blob.arrayBuffer();
        const bytes = new Uint8Array(buffer);

        let byteMatches = bytes.length === expectedSize;
        for (let i = 0; i < expectedSize && byteMatches; i++) {
          const expected = (i * 31 + 7) & 0xff;
          if (bytes[i] !== expected) {
            byteMatches = false;
          }
        }

        return {
          found: true,
          matches: byteMatches,
          size: record.blob.size,
          mime: record.mime,
          dpi: record.dpi,
        };
      },
      { hash: assetHash, expectedSize: originalByteCount }
    );

    expect(postReloadAssetCheck.found).toBe(true);
    expect(postReloadAssetCheck.size).toBe(originalByteCount);
    expect(postReloadAssetCheck.mime).toBe('image/png');
    expect(postReloadAssetCheck.dpi).toBe(300);
    expect(postReloadAssetCheck.matches).toBe(true);
  });
});
