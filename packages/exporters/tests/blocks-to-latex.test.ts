import { describe, it, expect } from 'vitest';
import type {
  EquationBlock,
  FigureBlock,
  Inline,
  TableBlock,
} from '@structpaper/doc-model';
import {
  equationToLatex,
  figureToLatex,
  inlinesToLatex,
  tableToLatex,
  blockToLatex,
} from '../src/latex/blocks';

describe('Block & Inline LaTeX Converters', () => {
  describe('inlinesToLatex', () => {
    it('converts text with formatting marks (bold, italic, sup, sub, code)', () => {
      const inlines: Inline[] = [
        { t: 'text', v: 'Bold Text', marks: ['b'] },
        { t: 'text', v: ' ' },
        { t: 'text', v: 'Italic Text', marks: ['i'] },
        { t: 'text', v: ' ' },
        { t: 'text', v: 'Sup', marks: ['sup'] },
        { t: 'text', v: ' ' },
        { t: 'text', v: 'Sub', marks: ['sub'] },
        { t: 'text', v: ' ' },
        { t: 'text', v: 'code_var', marks: ['code'] },
      ];

      const latex = inlinesToLatex(inlines);
      expect(latex).toContain('\\textbf{Bold Text}');
      expect(latex).toContain('\\textit{Italic Text}');
      expect(latex).toContain('\\textsuperscript{Sup}');
      expect(latex).toContain('\\textsubscript{Sub}');
      expect(latex).toContain('\\texttt{code\\_var}');
    });

    it('converts math inlines ($...$)', () => {
      const inlines: Inline[] = [
        { t: 'text', v: 'Chỉ số ' },
        { t: 'math', latex: '\\text{FEV}_1 / \\text{FVC}' },
        { t: 'text', v: ' đạt chuẩn.' },
      ];
      const latex = inlinesToLatex(inlines);
      expect(latex).toBe('Chỉ số $\\text{FEV}_1 / \\text{FVC}$ đạt chuẩn.');
    });

    it('converts citations into Vancouver \\cite{...}', () => {
      const inlines: Inline[] = [
        { t: 'text', v: 'Theo kết quả trước ' },
        { t: 'cite', refIds: ['ref1', 'ref2'] },
      ];
      const latex = inlinesToLatex(inlines);
      expect(latex).toBe('Theo kết quả trước \\cite{ref:ref1,ref:ref2}');
    });

    it('converts cross-references into \\ref{...}', () => {
      const inlines: Inline[] = [
        { t: 'text', v: 'Như thể hiện ở ' },
        { t: 'xref', kind: 'figure', target: 'fig1' },
        { t: 'text', v: ' và ' },
        { t: 'xref', kind: 'table', target: 'tbl_results' },
      ];
      const latex = inlinesToLatex(inlines);
      expect(latex).toBe('Như thể hiện ở \\ref{fig:fig1} và \\ref{tab:tbl_results}');
    });

    it('converts links into \\href{...}{...}', () => {
      const inlines: Inline[] = [
        {
          t: 'link',
          href: 'https://doi.org/10.1234/5678',
          content: [{ t: 'text', v: 'Xem DOI' }],
        },
      ];
      const latex = inlinesToLatex(inlines);
      expect(latex).toBe('\\href{https://doi.org/10.1234/5678}{Xem DOI}');
    });
  });

  describe('equationToLatex', () => {
    it('converts numbered equation with %%BLOCK marker and label', () => {
      const block: EquationBlock = {
        type: 'equation',
        id: 'eq_or',
        latex: '\\text{OR} = \\frac{a \\times d}{b \\times c}',
        numbered: true,
        status: 'ok',
      };
      const latex = equationToLatex(block);
      expect(latex).toContain('%%BLOCK:eq_or');
      expect(latex).toContain('\\begin{equation}');
      expect(latex).toContain('\\label{eq:eq_or}');
      expect(latex).toContain('\\text{OR} = \\frac{a \\times d}{b \\times c}');
      expect(latex).toContain('\\end{equation}');
    });

    it('converts unnumbered equation with \\[...\\]', () => {
      const block: EquationBlock = {
        type: 'equation',
        id: 'eq_unnum',
        latex: 'E = mc^2',
        numbered: false,
        status: 'ok',
      };
      const latex = equationToLatex(block);
      expect(latex).toContain('%%BLOCK:eq_unnum');
      expect(latex).toContain('\\[');
      expect(latex).toContain('E = mc^2');
      expect(latex).toContain('\\]');
      expect(latex).not.toContain('\\begin{equation}');
    });
  });

  describe('figureToLatex', () => {
    it('converts 1-column figure with caption, label, safe fallback and %%BLOCK marker', () => {
      const block: FigureBlock = {
        type: 'figure',
        id: 'fig_01',
        assetId: 'chart.png',
        caption: [{ t: 'text', v: 'Biểu đồ phân bố độ tuổi bệnh nhân' }],
        layout: { columnSpan: '1-column', scalePercent: 85 },
        source: [{ t: 'text', v: 'Số liệu khảo sát 2026' }],
      };

      const latex = figureToLatex(block);
      expect(latex).toContain('%%BLOCK:fig_01');
      expect(latex).toContain('\\begin{figure}[htbp]');
      expect(latex).toContain('\\centering');
      expect(latex).toContain('\\IfFileExists{chart.png}');
      expect(latex).toContain('\\caption{Biểu đồ phân bố độ tuổi bệnh nhân}');
      expect(latex).toContain('\\label{fig:fig_01}');
      expect(latex).toContain('Nguồn: Số liệu khảo sát 2026');
      expect(latex).toContain('\\end{figure}');
    });

    it('converts 2-column figure into figure* environment', () => {
      const block: FigureBlock = {
        type: 'figure',
        id: 'fig_wide',
        assetId: 'wide_diagram.png',
        caption: [{ t: 'text', v: 'Sơ đồ quy trình tổng quát' }],
        layout: { columnSpan: '2-column' },
      };

      const latex = figureToLatex(block);
      expect(latex).toContain('%%BLOCK:fig_wide');
      expect(latex).toContain('\\begin{figure*}[htbp]');
      expect(latex).toContain('\\end{figure*}');
    });
  });

  describe('tableToLatex', () => {
    it('converts simple table with booktabs rules (\\toprule, \\midrule, \\bottomrule)', () => {
      const block: TableBlock = {
        type: 'table',
        id: 'tbl_simple',
        caption: [{ t: 'text', v: 'Bảng thống kê mẫu' }],
        headerRows: 1,
        grid: [
          [
            { content: [{ t: 'text', v: 'Thông số' }], rowSpan: 1, colSpan: 1, header: true, align: 'l' },
            { content: [{ t: 'text', v: 'Giá trị' }], rowSpan: 1, colSpan: 1, header: true, align: 'r' },
          ],
          [
            { content: [{ t: 'text', v: 'Số lượng' }], rowSpan: 1, colSpan: 1, align: 'l' },
            { content: [{ t: 'text', v: '100' }], rowSpan: 1, colSpan: 1, align: 'r' },
          ],
        ],
        layout: { columnSpan: '1-column' },
      };

      const latex = tableToLatex(block);
      expect(latex).toContain('%%BLOCK:tbl_simple');
      expect(latex).toContain('\\begin{table}[htbp]');
      expect(latex).toContain('\\begin{tabular}{lr}');
      expect(latex).toContain('\\toprule');
      expect(latex).toContain('\\textbf{Thông số} & \\textbf{Giá trị} \\\\');
      expect(latex).toContain('\\midrule');
      expect(latex).toContain('Số lượng & 100 \\\\');
      expect(latex).toContain('\\bottomrule');
      expect(latex).toContain('\\caption{Bảng thống kê mẫu}');
      expect(latex).toContain('\\label{tab:tbl_simple}');
      expect(latex).toContain('\\end{table}');
    });

    it('supports colSpan using \\multicolumn and rowSpan using \\multirow', () => {
      const block: TableBlock = {
        type: 'table',
        id: 'tbl_merged',
        caption: [{ t: 'text', v: 'Bảng gộp ô' }],
        headerRows: 1,
        grid: [
          [
            { content: [{ t: 'text', v: 'Chỉ số chung' }], rowSpan: 1, colSpan: 2, header: true, align: 'c' },
          ],
          [
            { content: [{ t: 'text', v: 'Nhóm A' }], rowSpan: 2, colSpan: 1, align: 'l' },
            { content: [{ t: 'text', v: 'Dữ liệu 1' }], rowSpan: 1, colSpan: 1, align: 'r' },
          ],
          [
            { content: [{ t: 'text', v: 'Dữ liệu 2' }], rowSpan: 1, colSpan: 1, align: 'r' },
          ],
        ],
        layout: { columnSpan: '1-column' },
      };

      const latex = tableToLatex(block);
      expect(latex).toContain('\\multicolumn{2}{c}{\\textbf{Chỉ số chung}}');
      expect(latex).toContain('\\multirow{2}{*}{Nhóm A}');
    });
  });

  describe('blockToLatex Dispatcher', () => {
    it('dispatches paragraph, list, quote and pageBreak with %%BLOCK markers', () => {
      const paraLatex = blockToLatex({
        type: 'paragraph',
        id: 'p_1',
        content: [{ t: 'text', v: 'Nội dung đoạn văn.' }],
      });
      expect(paraLatex).toContain('%%BLOCK:p_1\nNội dung đoạn văn.');

      const listLatex = blockToLatex({
        type: 'list',
        id: 'list_1',
        ordered: true,
        items: [
          [{ type: 'paragraph', id: 'li_p1', content: [{ t: 'text', v: 'Mục 1' }] }],
          [{ type: 'paragraph', id: 'li_p2', content: [{ t: 'text', v: 'Mục 2' }] }],
        ],
      });
      expect(listLatex).toContain('%%BLOCK:list_1');
      expect(listLatex).toContain('\\begin{enumerate}');
      expect(listLatex).toContain('\\item %%BLOCK:li_p1\nMục 1');
      expect(listLatex).toContain('\\end{enumerate}');

      const pbLatex = blockToLatex({
        type: 'pageBreak',
        id: 'pb_1',
      });
      expect(pbLatex).toContain('%%BLOCK:pb_1\n\\clearpage');
    });
  });
});
