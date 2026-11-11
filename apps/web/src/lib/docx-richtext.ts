import type { PaperSection } from '@/types/paper';

/**
 * The text pipeline (mammoth) flattens Word formatting, so "f² DS→DT", "R²", "CO₂", "m²" lose their
 * superscripts / subscripts. For body paragraphs that carry such runs in the original XML, rebuild the
 * paragraph with `$^{…}$` / `$_{…}$` so every exporter (LaTeX, Word, XML, preview) renders them.
 */

export interface ScriptRun {
  text: string;
  isSup: boolean;
  isSub?: boolean;
}

export interface ScriptParagraph {
  text: string;
  runs: ScriptRun[];
}

const MATH_SYMBOLS: Record<string, string> = {
  '→': '\\to ',
  '←': '\\leftarrow ',
  '↔': '\\leftrightarrow ',
  '≥': '\\geq ',
  '≤': '\\leq ',
  '≠': '\\neq ',
  '≈': '\\approx ',
  '±': '\\pm ',
  '×': '\\times ',
  '−': '-',
  '–': '-',
};

/** Plain text -> math-mode LaTeX that keeps Vietnamese letters (via \text) and common symbols. */
export function plainToMath(text: string): string {
  const t = text.trim();
  if (!t) return '';
  if (/^[0-9+\-=(),.]+$/.test(t)) return t;
  let out = '';
  let buf = '';
  const flush = () => {
    if (buf) out += `\\text{${buf}}`;
    buf = '';
  };
  for (const ch of t) {
    if (MATH_SYMBOLS[ch]) {
      flush();
      out += MATH_SYMBOLS[ch];
    } else if ('%&#_{}'.includes(ch)) buf += `\\${ch}`;
    else if (ch === '\\') buf += '\\textbackslash{}';
    else if (ch === '^' || ch === '~') buf += `\\char\`\\${ch}`;
    else buf += ch;
  }
  flush();
  return out.trim();
}

const norm = (s: string) => (s || '').normalize('NFC').replace(/[​-‏﻿]/g, '').replace(/\s+/g, '');

/** Join runs, turning sup/sub runs (an adjacent sup+sub pair becomes one `^{a}_{b}`) into math. */
export function runsToScriptedText(runs: ScriptRun[]): string {
  let out = '';
  for (let i = 0; i < runs.length; i++) {
    const r = runs[i];
    if (!r.isSup && !r.isSub) {
      out += r.text;
      continue;
    }
    let sup = '';
    let sub = '';
    let j = i;
    for (; j < runs.length && (runs[j].isSup || runs[j].isSub); j++) {
      if (runs[j].isSup) sup += runs[j].text;
      else sub += runs[j].text;
    }
    i = j - 1;
    const s = plainToMath(sup);
    const b = plainToMath(sub);
    if (!s && !b) continue;
    out += `$${s ? `^{${s}}` : ''}${b ? `_{${b}}` : ''}$`;
  }
  return out;
}

/** Replace body paragraphs by their scripted version when the original XML paragraph matches exactly. */
export function enrichScriptRuns(sections: PaperSection[], paragraphs: ScriptParagraph[]): number {
  const withScripts = paragraphs.filter((p) => p.runs.some((r) => r.isSup || r.isSub));
  if (!withScripts.length) return 0;
  const byText = new Map<string, ScriptParagraph>();
  for (const p of withScripts) {
    const k = norm(p.text);
    if (k && !byText.has(k)) byText.set(k, p);
  }
  let changed = 0;
  for (const s of sections) {
    if (s.type !== 'paragraph' || !s.content) continue;
    const p = byText.get(norm(s.content));
    if (!p) continue;
    const rebuilt = runsToScriptedText(p.runs).replace(/\s+/g, ' ').trim();
    if (rebuilt && rebuilt !== s.content) {
      s.content = rebuilt;
      changed += 1;
    }
  }
  return changed;
}
