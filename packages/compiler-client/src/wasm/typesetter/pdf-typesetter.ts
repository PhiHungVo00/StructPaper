import { jsPDF } from 'jspdf';
import { parseLatexToAST } from '../parser/latex-ast-parser';
import type { PaperAST, ASTTable, ASTReference } from '../parser/ast-types';
import type { TypesetterOptions } from './typesetter-options';
export type { TypesetterOptions };
import {
  LIBERATION_SANS_REGULAR_BASE64,
  LIBERATION_SANS_BOLD_BASE64,
} from '../fonts/liberation-sans';

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN_LEFT = 42;
const MARGIN_RIGHT = 42;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT; // ~511.28 pt
const HEADER_Y = 28;
const FOOTER_Y = 818;
const MAX_CONTENT_Y = 800;
const INITIAL_PAGE_Y = 48;

/**
 * Registers embedded TrueType fonts with jsPDF instance.
 */
function registerFonts(doc: jsPDF): void {
  doc.addFileToVFS('LiberationSans-Regular.ttf', LIBERATION_SANS_REGULAR_BASE64);
  doc.addFont('LiberationSans-Regular.ttf', 'LiberationSans', 'normal');

  doc.addFileToVFS('LiberationSans-Bold.ttf', LIBERATION_SANS_BOLD_BASE64);
  doc.addFont('LiberationSans-Bold.ttf', 'LiberationSans', 'bold');
}

/**
 * Typesets an entire LaTeX document AST into a publication-quality multi-page PDF.
 */
export class PDFTypesetter {
  private doc: jsPDF;
  private cursorY: number = INITIAL_PAGE_Y;
  private options: TypesetterOptions;

  constructor(options: TypesetterOptions = {}) {
    this.options = options;
    this.doc = new jsPDF({
      orientation: 'portrait',
      unit: 'pt',
      format: 'a4',
      compress: true,
    });
    registerFonts(this.doc);
  }

  private checkPageBreak(requiredHeight: number): void {
    if (this.cursorY + requiredHeight > MAX_CONTENT_Y) {
      this.doc.addPage();
      this.cursorY = INITIAL_PAGE_Y;
    }
  }

  private renderTitleBlock(ast: PaperAST): void {
    const meta = ast.metadata;

    // Journal Badge
    this.doc.setFillColor(238, 242, 255);
    this.doc.rect(MARGIN_LEFT, this.cursorY, CONTENT_WIDTH, 20, 'F');
    this.doc.setFont('LiberationSans', 'bold');
    this.doc.setFontSize(8.5);
    this.doc.setTextColor(67, 56, 202);
    const journalTitle = this.options.journalName || meta.journalName || 'TẠP CHÍ PHÁT TRIỂN KHOA HỌC & CÔNG NGHỆ (VNUHCM PRESS)';
    this.doc.text(journalTitle.toUpperCase(), MARGIN_LEFT + 8, this.cursorY + 13);
    this.cursorY += 30;

    // Document Title
    this.doc.setFont('LiberationSans', 'bold');
    this.doc.setFontSize(15);
    this.doc.setTextColor(17, 24, 39);
    const titleLines = this.doc.splitTextToSize(meta.title, CONTENT_WIDTH);
    for (const line of titleLines) {
      this.checkPageBreak(20);
      this.doc.text(line, MARGIN_LEFT, this.cursorY);
      this.cursorY += 20;
    }
    this.cursorY += 6;

    // Authors
    if (meta.authors.length > 0) {
      this.checkPageBreak(16);
      this.doc.setFont('LiberationSans', 'bold');
      this.doc.setFontSize(10);
      this.doc.setTextColor(55, 65, 81);
      const authorsText = meta.authors.join('   •   ');
      const authorLines = this.doc.splitTextToSize(authorsText, CONTENT_WIDTH);
      for (const line of authorLines) {
        this.doc.text(line, MARGIN_LEFT, this.cursorY);
        this.cursorY += 14;
      }
      this.cursorY += 8;
    }

    // Abstract Box
    if (meta.abstract) {
      const abstractLines = this.doc.splitTextToSize(meta.abstract, CONTENT_WIDTH - 24);
      const boxHeight = abstractLines.length * 13 + 36;

      this.checkPageBreak(Math.min(boxHeight, 180));
      const boxStartY = this.cursorY;

      // Box background and left accent bar
      this.doc.setFillColor(248, 250, 252);
      this.doc.setDrawColor(226, 232, 240);
      this.doc.rect(MARGIN_LEFT, boxStartY, CONTENT_WIDTH, boxHeight, 'FD');

      this.doc.setFillColor(37, 99, 235);
      this.doc.rect(MARGIN_LEFT, boxStartY, 3.5, boxHeight, 'F');

      this.cursorY += 14;
      this.doc.setFont('LiberationSans', 'bold');
      this.doc.setFontSize(9);
      this.doc.setTextColor(30, 41, 59);
      this.doc.text('TÓM TẮT', MARGIN_LEFT + 12, this.cursorY);
      this.cursorY += 13;

      this.doc.setFont('LiberationSans', 'normal');
      this.doc.setFontSize(8.5);
      this.doc.setTextColor(51, 65, 85);
      for (const line of abstractLines) {
        if (this.cursorY + 13 > MAX_CONTENT_Y) {
          this.doc.addPage();
          this.cursorY = INITIAL_PAGE_Y;
        }
        this.doc.text(line, MARGIN_LEFT + 12, this.cursorY);
        this.cursorY += 13;
      }
      this.cursorY += 8;

      // Keywords
      if (meta.keywords.length > 0) {
        this.checkPageBreak(14);
        this.doc.setFont('LiberationSans', 'bold');
        this.doc.setFontSize(8.5);
        this.doc.setTextColor(71, 85, 105);
        this.doc.text('Từ khóa: ', MARGIN_LEFT + 12, this.cursorY);
        const kwWidth = this.doc.getTextWidth('Từ khóa: ');
        this.doc.setFont('LiberationSans', 'normal');
        this.doc.text(meta.keywords.join(', '), MARGIN_LEFT + 12 + kwWidth, this.cursorY);
        this.cursorY += 16;
      }

      this.cursorY += 10;
    }
  }

  private renderHeading(title: string, level: 1 | 2 | 3): void {
    const fontSize = level === 1 ? 11.5 : level === 2 ? 10.5 : 9.5;
    const required = level === 1 ? 32 : 24;
    this.checkPageBreak(required);

    this.cursorY += level === 1 ? 10 : 6;
    this.doc.setFont('LiberationSans', 'bold');
    this.doc.setFontSize(fontSize);
    this.doc.setTextColor(15, 23, 42);

    const lines = this.doc.splitTextToSize(title, CONTENT_WIDTH);
    for (const line of lines) {
      this.doc.text(line, MARGIN_LEFT, this.cursorY);
      this.cursorY += fontSize + 4;
    }
    this.cursorY += 4;
  }

  private renderParagraph(content: string): void {
    this.doc.setFont('LiberationSans', 'normal');
    this.doc.setFontSize(9.5);
    this.doc.setTextColor(30, 41, 59);

    const lines = this.doc.splitTextToSize(content, CONTENT_WIDTH);
    for (const line of lines) {
      this.checkPageBreak(13.5);
      this.doc.text(line, MARGIN_LEFT, this.cursorY);
      this.cursorY += 13.5;
    }
    this.cursorY += 5; // Paragraph spacing
  }

  private renderTable(table: ASTTable): void {
    this.checkPageBreak(60);

    if (table.caption) {
      this.doc.setFont('LiberationSans', 'bold');
      this.doc.setFontSize(9);
      this.doc.setTextColor(30, 41, 59);
      this.doc.text(table.caption, MARGIN_LEFT, this.cursorY);
      this.cursorY += 14;
    }

    const colCount = Math.max(table.headers.length, ...table.rows.map((r) => r.length), 1);
    const colWidth = CONTENT_WIDTH / colCount;

    // Header row
    this.checkPageBreak(20);
    this.doc.setFillColor(241, 245, 249);
    this.doc.setDrawColor(203, 213, 225);
    this.doc.rect(MARGIN_LEFT, this.cursorY, CONTENT_WIDTH, 18, 'FD');

    this.doc.setFont('LiberationSans', 'bold');
    this.doc.setFontSize(8.5);
    this.doc.setTextColor(15, 23, 42);
    for (let c = 0; c < table.headers.length; c++) {
      const cellText = String(table.headers[c] || '').slice(0, 30);
      this.doc.text(cellText, MARGIN_LEFT + c * colWidth + 5, this.cursorY + 12);
    }
    this.cursorY += 18;

    // Data rows
    this.doc.setFont('LiberationSans', 'normal');
    this.doc.setFontSize(8.5);
    this.doc.setTextColor(51, 65, 85);

    for (let r = 0; r < table.rows.length; r++) {
      this.checkPageBreak(18);
      const row = table.rows[r];

      // Alternating row background
      if (r % 2 === 1) {
        this.doc.setFillColor(248, 250, 252);
        this.doc.rect(MARGIN_LEFT, this.cursorY, CONTENT_WIDTH, 17, 'F');
      }

      this.doc.setDrawColor(226, 232, 240);
      this.doc.line(MARGIN_LEFT, this.cursorY + 17, MARGIN_LEFT + CONTENT_WIDTH, this.cursorY + 17);

      for (let c = 0; c < colCount; c++) {
        const cellText = String(row[c] || '').slice(0, 35);
        this.doc.text(cellText, MARGIN_LEFT + c * colWidth + 5, this.cursorY + 12);
      }
      this.cursorY += 17;
    }

    this.cursorY += 10;
  }

  private renderReferences(refs: ASTReference[]): void {
    if (refs.length === 0) return;

    this.renderHeading('TÀI LIỆU THAM KHẢO (REFERENCES)', 1);

    this.doc.setFont('LiberationSans', 'normal');
    this.doc.setFontSize(8);
    this.doc.setTextColor(51, 65, 85);

    for (const ref of refs) {
      const prefix = `[${ref.num || 1}] `;
      const lines = this.doc.splitTextToSize(ref.text, CONTENT_WIDTH - 24);

      this.checkPageBreak(lines.length * 11 + 4);

      this.doc.setFont('LiberationSans', 'bold');
      this.doc.text(prefix, MARGIN_LEFT, this.cursorY);

      this.doc.setFont('LiberationSans', 'normal');
      for (let idx = 0; idx < lines.length; idx++) {
        const xOffset = idx === 0 ? MARGIN_LEFT + 22 : MARGIN_LEFT + 22;
        this.doc.text(lines[idx], xOffset, this.cursorY);
        this.cursorY += 11;
      }
      this.cursorY += 3;
    }
  }

  private applyRunningHeadersAndFooters(ast: PaperAST): void {
    const totalPages = this.doc.getNumberOfPages();
    const shortTitle = (ast.metadata.title || '').slice(0, 50) + (ast.metadata.title?.length > 50 ? '...' : '');

    for (let p = 1; p <= totalPages; p++) {
      this.doc.setPage(p);

      // Running Header (pages > 1)
      if (p > 1) {
        this.doc.setFont('LiberationSans', 'normal');
        this.doc.setFontSize(8);
        this.doc.setTextColor(148, 163, 184);
        this.doc.text(shortTitle, MARGIN_LEFT, HEADER_Y);

        this.doc.text('BẢN THẢO XEM TRƯỚC (OFFLINE)', PAGE_WIDTH - MARGIN_RIGHT - 150, HEADER_Y);

        this.doc.setDrawColor(226, 232, 240);
        this.doc.setLineWidth(0.5);
        this.doc.line(MARGIN_LEFT, HEADER_Y + 5, PAGE_WIDTH - MARGIN_RIGHT, HEADER_Y + 5);
      }

      // Running Footer (all pages)
      this.doc.setDrawColor(226, 232, 240);
      this.doc.setLineWidth(0.5);
      this.doc.line(MARGIN_LEFT, FOOTER_Y - 12, PAGE_WIDTH - MARGIN_RIGHT, FOOTER_Y - 12);

      this.doc.setFont('LiberationSans', 'normal');
      this.doc.setFontSize(8);
      this.doc.setTextColor(148, 163, 184);
      this.doc.text('Biên dịch ngoại tuyến bằng WebAssembly · StructPaper', MARGIN_LEFT, FOOTER_Y);

      const pageText = `Trang ${p} / ${totalPages}`;
      const pageTextWidth = this.doc.getTextWidth(pageText);
      this.doc.text(pageText, PAGE_WIDTH - MARGIN_RIGHT - pageTextWidth, FOOTER_Y);
    }
  }

  public typeset(tex: string): Uint8Array {
    this.options.onProgress?.(20, 'Đang phân tích cấu trúc tài liệu LaTeX (AST Parsing)...');
    const ast = parseLatexToAST(tex);

    this.options.onProgress?.(40, 'Đang thiết lập tiêu đề và thông tin bài báo...');
    this.renderTitleBlock(ast);

    this.options.onProgress?.(60, 'Đang dàn trang văn bản và bảng biểu...');
    const refBlocks: ASTReference[] = [];

    for (const block of ast.blocks) {
      switch (block.type) {
        case 'h1':
          if (block.title) this.renderHeading(block.title, 1);
          break;
        case 'h2':
          if (block.title) this.renderHeading(block.title, 2);
          break;
        case 'h3':
          if (block.title) this.renderHeading(block.title, 3);
          break;
        case 'paragraph':
          if (block.content) this.renderParagraph(block.content);
          break;
        case 'table':
          if (block.table) this.renderTable(block.table);
          break;
        case 'reference':
          if (block.reference) refBlocks.push(block.reference);
          break;
      }
    }

    if (refBlocks.length > 0) {
      this.options.onProgress?.(80, 'Đang định dạng danh mục tài liệu tham khảo...');
      this.renderReferences(refBlocks);
    }

    this.options.onProgress?.(90, 'Đang đánh số trang và hoàn thiện tài liệu...');
    this.applyRunningHeadersAndFooters(ast);

    this.options.onProgress?.(100, 'Hoàn tất biên dịch bản thảo!');
    const arrayBuffer = this.doc.output('arraybuffer');
    return new Uint8Array(arrayBuffer);
  }
}

/**
 * Convenient function to typeset LaTeX source code into Uint8Array PDF bytes.
 */
export function typesetLatexToPdf(
  tex: string,
  options?: TypesetterOptions
): Uint8Array {
  const typesetter = new PDFTypesetter(options);
  return typesetter.typeset(tex);
}
