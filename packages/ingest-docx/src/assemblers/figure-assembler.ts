import type { AssetMeta, FigureBlock } from '@structpaper/doc-model';
import type { RawDrawing, RawParagraph } from '../types/raw-doc';
import type { RecognizedBlock } from './types';
import { paragraphToInlines } from './inline-utils';

export interface FigureAssemblerContext {
  media?: Map<string, Uint8Array>;
  rels?: Map<string, string>;
}

export interface AssembleFigureOptions {
  id?: string;
  captionBlock?: RecognizedBlock;
  sourceBlock?: RecognizedBlock;
}

/**
 * FigureAssembler converts RawDrawing OOXML nodes into normalized FigureBlock structures,
 * calculates SHA-256 asset hashes, and collects binary assets into an AssetMeta dictionary.
 */
export class FigureAssembler {
  private readonly media: Map<string, Uint8Array>;
  private readonly rels: Map<string, string>;
  private readonly assets: Record<string, AssetMeta> = {};
  private idCounter = 0;

  public constructor(ctx: FigureAssemblerContext = {}) {
    this.media = ctx.media || new Map();
    this.rels = ctx.rels || new Map();
  }

  public getAssets(): Record<string, AssetMeta> {
    return { ...this.assets };
  }

  /**
   * Assembles a RawParagraph containing drawings into a FigureBlock.
   */
  public assembleFigure(
    paragraph: RawParagraph,
    options: AssembleFigureOptions = {}
  ): FigureBlock {
    const id = options.id || `fig-${++this.idCounter}`;
    const drawing = paragraph.drawings && paragraph.drawings.length > 0
      ? paragraph.drawings[0]
      : undefined;

    const { assetId, assetMeta } = this.resolveAsset(drawing, id);
    if (assetMeta) {
      this.assets[assetId] = assetMeta;
    }

    const caption = options.captionBlock?.raw.type === 'paragraph'
      ? paragraphToInlines(options.captionBlock.raw)
      : [];

    const source = options.sourceBlock?.raw.type === 'paragraph'
      ? paragraphToInlines(options.sourceBlock.raw)
      : undefined;

    return {
      type: 'figure',
      id,
      assetId,
      caption,
      ...(source && source.length > 0 ? { source } : {}),
      layout: {
        columnSpan: '1-column',
        alignment: 'center',
      },
    };
  }

  private resolveAsset(
    drawing: RawDrawing | undefined,
    fallbackId: string
  ): { assetId: string; assetMeta?: AssetMeta } {
    if (!drawing) {
      return { assetId: `placeholder-${fallbackId}` };
    }

    let bytes: Uint8Array | undefined;
    let targetPath = '';

    if (drawing.rId && this.rels.has(drawing.rId)) {
      targetPath = this.rels.get(drawing.rId)!;
      bytes = this.media.get(targetPath);
    }

    if (!bytes && drawing.filename) {
      const candidates = [
        drawing.filename,
        `media/${drawing.filename}`,
        `word/media/${drawing.filename}`,
      ];
      for (const cand of candidates) {
        if (this.media.has(cand)) {
          bytes = this.media.get(cand);
          targetPath = cand;
          break;
        }
      }
    }

    if (!bytes && drawing.rId && this.media.has(drawing.rId)) {
      bytes = this.media.get(drawing.rId);
      targetPath = drawing.rId;
    }

    if (!bytes) {
      return { assetId: `missing-${fallbackId}` };
    }

    const sha256 = computeSha256(bytes);
    const mimeType = detectMimeType(targetPath || drawing.filename || '', bytes);

    const assetMeta: AssetMeta = {
      id: sha256,
      sha256,
      mimeType,
      fileName: drawing.filename || targetPath.split('/').pop(),
      sizeBytes: bytes.length,
      width: drawing.width,
      height: drawing.height,
      dpi: 300,
    };

    return { assetId: sha256, assetMeta };
  }
}

/**
 * Computes SHA-256 hash formatted as a 64-character lowercase hexadecimal string.
 * Uses Node crypto when present, falling back to pure JavaScript RFC 6234.
 */
export function computeSha256(bytes: Uint8Array): string {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const cryptoMod = typeof require !== 'undefined' ? require('crypto') : undefined;
    if (cryptoMod && typeof cryptoMod.createHash === 'function') {
      return cryptoMod.createHash('sha256').update(bytes).digest('hex');
    }
  } catch {
    // fallback to pure JS
  }

  return pureJsSha256(bytes);
}

const K = [
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
];

function rotr(n: number, x: number): number {
  return (x >>> n) | (x << (32 - n));
}

function pureJsSha256(data: Uint8Array): string {
  const byteLen = data.length;
  const bitLen = byteLen * 8;
  const withOne = byteLen + 1;
  const padLen = (withOne % 64 <= 56) ? 56 - (withOne % 64) : 120 - (withOne % 64);
  const totalLen = withOne + padLen + 8;
  const padded = new Uint8Array(totalLen);
  padded.set(data);
  padded[byteLen] = 0x80;

  const view = new DataView(padded.buffer);
  view.setUint32(totalLen - 4, bitLen >>> 0);
  view.setUint32(totalLen - 8, Math.floor(bitLen / 0x100000000));

  let h0 = 0x6a09e667;
  let h1 = 0xbb67ae85;
  let h2 = 0x3c6ef372;
  let h3 = 0xa54ff53a;
  let h4 = 0x510e527f;
  let h5 = 0x9b05688c;
  let h6 = 0x1f83d9ab;
  let h7 = 0x5be0cd19;

  const w = new Uint32Array(64);

  for (let offset = 0; offset < totalLen; offset += 64) {
    for (let i = 0; i < 16; i++) {
      w[i] = view.getUint32(offset + i * 4);
    }
    for (let i = 16; i < 64; i++) {
      const s0 = rotr(7, w[i - 15]) ^ rotr(18, w[i - 15]) ^ (w[i - 15] >>> 3);
      const s1 = rotr(17, w[i - 2]) ^ rotr(19, w[i - 2]) ^ (w[i - 2] >>> 10);
      w[i] = (w[i - 16] + s0 + w[i - 7] + s1) >>> 0;
    }

    let a = h0;
    let b = h1;
    let c = h2;
    let d = h3;
    let e = h4;
    let f = h5;
    let g = h6;
    let h = h7;

    for (let i = 0; i < 64; i++) {
      const S1 = rotr(6, e) ^ rotr(11, e) ^ rotr(25, e);
      const ch = (e & f) ^ ((~e) & g);
      const temp1 = (h + S1 + ch + K[i] + w[i]) >>> 0;
      const S0 = rotr(2, a) ^ rotr(13, a) ^ rotr(22, a);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (S0 + maj) >>> 0;

      h = g;
      g = f;
      f = e;
      e = (d + temp1) >>> 0;
      d = c;
      c = b;
      b = a;
      a = (temp1 + temp2) >>> 0;
    }

    h0 = (h0 + a) >>> 0;
    h1 = (h1 + b) >>> 0;
    h2 = (h2 + c) >>> 0;
    h3 = (h3 + d) >>> 0;
    h4 = (h4 + e) >>> 0;
    h5 = (h5 + f) >>> 0;
    h6 = (h6 + g) >>> 0;
    h7 = (h7 + h) >>> 0;
  }

  const hexParts = [h0, h1, h2, h3, h4, h5, h6, h7].map((num) =>
    num.toString(16).padStart(8, '0')
  );
  return hexParts.join('');
}

function detectMimeType(fileName: string, bytes: Uint8Array): string {
  if (bytes.length >= 4) {
    if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
      return 'image/png';
    }
    if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
      return 'image/jpeg';
    }
    if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x38) {
      return 'image/gif';
    }
    if (
      bytes.length >= 12 &&
      bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
      bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50
    ) {
      return 'image/webp';
    }
  }

  const lower = fileName.toLowerCase();
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
  if (lower.endsWith('.gif')) return 'image/gif';
  if (lower.endsWith('.webp')) return 'image/webp';
  if (lower.endsWith('.svg')) return 'image/svg+xml';
  if (lower.endsWith('.emf')) return 'image/x-emf';
  if (lower.endsWith('.wmf')) return 'image/x-wmf';

  return 'application/octet-stream';
}
