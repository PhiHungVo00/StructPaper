import type { Manuscript, AssetMeta } from '@structpaper/doc-model';

export type SyncState = 'synced' | 'pending' | 'conflict';

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
