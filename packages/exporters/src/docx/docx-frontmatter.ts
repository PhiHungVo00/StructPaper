/**
 * Frontmatter section generator for docx exporter
 */

import {
  AlignmentType,
  BorderStyle,
  Paragraph,
  TextRun,
} from 'docx';
import type { FrontMatter, Inline } from '@structpaper/doc-model';
import { inlinesToPlainText } from './docx-inlines';

export function createFrontMatterElements(
  meta: FrontMatter,
  baseFont: string
): Paragraph[] {
  const elements: Paragraph[] = [];

  // 1. Article Title (18pt bold)
  elements.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 240, after: 120 },
      children: [
        new TextRun({
          text: inlinesToPlainText(meta.title),
          bold: true,
          size: 36, // 18pt
          font: { name: baseFont },
        }),
      ],
    })
  );

  // 2. English Translated Title (if present)
  if (meta.translations?.en) {
    elements.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 160 },
        children: [
          new TextRun({
            text: inlinesToPlainText(meta.translations.en as Inline[]),
            italics: true,
            size: 28, // 14pt
            font: { name: baseFont },
          }),
        ],
      })
    );
  }

  // 3. Authors
  if (meta.authors && meta.authors.length > 0) {
    const authorRuns: TextRun[] = [];
    meta.authors.forEach((author, idx) => {
      const affIndexes = author.affiliationIds
        .map((id) => {
          const pos = meta.affiliations?.findIndex((a) => a.id === id);
          return pos !== undefined && pos >= 0 ? String(pos + 1) : '';
        })
        .filter(Boolean);

      const supText =
        affIndexes.join(',') + (author.isCorresponding ? '*' : '');

      authorRuns.push(
        new TextRun({
          text: author.name,
          bold: true,
          size: 22,
          font: { name: baseFont },
        })
      );
      if (supText) {
        authorRuns.push(
          new TextRun({
            text: supText,
            superScript: true,
            font: { name: baseFont },
          })
        );
      }
      if (idx < meta.authors.length - 1) {
        authorRuns.push(new TextRun({ text: ', ', font: { name: baseFont } }));
      }
    });

    elements.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 80 },
        children: authorRuns,
      })
    );
  }

  // 4. Affiliations
  if (meta.affiliations && meta.affiliations.length > 0) {
    const affRuns: TextRun[] = [];
    meta.affiliations.forEach((aff, idx) => {
      const label = `${idx + 1}`;
      const parts = [
        aff.department,
        aff.institution,
        aff.city,
        aff.country,
      ].filter(Boolean);

      affRuns.push(
        new TextRun({
          text: `${label} `,
          superScript: true,
          font: { name: baseFont },
        }),
        new TextRun({
          text: parts.join(', ') + (idx < meta.affiliations.length - 1 ? '; ' : ''),
          italics: true,
          size: 18,
          font: { name: baseFont },
        })
      );
    });

    elements.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
        children: affRuns,
      })
    );
  }

  // 5. Abstract Box
  if (meta.abstract && meta.abstract.length > 0) {
    const abstractChildren: TextRun[] = [
      new TextRun({
        text: 'Tóm tắt — ',
        bold: true,
        font: { name: baseFont },
      }),
    ];
    meta.abstract.forEach((para) => {
      abstractChildren.push(
        new TextRun({
          text: inlinesToPlainText(para),
          font: { name: baseFont },
        })
      );
    });

    elements.push(
      new Paragraph({
        indent: { left: 400, right: 400 },
        border: {
          left: { style: BorderStyle.SINGLE, size: 16, color: '003366' },
        },
        spacing: { before: 120, after: 120, line: 260 },
        children: abstractChildren,
      })
    );
  }

  // 6. Keywords
  if (meta.keywords && meta.keywords.length > 0) {
    elements.push(
      new Paragraph({
        indent: { left: 400, right: 400 },
        spacing: { after: 240 },
        children: [
          new TextRun({
            text: 'Từ khóa: ',
            bold: true,
            font: { name: baseFont },
          }),
          new TextRun({
            text: meta.keywords.join(', '),
            italics: true,
            font: { name: baseFont },
          }),
        ],
      })
    );
  }

  return elements;
}
