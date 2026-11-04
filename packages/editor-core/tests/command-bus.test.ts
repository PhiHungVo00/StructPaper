import { describe, it, expect, vi } from 'vitest';
import { CommandBus } from '../src/bus';
import { createManuscriptStore } from '../src/store';
import { createSampleManuscript } from './fixtures/sample-manuscript';
import type { Block, Inline } from '@structpaper/doc-model';

describe('CommandBus & Base Commands', () => {
  it('dispatches metadata/updateTitle and emits valid forward and inverse patches', () => {
    const initialDoc = createSampleManuscript();
    const store = createManuscriptStore(initialDoc);
    const bus = new CommandBus(store);

    const onPatchSpy = vi.fn();
    const unsubscribe = bus.onPatch(onPatchSpy);

    const newTitle: Inline[] = [{ t: 'text', v: 'Tiêu đề bài báo mới cập nhật' }];

    const result = bus.dispatch({
      type: 'metadata/updateTitle',
      payload: { title: newTitle },
    });

    expect(result.doc.meta.title).toEqual(newTitle);
    expect(store.getState().manuscript?.meta.title).toEqual(newTitle);
    expect(store.getState().rev).toBe(1);
    expect(store.getState().isDirty).toBe(true);

    expect(result.patches).toHaveLength(1);
    expect(result.patches[0].op).toBe('replace');
    expect(result.patches[0].path).toEqual(['meta', 'title']);
    expect(result.patches[0].value).toEqual(newTitle);

    expect(result.inversePatches).toHaveLength(1);
    expect(result.inversePatches[0].op).toBe('replace');
    expect(result.inversePatches[0].path).toEqual(['meta', 'title']);
    expect(result.inversePatches[0].value).toEqual(initialDoc.meta.title);

    expect(onPatchSpy).toHaveBeenCalledTimes(1);
    expect(onPatchSpy).toHaveBeenCalledWith(result.patches, result.inversePatches, result.doc);

    unsubscribe();
    bus.dispatch({
      type: 'metadata/updateTitle',
      payload: { title: [{ t: 'text', v: 'Tiêu đề lần 2' }] },
    });
    expect(onPatchSpy).toHaveBeenCalledTimes(1); // Unsubscribed
  });

  it('dispatches metadata/updateAbstract and metadata/updateAuthors', () => {
    const initialDoc = createSampleManuscript();
    const bus = new CommandBus({ initialDoc });

    const newAbstract: Inline[][] = [
      [{ t: 'text', v: 'Đoạn tóm tắt 1 mới.' }],
      [{ t: 'text', v: 'Đoạn tóm tắt 2 mới.' }],
    ];

    const abstractRes = bus.dispatch({
      type: 'metadata/updateAbstract',
      payload: { abstract: newAbstract },
    });
    expect(abstractRes.doc.meta.abstract).toEqual(newAbstract);

    const newAuthors = [
      {
        id: 'auth_new',
        name: 'Lê Văn C',
        affiliationIds: ['aff_1'],
        isCorresponding: true,
      },
    ];

    const authorsRes = bus.dispatch({
      type: 'metadata/updateAuthors',
      payload: { authors: newAuthors },
    });
    expect(authorsRes.doc.meta.authors).toEqual(newAuthors);
  });

  describe('block commands', () => {
    it('inserts a block at the start, at the end, and after a specific blockId', () => {
      const initialDoc = createSampleManuscript();
      const bus = new CommandBus({ initialDoc });

      const startBlock: Block = {
        type: 'paragraph',
        id: 'p_start',
        content: [{ t: 'text', v: 'Khối đầu tiên' }],
      };

      bus.dispatch({
        type: 'block/insert',
        payload: {
          sectionId: 'sec_intro',
          block: startBlock,
          position: 'start',
        },
      });

      let sec = bus.getDocument()!.body[0];
      expect(sec.blocks[0].id).toBe('p_start');

      const endBlock: Block = {
        type: 'paragraph',
        id: 'p_end',
        content: [{ t: 'text', v: 'Khối cuối cùng' }],
      };

      bus.dispatch({
        type: 'block/insert',
        payload: {
          sectionId: 'sec_intro',
          block: endBlock,
          position: 'end',
        },
      });

      sec = bus.getDocument()!.body[0];
      expect(sec.blocks[sec.blocks.length - 1].id).toBe('p_end');

      const middleBlock: Block = {
        type: 'paragraph',
        id: 'p_middle',
        content: [{ t: 'text', v: 'Khối chèn giữa' }],
      };

      bus.dispatch({
        type: 'block/insert',
        payload: {
          sectionId: 'sec_intro',
          block: middleBlock,
          position: { afterBlockId: 'p_start' },
        },
      });

      sec = bus.getDocument()!.body[0];
      expect(sec.blocks[1].id).toBe('p_middle');
    });

    it('updates a block by id', () => {
      const initialDoc = createSampleManuscript();
      const bus = new CommandBus({ initialDoc });

      const updatedContent: Inline[] = [{ t: 'text', v: 'Nội dung paragraph đã chỉnh sửa.' }];

      bus.dispatch({
        type: 'block/update',
        payload: {
          blockId: 'p_intro_1',
          block: { content: updatedContent } as any,
        },
      });

      const sec = bus.getDocument()!.body[0];
      const para = sec.blocks.find((b) => b.id === 'p_intro_1');
      expect((para as any).content).toEqual(updatedContent);
    });

    it('removes a block by id', () => {
      const initialDoc = createSampleManuscript();
      const bus = new CommandBus({ initialDoc });

      expect(bus.getDocument()!.body[0].blocks).toHaveLength(2);

      bus.dispatch({
        type: 'block/remove',
        payload: { blockId: 'p_intro_1' },
      });

      const blocks = bus.getDocument()!.body[0].blocks;
      expect(blocks).toHaveLength(1);
      expect(blocks.find((b) => b.id === 'p_intro_1')).toBeUndefined();
    });
  });

  describe('reference commands', () => {
    it('adds and removes references', () => {
      const initialDoc = createSampleManuscript();
      const bus = new CommandBus({ initialDoc });

      expect(bus.getDocument()!.references).toHaveLength(1);

      const newRef = {
        id: 'ref_002',
        raw: 'Tran, T. B. (2026). Deep Learning. Journal of Tech, 2(1), 20-30.',
        parse: 'ok' as const,
      };

      bus.dispatch({
        type: 'reference/add',
        payload: { reference: newRef },
      });

      expect(bus.getDocument()!.references).toHaveLength(2);
      expect(bus.getDocument()!.references[1].id).toBe('ref_002');

      bus.dispatch({
        type: 'reference/remove',
        payload: { referenceId: 'ref_001' },
      });

      expect(bus.getDocument()!.references).toHaveLength(1);
      expect(bus.getDocument()!.references[0].id).toBe('ref_002');
    });
  });

  describe('table commands', () => {
    it('updates a specific cell in a TableBlock', () => {
      const initialDoc = createSampleManuscript();
      const bus = new CommandBus({ initialDoc });

      const newCellContent: Inline[] = [{ t: 'text', v: '99.9%' }];

      bus.dispatch({
        type: 'table/updateCell',
        payload: {
          tableId: 'tbl_results',
          rowIndex: 1,
          colIndex: 1,
          cell: {
            content: newCellContent,
            align: 'c',
          },
        },
      });

      const table = bus.getDocument()!.body[0].blocks[1] as any;
      expect(table.grid[1][1].content).toEqual(newCellContent);
      expect(table.grid[1][1].align).toBe('c');
    });
  });

  describe('custom command registration & error handling', () => {
    it('allows registering custom command handlers', () => {
      const initialDoc = createSampleManuscript();
      const bus = new CommandBus({ initialDoc });

      bus.register('article/changeType', (draft, payload: { articleType: string }) => {
        draft.articleType = payload.articleType;
      });

      const res = bus.dispatch({
        type: 'article/changeType',
        payload: { articleType: 'Review Article' },
      });

      expect(res.doc.articleType).toBe('Review Article');
    });

    it('throws when dispatching with no document loaded', () => {
      const bus = new CommandBus();
      expect(() =>
        bus.dispatch({
          type: 'metadata/updateTitle',
          payload: { title: [] },
        })
      ).toThrow('No manuscript is currently loaded');
    });

    it('throws when dispatching an unknown command', () => {
      const initialDoc = createSampleManuscript();
      const bus = new CommandBus({ initialDoc });
      expect(() =>
        bus.dispatch({
          type: 'unknown/command',
          payload: {},
        })
      ).toThrow('Unknown command type: "unknown/command"');
    });

    it('throws when trying to remove a non-existent block', () => {
      const initialDoc = createSampleManuscript();
      const bus = new CommandBus({ initialDoc });
      expect(() =>
        bus.dispatch({
          type: 'block/remove',
          payload: { blockId: 'non_existent_id' },
        })
      ).toThrow('Block with id "non_existent_id" not found to remove');
    });

    it('throws when trying to update cell in a non-existent table', () => {
      const initialDoc = createSampleManuscript();
      const bus = new CommandBus({ initialDoc });
      expect(() =>
        bus.dispatch({
          type: 'table/updateCell',
          payload: {
            tableId: 'no_table',
            rowIndex: 0,
            colIndex: 0,
            cell: {},
          },
        })
      ).toThrow('Table block with id "no_table" not found');
    });
  });
});
