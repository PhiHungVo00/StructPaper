import type { Manuscript, AssetMeta, WorkflowStatus } from '@structpaper/doc-model';

export type SyncState = 'synced' | 'pending' | 'conflict';

/**
 * Flattened stored manuscript entity in Dexie IndexedDB (PDF Spec 3.6, 9.2).
 * Combines core document payload with indexable ManuscriptInfo fields.
 */
export interface StoredManuscript {
  id: string;
  journalId: string;
  title: string;
  status: string;
  syncState: SyncState;
  rev: number;
  schemaVersion: number;
  updatedAt: string;
  doc: Manuscript;

  // Flattened ManuscriptInfo fields
  displayName: string;
  submissionId?: string;
  note?: string;
  tags: string[];
  workflowStatus: WorkflowStatus;
  pinned: boolean;
  archived: boolean;
  color?: string;
  sourceFileName?: string;
  sourceSha256?: string;
  ownerId?: string;
  createdAt: string;
  lastOpenedAt?: string;
  infoUpdatedAt?: string;
}

export interface StoredRevision {
  id: string;
  manuscriptId: string;
  rev: number;
  createdAt: string;
  doc: Manuscript;
}

export interface StoredAsset {
  hash: string;
  blob: Blob;
  mime: string;
  size: number;
  width?: number;
  height?: number;
  dpi?: number;
  vector?: boolean;
  meta?: AssetMeta | Record<string, unknown>;
}

export interface StoredAssetRef {
  manuscriptId: string;
  hash: string;
}

export interface StoredIngestSource {
  manuscriptId: string;
  fileName?: string;
  blob?: Blob;
  importedAt: string;
}

export interface StoredOutboxItem {
  seq?: number;
  manuscriptId: string;
  attempts: number;
  action: string;
  payload?: unknown;
  createdAt: string;
}

export interface StoredCompileCache {
  hash: string;
  cachedAt: string;
  pdfBlob?: Blob;
  logs?: string;
}

export interface StoredSetting {
  key: string;
  value: unknown;
  updatedAt?: string;
}

/**
 * Stored 3-tier profile snapshot cached in Dexie (PDF Spec 5.1d, 9.2).
 * Primary key: [scopeType+scopeId+version]
 */
export interface StoredProfile {
  scopeType: 'base' | 'journal' | 'articleType' | string;
  scopeId: string;
  version: number;
  state: 'draft' | 'published' | 'deprecated' | string;
  data: unknown;
  fetchedAt: string;
  etag?: string;
}

/**
 * Metadata index for cached profile versions and updates.
 * Primary key: [scopeType+scopeId]
 */
export interface StoredProfileIndex {
  scopeType: 'base' | 'journal' | 'articleType' | string;
  scopeId: string;
  checkedAt: string;
  latestVersion?: number;
  availableVersions?: number[];
  etag?: string;
}
