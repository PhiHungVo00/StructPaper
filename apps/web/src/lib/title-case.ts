/**
 * Word titles are often typed in CAPITALS; the journal prints sentence case
 * ("Ảnh hưởng của năng lực số đến …": only the first letter is capital).
 */

const WORD = /[\p{L}\p{N}]/u;

export function isAllCaps(title: string, minLetters = 12): boolean {
  const letters = (title || '').replace(/[^\p{L}]/gu, '');
  return letters.length >= minLetters && letters === letters.toUpperCase() && letters !== letters.toLowerCase();
}

/** Upper-case words of 2-8 chars (PLS-SEM, TPHCM, CNS, R2) found in the paper's own text. */
export function collectAcronyms(texts: string[]): Set<string> {
  const found = new Set<string>();
  for (const text of texts) {
    for (const m of (text || '').matchAll(/(?<![\p{L}\p{N}])[\p{Lu}][\p{Lu}\p{N}\-.]{1,7}(?![\p{L}])/gu)) {
      const w = m[0].replace(/[.\-]+$/, '');
      if (w.length >= 2 && w === w.toUpperCase() && /\p{L}/u.test(w)) found.add(w);
    }
  }
  return found;
}

/**
 * ALL CAPS -> sentence case, keeping acronyms that appear in capitals elsewhere in the paper.
 * Titles that are not all caps are returned unchanged.
 */
export function toSentenceCase(title: string, acronymSources: string[] = []): string {
  if (!isAllCaps(title)) return title;
  const acronyms = collectAcronyms(acronymSources);
  let out = '';
  let first = true;
  for (const token of title.split(/(\s+)/)) {
    if (!token.trim()) {
      out += token;
      continue;
    }
    const core = token.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '');
    const isAcronym = core.length >= 2 && acronyms.has(core);
    let word = isAcronym ? token : token.toLowerCase();
    if (first && WORD.test(word)) {
      const i = word.search(/[\p{L}]/u);
      if (i >= 0) word = word.slice(0, i) + word[i].toUpperCase() + word.slice(i + 1);
      first = false;
    }
    out += word;
  }
  return out;
}

export interface NormalizedTitle {
  title: string;
  /** The original text when it was changed (so the editor can undo it). */
  original?: string;
}

export function normalizeImportedTitle(title: string, acronymSources: string[] = []): NormalizedTitle {
  const next = toSentenceCase(title, acronymSources);
  return next !== title ? { title: next, original: title } : { title };
}
