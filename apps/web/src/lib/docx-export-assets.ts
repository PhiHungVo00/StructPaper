import qrcode from 'qrcode-generator';
import type { CompletePaper } from '@/types/paper';
import { doiToUrl } from './qr-latex';

/** Bytes of a picture plus what Word's ImageRun needs to know about it. */
export interface DocxImage {
  data: Uint8Array;
  type: 'png' | 'jpg' | 'gif' | 'bmp';
  width: number;
  height: number;
}

export type ImageLoader = (src: string) => Promise<Uint8Array | null>;

/** Journal artwork served by the web app (same files the PDF compile uses). */
export const ARTWORK = {
  openAccess: '/demo-images/open-access.png',
  checkUpdate: '/demo-images/check-update.jpeg',
  pressLogo: '/demo-images/logo-vnuhcmpress-color.png',
} as const;

function base64ToBytes(b64: string): Uint8Array {
  if (typeof atob === 'function') {
    const bin = atob(b64);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }
  return new Uint8Array(Buffer.from(b64, 'base64'));
}

/** data: URLs decode locally; asset:/http(s):/blob:/root-relative paths are fetched (browser). */
export const defaultImageLoader: ImageLoader = async (src) => {
  try {
    if (src.startsWith('data:')) return base64ToBytes(src.slice(src.indexOf(',') + 1));
    if (typeof fetch !== 'function') return null;
    let url = src;
    if (src.startsWith('asset:')) {
      const { defaultApiBase } = await import('./documents/document-api');
      url = `${defaultApiBase().replace(/\/$/, '')}/api/v1/assets/${src.slice(6)}`;
    } else if (src.startsWith('/') && typeof window === 'undefined') {
      return null; // a site path has no meaning outside the browser (tests, workers)
    }
    const res = await fetch(url);
    return res.ok ? new Uint8Array(await res.arrayBuffer()) : null;
  } catch {
    return null;
  }
};

/** Image type and pixel size from the file header (PNG, JPEG, GIF, BMP); null for anything else. */
export function imageInfo(b: Uint8Array): Omit<DocxImage, 'data'> | null {
  if (b.length < 24) return null;
  const u16 = (i: number) => (b[i] << 8) | b[i + 1];
  const u32 = (i: number) => ((b[i] << 24) | (b[i + 1] << 16) | (b[i + 2] << 8) | b[i + 3]) >>> 0;
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return { type: 'png', width: u32(16), height: u32(20) };
  if (b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46) return { type: 'gif', width: b[6] | (b[7] << 8), height: b[8] | (b[9] << 8) };
  if (b[0] === 0x42 && b[1] === 0x4d) return { type: 'bmp', width: b[18] | (b[19] << 8), height: Math.abs((b[22] | (b[23] << 8)) << 16 >> 16) };
  if (b[0] === 0xff && b[1] === 0xd8) {
    let i = 2;
    while (i + 9 < b.length) {
      if (b[i] !== 0xff) return null;
      const marker = b[i + 1];
      const len = u16(i + 2);
      // SOF0..SOF15 except DHT(C4), JPG(C8), DAC(CC)
      if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
        return { type: 'jpg', height: u16(i + 5), width: u16(i + 7) };
      }
      i += 2 + len;
    }
  }
  return null;
}

export async function loadDocxImage(src: string | undefined, load: ImageLoader): Promise<DocxImage | null> {
  if (!src) return null;
  const data = await load(src);
  if (!data) return null;
  const info = imageInfo(data);
  return info && info.width > 0 && info.height > 0 ? { data, ...info } : null;
}

/** QR code of the article DOI as a GIF (null while the DOI is "?" / blank, like the PDF). */
export function qrImageFor(doi: string | undefined): DocxImage | null {
  const url = doiToUrl(doi);
  if (!url) return null;
  const qr = qrcode(0, 'M');
  qr.addData(url);
  qr.make();
  const cell = 6;
  const margin = 2 * cell;
  const dataUrl = qr.createDataURL(cell, margin);
  const data = base64ToBytes(dataUrl.slice(dataUrl.indexOf(',') + 1));
  const size = qr.getModuleCount() * cell + 2 * margin;
  return { data, type: 'gif', width: size, height: size };
}

export interface ExportAssets {
  figures: Map<string, DocxImage>;
  qr: DocxImage | null;
  openAccess: DocxImage | null;
  checkUpdate: DocxImage | null;
}

/** Resolve every picture the Word file needs; a picture that cannot be loaded is simply left out. */
export async function collectExportAssets(paper: CompletePaper, doi: string, load: ImageLoader): Promise<ExportAssets> {
  const figures = new Map<string, DocxImage>();
  await Promise.all(
    (paper.sections || []).map(async (s) => {
      if (s.type === 'figure' && s.figure?.src) {
        const img = await loadDocxImage(s.figure.src, load);
        if (img) figures.set(s.id, img);
      }
    })
  );
  const [openAccess, checkUpdate] = await Promise.all([
    loadDocxImage(ARTWORK.openAccess, load),
    loadDocxImage(ARTWORK.checkUpdate, load),
  ]);
  return { figures, qr: qrImageFor(doi), openAccess, checkUpdate };
}
