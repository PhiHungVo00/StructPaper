import { mathWidthEm } from './latex-math-width';

/**
 * A long one-line formula (the journal template's regression model has seven terms) runs past the
 * 8 cm column. Word wraps it by itself; LaTeX does not. Break it at top-level "=", "+" and "−" signs and
 * stack the pieces in an `aligned` block, so the number stays on the right and nothing is cut off.
 */

/** Visible width of a math string, in "characters": commands count 1, sub/superscripts count 0.6. */
export function mathVisibleLength(latex: string): number {
  let n = 0;
  let small = 0; // depth of sub/superscript groups
  const depthStack: boolean[] = [];
  let pendingScript = false;
  for (let i = 0; i < latex.length; i++) {
    const c = latex[i];
    if (c === '\\') {
      const m = latex.slice(i + 1).match(/^[a-zA-Z]+/);
      if (m) {
        i += m[0].length;
        if (!/^(left|right|big|Big|bigg|Bigg|quad|qquad|text|mathrm|mathbf|mathit|operatorname)$/.test(m[0])) n += small ? 0.6 : 1;
      } else i += 1; // "\," "\;" "\\"
      continue;
    }
    if (c === '_' || c === '^') {
      pendingScript = true;
      continue;
    }
    if (c === '{') {
      depthStack.push(pendingScript);
      if (pendingScript) small++;
      pendingScript = false;
      continue;
    }
    if (c === '}') {
      if (depthStack.pop()) small--;
      continue;
    }
    if (/\s/.test(c)) continue;
    n += small || pendingScript ? 0.6 : 1;
    pendingScript = false;
  }
  return n;
}

/** Positions (indexes into `latex`) of top-level binary operators where a line may start. */
function breakPoints(latex: string): { at: number; isRelation: boolean }[] {
  const out: { at: number; isRelation: boolean }[] = [];
  let depth = 0; // {} and \left…\right
  let prev = '';
  for (let i = 0; i < latex.length; i++) {
    const c = latex[i];
    if (c === '\\') {
      const m = latex.slice(i + 1).match(/^[a-zA-Z]+/);
      if (m) {
        if (m[0] === 'left') depth++;
        else if (m[0] === 'right') depth--;
        i += m[0].length;
        prev = 'x';
      } else {
        i += 1;
        prev = 'x';
      }
      continue;
    }
    if (c === '{') depth++;
    else if (c === '}') depth--;
    else if (depth === 0 && (c === '=' || c === '+' || c === '-')) {
      // binary only: something printable on the left, and not directly after another operator or a script mark
      if (prev && !/[=+\-(\[_^,&]/.test(prev) && i > 0) out.push({ at: i, isRelation: c === '=' });
    }
    if (!/\s/.test(c)) prev = c;
  }
  return out;
}

const HAS_STRUCTURE = /\\begin\s*\{|\\\\|&|\\tag\b|\\label\b/;

/**
 * Returns the formula as an `aligned` block when it is wider than `maxWidth` (ems, see latex-math-width.ts),
 * else the input unchanged. Lines are filled greedily at the top-level "=", "+", "-" signs; continuation
 * lines are aligned under the first "=" and are measured with that indent. Never touches formulas that
 * already carry their own environment, line breaks or alignment marks.
 */
export function breakLongEquation(latex: string, maxWidth: number, measure: (s: string) => number = mathWidthEm): string {
  const src = latex.trim();
  if (!src || HAS_STRUCTURE.test(src) || measure(src) <= maxWidth) return src;
  const points = breakPoints(src);
  if (points.length === 0) return src;

  // Pieces: [start, p1) [p1, p2) … each (except the first) begins with its operator.
  const cuts = [0, ...points.map((p) => p.at), src.length];
  const pieces: string[] = [];
  for (let i = 0; i < cuts.length - 1; i++) pieces.push(src.slice(cuts[i], cuts[i + 1]).trim());

  // Where the "=" column is: the left-hand side before the first "=" (continuation lines start there + a quad).
  const firstEq = points.find((p) => p.isRelation);
  const indent = firstEq ? measure(src.slice(0, firstEq.at)) + 1 : 1;

  const lines: string[] = [];
  let cur = '';
  for (const piece of pieces) {
    const room = lines.length === 0 ? 0 : indent;
    if (cur && room + measure(`${cur} ${piece}`) > maxWidth) {
      lines.push(cur);
      cur = piece;
    } else cur += (cur ? ' ' : '') + piece;
  }
  if (cur) lines.push(cur);
  if (lines.length < 2) return src;

  const first = lines[0];
  const eq = breakPoints(first).find((p) => p.isRelation);
  const head = eq ? `${first.slice(0, eq.at).trim()} &${first.slice(eq.at).trim()}` : first;
  const rest = lines.slice(1).map((l) => `${eq ? '&' : ''}\\quad ${l}`);
  return `\\begin{aligned}\n${[head, ...rest].join(' \\\\\n')}\n\\end{aligned}`;
}
