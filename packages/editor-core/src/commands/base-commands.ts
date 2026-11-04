import type {
  Block,
  Cell,
  Manuscript,
  Section,
  TableBlock,
} from '@structpaper/doc-model';
import type {
  AddReferencePayload,
  InsertBlockPayload,
  RemoveBlockPayload,
  RemoveReferencePayload,
  UpdateAbstractPayload,
  UpdateAuthorsPayload,
  UpdateBlockPayload,
  UpdateCellPayload,
  UpdateTitlePayload,
} from './types';

function findSection(sections: Section[], sectionId: string): Section | null {
  for (const s of sections) {
    if (s.id === sectionId) return s;
    if (s.children && s.children.length > 0) {
      const found = findSection(s.children, sectionId);
      if (found) return found;
    }
  }
  return null;
}

function findBlock(blocks: Block[], blockId: string): Block | null {
  for (const b of blocks) {
    if (b.id === blockId) return b;
    if (b.type === 'list' && b.items) {
      for (const itemBlocks of b.items) {
        const found = findBlock(itemBlocks, blockId);
        if (found) return found;
      }
    }
    if ((b.type === 'quote' || b.type === 'box') && Array.isArray(b.content)) {
      const found = findBlock(b.content as Block[], blockId);
      if (found) return found;
    }
  }
  return null;
}

function findBlockInManuscript(doc: Manuscript, blockId: string): Block | null {
  if (doc.body) {
    for (const s of doc.body) {
      if (s.blocks) {
        const found = findBlock(s.blocks, blockId);
        if (found) return found;
      }
      if (s.children) {
        const found = findBlockInChildrenSections(s.children, blockId);
        if (found) return found;
      }
    }
  }
  if (doc.back && Array.isArray(doc.back)) {
    for (const item of doc.back as any[]) {
      if (item && Array.isArray(item.content)) {
        const found = findBlock(item.content, blockId);
        if (found) return found;
      }
    }
  }
  return null;
}

function findBlockInChildrenSections(sections: Section[], blockId: string): Block | null {
  for (const s of sections) {
    if (s.blocks) {
      const found = findBlock(s.blocks, blockId);
      if (found) return found;
    }
    if (s.children) {
      const found = findBlockInChildrenSections(s.children, blockId);
      if (found) return found;
    }
  }
  return null;
}

function removeBlockFromArray(blocks: Block[], blockId: string): boolean {
  const idx = blocks.findIndex((b) => b.id === blockId);
  if (idx !== -1) {
    blocks.splice(idx, 1);
    return true;
  }
  for (const b of blocks) {
    if (b.type === 'list' && b.items) {
      for (const itemBlocks of b.items) {
        if (removeBlockFromArray(itemBlocks, blockId)) return true;
      }
    }
    if ((b.type === 'quote' || b.type === 'box') && Array.isArray(b.content)) {
      if (removeBlockFromArray(b.content as Block[], blockId)) return true;
    }
  }
  return false;
}

function removeBlockFromSections(sections: Section[], blockId: string): boolean {
  for (const s of sections) {
    if (s.blocks && removeBlockFromArray(s.blocks, blockId)) {
      return true;
    }
    if (s.children && removeBlockFromSections(s.children, blockId)) {
      return true;
    }
  }
  return false;
}

function removeBlockFromManuscript(doc: Manuscript, blockId: string): boolean {
  if (doc.body && removeBlockFromSections(doc.body, blockId)) {
    return true;
  }
  if (doc.back && Array.isArray(doc.back)) {
    for (const item of doc.back as any[]) {
      if (item && Array.isArray(item.content) && removeBlockFromArray(item.content, blockId)) {
        return true;
      }
    }
  }
  return false;
}

export function handleUpdateTitle(draft: Manuscript, payload: UpdateTitlePayload | any): void {
  const title = Array.isArray(payload) ? payload : payload.title;
  if (!draft.meta) {
    draft.meta = {} as any;
  }
  draft.meta.title = title;
}

export function handleUpdateAbstract(draft: Manuscript, payload: UpdateAbstractPayload | any): void {
  const abstract = Array.isArray(payload) ? payload : payload.abstract;
  if (!draft.meta) {
    draft.meta = {} as any;
  }
  draft.meta.abstract = abstract;
}

export function handleUpdateAuthors(draft: Manuscript, payload: UpdateAuthorsPayload | any): void {
  const authors = Array.isArray(payload) ? payload : payload.authors;
  if (!draft.meta) {
    draft.meta = {} as any;
  }
  draft.meta.authors = authors;
}

export function handleInsertBlock(draft: Manuscript, payload: InsertBlockPayload): void {
  let targetSection: Section | null = null;
  if (payload.sectionId) {
    targetSection = findSection(draft.body, payload.sectionId);
    if (!targetSection) {
      throw new Error(`Section not found: "${payload.sectionId}"`);
    }
  } else if (draft.body && draft.body.length > 0) {
    targetSection = draft.body[0];
  } else {
    throw new Error('No section available in manuscript to insert block');
  }

  if (!targetSection.blocks) {
    targetSection.blocks = [];
  }

  const afterBlockId =
    payload.afterBlockId ??
    (typeof payload.position === 'object' && payload.position && 'afterBlockId' in payload.position
      ? payload.position.afterBlockId
      : undefined);

  if (payload.position === 'start') {
    targetSection.blocks.unshift(payload.block);
  } else if (afterBlockId) {
    const idx = targetSection.blocks.findIndex((b) => b.id === afterBlockId);
    if (idx !== -1) {
      targetSection.blocks.splice(idx + 1, 0, payload.block);
    } else {
      targetSection.blocks.push(payload.block);
    }
  } else if (typeof payload.index === 'number') {
    targetSection.blocks.splice(payload.index, 0, payload.block);
  } else {
    targetSection.blocks.push(payload.block);
  }
}

export function handleUpdateBlock(draft: Manuscript, payload: UpdateBlockPayload): void {
  const targetBlock = findBlockInManuscript(draft, payload.blockId);
  if (!targetBlock) {
    throw new Error(`Block with id "${payload.blockId}" not found`);
  }

  const { blockId, block, ...rest } = payload;
  const updates = block ?? rest;
  Object.assign(targetBlock, updates);
}

export function handleRemoveBlock(draft: Manuscript, payload: RemoveBlockPayload): void {
  const removed = removeBlockFromManuscript(draft, payload.blockId);
  if (!removed) {
    throw new Error(`Block with id "${payload.blockId}" not found to remove`);
  }
}

export function handleAddReference(draft: Manuscript, payload: AddReferencePayload | any): void {
  const ref = payload.reference ?? payload;
  if (!draft.references) {
    draft.references = [];
  }
  if (typeof payload.index === 'number') {
    draft.references.splice(payload.index, 0, ref);
  } else {
    draft.references.push(ref);
  }
}

export function handleRemoveReference(draft: Manuscript, payload: RemoveReferencePayload): void {
  const id = payload.referenceId ?? payload.id;
  if (!id) {
    throw new Error('referenceId must be provided to remove a reference');
  }
  if (!draft.references) {
    throw new Error('No references array in manuscript');
  }
  const idx = draft.references.findIndex((r) => r.id === id);
  if (idx === -1) {
    throw new Error(`Reference with id "${id}" not found`);
  }
  draft.references.splice(idx, 1);
}

export function handleUpdateCell(draft: Manuscript, payload: UpdateCellPayload): void {
  const block = findBlockInManuscript(draft, payload.tableId);
  if (!block) {
    throw new Error(`Table block with id "${payload.tableId}" not found`);
  }
  if (block.type !== 'table') {
    throw new Error(
      `Block with id "${payload.tableId}" is not a table block (actual type: "${block.type}")`
    );
  }
  const table = block as TableBlock;
  if (!table.grid || !table.grid[payload.rowIndex]) {
    throw new Error(`Row ${payload.rowIndex} does not exist in table "${payload.tableId}"`);
  }
  const cell = table.grid[payload.rowIndex][payload.colIndex];
  if (!cell) {
    throw new Error(
      `Cell at row ${payload.rowIndex}, col ${payload.colIndex} does not exist in table "${payload.tableId}"`
    );
  }
  Object.assign(cell, payload.cell);
}

export interface HandlerRegistrar {
  registerHandler: (type: string, handler: (draft: Manuscript, payload: any) => void) => void;
}

export function registerBaseCommands(bus: HandlerRegistrar): void {
  bus.registerHandler('metadata/updateTitle', handleUpdateTitle);
  bus.registerHandler('metadata/updateAbstract', handleUpdateAbstract);
  bus.registerHandler('metadata/updateAuthors', handleUpdateAuthors);
  bus.registerHandler('block/insert', handleInsertBlock);
  bus.registerHandler('block/update', handleUpdateBlock);
  bus.registerHandler('block/remove', handleRemoveBlock);
  bus.registerHandler('reference/add', handleAddReference);
  bus.registerHandler('reference/remove', handleRemoveReference);
  bus.registerHandler('table/updateCell', handleUpdateCell);
}
