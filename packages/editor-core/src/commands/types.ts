import type {
  Block,
  Cell,
  Author,
  Inline,
  Reference,
  Dates,
} from '@structpaper/doc-model';

export interface UpdateTitlePayload {
  title: Inline[] | string;
}

export interface UpdateAbstractPayload {
  abstract: Inline[][] | string;
}

export interface UpdateAuthorsPayload {
  authors: Author[];
}

export interface UpdateKeywordsPayload {
  keywords: string[];
}

export interface UpdateDatesPayload {
  dates: Partial<Dates> | Record<string, string | undefined>;
}

export interface UpdateMetadataFieldPayload {
  field?: string;
  value?: unknown;
  patch?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface AddAuthorPayload {
  author?: Author;
  index?: number;
  [key: string]: unknown;
}

export interface UpdateAuthorPayload {
  authorId?: string;
  id?: string;
  index?: number;
  author?: Partial<Author>;
  updates?: Partial<Author>;
  [key: string]: unknown;
}

export interface RemoveAuthorPayload {
  authorId?: string;
  id?: string;
  index?: number;
}

export interface AddAffiliationPayload {
  affiliation?: unknown;
  index?: number;
  [key: string]: unknown;
}

export interface UpdateAffiliationPayload {
  affiliationId?: number | string;
  id?: number | string;
  index?: number;
  affiliation?: Record<string, unknown>;
  updates?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface RemoveAffiliationPayload {
  affiliationId?: number | string;
  id?: number | string;
  index?: number;
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

export interface UpdateReferencePayload {
  referenceId?: string | number;
  id?: string | number;
  index?: number;
  reference?: Partial<Reference>;
  updates?: Partial<Reference>;
  [key: string]: unknown;
}

export interface RemoveReferencePayload {
  referenceId?: string | number;
  id?: string | number;
}

export interface UpdateCellPayload {
  tableId: string;
  rowIndex: number;
  colIndex: number;
  cell: Partial<Cell>;
}

export interface BaseCommandPayloadMap {
  'metadata/updateTitle': UpdateTitlePayload | Inline[] | string;
  'metadata/updateAbstract': UpdateAbstractPayload | Inline[][] | string;
  'metadata/updateAuthors': UpdateAuthorsPayload | Author[];
  'metadata/updateKeywords': UpdateKeywordsPayload | string[];
  'metadata/updateDates': UpdateDatesPayload | Record<string, string | undefined>;
  'metadata/updateField': UpdateMetadataFieldPayload;
  'author/add': AddAuthorPayload | Author;
  'author/update': UpdateAuthorPayload;
  'author/remove': RemoveAuthorPayload;
  'affiliation/add': AddAffiliationPayload | any;
  'affiliation/update': UpdateAffiliationPayload;
  'affiliation/remove': RemoveAffiliationPayload;
  'block/insert': InsertBlockPayload;
  'block/update': UpdateBlockPayload;
  'block/remove': RemoveBlockPayload;
  'reference/add': AddReferencePayload | Reference;
  'reference/update': UpdateReferencePayload;
  'reference/remove': RemoveReferencePayload;
  'table/updateCell': UpdateCellPayload;
}
