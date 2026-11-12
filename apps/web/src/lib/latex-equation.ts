import type { PaperSection } from '@/types/paper';
import { sanitizeMathForLatex } from './math-text';
import { breakLongEquation } from './latex-equation-break';
import { mathWidthEm } from './latex-math-width';

/**
 * Room for the formula itself, in ems of the 9 pt body font, before it is broken into lines:
 * a column (~8.3 cm) minus the number "(n)", the page text width, a one-column page.
 */
const BUDGET_EM = { column: 21, fullWidth: 46, oneColumn: 46 } as const;

/**
 * Safety net on the TeX side. The line breaking above works from an estimate of the formula's width;
 * `\fiteq{width}{math}` boxes the formula and shrinks it only when it is still wider than `width`,
 * so a formula can never run into the margin or the next column. Emitted once per document.
 */
export const EQUATION_FIT_MACRO = [
  '\\newsavebox{\\eqfitbox}',
  '\\newcommand{\\fiteq}[2]{%',
  '  \\sbox{\\eqfitbox}{$\\displaystyle #2$}%',
  '  \\ifdim\\wd\\eqfitbox>#1\\relax\\resizebox{#1}{!}{\\usebox{\\eqfitbox}}\\else\\usebox{\\eqfitbox}\\fi}',
  '',
].join('\n');

/**
 * LaTeX for an equation section.
 *  - default: inside the column; a formula wider than the column is broken at its top-level +, −, =,
 *    and shrunk as a last resort if a line is still too wide.
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
  const budget = spanBoth ? BUDGET_EM.fullWidth : oneColumn ? BUDGET_EM.oneColumn : BUDGET_EM.column;
  const math = breakLongEquation(sanitizeMathForLatex(eq.latex), budget);
  // leave room for the number on the right of a numbered formula
  const room = eq.numbered ? '\\dimexpr\\linewidth-2.6em\\relax' : '\\linewidth';
  // a short formula is left alone; anything near the limit gets the shrink-to-fit box
  const body = mathWidthEm(math) > budget * 0.7 ? `\\fiteq{${room}}{${math}}` : math;
  const block = `\\begin{${env}}\n${body}${tag}${label}\n\\end{${env}}`;
  return spanBoth ? `\n\\begin{figure*}[!t]\n\\normalsize\n${block}\n\\end{figure*}\n` : `\n${block}\n`;
}
