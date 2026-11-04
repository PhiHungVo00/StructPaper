import Dexie, { type Table } from 'dexie';
import type {
  StoredManuscript,
  StoredRevision,
  StoredAsset,
  StoredAssetRef,
  StoredIngestSource,
  StoredOutboxItem,
  StoredCompileCache,
  StoredSetting,
} from './types';

/**
 * StructPaperDatabase provides client-side offline-first persistence via Dexie IndexedDB.
 * Manages 8 indexed tables: manuscripts, revisions, assets, assetRefs, ingestSources,
 * outbox, compileCache, and settings.
 */
export class StructPaperDatabase extends Dexie {
  manuscripts!: Table<StoredManuscript, string>;
  revisions!: Table<StoredRevision, string>;
  assets!: Table<StoredAsset, string>;
  assetRefs!: Table<StoredAssetRef, [string, string]>;
  ingestSources!: Table<StoredIngestSource, string>;
  outbox!: Table<StoredOutboxItem, number>;
  compileCache!: Table<StoredCompileCache, string>;
  settings!: Table<StoredSetting, string>;

  constructor(dbName = 'StructPaperDB') {
    super(dbName);

    this.version(1).stores({
      manuscripts:
        'id, [journalId+updatedAt], status, syncState, rev, schemaVersion, title, updatedAt',
      revisions: 'id, [manuscriptId+rev], manuscriptId, rev, createdAt',
      assets: 'hash, mime, size, width, height, dpi, vector',
      assetRefs: '[manuscriptId+hash], manuscriptId, hash',
      ingestSources: 'manuscriptId',
      outbox: '++seq, manuscriptId, attempts',
      compileCache: 'hash, cachedAt',
      settings: 'key',
    });
  }
}

export const defaultDatabase = new StructPaperDatabase();
