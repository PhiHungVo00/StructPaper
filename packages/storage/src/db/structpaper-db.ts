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
  StoredProfile,
  StoredProfileIndex,
} from './types';

/**
 * StructPaperDatabase provides client-side offline-first persistence via Dexie IndexedDB.
 * Manages 10 indexed tables in v2 schema (PDF Spec 3.6, 5.1d, 9.2).
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
  profiles!: Table<StoredProfile, [string, string, number]>;
  profileIndex!: Table<StoredProfileIndex, [string, string]>;

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

    this.version(2)
      .stores({
        manuscripts:
          'id, [journalId+updatedAt], workflowStatus, displayName, *tags, pinned, archived, syncState, updatedAt',
        profiles: '[scopeType+scopeId+version], scopeType, scopeId, version, state, fetchedAt',
        profileIndex: '[scopeType+scopeId], scopeType, scopeId, checkedAt',
      })
      .upgrade((tx) => {
        return tx
          .table('manuscripts')
          .toCollection()
          .modify((manuscript: any) => {
            const now = new Date().toISOString();
            if (!manuscript.displayName) {
              manuscript.displayName = manuscript.title || 'Untitled Document';
            }
            if (!manuscript.workflowStatus) {
              manuscript.workflowStatus = 'draft';
            }
            if (typeof manuscript.pinned !== 'boolean') {
              manuscript.pinned = false;
            }
            if (typeof manuscript.archived !== 'boolean') {
              manuscript.archived = false;
            }
            if (!Array.isArray(manuscript.tags)) {
              manuscript.tags = [];
            }
            if (!manuscript.createdAt) {
              manuscript.createdAt = manuscript.updatedAt || now;
            }
            if (!manuscript.updatedAt) {
              manuscript.updatedAt = now;
            }
          });
      });
  }
}

export const defaultDatabase = new StructPaperDatabase();
