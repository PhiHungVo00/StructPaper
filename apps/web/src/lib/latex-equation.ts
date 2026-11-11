import type { PaperSection } from '@/types/paper';
import { sanitizeMathForLatex } from './math-text';
import { breakLongEquation } from './latex-equation-break';

/** Visible-character budget of one formula line: a column, the page text width, a landscape page. */
const BUDGET = { column: 40, fullWidth: 105, oneColumn: 90 } as const;

/**
 * LaTeX for an equation section.
 *  - default: inside the column; a formula wider than the column is broken at its top-level +, −, =.
 *  - columnSpan '2-column' (two-column layout only): set on one line across both columns, in a
 *    `figure*` float like a full-width table or figure; broken only when even that is too narrow.
 */
export function equationToLatex(sec: PaperSection, secIdx: number, oneColumn: boolean): string {
  const eq = sec.equation;
  if (!eq || !eq.latex.trim()) return '';
  const env = eq.numbered ? 'equation' : 'equation*';
  const label = eq.numbered ? `\n\\label{eq:${eq.num ?? secIdx + 1}}` : '';
  // Keep the number typed in the source ("(4)") so references in the text stay right.
  const tag = eq.numbered && eq.num ? `\\tag{${eq.num}}` : '';
  const spanBoth = !oneColumn && eq.columnSpan === '2-column';
  const budget = spanBoth ? BUDGET.fullWidth : oneColumn ? BUDGET.oneColumn : BUDGET.column;
  const block = `\\begin{${env}}\n${breakLongEquation(sanitizeMathForLatex(eq.latex), budget)}${tag}${label}\n\\end{${env}}`;
  return spanBoth ? `\n\\begin{figure*}[!t]\n\\normalsize\n${block}\n\\end{figure*}\n` : `\n${block}\n`;
}
