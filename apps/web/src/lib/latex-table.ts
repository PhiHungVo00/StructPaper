import type { PaperTable } from '@/types/paper';
import type { ResolvedTheme } from './theme-config';
import { escapeLatex } from './latex-escape';

/**
 * LaTeX for one table block.
 *  - short tables: floating `tabulary` (kept together)
 *  - long tables (more than theme.longTableRowThreshold body rows): breakable `supertabular`
 *    that flows across columns/pages and repeats the header row (when theme.repeatTableHeader).
 */
export function tableToLatex(
  table: PaperTable,
  { isOneColumn, theme }: { isOneColumn: boolean; theme: ResolvedTheme }
): string {
  let out = '';
      const rawHeaders = table.headers && table.headers.length > 0 ? table.headers : ['Cột 1'];
      const rawRows = table.rows || [];
      const maxCols = Math.max(rawHeaders.length, ...rawRows.map((r) => r.length), 1);
      const colFmt = Array(maxCols).fill('L').join('');
      const headers = Array(maxCols).fill('').map((_, idx) => rawHeaders[idx] || '');
      const paddedRows = rawRows.map((row) => Array(maxCols).fill('').map((_, idx) => row[idx] || ''));

      // Check rotated vs 1-col vs 2-col
      const isRotated = !!table.isRotated;
      const isTabOneCol = isOneColumn || table.columnSpan === '1-column' || table.isFullWidth === false;
      const tabEnv = isRotated
        ? (isTabOneCol ? 'sidewaystable' : 'sidewaystable*')
        : (isTabOneCol ? 'table' : 'table*');

      let placement = '!htbp';
      if (table.placement === 'top') placement = 't';
      else if (table.placement === 'here') placement = '!h';
      else if (table.placement === 'bottom') placement = 'b';

      const tblFontSize = table.fontSize || '8pt';
      const tblLineHeight = tblFontSize === '7pt' ? '9pt' : tblFontSize === '9pt' ? '11pt' : tblFontSize === '10pt' ? '12pt' : '10pt';
      const tblArrayStretch = table.rowStretch || 1.4;
      const hasZebra = table.hasZebraStripes !== false;

      const bodyRowsForTable = (table.bodyRows && table.bodyRows.length > 0
        ? table.bodyRows
        : paddedRows.map((r) => r.map((c) => ({ text: c }))));
      const renderRow = (row: any[], rI: number) =>
        `${hasZebra && rI % 2 === 0 ? '\\rowcolor{tablezebracolor}\n' : ''}${row
          .map((cell: any) => {
            const rawText = cell.text !== undefined ? cell.text : String(cell || '');
            let escaped = escapeLatex(rawText);
            escaped = escaped.replace(/•/g, '$\\bullet$~');
            escaped = escaped.replace(/\r?\n/g, ' \\newline ');
            if (cell.colSpan && cell.colSpan > 1) {
              const alignChar = cell.align === 'center' ? 'c' : cell.align === 'right' ? 'r' : 'l';
              return `\\multicolumn{${cell.colSpan}}{${alignChar}}{${escaped}}`;
            }
            return escaped;
          })
          .join(' & ')} \\\\`;
      const tableSourceLine = table.source && table.source.trim()
        ? `\\par\\vspace{2pt}{\\footnotesize\\textit{${escapeLatex(table.source)}}}`
        : '';
      const isLongTable = !isRotated && bodyRowsForTable.length > theme.longTableRowThreshold;

      if (isLongTable) {
        // Breakable table: flows across columns/pages and repeats the header row on every page.
        const colW = `\\dimexpr(\\linewidth-${2 * maxCols}\\tabcolsep)/${maxCols}\\relax`;
        const spec = Array(maxCols).fill(`>{\\raggedright\\arraybackslash}p{${colW}}`).join('');
        const headRow = `\\rowcolor{tableheadrcolor}\n${headers.map((h) => `\\textbf{${escapeLatex(h)}}`).join(' & ')} \\\\ \\hline`;
        const repeat = theme.repeatTableHeader ? `\\tablehead{\\hline ${headRow}}\n` : '';
        out += `\n{\\fontsize{${tblFontSize}}{${tblLineHeight}}\\selectfont
\\def\\arraystretch{${tblArrayStretch}}
\\topcaption{{\\textbf{${escapeLatex(table.caption)}}}}
\\tablefirsthead{\\hline ${headRow}}
${repeat}\\tabletail{\\hline}
\\tablelasttail{\\hline}
\\begin{supertabular}{${spec}}
${bodyRowsForTable.map(renderRow).join('\n')}
\\end{supertabular}${tableSourceLine}}
\\par\\vspace{4pt}\n`;
      } else
      out += `\n\\begin{${tabEnv}}[${placement}]
\\caption{{\\textbf{${escapeLatex(table.caption)}}}}
\\label{tab:${table.num || 1}}
\\centering
{\\fontsize{${tblFontSize}}{${tblLineHeight}}\\selectfont
\\def\\arraystretch{${tblArrayStretch}}
\\begin{tabulary}{\\linewidth}{${colFmt}}
\\hline \\rowcolor{tableheadrcolor}
${headers.map((h) => `\\textbf{${escapeLatex(h)}}`).join(' & ')} \\\\ \\hline
${bodyRowsForTable.map(renderRow).join('\n')}
\\hline
\\end{tabulary}${tableSourceLine}}
\\end{${tabEnv}}\n`;
  return out;
}
