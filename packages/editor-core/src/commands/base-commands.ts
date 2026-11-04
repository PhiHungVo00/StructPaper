import type {
  Author,
  Inline,
  Manuscript,
} from '@structpaper/doc-model';
import type {
  AddAuthorPayload,
  AddReferencePayload,
  RemoveAuthorPayload,
  RemoveReferencePayload,
  UpdateAbstractPayload,
  UpdateAuthorPayload,
  UpdateAuthorsPayload,
  UpdateDatesPayload,
  UpdateKeywordsPayload,
  UpdateMetadataFieldPayload,
  UpdateReferencePayload,
  UpdateTitlePayload,
} from './types';
import {
  findBlock,
  findBlockInManuscript,
  findBlockInChildrenSections,
  findSection,
  handleInsertBlock,
  handleRemoveBlock,
  handleUpdateBlock,
  handleUpdateCell,
  removeBlockFromArray,
  removeBlockFromManuscript,
  removeBlockFromSections,
} from './block-commands';

export {
  findBlock,
  findBlockInManuscript,
  findBlockInChildrenSections,
  findSection,
  handleInsertBlock,
  handleRemoveBlock,
  handleUpdateBlock,
  handleUpdateCell,
  removeBlockFromArray,
  removeBlockFromManuscript,
  removeBlockFromSections,
};

export function handleUpdateTitle(draft: Manuscript, payload: UpdateTitlePayload | any): void {
  const rawTitle = Array.isArray(payload) ? payload : (payload?.title ?? payload);
  if (!draft.meta) {
    draft.meta = {} as any;
  }
  draft.meta.title = typeof rawTitle === 'string' ? [{ t: 'text', v: rawTitle }] : rawTitle;
}

export function handleUpdateAbstract(draft: Manuscript, payload: UpdateAbstractPayload | any): void {
  const rawAbstract = Array.isArray(payload) ? payload : (payload?.abstract ?? payload);
  if (!draft.meta) {
    draft.meta = {} as any;
  }
  draft.meta.abstract = typeof rawAbstract === 'string' ? [[{ t: 'text', v: rawAbstract }]] : rawAbstract;
}

export function handleUpdateAuthors(draft: Manuscript, payload: UpdateAuthorsPayload | any): void {
  const authors = Array.isArray(payload) ? payload : (payload?.authors ?? payload);
  if (!draft.meta) {
    draft.meta = {} as any;
  }
  draft.meta.authors = authors;
}

export function handleUpdateKeywords(draft: Manuscript, payload: UpdateKeywordsPayload | any): void {
  const keywords = Array.isArray(payload) ? payload : (payload?.keywords ?? payload);
  if (!draft.meta) {
    draft.meta = {} as any;
  }
  draft.meta.keywords = keywords;
}

export function handleUpdateDates(draft: Manuscript, payload: UpdateDatesPayload | any): void {
  const dates = payload?.dates ?? payload;
  if (!draft.meta) {
    draft.meta = {} as any;
  }
  draft.meta.dates = { ...(draft.meta.dates || {}), ...dates };
}

export function handleUpdateMetadataField(draft: Manuscript, payload: UpdateMetadataFieldPayload | any): void {
  if (!draft.meta) {
    draft.meta = {} as any;
  }
  if (payload.field && payload.value !== undefined) {
    (draft.meta as any)[payload.field] = payload.value;
  } else if (payload.patch) {
    Object.assign(draft.meta, payload.patch);
  }
}

export function handleAddAuthor(draft: Manuscript, payload: AddAuthorPayload | any): void {
  const author: Author = payload?.author ?? payload;
  if (!draft.meta) {
    draft.meta = {} as any;
  }
  if (!draft.meta.authors) {
    draft.meta.authors = [];
  }
  if (typeof payload?.index === 'number') {
    draft.meta.authors.splice(payload.index, 0, author);
  } else {
    draft.meta.authors.push(author);
  }
}

export function handleUpdateAuthor(draft: Manuscript, payload: UpdateAuthorPayload | any): void {
  if (!draft.meta || !draft.meta.authors) return;
  const authorId = payload?.authorId ?? payload?.id;
  const idx = typeof payload?.index === 'number'
    ? payload.index
    : draft.meta.authors.findIndex((a) => a.id === authorId);

  if (idx !== -1 && draft.meta.authors[idx]) {
    const updates = payload?.author ?? payload?.updates ?? payload;
    const { authorId: _a, id: _i, index: _idx, author: _au, updates: _up, ...rest } = payload;
    const finalUpdates = updates && typeof updates === 'object' && updates.id ? updates : { ...rest, ...updates };
    Object.assign(draft.meta.authors[idx], finalUpdates);
  }
}

export function handleRemoveAuthor(draft: Manuscript, payload: RemoveAuthorPayload | any): void {
  if (!draft.meta || !draft.meta.authors) return;
  const authorId = payload?.authorId ?? payload?.id;
  const idx = typeof payload?.index === 'number'
    ? payload.index
    : draft.meta.authors.findIndex((a) => a.id === authorId);

  if (idx !== -1) {
    draft.meta.authors.splice(idx, 1);
  }
}

export function handleAddAffiliation(draft: Manuscript, payload: any): void {
  const aff = payload?.affiliation ?? payload;
  if (!draft.meta) {
    draft.meta = {} as any;
  }
  if (!draft.meta.affiliations) {
    draft.meta.affiliations = [];
  }
  if (typeof payload?.index === 'number') {
    draft.meta.affiliations.splice(payload.index, 0, aff);
  } else {
    draft.meta.affiliations.push(aff);
  }
}

export function handleUpdateAffiliation(draft: Manuscript, payload: any): void {
  if (!draft.meta || !draft.meta.affiliations) return;
  const affId = payload?.affiliationId ?? payload?.id;
  const idx = typeof payload?.index === 'number'
    ? payload.index
    : draft.meta.affiliations.findIndex((a: any) => String(a.id) === String(affId));

  if (idx !== -1 && draft.meta.affiliations[idx]) {
    const updates = payload?.affiliation ?? payload?.updates ?? payload;
    const { affiliationId: _a, id: _i, index: _idx, affiliation: _aff, updates: _up, ...rest } = payload;
    const finalUpdates = updates && typeof updates === 'object' && updates.id ? updates : { ...rest, ...updates };
    Object.assign(draft.meta.affiliations[idx], finalUpdates);
  }
}

export function handleRemoveAffiliation(draft: Manuscript, payload: any): void {
  if (!draft.meta || !draft.meta.affiliations) return;
  const affId = payload?.affiliationId ?? payload?.id;
  const idx = typeof payload?.index === 'number'
    ? payload.index
    : draft.meta.affiliations.findIndex((a: any) => String(a.id) === String(affId));

  if (idx !== -1) {
    draft.meta.affiliations.splice(idx, 1);
  }
}

export function handleAddReference(draft: Manuscript, payload: AddReferencePayload | any): void {
  const ref = payload?.reference ?? payload;
  if (!draft.references) {
    draft.references = [];
  }
  if (typeof payload?.index === 'number') {
    draft.references.splice(payload.index, 0, ref);
  } else {
    draft.references.push(ref);
  }
}

export function handleUpdateReference(draft: Manuscript, payload: UpdateReferencePayload | any): void {
  if (!draft.references) {
    draft.references = [];
  }
  const refId = payload?.referenceId ?? payload?.id;
  const idx = typeof payload?.index === 'number'
    ? payload.index
    : draft.references.findIndex((r) => String(r.id) === String(refId));

  if (idx !== -1 && draft.references[idx]) {
    const updates = payload?.reference ?? payload?.updates ?? payload;
    const { referenceId: _r, id: _i, index: _idx, reference: _ref, updates: _u, ...rest } = payload;
    const finalUpdates = updates && typeof updates === 'object' && updates.id ? updates : { ...rest, ...updates };
    Object.assign(draft.references[idx], finalUpdates);
  }
}

export function handleRemoveReference(draft: Manuscript, payload: RemoveReferencePayload | any): void {
  const id = payload?.referenceId ?? payload?.id;
  if (!id) {
    throw new Error('referenceId must be provided to remove a reference');
  }
  if (!draft.references) {
    throw new Error('No references array in manuscript');
  }
  const idx = draft.references.findIndex((r) => String(r.id) === String(id));
  if (idx === -1) {
    throw new Error(`Reference with id "${id}" not found`);
  }
  draft.references.splice(idx, 1);
}

export interface HandlerRegistrar {
  registerHandler: (type: string, handler: (draft: Manuscript, payload: any) => void) => void;
}

export function registerBaseCommands(bus: HandlerRegistrar): void {
  bus.registerHandler('metadata/updateTitle', handleUpdateTitle);
  bus.registerHandler('metadata/updateAbstract', handleUpdateAbstract);
  bus.registerHandler('metadata/updateAuthors', handleUpdateAuthors);
  bus.registerHandler('metadata/updateKeywords', handleUpdateKeywords);
  bus.registerHandler('metadata/updateDates', handleUpdateDates);
  bus.registerHandler('metadata/updateField', handleUpdateMetadataField);
  bus.registerHandler('author/add', handleAddAuthor);
  bus.registerHandler('author/update', handleUpdateAuthor);
  bus.registerHandler('author/remove', handleRemoveAuthor);
  bus.registerHandler('affiliation/add', handleAddAffiliation);
  bus.registerHandler('affiliation/update', handleUpdateAffiliation);
  bus.registerHandler('affiliation/remove', handleRemoveAffiliation);
  bus.registerHandler('block/insert', handleInsertBlock);
  bus.registerHandler('block/update', handleUpdateBlock);
  bus.registerHandler('block/remove', handleRemoveBlock);
  bus.registerHandler('reference/add', handleAddReference);
  bus.registerHandler('reference/update', handleUpdateReference);
  bus.registerHandler('reference/remove', handleRemoveReference);
  bus.registerHandler('table/updateCell', handleUpdateCell);
}
