import type { Manuscript, AssetMeta } from '../types/manuscript';

export interface ManuscriptSummary {
  id: string;
  title: string;
  journalId: string;
  updatedAt: string;
  rev: number;
}

export interface ManuscriptRepository {
  getById(id: string): Promise<Manuscript | null>;
  save(doc: Manuscript): Promise<void>;
  delete(id: string): Promise<void>;
  listRecent(): Promise<ManuscriptSummary[]>;
  get?(id: string): Promise<Manuscript | null>;
  list?(): Promise<Manuscript[]>;
}

export interface AssetRepository {
  getByHash(hash: string): Promise<Blob | null>;
  save(hash: string, blob: Blob, meta?: AssetMeta | Record<string, unknown>): Promise<void>;
  has(hash: string): Promise<boolean>;
  get?(sha256: string): Promise<Uint8Array | ArrayBuffer | Blob | null>;
  exists?(sha256: string): Promise<boolean>;
  delete?(sha256: string): Promise<void>;
}
