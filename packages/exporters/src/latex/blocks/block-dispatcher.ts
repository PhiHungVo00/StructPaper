/**
 * Block Dispatcher
 *
 * Dispatches arbitrary Block AST nodes to their corresponding LaTeX converters,
 * ensuring each block is preceded by a traceability marker %%BLOCK:<id>.
 */

import type { Block } from '@structpaper/doc-model';
import { inlinesToLatex } from './inlines-to-latex';
import { equationToLatex } from './equation-to-latex';
import { figureToLatex } from './figure-to-latex';
import { tableToLatex } from './table-to-latex';

/**
 * Converts a single Block AST node into LaTeX markup.
 */
export function blockToLatex(block: Block): string {
  switch (block.type) {
    case 'paragraph': {
      const marker = `%%BLOCK:${block.id}\n`;
      const body = inlinesToLatex(block.content);
      return `${marker}${body}\n\n`;
    }

    case 'list': {
      const marker = `%%BLOCK:${block.id}\n`;
      const env = block.ordered ? 'enumerate' : 'itemize';
      const itemsLatex = block.items
        .map((subBlocks) => `\\item ${blocksToLatex(subBlocks).trim()}`)
        .join('\n');
      return `${marker}\\begin{${env}}\n${itemsLatex}\n\\end{${env}}\n\n`;
    }

    case 'quote': {
      const marker = `%%BLOCK:${block.id}\n`;
      const inner = blocksToLatex(block.content).trim();
      return `${marker}\\begin{quote}\n${inner}\n\\end{quote}\n\n`;
    }

    case 'box': {
      const marker = `%%BLOCK:${block.id}\n`;
      const inner = blocksToLatex(block.content).trim();
      return `${marker}\\begin{quote}\n${inner}\n\\end{quote}\n\n`;
    }

    case 'equation':
      return equationToLatex(block) + '\n\n';

    case 'figure':
      return figureToLatex(block) + '\n\n';

    case 'table':
      return tableToLatex(block) + '\n\n';

    case 'pageBreak':
      return `%%BLOCK:${block.id}\n\\clearpage\n\n`;

    default:
      return '';
  }
}

/**
 * Converts a sequence of Block AST nodes into LaTeX markup.
 */
export function blocksToLatex(blocks: Block[]): string {
  if (!blocks || blocks.length === 0) return '';
  return blocks.map((b) => blockToLatex(b)).join('');
}
