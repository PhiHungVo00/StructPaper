import JSZip from 'jszip';
import type { AssetMeta, AssetRepository, Manuscript } from '@structpaper/doc-model';

export interface ImportedBackup {
  doc: Manuscript;
  assets: Array<{
    hash: string;
    blob: Blob;
    meta: AssetMeta;
  }>;
}

/**
 * Generates a .structpaper zip archive containing manuscript.json and all referenced images.
 */
export async function exportBackup(
  doc: Manuscript,
  assetRepo: AssetRepository
): Promise<Blob> {
  const zip = new JSZip();

  // 1. Add manuscript.json
  const manuscriptJson = JSON.stringify(doc, null, 2);
  zip.file('manuscript.json', manuscriptJson);

  // 2. Add referenced assets
  const assetsFolder = zip.folder('assets');
  if (assetsFolder && doc.assets) {
    const assetEntries = Object.values(doc.assets);
    for (const meta of assetEntries) {
      const hash = meta.sha256 || meta.id;
      if (!hash) continue;

      const blob = await assetRepo.getByHash(hash);
      if (blob) {
        const buffer = await blob.arrayBuffer();
        assetsFolder.file(hash, buffer);
      }
    }
  }

  // 3. Generate compressed archive
  return zip.generateAsync({
    type: 'blob',
    mimeType: 'application/x-structpaper-archive',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });
}

/**
 * Imports a .structpaper zip archive, parsing manuscript.json and extracting all assets.
 */
export async function importBackup(zipBlob: Blob): Promise<ImportedBackup> {
  const zip = await JSZip.loadAsync(zipBlob);

  // 1. Extract manuscript.json
  const manuscriptFile = zip.file('manuscript.json');
  if (!manuscriptFile) {
    throw new Error('Invalid .structpaper archive: manuscript.json not found');
  }

  const jsonText = await manuscriptFile.async('text');
  const doc: Manuscript = JSON.parse(jsonText);

  // 2. Extract assets
  const loadedAssets: Array<{ hash: string; blob: Blob; meta: AssetMeta }> = [];
  const assetsFolder = zip.folder('assets');

  if (assetsFolder) {
    const promises: Promise<void>[] = [];

    assetsFolder.forEach((relativePath, zipEntry) => {
      if (zipEntry.dir) return;

      promises.push(
        (async () => {
          const hash = relativePath.split('/').pop() || relativePath;
          const arrayBuffer = await zipEntry.async('arraybuffer');

          // Match meta from doc.assets
          let meta: AssetMeta | undefined;
          if (doc.assets && typeof doc.assets === 'object') {
            meta = Object.values(doc.assets).find(
              (a) => a.sha256 === hash || a.id === hash
            );
          }

          const mimeType = meta?.mimeType || 'application/octet-stream';
          const blob = new Blob([arrayBuffer], { type: mimeType });

          if (!meta) {
            meta = {
              id: hash,
              sha256: hash,
              mimeType,
              sizeBytes: blob.size,
            };
          }

          loadedAssets.push({ hash, blob, meta });
        })()
      );
    });

    await Promise.all(promises);
  }

  return {
    doc,
    assets: loadedAssets,
  };
}
