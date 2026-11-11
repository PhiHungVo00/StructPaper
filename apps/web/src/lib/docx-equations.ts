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
}

const norm = (s: string) => (s || '').replace(/\s+/g, ' ').trim().toLowerCase();

export function extractDisplayEquations(paragraphs: MathCapableParagraph[]): ExtractedEquation[] {
  const out: ExtractedEquation[] = [];
  let prevText = '';
  for (const p of paragraphs) {
    if (!p.hasMath) {
      if (p.text.trim()) prevText = p.text;
      continue;
    }
    const para = p.rawXml.match(/<m:oMathPara\b[\s\S]*?<\/m:oMathPara>/i);
    const single = p.rawXml.match(/<m:oMath\b[\s\S]*?<\/m:oMath>/i);
    // Display math: an oMathPara, or an oMath alone in its paragraph (no surrounding text).
    const omml = para ? para[0] : !p.text.trim() && single ? single[0] : null;
    if (!omml) continue; // inline math inside prose: not representable by the text pipeline
    const latex = ommlToLatex(omml);
    if (latex) out.push({ latex, omml, prevText });
    if (p.text.trim()) prevText = p.text;
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
      equation: { latex: eq.latex, numbered: true },
    });
    searchFrom = at + 2; // keep original order of consecutive equations
    placed += 1;
  });

  // Number in document order.
  let counter = 0;
  const numbered = result.map((s) =>
    s.type === 'equation' && s.equation?.numbered ? { ...s, equation: { ...s.equation, num: ++counter } } : s
  );
  return { sections: numbered, placed, unplaced };
}
