/**
 * Inlines to docx TextRun & Hyperlink converter
 */

import {
  ExternalHyperlink,
  ParagraphChild,
  TextRun,
} from 'docx';
import type { Inline, Reference } from '@structpaper/doc-model';
import { CslFormatter, type CslStyle } from '../csl';

export interface DocxInlineContext {
  citationStyle?: CslStyle;
  numbering?: Map<string, number>;
  references?: Map<string, Reference>;
  baseFont?: string;
}

/**
 * Extracts raw plain text from an array of Inline tokens.
 */
export function inlinesToPlainText(inlines: Inline[] = []): string {
  let text = '';
  for (const item of inlines) {
    if (item.t === 'text') {
      text += item.v;
    } else if (item.t === 'math') {
      text += item.latex;
    } else if (item.t === 'link') {
      text += inlinesToPlainText(item.content);
    } else if (item.t === 'xref') {
      text += item.target;
    }
  }
  return text;
}

/**
 * Converts an array of doc-model Inlines into docx ParagraphChild elements.
 */
export function inlinesToDocx(
  inlines: Inline[] = [],
  ctx: DocxInlineContext = {}
): ParagraphChild[] {
  const children: ParagraphChild[] = [];
  const baseFont = ctx.baseFont || 'Times New Roman';

  for (const item of inlines) {
    switch (item.t) {
      case 'text': {
        const marks = item.marks || [];
        const isCode = marks.includes('code');
        children.push(
          new TextRun({
            text: item.v,
            bold: marks.includes('b'),
            italics: marks.includes('i'),
            superScript: marks.includes('sup'),
            subScript: marks.includes('sub'),
            font: isCode ? { name: 'Consolas' } : { name: baseFont },
          })
        );
        break;
      }

      case 'cite': {
        const callout = CslFormatter.formatCallout(item.refIds, {
          style: ctx.citationStyle || 'vancouver',
          numbering: ctx.numbering,
          references: ctx.references,
        });
        children.push(
          new TextRun({
            text: callout,
            font: { name: baseFont },
          })
        );
        break;
      }

      case 'xref': {
        children.push(
          new TextRun({
            text: item.target,
            bold: false,
            font: { name: baseFont },
          })
        );
        break;
      }

      case 'math': {
        children.push(
          new TextRun({
            text: item.latex,
            italics: true,
            font: { name: 'Cambria Math' },
          })
        );
        break;
      }

      case 'link': {
        const linkChildren = inlinesToDocx(item.content, ctx);
        children.push(
          new ExternalHyperlink({
            children: linkChildren,
            link: item.href,
          })
        );
        break;
      }

      case 'footnote': {
        children.push(
          new TextRun({
            text: '[*]',
            superScript: true,
            font: { name: baseFont },
          })
        );
        break;
      }
    }
  }

  return children;
}
