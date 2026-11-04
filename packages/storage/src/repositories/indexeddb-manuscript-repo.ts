import type {
  Manuscript,
  ManuscriptRepository,
  ManuscriptSummary,
} from '@structpaper/doc-model';
import type { StructPaperDatabase } from '../db/structpaper-db';
import type { StoredAssetRef, StoredRevision, SyncState } from '../db/types';

/**
 * Extracts plain text title from a Manuscript object.
 */
export function extractTitle(doc: Manuscript): string {
  if (typeof (doc as any).title === 'string' && (doc as any).title.trim()) {
    return (doc as any).title.trim();
  }
  if (typeof (doc.meta as any)?.title === 'string' && (doc.meta as any).title.trim()) {
    return (doc.meta as any).title.trim();
  }
  if (Array.isArray(doc.meta?.title)) {
    const text = doc.meta.title
      .map((item) => {
        if (typeof item === 'string') return item;
        if ('v' in item && typeof item.v === 'string') return item.v;
        if ('text' in item && typeof (item as any).text === 'string') return (item as any).text;
        return '';
      })
      .join('')
      .trim();
    if (text) return text;
  }
  return 'Untitled Manuscript';
}

/**
 * IndexedDbManuscriptRepo implements ManuscriptRepository using Dexie IndexedDB.
 * Handles transactional save with revision tracking and assetRefs maintenance.
 */
export class IndexedDbManuscriptRepo implements ManuscriptRepository {
  constructor(private db: StructPaperDatabase) {}

  async getById(id: string): Promise<Manuscript | null> {
    const record = await this.db.manuscripts.get(id);
    if (!record) return null;
    return record.doc;
  }

  async get(id: string): Promise<Manuscript | null> {
    return this.getById(id);
  }

  async save(doc: Manuscript): Promise<void> {
    const title = extractTitle(doc);
    const rev = typeof (doc as any).rev === 'number' ? (doc as any).rev : 1;
    const updatedAt = (doc as any).updatedAt || new Date().toISOString();
    const status = (doc as any).status || 'draft';
    const syncState: SyncState = (doc as any).syncState || 'synced';
    const schemaVersion = doc.schemaVersion ?? 2;

    await this.db.transaction(
      'rw',
      [this.db.manuscripts, this.db.revisions, this.db.assetRefs],
      async () => {
        // 1. Put document record
        await this.db.manuscripts.put({
          id: doc.id,
          journalId: doc.journalId,
          title,
          status,
          syncState,
          rev,
          schemaVersion,
          updatedAt,
          doc,
        });

        // 2. Put revision snapshot
        const revisionId = `${doc.id}_rev_${rev}`;
        await this.db.revisions.put({
          id: revisionId,
          manuscriptId: doc.id,
          rev,
          createdAt: updatedAt,
          doc,
        });

        // 3. Update assetRefs
        await this.db.assetRefs.where('manuscriptId').equals(doc.id).delete();

        if (doc.assets && typeof doc.assets === 'object') {
          const assetEntries = Object.values(doc.assets);
          const refsToPut: StoredAssetRef[] = [];
          const seenHashes = new Set<string>();

          for (const asset of assetEntries) {
            const hash = asset.sha256 || asset.id;
            if (hash && !seenHashes.has(hash)) {
              seenHashes.add(hash);
              refsToPut.push({ manuscriptId: doc.id, hash });
            }
          }

          if (refsToPut.length > 0) {
            await this.db.assetRefs.bulkPut(refsToPut);
          }
        }
      }
    );
  }

  async delete(id: string): Promise<void> {
    await this.db.transaction(
      'rw',
      [this.db.manuscripts, this.db.revisions, this.db.assetRefs],
      async () => {
        await this.db.assetRefs.where('manuscriptId').equals(id).delete();
        await this.db.revisions.where('manuscriptId').equals(id).delete();
        await this.db.manuscripts.delete(id);
      }
    );
  }

  async listRecent(limit?: number): Promise<ManuscriptSummary[]> {
    let query = this.db.manuscripts.orderBy('updatedAt').reverse();
    if (typeof limit === 'number' && limit > 0) {
      query = query.limit(limit);
    }
    const records = await query.toArray();
    return records.map((r) => ({
      id: r.id,
      title: r.title,
      journalId: r.journalId,
      updatedAt: r.updatedAt,
      rev: r.rev,
    }));
  }

  async list(): Promise<Manuscript[]> {
    const records = await this.db.manuscripts.orderBy('updatedAt').reverse().toArray();
    return records.map((r) => r.doc);
  }

  async getRevision(manuscriptId: string, rev: number): Promise<Manuscript | null> {
    const record = await this.db.revisions
      .where('[manuscriptId+rev]')
      .equals([manuscriptId, rev])
      .first();
    return record ? record.doc : null;
  }

  async listRevisions(manuscriptId: string): Promise<StoredRevision[]> {
    return this.db.revisions
      .where('manuscriptId')
      .equals(manuscriptId)
      .sortBy('rev');
  }
}
