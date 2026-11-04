import type { Inline, ComputedNumbering } from '../types';
import type { IdGenerator } from '../utils';
import { formatCitationRange } from '../numbering';

/**
 * Parses bracket content (e.g., "1", "1, 2", "2-4", "1, 3-5, 8") into an array of distinct integers.
 */
export function parseCitationNumbers(bracketText: string): number[] {
  const trimmed = bracketText.trim();
  if (!trimmed) return [];

  const parts = trimmed.split(/[,;]/);
  const result = new Set<number>();

  for (const part of parts) {
    const p = part.trim();
    if (!p) continue;

    // Check for range with hyphen, en-dash, em-dash
    const rangeMatch = p.match(/^(\d+)\s*[-–—]\s*(\d+)$/);
    if (rangeMatch) {
      const start = parseInt(rangeMatch[1], 10);
      const end = parseInt(rangeMatch[2], 10);
      const min = Math.min(start, end);
      const max = Math.max(start, end);
      for (let n = min; n <= max; n++) {
        result.add(n);
      }
    } else {
      const num = parseInt(p, 10);
      if (!isNaN(num)) {
        result.add(num);
      }
    }
  }

  return Array.from(result).sort((a, b) => a - b);
}

/**
 * Converts a text string containing citations (e.g., "Nghiên cứu [1] và [2, 3].")
 * into an array of Inline nodes.
 */
export function parseTextWithCitations(
  text: string,
  refIdMap?: Map<number, string>,
  idGen?: IdGenerator
): Inline[] {
  if (!text) return [];

  const inlines: Inline[] = [];
  // Regex to match citation brackets: [1], [1, 2], [2-4], [1, 3-5, 8]
  const citationRegex = /\[(\d+(?:\s*[,-–—]\s*\d+)*)\]/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = citationRegex.exec(text)) !== null) {
    const matchStart = match.index;
    const matchEnd = citationRegex.lastIndex;

    // Push text before citation if present
    if (matchStart > lastIndex) {
      const textChunk = text.slice(lastIndex, matchStart);
      if (textChunk) {
        inlines.push({ t: 'text', v: textChunk });
      }
    }

    const bracketContent = match[1];
    const numbers = parseCitationNumbers(bracketContent);

    if (numbers.length > 0) {
      const refIds: string[] = numbers.map((num) => {
        if (refIdMap && refIdMap.has(num)) {
          return refIdMap.get(num)!;
        }
        // Fallback or unmapped reference
        return idGen ? idGen.nextId(`ref-${num}`) : `ref-${num}`;
      });

      inlines.push({
        t: 'cite',
        refIds,
      });
    } else {
      inlines.push({ t: 'text', v: match[0] });
    }

    lastIndex = matchEnd;
  }

  // Push remaining text if present
  if (lastIndex < text.length) {
    const trailingText = text.slice(lastIndex);
    if (trailingText) {
      inlines.push({ t: 'text', v: trailingText });
    }
  }

  return inlines.length > 0 ? inlines : [{ t: 'text', v: '' }];
}

/**
 * Converts Inline nodes back into plain text, reconstructing [n] citation marks.
 */
export function inlineToPlainText(
  inlines?: Inline[],
  numbering?: ComputedNumbering,
  refMap?: Map<string, number>
): string {
  if (!inlines || inlines.length === 0) return '';

  let result = '';

  for (const inline of inlines) {
    switch (inline.t) {
      case 'text':
        result += inline.v;
        break;
      case 'cite': {
        const numbers: number[] = [];
        for (const refId of inline.refIds) {
          if (numbering && numbering.citations.has(refId)) {
            numbers.push(numbering.citations.get(refId)!);
          } else if (refMap && refMap.has(refId)) {
            numbers.push(refMap.get(refId)!);
          } else {
            // Check if refId contains a number (e.g., "ref-1", "ref_001")
            const numMatch = refId.match(/\d+/);
            if (numMatch) {
              numbers.push(parseInt(numMatch[0], 10));
            } else {
              numbers.push(1);
            }
          }
        }
        const formatted = formatCitationRange(numbers);
        result += `[${formatted}]`;
        break;
      }
      case 'xref': {
        let label = 'Mục';
        if (inline.kind === 'figure') {
          const num = numbering?.figures.get(inline.target) ?? 1;
          label = `Hình ${num}`;
        } else if (inline.kind === 'table') {
          const num = numbering?.tables.get(inline.target) ?? 1;
          label = `Bảng ${num}`;
        } else if (inline.kind === 'equation') {
          const num = numbering?.equations.get(inline.target) ?? 1;
          label = `Công thức (${num})`;
        }
        result += label;
        break;
      }
      case 'math':
        result += `$${inline.latex}$`;
        break;
      case 'link':
        result += inlineToPlainText(inline.content, numbering, refMap);
        break;
      case 'footnote':
        result += '';
        break;
    }
  }

  return result;
}

/**
 * Pure TypeScript SHA-256 implementation (FIPS 180-4 compliant).
 * Works synchronously in Node.js and any browser without native crypto bindings.
 */
export function computeSha256(asciiOrHex: string): string {
  if (/^[a-f0-9]{64}$/i.test(asciiOrHex)) {
    return asciiOrHex.toLowerCase();
  }

  // Pre-computed table of round constants
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

  // UTF-8 encode string to Uint8Array
  const utf8: number[] = [];
  for (let i = 0; i < asciiOrHex.length; i++) {
    let charcode = asciiOrHex.charCodeAt(i);
    if (charcode < 0x80) utf8.push(charcode);
    else if (charcode < 0x800) {
      utf8.push(0xc0 | (charcode >> 6), 0x80 | (charcode & 0x3f));
    } else if (charcode < 0xd800 || charcode >= 0xe000) {
      utf8.push(0xe0 | (charcode >> 12), 0x80 | ((charcode >> 6) & 0x3f), 0x80 | (charcode & 0x3f));
    } else {
      // surrogate pair
      i++;
      charcode = 0x10000 + (((charcode & 0x3ff) << 10) | (asciiOrHex.charCodeAt(i) & 0x3ff));
      utf8.push(
        0xf0 | (charcode >> 18),
        0x80 | ((charcode >> 12) & 0x3f),
        0x80 | ((charcode >> 6) & 0x3f),
        0x80 | (charcode & 0x3f)
      );
    }
  }

  const bitLength = utf8.length * 8;
  utf8.push(0x80);
  while ((utf8.length % 64) !== 56) {
    utf8.push(0);
  }

  // Append 64-bit big-endian length
  // High 32 bits (0 for messages < 500MB)
  utf8.push(0, 0, 0, 0);
  // Low 32 bits
  utf8.push(
    (bitLength >>> 24) & 0xff,
    (bitLength >>> 16) & 0xff,
    (bitLength >>> 8) & 0xff,
    bitLength & 0xff
  );

  let H0 = 0x6a09e667;
  let H1 = 0xbb67ae85;
  let H2 = 0x3c6ef372;
  let H3 = 0xa54ff53a;
  let H4 = 0x510e527f;
  let H5 = 0x9b05688c;
  let H6 = 0x1f83d9ab;
  let H7 = 0x5be0cd19;

  const W = new Int32Array(64);

  const rotr = (x: number, n: number) => (x >>> n) | (x << (32 - n));

  for (let chunk = 0; chunk < utf8.length; chunk += 64) {
    for (let i = 0; i < 16; i++) {
      const idx = chunk + i * 4;
      W[i] = (utf8[idx] << 24) | (utf8[idx + 1] << 16) | (utf8[idx + 2] << 8) | utf8[idx + 3];
    }
    for (let i = 16; i < 64; i++) {
      const s0 = rotr(W[i - 15], 7) ^ rotr(W[i - 15], 18) ^ (W[i - 15] >>> 3);
      const s1 = rotr(W[i - 2], 17) ^ rotr(W[i - 2], 19) ^ (W[i - 2] >>> 10);
      W[i] = (W[i - 16] + s0 + W[i - 7] + s1) | 0;
    }

    let a = H0;
    let b = H1;
    let c = H2;
    let d = H3;
    let e = H4;
    let f = H5;
    let g = H6;
    let h = H7;

    for (let i = 0; i < 64; i++) {
      const S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
      const ch = (e & f) ^ (~e & g);
      const temp1 = (h + S1 + ch + K[i] + W[i]) | 0;
      const S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (S0 + maj) | 0;

      h = g;
      g = f;
      f = e;
      e = (d + temp1) | 0;
      d = c;
      c = b;
      b = a;
      a = (temp1 + temp2) | 0;
    }

    H0 = (H0 + a) | 0;
    H1 = (H1 + b) | 0;
    H2 = (H2 + c) | 0;
    H3 = (H3 + d) | 0;
    H4 = (H4 + e) | 0;
    H5 = (H5 + f) | 0;
    H6 = (H6 + g) | 0;
    H7 = (H7 + h) | 0;
  }

  const hex = [H0, H1, H2, H3, H4, H5, H6, H7]
    .map((v) => (v >>> 0).toString(16).padStart(8, '0'))
    .join('');

  return hex;
}

/**
 * Extracts MIME type from data URL or file extension.
 */
export function extractMimeType(src: string): string {
  if (!src) return 'image/png';
  const match = src.match(/^data:([^;]+);base64,/i);
  if (match) return match[1];
  if (/\.jpe?g$/i.test(src)) return 'image/jpeg';
  if (/\.svg$/i.test(src)) return 'image/svg+xml';
  if (/\.webp$/i.test(src)) return 'image/webp';
  return 'image/png';
}

/**
 * Maps MIME type to typical file extension.
 */
export function mimeToExt(mime: string): string {
  switch (mime) {
    case 'image/jpeg':
      return 'jpg';
    case 'image/svg+xml':
      return 'svg';
    case 'image/webp':
      return 'webp';
    case 'image/png':
    default:
      return 'png';
  }
}
