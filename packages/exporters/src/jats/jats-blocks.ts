/**
 * Blocks & Sections to JATS XML 1.3 serializer
 */

import type { Block, Section, Cell } from '@structpaper/doc-model';
import { inlinesToJats, type JatsInlineContext } from './jats-inlines';
import { escapeXml } from './xml-utils';

/**
 * Converts a table cell to <th> or <td>.
 */
function cellToJats(cell: Cell, isHeader: boolean, ctx: JatsInlineContext): string {
  const tag = isHeader || cell.header ? 'th' : 'td';
  const attrs: string[] = [];

  if (cell.colSpan > 1) {
    attrs.push(`colspan="${cell.colSpan}"`);
  }
  if (cell.rowSpan > 1) {
    attrs.push(`rowspan="${cell.rowSpan}"`);
  }
  if (cell.align) {
    const alignMap = { l: 'left', c: 'center', r: 'right' };
    attrs.push(`align="${alignMap[cell.align] || 'left'}"`);
  }

  const attrStr = attrs.length > 0 ? ` ${attrs.join(' ')}` : '';
  const content = inlinesToJats(cell.content, ctx);
  return `<${tag}${attrStr}>${content}</${tag}>`;
}

/**
 * Converts a single Block to JATS XML.
 */
export function blockToJats(block: Block, ctx: JatsInlineContext): string {
  switch (block.type) {
    case 'paragraph': {
      const content = inlinesToJats(block.content, ctx);
      return `<p id="${escapeXml(block.id)}">${content}</p>`;
    }

    case 'list': {
      const listType = block.ordered ? 'order' : 'bullet';
      const items = block.items
        .map((itemBlocks) => {
          const body = blocksToJats(itemBlocks, ctx);
          return `<list-item>${body}</list-item>`;
        })
        .join('\n');
      return `<list list-type="${listType}" id="${escapeXml(block.id)}">\n${items}\n</list>`;
    }

    case 'quote': {
      const body = blocksToJats(block.content, ctx);
      return `<disp-quote id="${escapeXml(block.id)}">\n${body}\n</disp-quote>`;
    }

    case 'box': {
      const body = blocksToJats(block.content, ctx);
      return `<boxed-text id="${escapeXml(block.id)}">\n${body}\n</boxed-text>`;
    }

    case 'equation': {
      const label =
        block.numbered && block.label
          ? `<label>${escapeXml(block.label)}</label>`
          : '';
      return `<disp-formula id="${escapeXml(block.id)}">${label}<tex-math><![CDATA[${block.latex}]]></tex-math></disp-formula>`;
    }

    case 'figure': {
      const caption = inlinesToJats(block.caption, ctx);
      const source = block.source
        ? `<attrib>${inlinesToJats(block.source, ctx)}</attrib>`
        : '';
      return [
        `<fig id="${escapeXml(block.id)}" orientation="portrait" position="float">`,
        `  <caption><title>${caption}</title></caption>`,
        `  <graphic xlink:href="${escapeXml(block.assetId)}" />`,
        source ? `  ${source}` : '',
        `</fig>`,
      ]
        .filter(Boolean)
        .join('\n');
    }

    case 'table': {
      const caption = inlinesToJats(block.caption, ctx);
      const rows: string[] = [];

      const theadRows: string[] = [];
      const tbodyRows: string[] = [];

      block.grid.forEach((row, rowIndex) => {
        const isHeaderRow = rowIndex < block.headerRows;
        const cellXml = row
          .map((cell) => cellToJats(cell, isHeaderRow, ctx))
          .join('');
        const rowXml = `  <tr>${cellXml}</tr>`;

        if (isHeaderRow) {
          theadRows.push(rowXml);
        } else {
          tbodyRows.push(rowXml);
        }
      });

      const tableContent: string[] = [];
      if (theadRows.length > 0) {
        tableContent.push('<thead>', ...theadRows, '</thead>');
      }
      if (tbodyRows.length > 0) {
        tableContent.push('<tbody>', ...tbodyRows, '</tbody>');
      }

      let footXml = '';
      if (block.notes || block.source) {
        const noteItems: string[] = [];
        if (block.notes) {
          noteItems.push(`<p>${inlinesToJats(block.notes, ctx)}</p>`);
        }
        if (block.source) {
          noteItems.push(`<p><italic>Nguồn:</italic> ${inlinesToJats(block.source, ctx)}</p>`);
        }
        footXml = `  <table-wrap-foot>\n    ${noteItems.join('\n    ')}\n  </table-wrap-foot>`;
      }

      return [
        `<table-wrap id="${escapeXml(block.id)}" orientation="portrait" position="float">`,
        `  <caption><title>${caption}</title></caption>`,
        `  <table>`,
        ...tableContent.map((l) => `    ${l}`),
        `  </table>`,
        footXml,
        `</table-wrap>`,
      ]
        .filter(Boolean)
        .join('\n');
    }

    case 'pageBreak':
      return '';

    default:
      return '';
  }
}

/**
 * Converts a sequence of Blocks to JATS XML.
 */
export function blocksToJats(blocks: Block[] = [], ctx: JatsInlineContext): string {
  return blocks
    .map((b) => blockToJats(b, ctx))
    .filter(Boolean)
    .join('\n');
}

/**
 * Converts a hierarchical Section to `<sec>`.
 */
export function sectionToJats(section: Section, ctx: JatsInlineContext): string {
  const title = inlinesToJats(section.title, ctx);
  const blocks = blocksToJats(section.blocks, ctx);
  const children = section.children
    ? section.children.map((c) => sectionToJats(c, ctx)).join('\n')
    : '';

  return [
    `<sec id="${escapeXml(section.id)}">`,
    `  <title>${title}</title>`,
    blocks ? `  ${blocks}` : '',
    children ? `  ${children}` : '',
    `</sec>`,
  ]
    .filter(Boolean)
    .join('\n');
}
