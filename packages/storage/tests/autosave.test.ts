import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { Manuscript } from '@structpaper/doc-model';
import { createManuscriptStore } from '@structpaper/editor-core';
import { CommandBus } from '@structpaper/editor-core';
import { StructPaperDatabase } from '../src/db/structpaper-db';
import { IndexedDbManuscriptRepo, extractTitle } from '../src/repositories/indexeddb-manuscript-repo';
import { AutosaveEngine, type AutosaveStatus } from '../src/autosave/autosave-engine';

function createMockDoc(): Manuscript {
  return {
    schemaVersion: 2,
    id: 'doc_autosave_01',
    lang: 'vi',
    journalId: 'vnuhcm-hs',
    articleType: 'Research Article',
    meta: {
      title: [{ t: 'text', v: 'Tiêu đề khởi tạo' }],
      authors: [],
      affiliations: [],
      abstract: [],
      keywords: [],
      dates: {},
    },
    body: [],
    back: [],
    references: [],
    assets: {},
  };
}

describe('packages/storage - AutosaveEngine', () => {
  let db: StructPaperDatabase;
  let repo: IndexedDbManuscriptRepo;
  let activeEngine: AutosaveEngine | null = null;

  beforeEach(async () => {
    const dbName = `test_autosave_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    db = new StructPaperDatabase(dbName);
    repo = new IndexedDbManuscriptRepo(db);
    activeEngine = null;
    await db.open();
  });

  afterEach(async () => {
    if (activeEngine) {
      activeEngine.stop();
      activeEngine = null;
    }
    if (db.isOpen()) {
      await db.delete();
    }
  });

  it('debounces command dispatch, updates status to saved, and clears isDirty', async () => {
    const doc = createMockDoc();
    const store = createManuscriptStore(doc);
    const bus = new CommandBus({ store });

    const statusHistory: AutosaveStatus[] = [];
    const engine = new AutosaveEngine({
      repo,
      debounceMs: 50,
      onStatusChange: (status) => statusHistory.push(status),
    });
    activeEngine = engine;

    engine.attach(bus, store);
    expect(engine.getStatus()).toBe('idle');

    // Dispatch title update
    bus.dispatch({
      type: 'metadata/updateTitle',
      payload: { title: 'Tiêu đề sau khi sửa' },
    });

    expect(store.getState().isDirty).toBe(true);
    expect(extractTitle(store.getState().manuscript!)).toBe('Tiêu đề sau khi sửa');

    // Wait for debounce timer to fire (120ms > 50ms)
    await new Promise((resolve) => setTimeout(resolve, 120));

    expect(statusHistory).toContain('saving');
    expect(statusHistory).toContain('saved');
    expect(store.getState().isDirty).toBe(false);

    // Verify stored document in IndexedDB
    const savedDoc = await repo.getById(doc.id);
    expect(savedDoc).not.toBeNull();
    expect(extractTitle(savedDoc!)).toBe('Tiêu đề sau khi sửa');

    engine.stop();
  });

  it('coalesces multiple rapid commands into a single debounced save', async () => {
    const doc = createMockDoc();
    const store = createManuscriptStore(doc);
    const bus = new CommandBus({ store });

    let saveCount = 0;
    const originalSave = repo.save.bind(repo);
    vi.spyOn(repo, 'save').mockImplementation(async (d) => {
      saveCount++;
      return originalSave(d);
    });

    const engine = new AutosaveEngine({
      repo,
      debounceMs: 60,
    });
    activeEngine = engine;
    engine.attach(bus, store);

    // Rapid dispatches
    bus.dispatch({
      type: 'metadata/updateTitle',
      payload: { title: 'Sửa lần 1' },
    });
    bus.dispatch({
      type: 'metadata/updateTitle',
      payload: { title: 'Sửa lần 2' },
    });
    bus.dispatch({
      type: 'metadata/updateTitle',
      payload: { title: 'Sửa lần 3 cuối cùng' },
    });

    // Wait for debounce
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(saveCount).toBe(1);
    const savedDoc = await repo.getById(doc.id);
    expect(extractTitle(savedDoc!)).toBe('Sửa lần 3 cuối cùng');

    engine.stop();
  });

  it('flush immediately saves pending changes without waiting for debounce', async () => {
    const doc = createMockDoc();
    const store = createManuscriptStore(doc);
    const bus = new CommandBus({ store });

    const engine = new AutosaveEngine({
      repo,
      debounceMs: 10000, // Very long debounce
    });
    activeEngine = engine;
    engine.attach(bus, store);

    bus.dispatch({
      type: 'metadata/updateTitle',
      payload: { title: 'Lưu tức thì qua flush' },
    });

    expect(store.getState().isDirty).toBe(true);

    // Flush immediately
    await engine.flush();

    expect(store.getState().isDirty).toBe(false);
    const savedDoc = await repo.getById(doc.id);
    expect(extractTitle(savedDoc!)).toBe('Lưu tức thì qua flush');

    engine.stop();
  });

  it('stop cancels pending timer and unregisters listeners', async () => {
    const doc = createMockDoc();
    const store = createManuscriptStore(doc);
    const bus = new CommandBus({ store });

    const statusHistory: AutosaveStatus[] = [];
    const engine = new AutosaveEngine({
      repo,
      debounceMs: 50,
      onStatusChange: (status) => statusHistory.push(status),
    });
    activeEngine = engine;
    engine.attach(bus, store);

    // Stop engine
    engine.stop();
    expect(engine.getStatus()).toBe('idle');

    bus.dispatch({
      type: 'metadata/updateTitle',
      payload: { title: 'Sau khi stop' },
    });

    await new Promise((resolve) => setTimeout(resolve, 80));

    // No saving or saved events fired
    expect(statusHistory).toEqual([]);
    expect(await repo.getById(doc.id)).toBeNull();
  });

  it('handles save error gracefully and transitions to error status', async () => {
    const doc = createMockDoc();
    const store = createManuscriptStore(doc);
    const bus = new CommandBus({ store });

    vi.spyOn(repo, 'save').mockRejectedValueOnce(new Error('IndexedDB QuotaExceededError'));

    const statusHistory: AutosaveStatus[] = [];
    const engine = new AutosaveEngine({
      repo,
      debounceMs: 30,
      onStatusChange: (status) => statusHistory.push(status),
    });
    activeEngine = engine;
    engine.attach(bus, store);

    bus.dispatch({
      type: 'metadata/updateTitle',
      payload: { title: 'Gây lỗi lưu' },
    });

    await new Promise((resolve) => setTimeout(resolve, 60));

    expect(statusHistory).toContain('saving');
    expect(statusHistory).toContain('error');
    expect(store.getState().isDirty).toBe(true);

    engine.stop();
  });
});
