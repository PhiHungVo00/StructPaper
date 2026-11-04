/**
 * Equation Block to LaTeX Converter
 *
 * Converts EquationBlock AST nodes into numbered equation environments
 * or unnumbered display math blocks with traceability markers.
 */

import type { EquationBlock } from '@structpaper/doc-model';
import { formatLatexKey } from '../escape-tex';

/**
 * Converts an EquationBlock into standard LaTeX equation markup.
 */
export function equationToLatex(block: EquationBlock): string {
  const marker = `%%BLOCK:${block.id}\n`;
  const latexFormula = (block.latex || '').trim();

  if (block.numbered) {
    const label = formatLatexKey(block.id, 'eq');
    return `${marker}\\begin{equation}\n${latexFormula}\n\\label{${label}}\n\\end{equation}`;
  }

  return `${marker}\\[\n${latexFormula}\n\\]`;
}
