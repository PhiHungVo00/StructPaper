/**
 * Inlines to LaTeX Converter
 *
 * Converts rich Inline AST nodes (text, marks, math, citations, xrefs, links)
 * to standard LaTeX representations.
 */

import type { Block, Inline, InlineMark } from '@structpaper/doc-model';
import { escapeTex, formatLatexKey } from '../escape-tex';

export interface InlineConvertContext {
  renderBlocks?: (blocks: Block[]) => string;
}

/**
 * Wraps text with LaTeX markup based on active formatting marks.
 */
function applyMarks(text: string, marks?: InlineMark[]): string {
  if (!marks || marks.length === 0) return text;

  let wrapped = text;
  // Apply in a stable sequence
  for (const mark of marks) {
    switch (mark) {
      case 'b':
        wrapped = `\\textbf{${wrapped}}`;
        break;
      case 'i':
        wrapped = `\\textit{${wrapped}}`;
        break;
      case 'sup':
        wrapped = `\\textsuperscript{${wrapped}}`;
        break;
      case 'sub':
        wrapped = `\\textsubscript{${wrapped}}`;
        break;
      case 'code':
        wrapped = `\\texttt{${wrapped}}`;
        break;
    }
  }
  return wrapped;
}

/**
 * Maps cross-reference kind to standard LaTeX label prefixes.
 */
function xrefPrefix(kind: 'figure' | 'table' | 'equation' | 'section'): string {
  switch (kind) {
    case 'figure':
      return 'fig';
    case 'table':
      return 'tab';
    case 'equation':
      return 'eq';
    case 'section':
      return 'sec';
  }
}

/**
 * Converts a single Inline element into its LaTeX representation.
 */
export function singleInlineToLatex(
  inline: Inline,
  context: InlineConvertContext = {}
): string {
  switch (inline.t) {
    case 'text': {
      const escaped = escapeTex(inline.v);
      return applyMarks(escaped, inline.marks);
    }
    case 'math': {
      // Inlines containing math formulas are enclosed in $...$
      return `$${inline.latex}$`;
    }
    case 'cite': {
      if (!inline.refIds || inline.refIds.length === 0) return '';
      const keys = inline.refIds.map((id) => formatLatexKey(id, 'ref')).join(',');
      return `\\cite{${keys}}`;
    }
    case 'xref': {
      const prefix = xrefPrefix(inline.kind);
      const label = formatLatexKey(inline.target, prefix);
      return `\\ref{${label}}`;
    }
    case 'link': {
      const content = inlinesToLatex(inline.content, context);
      return `\\href{${escapeTex(inline.href, { preserveMath: false })}}{${content}}`;
    }
    case 'footnote': {
      if (!context.renderBlocks || !inline.blocks) return '';
      const body = context.renderBlocks(inline.blocks).trim();
      return `\\footnote{${body}}`;
    }
    default:
      return '';
  }
}

/**
 * Converts an array of Inline elements into a unified LaTeX string.
 */
export function inlinesToLatex(
  inlines?: Inline[],
  context: InlineConvertContext = {}
): string {
  if (!inlines || inlines.length === 0) return '';
  return inlines.map((item) => singleInlineToLatex(item, context)).join('');
}
