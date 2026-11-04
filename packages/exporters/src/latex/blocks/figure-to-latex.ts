/**
 * Figure Block to LaTeX Converter
 *
 * Converts FigureBlock AST nodes into standard figure or figure* environments
 * with graceful file-existence fallbacks and traceability markers.
 */

import type { FigureBlock } from '@structpaper/doc-model';
import { escapeTex, formatLatexKey } from '../escape-tex';
import { inlinesToLatex } from './inlines-to-latex';

/**
 * Converts a FigureBlock into LaTeX figure environment markup.
 */
export function figureToLatex(block: FigureBlock): string {
  const marker = `%%BLOCK:${block.id}\n`;
  const isTwoColumn = block.layout?.columnSpan === '2-column';
  const env = isTwoColumn ? 'figure*' : 'figure';

  const scalePercent =
    typeof block.layout?.scalePercent === 'number'
      ? Math.max(10, Math.min(100, block.layout.scalePercent))
      : 100;
  const widthFactor = (scalePercent / 100).toFixed(2);
  const widthArg = `width=${widthFactor}\\linewidth,keepaspectratio`;

  const assetId = block.assetId || 'figure.png';
  const labelKey = formatLatexKey(block.id, 'fig');
  const captionText = inlinesToLatex(block.caption);

  const lines: string[] = [
    marker + `\\begin{${env}}[htbp]`,
    '\\centering',
  ];

  // If multi-panel subfigures are present, render them side-by-side
  if (block.panels && block.panels.length > 0) {
    const panelWidth = (0.95 / block.panels.length).toFixed(2);
    lines.push('\\noindent');
    for (const panel of block.panels) {
      const panelAsset = panel.assetId || assetId;
      const panelCaption = panel.caption ? inlinesToLatex(panel.caption) : '';
      lines.push(
        `\\begin{minipage}{${panelWidth}\\linewidth}`,
        '\\centering',
        `\\IfFileExists{${panelAsset}}{\\includegraphics[width=\\linewidth,keepaspectratio]{${panelAsset}}}{%`,
        `\\IfFileExists{images/${panelAsset}}{\\includegraphics[width=\\linewidth,keepaspectratio]{images/${panelAsset}}}{%`,
        `\\fbox{\\parbox{0.9\\linewidth}{\\centering\\vspace{0.8cm}\\textbf{[${escapeTex(panel.label || panelAsset)}]}\\\\ \\textit{Tệp ảnh}\\vspace{0.8cm}}}%`,
        '}}',
        panelCaption ? `\\par\\vspace{2pt}{\\footnotesize ${panelCaption}}` : '',
        '\\end{minipage}\\hfill'
      );
    }
  } else {
    // Single figure inclusion with safe file existence fallback
    lines.push(
      `\\IfFileExists{${assetId}}{\\includegraphics[${widthArg}]{${assetId}}}{%`,
      `\\IfFileExists{images/${assetId}}{\\includegraphics[${widthArg}]{images/${assetId}}}{%`,
      `\\fbox{\\parbox{0.85\\linewidth}{\\centering\\vspace{1cm}\\textbf{[Hình: ${escapeTex(assetId)}]}\\\\ \\textit{Tệp ảnh minh họa}\\vspace{1cm}}}%`,
      '}}'
    );
  }

  lines.push(`\\caption{${captionText}}`);
  lines.push(`\\label{${labelKey}}`);

  if (block.source && block.source.length > 0) {
    lines.push(`\\vspace{2pt}\\par{\\footnotesize\\textit{Nguồn: ${inlinesToLatex(block.source)}}}\\par`);
  }

  lines.push(`\\end{${env}}`);

  return lines.filter(Boolean).join('\n');
}
