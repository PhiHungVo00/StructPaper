import { describe, it, expect, vi } from 'vitest';
import { CommandBus } from '../src/bus';
import { createManuscriptStore } from '../src/store';
import { HistoryManager } from '../src/history';
import { createSampleManuscript } from './fixtures/sample-manuscript';
import type { Inline } from '@structpaper/doc-model';

describe('HistoryManager (Undo / Redo)', () => {
  it('restores document state to exact previous snapshots on undo and redo', () => {
    const initialDoc = createSampleManuscript();
    const store = createManuscriptStore(initialDoc);
    const bus = new CommandBus(store);
    const history = new HistoryManager({ commandBus: bus, store });

    expect(history.canUndo).toBe(false);
    expect(history.canRedo).toBe(false);

    // Mutation 1: Update title
    const newTitle: Inline[] = [{ t: 'text', v: 'Tiêu đề cập nhật lần 1' }];
    bus.dispatch({
      type: 'metadata/updateTitle',
      payload: { title: newTitle },
    });

    expect(store.getState().manuscript?.meta.title).toEqual(newTitle);
    expect(history.canUndo).toBe(true);
    expect(history.canRedo).toBe(false);
    expect(history.undoStack).toHaveLength(1);

    // Undo -> Restores initial title
    const undoneDoc = history.undo();
    expect(undoneDoc).not.toBeNull();
    expect(undoneDoc?.meta.title).toEqual(initialDoc.meta.title);
    expect(store.getState().manuscript?.meta.title).toEqual(initialDoc.meta.title);
    expect(history.canUndo).toBe(false);
    expect(history.canRedo).toBe(true);

    // Calling undo when canUndo is false returns null
    expect(history.undo()).toBeNull();

    // Redo -> Restores updated title
    const redoneDoc = history.redo();
    expect(redoneDoc).not.toBeNull();
    expect(redoneDoc?.meta.title).toEqual(newTitle);
    expect(store.getState().manuscript?.meta.title).toEqual(newTitle);
    expect(history.canUndo).toBe(true);
    expect(history.canRedo).toBe(false);

    // Calling redo when canRedo is false returns null
    expect(history.redo()).toBeNull();
  });

  it('handles multi-step undo and redo sequences accurately', () => {
    const initialDoc = createSampleManuscript();
    const store = createManuscriptStore(initialDoc);
    const bus = new CommandBus(store);
    const history = new HistoryManager({ commandBus: bus, store });

    const title1: Inline[] = [{ t: 'text', v: 'Bước 1' }];
    const title2: Inline[] = [{ t: 'text', v: 'Bước 2' }];
    const title3: Inline[] = [{ t: 'text', v: 'Bước 3' }];

    bus.dispatch({ type: 'metadata/updateTitle', payload: { title: title1 } });
    bus.dispatch({ type: 'metadata/updateTitle', payload: { title: title2 } });
    bus.dispatch({ type: 'metadata/updateTitle', payload: { title: title3 } });

    expect(history.undoStack).toHaveLength(3);
    expect(store.getState().manuscript?.meta.title).toEqual(title3);

    // Step-by-step undo
    history.undo();
    expect(store.getState().manuscript?.meta.title).toEqual(title2);

    history.undo();
    expect(store.getState().manuscript?.meta.title).toEqual(title1);

    history.undo();
    expect(store.getState().manuscript?.meta.title).toEqual(initialDoc.meta.title);
    expect(history.canUndo).toBe(false);
    expect(history.canRedo).toBe(true);
    expect(history.redoStack).toHaveLength(3);

    // Step-by-step redo
    history.redo();
    expect(store.getState().manuscript?.meta.title).toEqual(title1);

    history.redo();
    expect(store.getState().manuscript?.meta.title).toEqual(title2);

    history.redo();
    expect(store.getState().manuscript?.meta.title).toEqual(title3);
    expect(history.canUndo).toBe(true);
    expect(history.canRedo).toBe(false);
  });

  it('clears redo stack when a new mutation is dispatched after undo', () => {
    const initialDoc = createSampleManuscript();
    const store = createManuscriptStore(initialDoc);
    const bus = new CommandBus(store);
    const history = new HistoryManager({ commandBus: bus, store });

    const titleA: Inline[] = [{ t: 'text', v: 'Phiên bản A' }];
    const titleB: Inline[] = [{ t: 'text', v: 'Phiên bản B' }];
    const titleC: Inline[] = [{ t: 'text', v: 'Phiên bản C' }];

    bus.dispatch({ type: 'metadata/updateTitle', payload: { title: titleA } });
    bus.dispatch({ type: 'metadata/updateTitle', payload: { title: titleB } });

    history.undo(); // back to A
    expect(store.getState().manuscript?.meta.title).toEqual(titleA);
    expect(history.canRedo).toBe(true);
    expect(history.redoStack).toHaveLength(1);

    // Branch off with a new mutation
    bus.dispatch({ type: 'metadata/updateTitle', payload: { title: titleC } });
    expect(store.getState().manuscript?.meta.title).toEqual(titleC);

    // Redo stack must now be empty
    expect(history.canRedo).toBe(false);
    expect(history.redoStack).toHaveLength(0);

    // Undo should go back to titleA, not titleB
    history.undo();
    expect(store.getState().manuscript?.meta.title).toEqual(titleA);
  });

  it('respects maxHistory constraint (sliding window)', () => {
    const initialDoc = createSampleManuscript();
    const store = createManuscriptStore(initialDoc);
    const bus = new CommandBus(store);
    const history = new HistoryManager({ commandBus: bus, store, maxHistory: 3 });

    for (let i = 1; i <= 5; i++) {
      bus.dispatch({
        type: 'metadata/updateTitle',
        payload: { title: [{ t: 'text', v: `Version ${i}` }] },
      });
    }

    expect(history.undoStack).toHaveLength(3);

    // Can only undo 3 times
    history.undo(); // Version 4
    expect(store.getState().manuscript?.meta.title[0]).toEqual({ t: 'text', v: 'Version 4' });

    history.undo(); // Version 3
    expect(store.getState().manuscript?.meta.title[0]).toEqual({ t: 'text', v: 'Version 3' });

    history.undo(); // Version 2
    expect(store.getState().manuscript?.meta.title[0]).toEqual({ t: 'text', v: 'Version 2' });

    expect(history.canUndo).toBe(false);
  });

  it('supports listeners on history changes', () => {
    const initialDoc = createSampleManuscript();
    const store = createManuscriptStore(initialDoc);
    const bus = new CommandBus(store);
    const history = new HistoryManager({ commandBus: bus, store });

    const listener = vi.fn();
    const unsubscribe = history.onHistoryChange(listener);

    bus.dispatch({
      type: 'metadata/updateTitle',
      payload: { title: [{ t: 'text', v: 'Testing Listeners' }] },
    });

    history.undo();
    expect(listener).toHaveBeenCalledWith(expect.any(Object), 'undo');

    history.redo();
    expect(listener).toHaveBeenCalledWith(expect.any(Object), 'redo');

    unsubscribe();
    history.undo();
    expect(listener).toHaveBeenCalledTimes(2); // No extra call after unsubscribe
  });

  it('clears all history on clear()', () => {
    const initialDoc = createSampleManuscript();
    const store = createManuscriptStore(initialDoc);
    const bus = new CommandBus(store);
    const history = new HistoryManager({ commandBus: bus, store });

    bus.dispatch({
      type: 'metadata/updateTitle',
      payload: { title: [{ t: 'text', v: 'Temp' }] },
    });

    expect(history.canUndo).toBe(true);
    history.clear();

    expect(history.canUndo).toBe(false);
    expect(history.canRedo).toBe(false);
    expect(history.undoStack).toEqual([]);
    expect(history.redoStack).toEqual([]);
  });

  it('works standalone with manual record/undo/redo on a document', () => {
    const doc1 = createSampleManuscript();
    const history = new HistoryManager();

    // Fake patches
    const patches = [{ op: 'replace' as const, path: ['meta', 'title', 0, 'v'], value: 'Manual' }];
    const invPatches = [
      {
        op: 'replace' as const,
        path: ['meta', 'title', 0, 'v'],
        value: doc1.meta.title[0].v,
      },
    ];

    history.record(patches, invPatches);
    expect(history.canUndo).toBe(true);

    const doc2 = JSON.parse(JSON.stringify(doc1));
    doc2.meta.title[0].v = 'Manual';

    const restored = history.undo(doc2);
    expect(restored?.meta.title[0].v).toBe(doc1.meta.title[0].v);

    const redone = history.redo(restored!);
    expect(redone?.meta.title[0].v).toBe('Manual');
  });
});
