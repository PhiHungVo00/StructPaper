import type {
  Manuscript,
  ManuscriptRepository,
  ManuscriptSummary,
  ManuscriptInfo,
  ManuscriptRecord,
  WorkflowStatus,
} from '@structpaper/doc-model';
import type { StructPaperDatabase } from '../db/structpaper-db';
import type { StoredAssetRef, StoredManuscript, StoredRevision, SyncState } from '../db/types';

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
 * Converts a StoredManuscript row to a canonical ManuscriptInfo object.
 */
export function recordToManuscriptInfo(r: StoredManuscript): ManuscriptInfo {
  return {
    id: r.id,
    displayName: r.displayName || r.title || 'Untitled Document',
    submissionId: r.submissionId,
    note: r.note,
    tags: Array.isArray(r.tags) ? r.tags : [],
    workflowStatus: r.workflowStatus || (r.status as WorkflowStatus) || 'draft',
    pinned: Boolean(r.pinned),
    archived: Boolean(r.archived),
    color: r.color,
    ownerId: r.ownerId,
    createdAt: r.createdAt || r.updatedAt,
    updatedAt: r.updatedAt,
    lastOpenedAt: r.lastOpenedAt,
    source:
      r.sourceFileName && r.sourceSha256
        ? {
            fileName: r.sourceFileName,
            sha256: r.sourceSha256,
            importedAt: r.createdAt || r.updatedAt,
          }
        : undefined,
  };
}

/**
 * IndexedDbManuscriptRepo implements ManuscriptRepository using Dexie IndexedDB.
 * Supports dual access: raw document operations & full ManuscriptRecord (doc + info).
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

  /**
   * Retrieves full ManuscriptRecord (doc + info + revision).
   */
  async getRecord(id: string): Promise<ManuscriptRecord | null> {
    const record = await this.db.manuscripts.get(id);
    if (!record) return null;
    return {
      info: recordToManuscriptInfo(record),
      doc: record.doc,
      revision: record.rev,
    };
  }

  /**
   * Lists all manuscripts as ManuscriptRecords, sorted with pinned items first,
   * then by updatedAt descending.
   */
  async listRecords(): Promise<ManuscriptRecord[]> {
    const records = await this.db.manuscripts.toArray();
    records.sort((a, b) => {
      const aPinned = Boolean(a.pinned);
      const bPinned = Boolean(b.pinned);
      if (aPinned !== bPinned) {
        return aPinned ? -1 : 1;
      }
      return b.updatedAt.localeCompare(a.updatedAt);
    });
    return records.map((r) => ({
      info: recordToManuscriptInfo(r),
      doc: r.doc,
      revision: r.rev,
    }));
  }

  /**
   * Updates only metadata info fields in the manuscripts table.
   * DOES NOT bump doc.rev and DOES NOT write to revisions table (PDF Spec 3.6).
   */
  async updateInfo(id: string, patch: Partial<ManuscriptInfo>): Promise<void> {
    const existing = await this.db.manuscripts.get(id);
    if (!existing) {
      throw new Error(`Manuscript with id ${id} not found`);
    }

    const updates: Partial<StoredManuscript> = {
      infoUpdatedAt: new Date().toISOString(),
    };

    if (patch.displayName !== undefined) {
      updates.displayName = patch.displayName;
    }
    if (patch.submissionId !== undefined) {
      updates.submissionId = patch.submissionId;
    }
    if (patch.note !== undefined) {
      updates.note = patch.note;
    }
    if (patch.tags !== undefined) {
      updates.tags = patch.tags;
    }
    if (patch.workflowStatus !== undefined) {
      updates.workflowStatus = patch.workflowStatus;
      updates.status = patch.workflowStatus;
    }
    if (patch.pinned !== undefined) {
      updates.pinned = patch.pinned;
    }
    if (patch.archived !== undefined) {
      updates.archived = patch.archived;
    }
    if (patch.color !== undefined) {
      updates.color = patch.color;
    }
    if (patch.ownerId !== undefined) {
      updates.ownerId = patch.ownerId;
    }
    if (patch.lastOpenedAt !== undefined) {
      updates.lastOpenedAt = patch.lastOpenedAt;
    }
    if (patch.source !== undefined) {
      updates.sourceFileName = patch.source.fileName;
      updates.sourceSha256 = patch.source.sha256;
    }
    if ((patch as any).sourceFileName !== undefined) {
      updates.sourceFileName = (patch as any).sourceFileName;
    }
    if ((patch as any).sourceSha256 !== undefined) {
      updates.sourceSha256 = (patch as any).sourceSha256;
    }

    await (this.db.manuscripts as any).update(id, updates);
  }

  async save(doc: Manuscript, info?: Partial<ManuscriptInfo>): Promise<void> {
    const title = extractTitle(doc);
    const updatedAt = (doc as any).updatedAt || new Date().toISOString();
    const schemaVersion = doc.schemaVersion ?? 2;

    await this.db.transaction(
      'rw',
      [this.db.manuscripts, this.db.revisions, this.db.assetRefs],
      async () => {
        const existing = await this.db.manuscripts.get(doc.id);

        const rev =
          typeof (doc as any).rev === 'number'
            ? (doc as any).rev
            : existing
            ? existing.rev + 1
            : 1;

        const syncState: SyncState = (doc as any).syncState || existing?.syncState || 'synced';

        const workflowStatus: WorkflowStatus =
          info?.workflowStatus ??
          existing?.workflowStatus ??
          ((doc as any).status as WorkflowStatus) ??
          'draft';

        const status = workflowStatus;

        const displayName =
          info?.displayName ??
          existing?.displayName ??
          title ??
          'Untitled Document';

        const pinned = info?.pinned ?? existing?.pinned ?? false;
        const archived = info?.archived ?? existing?.archived ?? false;
        const tags = info?.tags ?? existing?.tags ?? [];
        const submissionId = info?.submissionId ?? existing?.submissionId;
        const note = info?.note ?? existing?.note;
        const color = info?.color ?? existing?.color;
        const ownerId = info?.ownerId ?? existing?.ownerId;
        const createdAt = info?.createdAt ?? existing?.createdAt ?? updatedAt;
        const lastOpenedAt = info?.lastOpenedAt ?? existing?.lastOpenedAt;
        const sourceFileName =
          info?.source?.fileName ??
          (info as any)?.sourceFileName ??
          existing?.sourceFileName;
        const sourceSha256 =
          info?.source?.sha256 ??
          (info as any)?.sourceSha256 ??
          existing?.sourceSha256;
        const infoUpdatedAt = info ? new Date().toISOString() : existing?.infoUpdatedAt;

        const stored: StoredManuscript = {
          id: doc.id,
          journalId: doc.journalId,
          title,
          status,
          syncState,
          rev,
          schemaVersion,
          updatedAt,
          doc,
          displayName,
          workflowStatus,
          pinned,
          archived,
          tags,
          createdAt,
          ...(submissionId ? { submissionId } : {}),
          ...(note !== undefined ? { note } : {}),
          ...(color ? { color } : {}),
          ...(ownerId ? { ownerId } : {}),
          ...(lastOpenedAt ? { lastOpenedAt } : {}),
          ...(sourceFileName ? { sourceFileName } : {}),
          ...(sourceSha256 ? { sourceSha256 } : {}),
          ...(infoUpdatedAt ? { infoUpdatedAt } : {}),
        };

        // 1. Put document record
        await this.db.manuscripts.put(stored);

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
