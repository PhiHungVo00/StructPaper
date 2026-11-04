import type {
  Block,
  Cell,
  Author,
  Inline,
  Reference,
} from '@structpaper/doc-model';

export interface UpdateTitlePayload {
  title: Inline[];
}

export interface UpdateAbstractPayload {
  abstract: Inline[][];
}

export interface UpdateAuthorsPayload {
  authors: Author[];
}

export interface InsertBlockPayload {
  sectionId?: string;
  block: Block;
  position?: 'start' | 'end' | { afterBlockId: string };
  afterBlockId?: string;
  index?: number;
}

export interface UpdateBlockPayload {
  blockId: string;
  block?: Partial<Block>;
  [key: string]: unknown;
}

export interface RemoveBlockPayload {
  blockId: string;
}

export interface AddReferencePayload {
  reference?: Reference;
  index?: number;
  [key: string]: unknown;
}

export interface RemoveReferencePayload {
  referenceId?: string;
  id?: string;
}

export interface UpdateCellPayload {
  tableId: string;
  rowIndex: number;
  colIndex: number;
  cell: Partial<Cell>;
}

export interface BaseCommandPayloadMap {
  'metadata/updateTitle': UpdateTitlePayload | Inline[];
  'metadata/updateAbstract': UpdateAbstractPayload | Inline[][];
  'metadata/updateAuthors': UpdateAuthorsPayload | Author[];
  'block/insert': InsertBlockPayload;
  'block/update': UpdateBlockPayload;
  'block/remove': RemoveBlockPayload;
  'reference/add': AddReferencePayload | Reference;
  'reference/remove': RemoveReferencePayload;
  'table/updateCell': UpdateCellPayload;
}
