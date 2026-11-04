/**
 * Inlines to JATS XML 1.3 serializer
 */

import type { Inline } from '@structpaper/doc-model';
import { escapeXml } from './xml-utils';

export interface JatsInlineContext {
  citationLabels?: Map<string, string>;
}

/**
 * Maps document-model xref kinds to JATS 1.3 ref-types.
 */
function toJatsRefType(
  kind: 'figure' | 'table' | 'equation' | 'section'
): string {
  switch (kind) {
    case 'figure':
      return 'fig';
    case 'table':
      return 'table';
    case 'equation':
      return 'disp-formula';
    case 'section':
      return 'sec';
    default:
      return 'other';
  }
}

/**
 * Converts an array of inline tokens to JATS XML markup.
 */
export function inlinesToJats(
  inlines: Inline[] = [],
  ctx: JatsInlineContext = {}
): string {
  let xml = '';

  for (const item of inlines) {
    switch (item.t) {
      case 'text': {
        let text = escapeXml(item.v);
        if (item.marks && item.marks.length > 0) {
          for (const mark of item.marks) {
            switch (mark) {
              case 'b':
                text = `<bold>${text}</bold>`;
                break;
              case 'i':
                text = `<italic>${text}</italic>`;
                break;
              case 'sup':
                text = `<sup>${text}</sup>`;
                break;
              case 'sub':
                text = `<sub>${text}</sub>`;
                break;
              case 'code':
                text = `<monospace>${text}</monospace>`;
                break;
            }
          }
        }
        xml += text;
        break;
      }

      case 'cite': {
        const xrefs = item.refIds.map((refId) => {
          const label = ctx.citationLabels?.get(refId) || refId;
          return `<xref ref-type="bibr" rid="${escapeXml(refId)}">${escapeXml(label)}</xref>`;
        });
        xml += xrefs.join(', ');
        break;
      }

      case 'xref': {
        const refType = toJatsRefType(item.kind);
        xml += `<xref ref-type="${refType}" rid="${escapeXml(item.target)}">${escapeXml(item.target)}</xref>`;
        break;
      }

      case 'math': {
        xml += `<inline-formula><tex-math><![CDATA[${item.latex}]]></tex-math></inline-formula>`;
        break;
      }

      case 'link': {
        const content = inlinesToJats(item.content, ctx);
        xml += `<ext-link ext-link-type="uri" xlink:href="${escapeXml(item.href)}">${content}</ext-link>`;
        break;
      }

      case 'footnote': {
        xml += `<fn><p>Footnote</p></fn>`;
        break;
      }
    }
  }

  return xml;
}
