import { defaultDatabase, IndexedDbAssetRepo } from '@structpaper/storage';
import { computeSha256 } from '@structpaper/compiler-client';

const trackedObjectUrls = new Set<string>();
const trackedObjectUrlMimes = new Map<string, string>();

/**
 * Normalizes a MIME type string and maps known image MIME types to 'jpg' or 'png'.
 */
export function mimeToImageExt(mimeType?: string): 'jpg' | 'png' | null {
  if (!mimeType || typeof mimeType !== 'string') return null;
  const normalized = mimeType.split(';')[0]?.trim().toLowerCase() || '';
  if (!normalized) return null;
  if (normalized === 'image/jpeg' || normalized === 'image/jpg' || normalized.includes('jpeg')) {
    return 'jpg';
  }
  if (normalized === 'image/png' || normalized.includes('png')) {
    return 'png';
  }
  return null;
}

/**
 * Associates a MIME type with a tracked blob: Object URL for synchronous filename resolution.
 */
export function setTrackedObjectUrlMime(url: string, mimeType: string): void {
  if (!url || !mimeType) return;
  const normalized = mimeType.split(';')[0]?.trim().toLowerCase();
  if (normalized) {
    trackedObjectUrlMimes.set(url, normalized);
  }
}

/**
 * Resolves the tracked image extension ('jpg' or 'png') for a blob: Object URL, if known.
 */
export function getTrackedObjectUrlExt(url?: string): 'jpg' | 'png' | null {
  if (!url) return null;
  return mimeToImageExt(trackedObjectUrlMimes.get(url.trim()));
}

/**
 * Reads a Blob into an ArrayBuffer with Response and FileReader fallbacks.
 */
export async function readBlobAsArrayBuffer(blob: Blob): Promise<ArrayBuffer> {
  if (typeof blob.arrayBuffer === 'function') {
    return await blob.arrayBuffer();
  }
  if (typeof Response !== 'undefined') {
    return await new Response(blob).arrayBuffer();
  }
  return await new Promise<ArrayBuffer>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () => reject(reader.error || new Error('Failed to read blob'));
    reader.readAsArrayBuffer(blob);
  });
}

/**
 * Creates and tracks a session-scoped blob: Object URL for lightweight image previews.
 */
export function createSessionImageObjectUrl(blob: Blob): string | null {
  if (typeof URL === 'undefined' || typeof URL.createObjectURL !== 'function') {
    return null;
  }
  try {
    const url = URL.createObjectURL(blob);
    if (url) {
      trackedObjectUrls.add(url);
      if (blob.type) {
        setTrackedObjectUrlMime(url, blob.type);
      }
      return url;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Revokes a single tracked blob: Object URL when explicitly releasing session resources.
 */
export function revokeTrackedObjectUrl(url: string): void {
  if (!url) return;
  trackedObjectUrlMimes.delete(url);
  if (!trackedObjectUrls.has(url)) return;
  trackedObjectUrls.delete(url);
  if (typeof URL !== 'undefined' && typeof URL.revokeObjectURL === 'function') {
    try {
      URL.revokeObjectURL(url);
    } catch {
      // Ignore revocation failures in constrained environments
    }
  }
}

/**
 * Revokes a specific collection of tracked blob: Object URLs, or all tracked URLs when omitted.
 */
export function revokeTrackedObjectUrls(urls?: Iterable<string>): void {
  const targets = urls ? Array.from(urls) : Array.from(trackedObjectUrls);
  for (const url of targets) {
    revokeTrackedObjectUrl(url);
  }
}

/**
 * Revokes all tracked session blob: Object URLs.
 */
export function revokeAllTrackedSessionObjectUrls(): void {
  revokeTrackedObjectUrls();
}

/**
 * Returns currently tracked blob: Object URLs (primarily for diagnostics/tests).
 */
export function getTrackedSessionObjectUrls(): string[] {
  return Array.from(trackedObjectUrls);
}

async function computeBlobSha256(blob: Blob): Promise<string> {
  const buffer = await readBlobAsArrayBuffer(blob);
  if (globalThis.crypto?.subtle?.digest) {
    const hashBuffer = await globalThis.crypto.subtle.digest('SHA-256', buffer);
    return Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }
  return computeSha256(new Uint8Array(buffer));
}

/**
 * Quietly persists a Blob in IndexedDbAssetRepo and returns its SHA-256 assetId on success.
 */
export async function cacheBlobAssetQuietly(blob: Blob): Promise<string | null> {
  if (typeof window === 'undefined' || typeof window.indexedDB === 'undefined') {
    return null;
  }
  try {
    const assetId = await computeBlobSha256(blob);
    const assetRepo = new IndexedDbAssetRepo(defaultDatabase);
    await assetRepo.save(assetId, blob, {
      mimeType: blob.type || 'application/octet-stream',
      sizeBytes: blob.size,
    });
    return assetId;
  } catch {
    return null;
  }
}

/**
 * Hydrates a figure blob: Object URL from IndexedDbAssetRepo by assetId for post-reload recovery.
 */
export async function hydrateFigureAssetById(assetId: string): Promise<string | null> {
  if (!assetId || typeof window === 'undefined' || typeof window.indexedDB === 'undefined') {
    return null;
  }
  try {
    const assetRepo = new IndexedDbAssetRepo(defaultDatabase);
    const blob = await assetRepo.get(assetId);
    if (!blob) return null;
    return createSessionImageObjectUrl(blob);
  } catch {
    return null;
  }
}
