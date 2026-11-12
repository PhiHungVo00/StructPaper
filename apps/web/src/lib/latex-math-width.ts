/**
 * Estimated width of a LaTeX formula in ems (1 em = the font size, 9 pt in the journal body).
 *
 * Counting characters is not enough to decide where a formula has to break: italic capitals (HDI, EXPO) are
 * about 1.5× as wide as lower-case letters, and "=" or "+" carry a thick/medium space on both sides.
 * The numbers below are Times-style averages; they only need to be good enough to choose line breaks, and
 * the TeX side shrinks a line that is still too wide (see latex-equation.ts), so a small error never
 * pushes a formula into the margin.
 */

const GREEK = /^(alpha|beta|gamma|delta|epsilon|varepsilon|zeta|eta|theta|vartheta|iota|kappa|lambda|mu|nu|xi|pi|varpi|rho|varrho|sigma|varsigma|tau|upsilon|phi|varphi|chi|psi|omega|Gamma|Delta|Theta|Lambda|Xi|Pi|Sigma|Upsilon|Phi|Psi|Omega)$/;
const BIG_OP = /^(sum|prod|int|oint|bigcup|bigcap|lim)$/;
const RELATION = /^(leq?|geq?|neq?|approx|equiv|sim|propto|rightarrow|leftarrow|to|in|subset|subseteq)$/;
const BINARY = /^(pm|mp|times|cdot|div|cup|cap|oplus|otimes)$/;
const STYLE_ONLY = /^(left|right|big|Big|bigg|Bigg|displaystyle|textstyle|scriptstyle|limits|nolimits|quad|qquad|,|;|:|!|\\)$/;
const TEXTLIKE = /^(text|mathrm|mathbf|mathit|mathsf|mathbb|mathcal|operatorname|boldsymbol|bm)$/;

const SCRIPT_SCALE = 0.7;

class Scanner {
  constructor(private s: string, public i = 0) {}
  peek(): string {
    return this.s[this.i] ?? '';
  }
  done(): boolean {
    return this.i >= this.s.length;
  }
  /** Reads {...} (or one token when there is no brace) and returns its source text. */
  group(): string {
    while (this.peek() === ' ') this.i++;
    if (this.peek() !== '{') {
      if (this.peek() === '\\') {
        const m = this.s.slice(this.i + 1).match(/^[a-zA-Z]+|^./);
        const len = 1 + (m ? m[0].length : 0);
        const out = this.s.slice(this.i, this.i + len);
        this.i += len;
        return out;
      }
      const ch = this.peek();
      this.i += ch ? 1 : 0;
      return ch;
    }
    let depth = 0;
    const start = this.i + 1;
    for (; this.i < this.s.length; this.i++) {
      if (this.s[this.i] === '\\') this.i++;
      else if (this.s[this.i] === '{') depth++;
      else if (this.s[this.i] === '}' && --depth === 0) break;
    }
    const out = this.s.slice(start, this.i);
    this.i++;
    return out;
  }
}

function charWidth(c: string): number {
  if (/[A-Z]/.test(c)) return 0.7;
  if (/[a-z]/.test(c)) return 0.47;
  if (/[0-9]/.test(c)) return 0.5;
  if (/[Α-Ωα-ω]/.test(c)) return 0.55;
  if (c === '+' || c === '-' || c === '−') return 1.0; // glyph + medium space on both sides
  if (c === '=') return 1.1; // glyph + thick space on both sides
  if (c === '<' || c === '>') return 1.1;
  if (c === ',') return 0.42;
  if (c === '(' || c === ')' || c === '[' || c === ']') return 0.34;
  if (c === '|') return 0.25;
  if (c === '.' || c === "'") return 0.25;
  return 0.4;
}

/** Width of `src` in ems at the base size, scripts at 70 %. */
function measure(src: string, scale: number): number {
  const sc = new Scanner(src);
  let w = 0;
  while (!sc.done()) {
    const c = sc.peek();
    if (c === ' ' || c === '\n' || c === '\t' || c === '&' || c === '{' || c === '}') {
      if (c === '{') {
        w += measure(sc.group(), scale);
        continue;
      }
      sc.i++;
      continue;
    }
    if (c === '_' || c === '^') {
      sc.i++;
      w += measure(sc.group(), scale * SCRIPT_SCALE);
      continue;
    }
    if (c === '\\') {
      const m = src.slice(sc.i + 1).match(/^[a-zA-Z]+|^./);
      const name = m ? m[0] : '';
      sc.i += 1 + name.length;
      if (name === 'frac' || name === 'dfrac' || name === 'tfrac') {
        const num = measure(sc.group(), scale * 0.85);
        const den = measure(sc.group(), scale * 0.85);
        w += Math.max(num, den) + 0.3 * scale;
      } else if (name === 'sqrt') {
        while (sc.peek() === '[') sc.i++; // \sqrt[n]{x}: the index is small, ignore it
        w += measure(sc.group(), scale) + 0.6 * scale;
      } else if (TEXTLIKE.test(name)) {
        w += measure(sc.group(), scale);
      } else if (STYLE_ONLY.test(name)) {
        if (name === 'quad') w += 1 * scale;
        else if (name === 'qquad') w += 2 * scale;
        else if (name === ',' || name === ';' || name === ':') w += 0.2 * scale;
      } else if (GREEK.test(name)) {
        w += 0.55 * scale;
      } else if (BIG_OP.test(name)) {
        w += 1.1 * scale;
      } else if (RELATION.test(name)) {
        w += 1.1 * scale;
      } else if (BINARY.test(name)) {
        w += 1.0 * scale;
      } else {
        w += 0.7 * scale; // any other symbol or function name (\log, \infty, \partial, …)
      }
      continue;
    }
    sc.i++;
    w += charWidth(c) * scale;
  }
  return w;
}

export function mathWidthEm(latex: string): number {
  return measure(latex, 1);
}
