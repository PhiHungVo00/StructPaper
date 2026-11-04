import type { AssetMeta, AssetRepository } from '@structpaper/doc-model';
import type { StructPaperDatabase } from '../db/structpaper-db';

/**
 * IndexedDbAssetRepo implements AssetRepository using Dexie IndexedDB.
 * Stores binary images as raw Blobs indexed by their SHA-256 hash.
 */
export class IndexedDbAssetRepo implements AssetRepository {
  constructor(private db: StructPaperDatabase) {}

  async getByHash(hash: string): Promise<Blob | null> {
    const record = await this.db.assets.get(hash);
    if (!record) return null;
    return record.blob;
  }

  async save(
    hash: string,
    blob: Blob,
    meta?: AssetMeta | Record<string, unknown>
  ): Promise<void> {
    const mime =
      (meta as any)?.mimeType ||
      (meta as any)?.mime ||
      blob.type ||
      'application/octet-stream';
    const size = (meta as any)?.sizeBytes ?? (meta as any)?.size ?? blob.size;
    const width = (meta as any)?.width;
    const height = (meta as any)?.height;
    const dpi = (meta as any)?.dpi;
    const vector =
      (meta as any)?.vector ?? (mime === 'image/svg+xml' || mime.includes('svg'));

    await this.db.assets.put({
      hash,
      blob,
      mime,
      size,
      width,
      height,
      dpi,
      vector,
      meta,
    });
  }

  async has(hash: string): Promise<boolean> {
    const record = await this.db.assets.get(hash);
    return record !== undefined;
  }

  async get(sha256: string): Promise<Blob | null> {
    return this.getByHash(sha256);
  }

  async exists(sha256: string): Promise<boolean> {
    return this.has(sha256);
  }

  async delete(sha256: string): Promise<void> {
    await this.db.assets.delete(sha256);
  }
}
