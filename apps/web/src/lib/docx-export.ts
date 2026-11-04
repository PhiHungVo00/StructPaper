import {
  Document,
  Paragraph,
  TextRun,
  HeadingLevel,
  Packer,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  ShadingType,
} from 'docx';
import { CompletePaper } from '@/types/paper';

// Official font families matching ID630_HS-2026-10-02-06-42.docx & VNUHCMJ-HS-Vi.dotx
const FONT_SERIF = 'Times New Roman';
const FONT_SANS = 'Calibri';
const FONT_AFFIL = 'Palatino Linotype';
const COLOR_TITLE = '2B74B7'; // Official journal title color
const COLOR_MUTED = '555555';
const COLOR_GRAY = '7F7F7F';

/**
 * Exports complete paper into DOCX format conforming to VNUHCM journal styles.
 */
export async function exportPaperToDocx(paper: CompletePaper): Promise<Blob> {
  const { metadata, sections, references } = paper;

  const docParagraphs: (Paragraph | Table)[] = [];

  // 1. Running Header / Journal name
  docParagraphs.push(
    new Paragraph({
      children: [
        new TextRun({
          text: `${metadata.journalName || 'Tạp chí Phát triển Khoa học và Công nghệ'} ${metadata.year || 2026}, ${metadata.volume || 7}(${metadata.issue || 2}):${metadata.firstPage || 1}–${metadata.lastPage || 10}`,
          font: FONT_SANS,
          size: 16, // 8pt
          bold: true,
          italics: true,
        }),
      ],
      spacing: { after: 100 },
    })
  );

  // 2. Open Access Full Text Article & Article Type
  docParagraphs.push(
    new Paragraph({
      children: [
        new TextRun({
          text: 'Open Access Full Text Article        ',
          font: FONT_AFFIL,
          size: 16, // 8pt
          bold: true,
          color: COLOR_GRAY,
        }),
        new TextRun({
          text: metadata.articleType || 'Bài tổng quan',
          font: FONT_AFFIL,
          size: 20, // 10pt
          bold: true,
          italics: true,
          underline: {},
        }),
      ],
      spacing: { after: 200 },
    })
  );

  // 3. Article Title - Exact: Calibri 18pt Bold #2B74B7
  docParagraphs.push(
    new Paragraph({
      children: [
        new TextRun({
          text: metadata.title,
          font: FONT_SANS,
          size: 36, // 18pt
          bold: true,
          color: COLOR_TITLE,
        }),
      ],
      spacing: { before: 100, after: 150 },
    })
  );

  if (metadata.titleEn) {
    docParagraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: metadata.titleEn,
            font: FONT_SANS,
            size: 24, // 12pt
            italics: true,
            color: COLOR_MUTED,
          }),
        ],
        spacing: { after: 200 },
      })
    );
  }

  // 4. Authors with superscript affiliations
  const authorRuns: TextRun[] = [];
  metadata.authors.forEach((a, idx) => {
    authorRuns.push(
      new TextRun({
        text: a.name,
        font: FONT_SANS,
        size: 22, // 11pt
        bold: true,
        color: COLOR_TITLE,
      })
    );
    const affIds = a.affiliationIds && a.affiliationIds.length > 0 ? a.affiliationIds.join(',') : '1';
    authorRuns.push(
      new TextRun({
        text: `${affIds}${a.isCorresponding ? ',*' : ''}`,
        font: FONT_SANS,
        size: 16, // 8pt
        superScript: true,
        color: COLOR_TITLE,
      })
    );
    if (idx < metadata.authors.length - 1) {
      authorRuns.push(
        new TextRun({
          text: ', ',
          font: FONT_SANS,
          size: 22,
          color: COLOR_TITLE,
        })
      );
    }
  });

  docParagraphs.push(
    new Paragraph({
      children: authorRuns,
      spacing: { after: 150 },
    })
  );

  // 5. Affiliations - Palatino Linotype 8pt Italic
  metadata.affiliations.forEach((aff) => {
    docParagraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `${aff.id ? aff.id + '. ' : ''}${aff.name}`,
            font: FONT_AFFIL,
            size: 16, // 8pt
            italics: true,
            color: '333333',
          }),
        ],
        spacing: { after: 60 },
      })
    );
  });

  // 6. Correspondence & History Sidebar block
  const corr = metadata.corresponding || (metadata.authors.find((a) => a.isCorresponding) ? {
    name: metadata.authors.find((a) => a.isCorresponding)?.name || '',
    email: 'contact@example.edu.vn',
    affiliation: metadata.affiliations[0]?.name || '',
  } : null);

function formatJournalDate(dateStr?: string): string {
  if (!dateStr) return '';
  const trimmed = dateStr.trim();
  const parts = trimmed.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})$/);
  if (parts) {
    const dd = parts[1].padStart(2, '0');
    const mm = parts[2].padStart(2, '0');
    const yyyy = parts[3];
    return `${dd}-${mm}-${yyyy}`;
  }
  const isoParts = trimmed.match(/^(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})$/);
  if (isoParts) {
    const yyyy = isoParts[1];
    const mm = isoParts[2].padStart(2, '0');
    const dd = isoParts[3].padStart(2, '0');
    return `${dd}-${mm}-${yyyy}`;
  }
  return trimmed;
}

  if (corr) {
    docParagraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: 'Liên hệ',
            font: FONT_AFFIL,
            size: 14, // 7pt
            bold: true,
            color: COLOR_TITLE,
          }),
        ],
        spacing: { before: 120, after: 40 },
      })
    );
    docParagraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `${corr.name}, `,
            font: FONT_SANS,
            size: 14, // 7pt
            bold: true,
            color: '222222',
          }),
          new TextRun({
            text: `${corr.affiliation} - Email: ${corr.email}`,
            font: FONT_SANS,
            size: 14, // 7pt
            color: '333333',
          }),
        ],
        spacing: { after: 80 },
      })
    );
  }

  if (metadata.dates) {
    docParagraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: 'Lịch sử',
            font: FONT_AFFIL,
            size: 14, // 7pt
            bold: true,
            color: COLOR_TITLE,
          }),
        ],
        spacing: { before: 80, after: 40 },
      })
    );

    const dateItems = [
      { label: 'Ngày nhận: ', val: formatJournalDate(metadata.dates.received) },
      { label: 'Ngày sửa đổi: ', val: formatJournalDate(metadata.dates.revised) },
      { label: 'Ngày chấp nhận: ', val: formatJournalDate(metadata.dates.accepted) },
      { label: 'Ngày đăng: ', val: formatJournalDate(metadata.dates.published) },
    ].filter((d) => Boolean(d.val));

    dateItems.forEach((d) => {
      docParagraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: '• ',
              font: FONT_SANS,
              size: 16, // 8pt
              bold: true,
              color: COLOR_TITLE,
            }),
            new TextRun({
              text: d.label,
              font: FONT_SERIF,
              size: 16, // 8pt
              color: '333333',
            }),
            new TextRun({
              text: d.val,
              font: FONT_SANS,
              size: 16, // 8pt
              color: '333333',
            }),
          ],
          spacing: { after: 30 },
        })
      );
    });
  }

  if (metadata.doi) {
    docParagraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: 'DOI : ',
            font: FONT_SANS,
            size: 14, // 7pt
            bold: true,
            color: COLOR_TITLE,
          }),
          new TextRun({
            text: metadata.doi,
            font: FONT_AFFIL,
            size: 14, // 7pt
            bold: true,
            color: '000000',
          }),
        ],
        spacing: { before: 80, after: 80 },
      })
    );
  }

  // Bản quyền (Copyright)
  docParagraphs.push(
    new Paragraph({
      children: [
        new TextRun({
          text: 'Bản quyền',
          font: FONT_AFFIL,
          size: 14, // 7pt
          bold: true,
          color: COLOR_TITLE,
        }),
      ],
      spacing: { before: 80, after: 40 },
    })
  );
  docParagraphs.push(
    new Paragraph({
      children: [
        new TextRun({
          text: '© ĐHQG Tp.HCM. Đây là bài báo công bố mở được phát hành theo các điều khoản của the Creative Commons Attribution 4.0 International license.',
          font: FONT_SANS,
          size: 14, // 7pt
          color: '333333',
        }),
      ],
      spacing: { after: 200 },
    })
  );

  // 7. Abstract Box - Exact: Calibri 9pt Bold TÓM TẮT, 9.5pt Body
  docParagraphs.push(
    new Paragraph({
      children: [
        new TextRun({
          text: 'TÓM TẮT',
          font: FONT_SANS,
          size: 18, // 9pt
          bold: true,
          color: COLOR_TITLE,
        }),
      ],
      spacing: { before: 200, after: 100 },
    })
  );

  docParagraphs.push(
    new Paragraph({
      children: [
        new TextRun({
          text: metadata.abstract,
          font: FONT_SANS,
          size: 19, // 9.5pt
          color: '111111',
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 140 },
    })
  );

  // 8. Keywords - Exact: Calibri 9.5pt
  docParagraphs.push(
    new Paragraph({
      children: [
        new TextRun({
          text: 'Từ khoá: ',
          font: FONT_SANS,
          size: 19,
          bold: true,
          color: COLOR_TITLE,
        }),
        new TextRun({
          text: metadata.keywords.join(', ') + '.',
          font: FONT_SANS,
          size: 19,
          color: '111111',
        }),
      ],
      spacing: { after: 300 },
    })
  );

  // 9. Body sections - Headings in Calibri Bold #2B74B7, Paragraphs in Times New Roman 9.5pt/10pt
  sections.forEach((sec) => {
    if (sec.type === 'h1' && sec.title) {
      docParagraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: sec.title.toUpperCase(),
              font: FONT_SANS,
              size: 24, // 12pt
              bold: true,
              color: COLOR_TITLE,
            }),
          ],
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 300, after: 120 },
        })
      );
      if (sec.content) {
        docParagraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: sec.content,
                font: FONT_SERIF,
                size: 20, // 10pt
              }),
            ],
            alignment: AlignmentType.JUSTIFIED,
            indent: { firstLine: 360 },
            spacing: { after: 120 },
          })
        );
      }
    } else if (sec.type === 'h2' && sec.title) {
      docParagraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: sec.title,
              font: FONT_SANS,
              size: 20, // 10pt
              bold: true,
              color: COLOR_TITLE,
            }),
          ],
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 90 },
        })
      );
      if (sec.content) {
        docParagraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: sec.content,
                font: FONT_SERIF,
                size: 20, // 10pt
              }),
            ],
            alignment: AlignmentType.JUSTIFIED,
            indent: { firstLine: 360 },
            spacing: { after: 120 },
          })
        );
      }
    } else if (sec.type === 'h3' && sec.title) {
      docParagraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: sec.title,
              font: FONT_SANS,
              size: 20, // 10pt
              bold: true,
              italics: true,
              color: COLOR_TITLE,
            }),
          ],
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 180, after: 80 },
        })
      );
      if (sec.content) {
        docParagraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: sec.content,
                font: FONT_SERIF,
                size: 20,
              }),
            ],
            alignment: AlignmentType.JUSTIFIED,
            indent: { firstLine: 360 },
            spacing: { after: 120 },
          })
        );
      }
    } else if (sec.type === 'paragraph' && sec.content) {
      docParagraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: sec.content,
              font: FONT_SERIF,
              size: 20, // 10pt
            }),
          ],
          alignment: AlignmentType.JUSTIFIED,
          indent: { firstLine: 360 },
          spacing: { after: 120 },
        })
      );
    } else if (sec.type === 'table' && sec.table) {
      docParagraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `Bảng ${sec.table.num}: `,
              font: FONT_SANS,
              size: 17, // 8.5pt
              bold: true,
              color: COLOR_TITLE,
            }),
            new TextRun({
              text: sec.table.caption,
              font: FONT_SANS,
              size: 17,
              bold: true,
            }),
          ],
          spacing: { before: 200, after: 100 },
        })
      );

      const tableRows: TableRow[] = [
        new TableRow({
          children: sec.table.headers.map(
            (h) =>
              new TableCell({
                shading: { type: ShadingType.CLEAR, fill: 'E5E5E5' },
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: h,
                        font: FONT_SANS,
                        size: 16, // 8pt
                        bold: true,
                      }),
                    ],
                  }),
                ],
              })
          ),
        }),
      ];

      sec.table.rows.forEach((row, rIdx) => {
        const fill = rIdx % 2 === 0 ? 'E7ECF7' : 'FFFFFF';
        tableRows.push(
          new TableRow({
            children: row.map(
              (cell) =>
                new TableCell({
                  shading: { type: ShadingType.CLEAR, fill },
                  children: [
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: cell,
                          font: FONT_SERIF,
                          size: 16, // 8pt
                        }),
                      ],
                    }),
                  ],
                })
            ),
          })
        );
      });

      docParagraphs.push(
        new Table({
          rows: tableRows,
          width: { size: 100, type: WidthType.PERCENTAGE },
        })
      );
    } else if (sec.type === 'figure' && sec.figure) {
      docParagraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `Hình ${sec.figure.num}: `,
              font: FONT_SANS,
              size: 17, // 8.5pt
              bold: true,
              color: COLOR_TITLE,
            }),
            new TextRun({
              text: sec.figure.caption,
              font: FONT_SANS,
              size: 17,
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { before: 200, after: sec.figure.source ? 60 : 200 },
        })
      );
      if (sec.figure.source) {
        docParagraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: sec.figure.source,
                font: FONT_SANS,
                size: 15, // 7.5pt
                italics: true,
                color: '666666',
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
          })
        );
      }
    } else if (sec.type === 'citation' && sec.content) {
      docParagraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: 'Trích dẫn bài báo này: ',
              font: FONT_SANS,
              size: 18,
              bold: true,
              color: COLOR_TITLE,
            }),
            new TextRun({
              text: sec.content,
              font: FONT_SERIF,
              size: 18,
              italics: true,
            }),
          ],
          spacing: { before: 200, after: 200 },
        })
      );
    }
  });

  // 10. References - Exact: Calibri 7.5pt/8pt with #2B74B7 bold number
  if (references.length > 0) {
    docParagraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: 'TÀI LIỆU THAM KHẢO',
            font: FONT_SANS,
            size: 24, // 12pt
            bold: true,
            color: COLOR_TITLE,
          }),
        ],
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 150 },
      })
    );

    references.forEach((ref) => {
      docParagraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `[${ref.id}] `,
              font: FONT_SANS,
              size: 15, // 7.5pt
              bold: true,
              color: COLOR_TITLE,
            }),
            new TextRun({
              text: ref.raw,
              font: FONT_SANS,
              size: 15,
            }),
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 80 },
        })
      );
    });
  }

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            size: {
              width: 12260, // 8.514 in (matching 612.72 pt in demo PDF and 12260 dxa in demo docx)
              height: 15840, // 11.00 in (matching 792 pt in demo PDF and 15840 dxa in demo docx)
            },
            margin: {
              top: 1134, // ~2cm
              bottom: 1134,
              left: 1134,
              right: 1134,
            },
          },
        },
        children: docParagraphs,
      },
    ],
  });

  return await Packer.toBlob(doc);
}
