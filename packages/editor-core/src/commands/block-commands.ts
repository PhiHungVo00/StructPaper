import type {
  Block,
  Cell,
  Manuscript,
  Section,
  TableBlock,
} from '@structpaper/doc-model';
import type {
  InsertBlockPayload,
  RemoveBlockPayload,
  UpdateBlockPayload,
  UpdateCellPayload,
} from './types';

export function findSection(sections: Section[], sectionId: string): Section | null {
  for (const s of sections) {
    if (s.id === sectionId) return s;
    if (s.children && s.children.length > 0) {
      const found = findSection(s.children, sectionId);
      if (found) return found;
    }
  }
  return null;
}

export function findBlock(blocks: Block[], blockId: string): Block | null {
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

export function findBlockInChildrenSections(sections: Section[], blockId: string): Block | null {
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

export function findBlockInManuscript(doc: Manuscript, blockId: string): Block | null {
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

export function removeBlockFromArray(blocks: Block[], blockId: string): boolean {
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

export function removeBlockFromSections(sections: Section[], blockId: string): boolean {
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

export function removeBlockFromManuscript(doc: Manuscript, blockId: string): boolean {
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
