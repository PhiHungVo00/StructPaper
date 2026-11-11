import {
  Math as DocxMath,
  MathRun,
  MathFraction,
  MathRadical,
  MathSubScript,
  MathSuperScript,
  MathSubSuperScript,
  MathSum,
  type MathComponent,
} from 'docx';
import { splitMathSegments } from '@/lib/math-text';

/**
 * Converts a LaTeX math string into native, editable Word (OMML) equation components.
 * Supports: groups, ^ _ , \frac, \sqrt[n]{}, \sum/\prod/\int with limits, \left \right,
 * Greek letters and common operators/relations. Unknown commands degrade to plain text.
 */

const SYMBOLS: Record<string, string> = {
  alpha: 'α', beta: 'β', gamma: 'γ', delta: 'δ', epsilon: 'ϵ', varepsilon: 'ε', zeta: 'ζ', eta: 'η',
  theta: 'θ', iota: 'ι', kappa: 'κ', lambda: 'λ', mu: 'μ', nu: 'ν', xi: 'ξ', pi: 'π', rho: 'ρ',
  sigma: 'σ', tau: 'τ', upsilon: 'υ', phi: 'φ', varphi: 'ϕ', chi: 'χ', psi: 'ψ', omega: 'ω',
  Gamma: 'Γ', Delta: 'Δ', Theta: 'Θ', Lambda: 'Λ', Xi: 'Ξ', Pi: 'Π', Sigma: 'Σ', Phi: 'Φ', Psi: 'Ψ', Omega: 'Ω',
  times: '×', cdot: '·', pm: '±', mp: '∓', div: '÷', leq: '≤', le: '≤', geq: '≥', ge: '≥', neq: '≠', ne: '≠',
  approx: '≈', equiv: '≡', sim: '∼', propto: '∝', infty: '∞', partial: '∂', nabla: '∇', to: '→', rightarrow: '→',
  leftarrow: '←', Rightarrow: '⇒', Leftrightarrow: '⇔', in: '∈', notin: '∉', subset: '⊂', cup: '∪', cap: '∩',
  forall: '∀', exists: '∃', ldots: '…', cdots: '⋯', circ: '∘', degree: '°', prime: '′', hat: '^', bar: '¯',
  ',': ' ', ';': ' ', ':': ' ', '!': '', quad: '  ', qquad: '    ',
};

const NARY: Record<string, string> = { sum: '∑', prod: '∏', int: '∫' };
const FUNCS = new Set(['sin', 'cos', 'tan', 'log', 'ln', 'exp', 'min', 'max', 'lim', 'det', 'sup', 'inf']);

type Tok = { t: 'cmd' | 'char' | '{' | '}' | '^' | '_'; v: string };

function tokenize(src: string): Tok[] {
  const toks: Tok[] = [];
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (c === '\\') {
      const m = src.slice(i + 1).match(/^([a-zA-Z]+|.)/);
      if (m) {
        toks.push({ t: 'cmd', v: m[1] });
        i += m[1].length;
      }
    } else if (c === '{' || c === '}' || c === '^' || c === '_') {
      toks.push({ t: c, v: c });
    } else if (!/\s/.test(c)) {
      toks.push({ t: 'char', v: c });
    }
  }
  return toks;
}

class Parser {
  private i = 0;
  constructor(private toks: Tok[]) {}

  parseAll(): MathComponent[] {
    const out: MathComponent[] = [];
    while (this.i < this.toks.length) out.push(...this.parseItem());
    return out;
  }

  private peek() {
    return this.toks[this.i];
  }

  private parseGroupOrAtom(): MathComponent[] {
    const tk = this.peek();
    if (!tk) return [];
    if (tk.t === '{') {
      this.i++;
      const inner: MathComponent[] = [];
      while (this.i < this.toks.length && this.peek().t !== '}') inner.push(...this.parseItem());
      this.i++; // closing brace (or EOF)
      return inner;
    }
    return this.parseAtom();
  }

  private parseAtom(): MathComponent[] {
    const tk = this.toks[this.i++];
    if (!tk) return [];
    if (tk.t === 'char') return [new MathRun(tk.v)];
    if (tk.t === '{' || tk.t === '}') return [];
    if (tk.t === '^' || tk.t === '_') return [new MathRun(tk.v)];
    // command
    const cmd = tk.v;
    if (cmd === 'frac' || cmd === 'dfrac' || cmd === 'tfrac') {
      const numerator = this.parseGroupOrAtom();
      const denominator = this.parseGroupOrAtom();
      return [new MathFraction({ numerator, denominator })];
    }
    if (cmd === 'sqrt') {
      let degree: MathComponent[] | undefined;
      if (this.peek()?.t === 'char' && this.peek().v === '[') {
        this.i++;
        degree = [];
        while (this.i < this.toks.length && !(this.peek().t === 'char' && this.peek().v === ']')) degree.push(...this.parseItem());
        this.i++;
      }
      const children = this.parseGroupOrAtom();
      return [new MathRadical({ children, ...(degree ? { degree } : {}) })];
    }
    if (cmd === 'left' || cmd === 'right') {
      const next = this.toks[this.i];
      if (next && (next.t === 'char' || next.t === 'cmd')) {
        this.i++;
        return next.v === '.' ? [] : [new MathRun(next.t === 'cmd' ? SYMBOLS[next.v] ?? next.v : next.v)];
      }
      return [];
    }
    if (cmd in NARY) return [new MathRun(NARY[cmd])]; // limits handled in parseItem
    if (cmd === 'text' || cmd === 'mathrm' || cmd === 'operatorname' || cmd === 'mathbf' || cmd === 'mathit') {
      return this.parseGroupOrAtom();
    }
    if (FUNCS.has(cmd)) return [new MathRun(cmd)];
    if (cmd in SYMBOLS) return [new MathRun(SYMBOLS[cmd])];
    if (cmd === '{' || cmd === '}' || cmd === '%' || cmd === '&' || cmd === '$' || cmd === '#' || cmd === '_') return [new MathRun(cmd)];
    return [new MathRun(cmd)];
  }

  /** atom followed by optional ^ / _ scripts. */
  private parseItem(): MathComponent[] {
    const startTok = this.peek();
    const isNary = startTok?.t === 'cmd' && startTok.v in NARY;
    const base = this.parseAtom();
    let sub: MathComponent[] | undefined;
    let sup: MathComponent[] | undefined;
    while (this.peek() && (this.peek().t === '^' || this.peek().t === '_')) {
      const kind = this.toks[this.i++].t;
      const arg = this.parseGroupOrAtom();
      if (kind === '^') sup = arg;
      else sub = arg;
    }
    if (!sub && !sup) return base;
    if (isNary && NARY[startTok!.v] === '∑') {
      return [new MathSum({ children: [], ...(sub ? { subScript: sub } : {}), ...(sup ? { superScript: sup } : {}) })];
    }
    if (sub && sup) return [new MathSubSuperScript({ children: base, subScript: sub, superScript: sup })];
    if (sup) return [new MathSuperScript({ children: base, superScript: sup })];
    return [new MathSubScript({ children: base, subScript: sub! })];
  }
}

export function latexToMathComponents(latex: string): MathComponent[] {
  try {
    const comps = new Parser(tokenize(latex || '')).parseAll();
    return comps.length ? comps : [new MathRun(latex || '')];
  } catch {
    return [new MathRun(latex || '')];
  }
}

/** A native Word equation (m:oMath) for use as a Paragraph child. */
export function latexToDocxMath(latex: string): DocxMath {
  return new DocxMath({ children: latexToMathComponents(latex) });
}

export type MixedChild = { kind: 'text'; value: string } | { kind: 'math'; math: DocxMath };

/** Split paragraph text so inline $…$ become Word equations and the rest stay text. */
export function splitTextWithMath(text: string): MixedChild[] {
  return splitMathSegments(text || '').map((seg) =>
    seg.kind === 'text'
      ? ({ kind: 'text', value: seg.value } as MixedChild)
      : ({ kind: 'math', math: latexToDocxMath(seg.value) } as MixedChild)
  );
}
