/**
 * Splits paragraph text into plain / inline-math / display-math segments so the
 * preview can render formulas with KaTeX while LaTeX/JATS exporters keep the source.
 * Delimiters: $$...$$ (display) and $...$ (inline). A lone "$" (currency) is plain text.
 */
export type MathSegment =
  | { kind: 'text'; value: string }
  | { kind: 'inline'; value: string }
  | { kind: 'display'; value: string };

const MATH_RE = /\$\$([\s\S]+?)\$\$|\$([^$\n]+?)\$/g;

export function splitMathSegments(text: string): MathSegment[] {
  const out: MathSegment[] = [];
  if (!text) return out;
  let last = 0;
  for (const m of text.matchAll(MATH_RE)) {
    const idx = m.index ?? 0;
    if (idx > last) out.push({ kind: 'text', value: text.slice(last, idx) });
    if (m[1] !== undefined) out.push({ kind: 'display', value: m[1].trim() });
    else out.push({ kind: 'inline', value: m[2].trim() });
    last = idx + m[0].length;
  }
  if (last < text.length) out.push({ kind: 'text', value: text.slice(last) });
  return out;
}

export function hasMath(text: string): boolean {
  return splitMathSegments(text).some((s) => s.kind !== 'text');
}

/** If the whole paragraph is exactly one display formula, return its LaTeX. */
export function asStandaloneEquation(text: string): string | null {
  const segs = splitMathSegments((text || '').trim());
  if (segs.length === 1 && segs[0].kind === 'display') return segs[0].value;
  return null;
}

/**
 * Cheap structural sanity check for LaTeX math (balanced braces / \left-\right /
 * begin-end). KaTeX gives the authoritative result in the browser; this keeps
 * validators usable in node/test environments.
 */
export function checkLatexMath(latex: string): string | null {
  const src = latex || '';
  if (!src.trim()) return 'Công thức trống';
  let depth = 0;
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (c === '\\') {
      i++;
      continue;
    }
    if (c === '{') depth++;
    else if (c === '}') {
      depth--;
      if (depth < 0) return 'Dấu ngoặc nhọn } thừa';
    }
  }
  if (depth !== 0) return 'Thiếu dấu ngoặc nhọn }';
  const left = (src.match(/\\left\b/g) || []).length;
  const right = (src.match(/\\right\b/g) || []).length;
  if (left !== right) return '\\left và \\right không khớp nhau';
  const begins = (src.match(/\\begin\{/g) || []).length;
  const ends = (src.match(/\\end\{/g) || []).length;
  if (begins !== ends) return '\\begin và \\end không khớp nhau';
  return null;
}

/** Escape text for use inside XML character data / attribute values. */
export function xmlEscape(s: string): string {
  return (s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Make user-supplied LaTeX math safe to splice into an equation environment:
 * prevents closing the environment early and strips file-system / shell primitives.
 */
export function sanitizeMathForLatex(latex: string): string {
  return (latex || '')
    .replace(/\\(?:end|begin)\s*\{\s*equation\*?\s*\}/g, '')
    .replace(/\\(?:input|include|includeonly|write|openout|openin|read|immediate|catcode|csname|usepackage|def|let)(?![a-zA-Z])/g, '')
    .trim();
}
