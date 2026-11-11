import type { PaperTable } from '@/types/paper';
import type { ResolvedTheme } from './theme-config';
import { escapeLatex } from './latex-escape';

import { stripCaptionLabel } from './docx-table-extras';
import { resolveBodyFill, rowIsTinted } from './table-fill';
/**
 * LaTeX for one table block. Layout is chosen from the table options:
 *
 *  | table is…                         | typeset as                                                    |
 *  | short                             | floating `table` / `table*` (1 or 2 columns)                  |
 *  | short + rotated                   | `sidewaystable(*)`                                            |
 *  | long + 1 column                   | `supertabular` flowing through the column(s)                  |
 *  | long + 2 columns, or long+rotated | own page(s): one-column `longtable` (landscape if rotated)    |
 *
 * Long tables repeat the header row on every page and show the "continued" markers used by the
 * journal ("Table N continued" on top, "Continued on next page" at the bottom).
 */
export function tableToLatex(
  table: PaperTable,
  { isOneColumn, theme }: { isOneColumn: boolean; theme: ResolvedTheme }
): string {
  const rawHeaders = table.headers && table.headers.length > 0 ? table.headers : ['Cột 1'];
  const rawRows = table.rows || [];
  const maxCols = Math.max(rawHeaders.length, ...rawRows.map((r) => r.length), 1);
  const headers = Array(maxCols).fill('').map((_, idx) => rawHeaders[idx] || '');
  const paddedRows = rawRows.map((row) => Array(maxCols).fill('').map((_, idx) => row[idx] || ''));

  const isRotated = !!table.isRotated;
  const spansOneColumn = isOneColumn || table.columnSpan === '1-column' || table.isFullWidth === false;

  const fontSize = table.fontSize || '8pt';
  const lineHeight = fontSize === '7pt' ? '9pt' : fontSize === '9pt' ? '11pt' : fontSize === '10pt' ? '12pt' : '10pt';
  const arrayStretch = table.rowStretch || 1.4;
  const fill = resolveBodyFill(table);

  const bodyRows = table.bodyRows && table.bodyRows.length > 0
    ? table.bodyRows
    : paddedRows.map((r) => r.map((c) => ({ text: c })));

  const renderRow = (row: any[], rI: number) =>
    `${rowIsTinted(fill, rI) ? '\\rowcolor{tablezebracolor}\n' : ''}${row
      .map((cell: any) => {
        const rawText = cell.text !== undefined ? cell.text : String(cell || '');
        let escaped = escapeLatex(rawText);
        escaped = escaped.replace(/•/g, '$\\bullet$~');
        escaped = escaped.replace(/\r?\n/g, ' \\newline ');
        // citations inside cells ("Ho [36,6]") become superscript natbib citations, as in the paragraphs
        escaped = escaped.replace(/\s*\[(\d+(?:\s*,\s*\d+)*)\]/g, (_m, nums: string) => `\\unskip\\cite{${nums.split(',').map((n) => `ref${n.trim()}`).join(',')}}`);
        if (cell.colSpan && cell.colSpan > 1) {
          const alignChar = cell.align === 'center' ? 'c' : cell.align === 'right' ? 'r' : 'l';
          return `\\multicolumn{${cell.colSpan}}{${alignChar}}{${escaped}}`;
        }
        return escaped;
      })
      .join(' & ')} \\\\`;

  const sourceLine = table.source && table.source.trim()
    ? `\\par\\vspace{2pt}{\\footnotesize ${table.source
        .split('\n')
        .filter((l) => l.trim())
        // notes ("Chú thích: …") are italic, the "Nguồn: …" line is upright, like the printed journal
        .map((l) => (/^(chú thích|ghi chú|notes?)\s*:/i.test(l.trim()) ? `\\textit{${escapeLatex(l.trim())}}` : escapeLatex(l.trim())))
        .join('\\newline ')}}`
    : '';

  const caption = `\\caption{{\\textbf{${escapeLatex(stripCaptionLabel(table.caption))}}}}`;
  const label = `\\label{tab:${table.num || 1}}`;
  const headRow = `\\rowcolor{tableheadrcolor}\n${headers.map((h) => `\\textbf{${escapeLatex(h)}}`).join(' & ')} \\\\ \\hline`;
  const continuedTitle = escapeLatex(theme.continuedTitleText.replace('{n}', String(table.num || '')));
  const continuedFoot = escapeLatex(theme.continuedFootText);
  // Column widths proportional to content length (clamped), like a typeset journal table.
  const weights = headers.map((h, c) => {
    const lens = [h.length, ...bodyRows.map((r) => String(r[c]?.text ?? r[c] ?? '').length)];
    const avg = lens.reduce((a, b) => a + b, 0) / lens.length;
    return Math.max(6, Math.min(60, Math.round(avg)));
  });
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  const colSpec = weights
    .map((w) => `>{\\raggedright\\arraybackslash}p{\\dimexpr(\\linewidth-${2 * maxCols}\\tabcolsep)*${w}/${totalWeight}\\relax}`)
    .join('');
  const sizeOpen = `{\\fontsize{${fontSize}}{${lineHeight}}\\selectfont\n\\def\\arraystretch{${arrayStretch}}`;

  const breakMode = table.breakAcrossPages ?? 'auto';
  const isLong = breakMode === 'always' || (breakMode === 'auto' && bodyRows.length > theme.longTableRowThreshold);

  // ---- long table, flowing inside one column ----
  if (isLong && spansOneColumn && !isRotated) {
    const contLine = `\\multicolumn{${maxCols}}{c}{\\textit{${continuedTitle}}}\\\\`;
    const repeat = theme.repeatTableHeader ? `\\tablehead{\\hline ${contLine}\n${headRow}}\n` : `\\tablehead{${contLine}}\n`;
    return `\n${sizeOpen}
\\topcaption{{\\textbf{${escapeLatex(stripCaptionLabel(table.caption))}}}}
\\tablefirsthead{\\hline ${headRow}}
${repeat}\\tabletail{\\hline \\multicolumn{${maxCols}}{r}{\\textit{${continuedFoot}}}\\\\}
\\tablelasttail{\\hline}
\\begin{supertabular}{${colSpec}}
${bodyRows.map(renderRow).join('\n')}
\\end{supertabular}${sourceLine}}
\\par\\vspace{4pt}\n`;
  }

  // ---- long table over 2 columns and/or rotated: own page(s), full width ----
  if (isLong) {
    const leave = isOneColumn ? '' : '\\onecolumn\n';
    const back = isOneColumn ? '' : '\\twocolumn\n';
    const open = isRotated ? '\\begin{landscape}\n' : '';
    const close = isRotated ? '\\end{landscape}\n' : '';
    const contLine = `\\multicolumn{${maxCols}}{c}{\\textit{${continuedTitle}}}\\\\`;
    const endHead = theme.repeatTableHeader
      ? `\\hline ${contLine}\n${headRow}\n\\endhead`
      : `\\hline ${contLine}\n\\endhead`;
    return `\n\\clearpage
${leave}${open}${sizeOpen}
\\begin{longtable}{${colSpec}}
${caption}${label}\\\\
\\hline ${headRow}
\\endfirsthead
${endHead}
\\hline \\multicolumn{${maxCols}}{r}{\\textit{${continuedFoot}}}\\\\
\\endfoot
\\hline
\\endlastfoot
${bodyRows.map(renderRow).join('\n')}
\\end{longtable}${sourceLine}}
${close}\\clearpage
${back}`;
  }

  // ---- short table: floating, kept together ----
  const tabEnv = isRotated
    ? (spansOneColumn ? 'sidewaystable' : 'sidewaystable*')
    : (spansOneColumn ? 'table' : 'table*');

  let placement = '!htbp';
  if (table.placement === 'top') placement = 't';
  else if (table.placement === 'here') placement = '!h';
  else if (table.placement === 'bottom') placement = 'b';

  const colFmt = Array(maxCols).fill('L').join('');
  return `\n\\begin{${tabEnv}}[${placement}]
${caption}
${label}
\\centering
${sizeOpen}
\\begin{tabulary}{\\linewidth}{${colFmt}}
\\hline ${headRow}
${bodyRows.map(renderRow).join('\n')}
\\hline
\\end{tabulary}${sourceLine}}
\\end{${tabEnv}}\n`;
}
