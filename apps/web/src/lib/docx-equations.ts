import type { PaperSection } from '@/types/paper';
import { ommlToLatex } from './omml';

/**
 * Word equations (OMML) are invisible to the text-based import (mammoth drops them), so they
 * are recovered from word/document.xml and re-inserted as `equation` blocks, anchored right
 * after the paragraph that preceded them in the original document.
 */

export interface MathCapableParagraph {
  text: string;
  hasMath: boolean;
  rawXml: string;
}

export interface ExtractedEquation {
  latex: string;
  omml: string;
  /** Text of the nearest preceding non-math paragraph (anchor). */
  prevText: string;
  /** Number typed next to the equation in the source ("(4)"), when present. */
  num?: number;
}

/** "(4)", "[12]", "(3a)" typed after an equation (usually after tabs). */
const EQ_NUM_RE = /^[([]\s*(\d{1,3})[a-z]?\s*[)\]]$/i;

const norm = (s: string) => (s || '').replace(/\s+/g, ' ').trim().toLowerCase();

export function extractDisplayEquations(paragraphs: MathCapableParagraph[]): ExtractedEquation[] {
  const out: ExtractedEquation[] = [];
  let prevText = '';
  for (const p of paragraphs) {
    if (!p.hasMath) {
      if (p.text.trim()) prevText = p.text;
      continue;
    }
    const rest = (p.text || '').replace(/\s+/g, ' ').trim();
    const para = p.rawXml.match(/<m:oMathPara\b[\s\S]*?<\/m:oMathPara>/i);
    const singles = p.rawXml.match(/<m:oMath\b[\s\S]*?<\/m:oMath>/gi) || [];
    const numMatch = rest.match(EQ_NUM_RE);
    // Display math: an oMathPara, or one oMath alone in its paragraph, optionally followed by its number "(n)".
    const omml = para ? para[0] : singles.length === 1 && (!rest || numMatch) ? singles[0] : null;
    if (!omml) {
      if (rest) prevText = p.text; // inline math inside prose still anchors the next equation
      continue;
    }
    const latex = ommlToLatex(omml);
    if (latex) out.push({ latex, omml, prevText, ...(numMatch ? { num: parseInt(numMatch[1], 10) } : {}) });
    if (rest && !numMatch) prevText = p.text; // never anchor on a bare "(1)"
  }
  return out;
}

export function insertEquations(
  sections: PaperSection[],
  equations: ExtractedEquation[]
): { sections: PaperSection[]; placed: number; unplaced: number } {
  const result = [...sections];
  let placed = 0;
  let unplaced = 0;
  let searchFrom = 0;

  equations.forEach((eq, n) => {
    const anchor = norm(eq.prevText).slice(0, 40);
    let at = -1;
    if (anchor.length >= 8) {
      for (let i = searchFrom; i < result.length; i++) {
        const sec = result[i];
        const text = norm(sec.type === 'paragraph' ? sec.content : sec.title || '');
        if (text && text.includes(anchor)) {
          at = i;
          break;
        }
      }
    } else if (result.length === 0 || (eq.prevText === '' && n === 0)) {
      at = -1;
    }
    if (at < 0) {
      unplaced += 1;
      return;
    }
    result.splice(at + 1, 0, {
      id: `eq_${n + 1}`,
      type: 'equation',
      content: '',
      // The LaTeX is the source of truth; the (large) raw OMML is not persisted.
      equation: { latex: eq.latex, numbered: true, ...(eq.num ? { num: eq.num } : {}) },
    });
    searchFrom = at + 2; // keep original order of consecutive equations
    placed += 1;
  });

  // Number in document order, keeping a number typed in the source ("(4)").
  let counter = 0;
  const numbered = result.map((s) => {
    if (s.type !== 'equation' || !s.equation?.numbered) return s;
    const num = s.equation.num ?? counter + 1;
    counter = num;
    return { ...s, equation: { ...s.equation, num } };
  });
  return { sections: numbered, placed, unplaced };
}

/** A short "n là số lượng mẫu" line under "Trong đó: F_i là …" (kept although shorter than a paragraph). */
export function isWhereDefinitionLine(line: string, prev: PaperSection | undefined): boolean {
  return (
    line.length >= 6 &&
    /^[\p{L}\p{N}_$\\{}]{1,10}\s+(?:là|=|:|is|are|denotes)\s+\S/iu.test(line) &&
    prev?.type === 'paragraph' &&
    /^(trong đó|where|với)\b|\s(là|is)\s/i.test((prev.content || '').trim())
  );
}
