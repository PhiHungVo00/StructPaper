import type { Id } from './inline';
import type { Manuscript } from './manuscript';

export interface Command<TPayload = unknown> {
  type: string;
  payload?: TPayload;
  undoable?: boolean;
  timestamp?: number;
}

export interface Patch {
  op: 'add' | 'remove' | 'replace' | 'move' | 'copy' | 'test';
  path: (string | number)[];
  value?: unknown;
}

export type InversePatch = Patch;

export interface ManuscriptRepository {
  get(id: Id): Promise<Manuscript | null>;
  save(doc: Manuscript): Promise<void>;
  delete(id: Id): Promise<void>;
  list(): Promise<Manuscript[]>;
}

export interface AssetRepository {
  get(sha256: string): Promise<Uint8Array | ArrayBuffer | Blob | null>;
  save(sha256: string, data: Uint8Array | ArrayBuffer | Blob, meta?: Record<string, unknown>): Promise<void>;
  exists(sha256: string): Promise<boolean>;
  delete?(sha256: string): Promise<void>;
}
