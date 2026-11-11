import JSZip from 'jszip';
import type { BatchItem } from './types';

/** File-system safe name, keeps Vietnamese letters. */
export function safeFileName(title: string, fallback: string): string {
  const cleaned = Array.from(
    title
      .replace(/[\\/:*?"<>|\u0000-\u001f‪-‮⁦-⁩]/g, ' ') // separators, controls, bidi overrides
      .replace(/\s+/g, ' ')
      .trim()
  )
    .slice(0, 120) // by characters, so a surrogate pair is never cut in half
    .join('')
    .replace(/[. ]+$/, ''); // Windows drops trailing dots and spaces
  const name = cleaned || fallback;
  return /^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i.test(name) ? `_${name}` : name; // reserved device names
}

/** All finished PDFs of a batch in one .zip (names made unique, no PDF -> not in the zip). */
export async function zipPdfs(items: BatchItem[]): Promise<Blob | null> {
  const zip = new JSZip();
  const used = new Set<string>();
  let count = 0;
  for (const it of items) {
    if (!it.pdf) continue;
    const base = safeFileName(it.title || '', it.fileName.replace(/\.docx?$/i, ''));
    let name = `${base}.pdf`;
    for (let n = 2; used.has(name.toLowerCase()); n++) name = `${base} (${n}).pdf`;
    used.add(name.toLowerCase());
    zip.file(name, it.pdf.blob);
    count++;
  }
  return count === 0 ? null : zip.generateAsync({ type: 'blob' });
}
