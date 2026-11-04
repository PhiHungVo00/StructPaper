/**
 * Microsoft Word (.docx) Exporter for StructPaper v2
 *
 * Transforms a Manuscript AST v2 into an OOXML Word Document
 * using standard docx library with proper styling, typography, tables, and headers/footers.
 */

import {
  AlignmentType,
  Document,
  Footer,
  Header,
  HeadingLevel,
  Packer,
  PageNumber,
  Paragraph,
  TextRun,
} from 'docx';
import type {
  BackMatterItem,
  Manuscript,
  Reference,
} from '@structpaper/doc-model';
import type { JournalProfile } from '@structpaper/journal-profiles';
import { inlinesToPlainText } from './docx-inlines';
import { blockToDocx, sectionToDocx, type DocxElement } from './docx-blocks';
import { createFrontMatterElements } from './docx-frontmatter';
import { CslFormatter, type CslStyle } from '../csl';

export interface DocxExportOptions {
  profile?: JournalProfile;
  citationStyle?: CslStyle;
  baseFont?: string;
  marginMm?: number;
}

export class DocxExporter {
  /**
   * Generates a docx Document object from a Manuscript AST.
   */
  public exportToDocument(
    manuscript: Manuscript,
    options: DocxExportOptions = {}
  ): Document {
    const baseFont = options.baseFont || 'Times New Roman';
    const citationStyle = options.citationStyle || 'vancouver';
    const profile = options.profile;
    const meta = manuscript.meta;

    const refMap = new Map<string, Reference>();
    for (const r of manuscript.references || []) {
      refMap.set(r.id, r);
    }

    const numberingMap = new Map<string, number>();
    manuscript.references?.forEach((r, idx) => {
      numberingMap.set(r.id, idx + 1);
    });

    const ctx = {
      baseFont,
      citationStyle,
      references: refMap,
      numbering: numberingMap,
    };

    // 1. Front matter elements (Title, translated title, authors, affiliations, abstract, keywords)
    const elements: DocxElement[] = createFrontMatterElements(meta, baseFont);

    // 2. Body Sections
    for (const sec of manuscript.body || []) {
      elements.push(...sectionToDocx(sec, ctx));
    }

    // 3. Back Matter
    for (const rawItem of manuscript.back || []) {
      const item = rawItem as BackMatterItem;
      if (item && item.type) {
        const titleText = item.title
          ? inlinesToPlainText(item.title)
          : item.type.replace(/[-_]/g, ' ').toUpperCase();
        elements.push(
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 },
            children: [new TextRun({ text: titleText, bold: true, font: { name: baseFont } })],
          })
        );
        for (const b of item.content || []) {
          elements.push(...blockToDocx(b, ctx));
        }
      }
    }

    // 4. Bibliography
    if (manuscript.references && manuscript.references.length > 0) {
      elements.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 280, after: 140 },
          children: [
            new TextRun({
              text: 'Tài liệu tham khảo',
              bold: true,
              font: { name: baseFont },
            }),
          ],
        })
      );

      const formattedBib = CslFormatter.formatBibliography(
        manuscript.references,
        citationStyle
      );

      for (const entry of formattedBib) {
        elements.push(
          new Paragraph({
            indent: { left: 480, hanging: 480 },
            spacing: { after: 80, line: 260 },
            children: [
              new TextRun({
                text: entry.text,
                font: { name: baseFont },
              }),
            ],
          })
        );
      }
    }

    // Header & Footer
    const journalTitle =
      profile?.name || 'Tạp chí Phát triển Khoa học & Công nghệ';

    return new Document({
      sections: [
        {
          headers: {
            default: new Header({
              children: [
                new Paragraph({
                  alignment: AlignmentType.RIGHT,
                  children: [
                    new TextRun({
                      text: journalTitle,
                      italics: true,
                      size: 18,
                      font: { name: baseFont },
                    }),
                  ],
                }),
              ],
            }),
          },
          footers: {
            default: new Footer({
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [
                    new TextRun({
                      children: [PageNumber.CURRENT],
                      size: 18,
                      font: { name: baseFont },
                    }),
                  ],
                }),
              ],
            }),
          },
          children: elements,
        },
      ],
    });
  }

  /**
   * Serializes the Manuscript AST into a binary docx Buffer.
   */
  public async exportToBuffer(
    manuscript: Manuscript,
    options: DocxExportOptions = {}
  ): Promise<Buffer> {
    const doc = this.exportToDocument(manuscript, options);
    return await Packer.toBuffer(doc);
  }
}
