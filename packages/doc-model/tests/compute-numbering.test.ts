import { describe, it, expect } from 'vitest';
import type {
  Manuscript,
  Section,
  FigureBlock,
  TableBlock,
  EquationBlock,
  ParagraphBlock,
  QuoteBlock,
  BoxBlock,
  ListBlock,
  Reference,
} from '../src/types';
import {
  computeNumbering,
  vancouverCitationStyle,
  apaCitationStyle,
  formatCitationRange,
} from '../src/numbering';

function createBaseManuscript(overrides?: Partial<Manuscript>): Manuscript {
  return {
    schemaVersion: 2,
    id: 'manuscript_test_01',
    lang: 'vi',
    journalId: 'vnuhcm-hs',
    articleType: 'Research Article',
    meta: {
      title: [{ t: 'text', v: 'Tiêu đề bài báo' }],
      authors: [],
      affiliations: [],
      abstract: [[{ t: 'text', v: 'Tóm tắt bài báo' }]],
      keywords: ['Test'],
      dates: {},
    },
    body: [],
    back: [],
    references: [],
    assets: {},
    ...overrides,
  };
}

describe('computeNumbering pure function', () => {
  describe('formatCitationRange helper', () => {
    it('formats empty, single, pairs, and ranges correctly', () => {
      expect(formatCitationRange([])).toBe('');
      expect(formatCitationRange([1])).toBe('1');
      expect(formatCitationRange([1, 2])).toBe('1, 2');
      expect(formatCitationRange([2, 3, 4])).toBe('2-4');
      expect(formatCitationRange([4, 2, 3])).toBe('2-4'); // auto-sorts
      expect(formatCitationRange([1, 3, 4, 5, 8])).toBe('1, 3-5, 8');
      expect(formatCitationRange([1, 2, 4, 5, 6, 8, 9])).toBe('1, 2, 4-6, 8, 9');
    });
  });

  describe('Float numbering: Figures, Tables, Equations', () => {
    it('assigns strictly sequential 1-based numbers to figures, tables, and numbered equations', () => {
      const doc = createBaseManuscript({
        body: [
          {
            id: 'sec_1',
            level: 1,
            title: [{ t: 'text', v: 'Phần 1' }],
            blocks: [
              {
                type: 'figure',
                id: 'fig_alpha',
                assetId: 'asset_1',
                caption: [{ t: 'text', v: 'Hình A' }],
                layout: {},
              } as FigureBlock,
              {
                type: 'table',
                id: 'tbl_alpha',
                caption: [{ t: 'text', v: 'Bảng A' }],
                grid: [],
                headerRows: 1,
                layout: {},
              } as TableBlock,
              {
                type: 'equation',
                id: 'eq_1',
                latex: 'E = mc^2',
                numbered: true,
                status: 'ok',
              } as EquationBlock,
              {
                type: 'equation',
                id: 'eq_unnumbered',
                latex: 'a^2 + b^2 = c^2',
                numbered: false,
                status: 'ok',
              } as EquationBlock,
              {
                type: 'figure',
                id: 'fig_beta',
                assetId: 'asset_2',
                caption: [{ t: 'text', v: 'Hình B' }],
                layout: {},
              } as FigureBlock,
              {
                type: 'equation',
                id: 'eq_2',
                latex: '\\nabla \\cdot B = 0',
                numbered: true,
                status: 'ok',
              } as EquationBlock,
              {
                type: 'table',
                id: 'tbl_beta',
                caption: [{ t: 'text', v: 'Bảng B' }],
                grid: [],
                headerRows: 1,
                layout: {},
              } as TableBlock,
              {
                type: 'figure',
                id: 'fig_gamma',
                assetId: 'asset_3',
                caption: [{ t: 'text', v: 'Hình C' }],
                layout: {},
              } as FigureBlock,
            ],
            children: [],
          },
        ],
      });

      const res = computeNumbering(doc);

      // Figures
      expect(res.figures.get('fig_alpha')).toBe(1);
      expect(res.figures.get('fig_beta')).toBe(2);
      expect(res.figures.get('fig_gamma')).toBe(3);
      expect(res.figures.size).toBe(3);

      // Tables
      expect(res.tables.get('tbl_alpha')).toBe(1);
      expect(res.tables.get('tbl_beta')).toBe(2);
      expect(res.tables.size).toBe(2);

      // Equations
      expect(res.equations.get('eq_1')).toBe(1);
      expect(res.equations.get('eq_unnumbered')).toBeUndefined();
      expect(res.equations.get('eq_2')).toBe(2);
      expect(res.equations.size).toBe(2);
    });

    it('renumbers subsequent figures automatically when inserting in the middle', () => {
      const initialDoc = createBaseManuscript({
        body: [
          {
            id: 'sec_1',
            level: 1,
            title: [{ t: 'text', v: 'Nội dung' }],
            blocks: [
              {
                type: 'figure',
                id: 'fig_1',
                assetId: 'a1',
                caption: [{ t: 'text', v: 'Hình 1' }],
                layout: {},
              } as FigureBlock,
              {
                type: 'figure',
                id: 'fig_2',
                assetId: 'a2',
                caption: [{ t: 'text', v: 'Hình 2' }],
                layout: {},
              } as FigureBlock,
            ],
            children: [],
          },
        ],
      });

      const initialRes = computeNumbering(initialDoc);
      expect(initialRes.figures.get('fig_1')).toBe(1);
      expect(initialRes.figures.get('fig_2')).toBe(2);

      // Insert fig_inserted between fig_1 and fig_2
      const updatedDoc = createBaseManuscript({
        body: [
          {
            id: 'sec_1',
            level: 1,
            title: [{ t: 'text', v: 'Nội dung' }],
            blocks: [
              {
                type: 'figure',
                id: 'fig_1',
                assetId: 'a1',
                caption: [{ t: 'text', v: 'Hình 1' }],
                layout: {},
              } as FigureBlock,
              {
                type: 'figure',
                id: 'fig_inserted',
                assetId: 'a_new',
                caption: [{ t: 'text', v: 'Hình chèn' }],
                layout: {},
              } as FigureBlock,
              {
                type: 'figure',
                id: 'fig_2',
                assetId: 'a2',
                caption: [{ t: 'text', v: 'Hình 2' }],
                layout: {},
              } as FigureBlock,
            ],
            children: [],
          },
        ],
      });

      const updatedRes = computeNumbering(updatedDoc);
      expect(updatedRes.figures.get('fig_1')).toBe(1);
      expect(updatedRes.figures.get('fig_inserted')).toBe(2);
      expect(updatedRes.figures.get('fig_2')).toBe(3);
    });
  });

  describe('Citations & Bibliography', () => {
    const references: Reference[] = [
      { id: 'ref_1', raw: 'Nguyen et al., 2020', parse: 'ok' },
      { id: 'ref_2', raw: 'Tran et al., 2021', parse: 'ok' },
      { id: 'ref_3', raw: 'Le et al., 2022', parse: 'ok' },
      { id: 'ref_4', raw: 'Pham et al., 2023', parse: 'ok' },
      { id: 'ref_5', raw: 'Vu et al., 2024', parse: 'ok' },
    ];

    it('records citation order on first appearance and formats Vancouver range labels', () => {
      const doc = createBaseManuscript({
        references,
        body: [
          {
            id: 'sec_intro',
            level: 1,
            title: [{ t: 'text', v: 'Mở đầu' }],
            blocks: [
              {
                type: 'paragraph',
                id: 'p1',
                content: [
                  { t: 'text', v: 'Nghiên cứu trước đó ' },
                  { t: 'cite', refIds: ['ref_3'] },
                  { t: 'text', v: ' đã chỉ ra rằng...' },
                ],
              } as ParagraphBlock,
              {
                type: 'paragraph',
                id: 'p2',
                content: [
                  { t: 'text', v: 'Các tài liệu liên quan ' },
                  { t: 'cite', refIds: ['ref_1', 'ref_2', 'ref_4'] },
                  { t: 'text', v: ' xác nhận kết quả.' },
                ],
              } as ParagraphBlock,
              {
                type: 'paragraph',
                id: 'p3',
                content: [
                  { t: 'text', v: 'Nhắc lại nghiên cứu cũ ' },
                  { t: 'cite', refIds: ['ref_3'] }, // Repeated mention
                ],
              } as ParagraphBlock,
            ],
            children: [],
          },
        ],
      });

      const res = computeNumbering(doc, vancouverCitationStyle);

      // citationOrder: first seen ref_3, then ref_1, ref_2, ref_4
      expect(res.citationOrder).toEqual(['ref_3', 'ref_1', 'ref_2', 'ref_4']);

      // Sequential numbers
      expect(res.citations.get('ref_3')).toBe(1);
      expect(res.citations.get('ref_1')).toBe(2);
      expect(res.citations.get('ref_2')).toBe(3);
      expect(res.citations.get('ref_4')).toBe(4);

      // Individual citation labels
      expect(res.citationLabels.get('ref_3')).toBe('1');
      expect(res.citationLabels.get('ref_1')).toBe('2');
      expect(res.citationLabels.get('ref_2')).toBe('3');
      expect(res.citationLabels.get('ref_4')).toBe('4');

      // Multi-cite range label for [ref_1, ref_2, ref_4] -> numbers [2, 3, 4] -> '2-4'
      expect(res.citationLabels.get('ref_1,ref_2,ref_4')).toBe('2-4');

      // Uncited reference ref_5
      expect(res.uncitedRefs).toEqual(['ref_5']);

      // No dangling citations
      expect(res.danglingCites).toEqual([]);

      // Bibliography order for Vancouver: citationOrder then uncited
      expect(res.bibliographyOrder).toEqual(['ref_3', 'ref_1', 'ref_2', 'ref_4', 'ref_5']);
    });

    it('detects dangling cites when cite refers to non-existent reference or deleted reference', () => {
      const doc = createBaseManuscript({
        references: [
          { id: 'ref_1', raw: 'Nguyen 2020', parse: 'ok' },
        ],
        body: [
          {
            id: 'sec_1',
            level: 1,
            title: [{ t: 'text', v: 'Nội dung' }],
            blocks: [
              {
                type: 'paragraph',
                id: 'p1',
                content: [
                  { t: 'cite', refIds: ['ref_1', 'ref_deleted_99'] },
                ],
              } as ParagraphBlock,
            ],
            children: [],
          },
        ],
      });

      const res = computeNumbering(doc);
      expect(res.danglingCites).toEqual(['ref_deleted_99']);
      expect(res.citationOrder).toEqual(['ref_1', 'ref_deleted_99']);
    });

    it('sorts bibliography alphabetically for APA style', () => {
      const doc = createBaseManuscript({
        references: [
          { id: 'ref_z', raw: 'Zack, A. (2020). Biology.', parse: 'ok', csl: { author: [{ family: 'Zack' }] } },
          { id: 'ref_a', raw: 'Adams, B. (2018). Chemistry.', parse: 'ok', csl: { author: [{ family: 'Adams' }] } },
          { id: 'ref_m', raw: 'Miller, C. (2022). Physics.', parse: 'ok', csl: { author: [{ family: 'Miller' }] } },
        ],
        body: [
          {
            id: 'sec_1',
            level: 1,
            title: [{ t: 'text', v: 'Body' }],
            blocks: [
              {
                type: 'paragraph',
                id: 'p1',
                content: [{ t: 'cite', refIds: ['ref_z', 'ref_m'] }],
              } as ParagraphBlock,
            ],
            children: [],
          },
        ],
      });

      const res = computeNumbering(doc, apaCitationStyle);
      // APA sorts Adams, Miller, Zack
      expect(res.bibliographyOrder).toEqual(['ref_a', 'ref_m', 'ref_z']);
    });
  });

  describe('Cross-references (xref) validation', () => {
    it('detects broken xref targets that do not match any figure, table, equation, or section', () => {
      const doc = createBaseManuscript({
        body: [
          {
            id: 'sec_valid',
            level: 1,
            title: [{ t: 'text', v: 'Mục hợp lệ' }],
            blocks: [
              {
                type: 'paragraph',
                id: 'p1',
                content: [
                  { t: 'xref', target: 'fig_real', kind: 'figure' },
                  { t: 'xref', target: 'ghost_target', kind: 'figure' },
                  { t: 'xref', target: 'sec_valid', kind: 'section' },
                  { t: 'xref', target: 'tbl_missing', kind: 'table' },
                ],
              } as ParagraphBlock,
              {
                type: 'figure',
                id: 'fig_real',
                assetId: 'a1',
                caption: [{ t: 'text', v: 'Hình có thật' }],
                layout: {},
              } as FigureBlock,
            ],
            children: [],
          },
        ],
      });

      const res = computeNumbering(doc);
      expect(res.xrefBroken).toEqual(['ghost_target', 'tbl_missing']);
    });
  });

  describe('Preflight check: firstMentionBeforeFloat', () => {
    it('returns true when figure/table is mentioned via xref or text before its float block appears', () => {
      const doc = createBaseManuscript({
        body: [
          {
            id: 'sec_1',
            level: 1,
            title: [{ t: 'text', v: 'Phương pháp' }],
            blocks: [
              {
                type: 'paragraph',
                id: 'p1',
                content: [
                  { t: 'text', v: 'Quy trình được thể hiện rõ ở ' },
                  { t: 'xref', target: 'fig_mentioned_xref', kind: 'figure' },
                  { t: 'text', v: ' và bảng số liệu trong ' },
                  { t: 'text', v: 'Bảng 1' }, // text mention
                  { t: 'text', v: '.' },
                ],
              } as ParagraphBlock,
              {
                type: 'figure',
                id: 'fig_mentioned_xref',
                assetId: 'a1',
                caption: [{ t: 'text', v: 'Hình lưu đồ' }],
                layout: {},
              } as FigureBlock,
              {
                type: 'table',
                id: 'tbl_mentioned_text',
                caption: [{ t: 'text', v: 'Bảng dữ liệu' }],
                grid: [],
                headerRows: 1,
                layout: {},
              } as TableBlock,
              {
                type: 'figure',
                id: 'fig_late_mention',
                assetId: 'a2',
                caption: [{ t: 'text', v: 'Hình không được nhắc trước' }],
                layout: {},
              } as FigureBlock,
              {
                type: 'paragraph',
                id: 'p2',
                content: [
                  { t: 'text', v: 'Sau khi quan sát Hình 2, ta thấy...' }, // Mentioned AFTER float
                ],
              } as ParagraphBlock,
              {
                type: 'table',
                id: 'tbl_never_mentioned',
                caption: [{ t: 'text', v: 'Bảng mồ côi' }],
                grid: [],
                headerRows: 1,
                layout: {},
              } as TableBlock,
            ],
            children: [],
          },
        ],
      });

      const res = computeNumbering(doc);

      // Mentioned before float -> true
      expect(res.firstMentionBeforeFloat.get('fig_mentioned_xref')).toBe(true);
      expect(res.firstMentionBeforeFloat.get('tbl_mentioned_text')).toBe(true);

      // Mentioned after float -> false
      expect(res.firstMentionBeforeFloat.get('fig_late_mention')).toBe(false);

      // Never mentioned -> false
      expect(res.firstMentionBeforeFloat.get('tbl_never_mentioned')).toBe(false);
    });
  });

  describe('Deep recursive traversal', () => {
    it('traverses nested blocks inside quotes, boxes, lists, footnotes, and table cells', () => {
      const doc = createBaseManuscript({
        references: [{ id: 'ref_nested', raw: 'Nested Ref', parse: 'ok' }],
        body: [
          {
            id: 'sec_root',
            level: 1,
            title: [{ t: 'text', v: 'Root' }],
            blocks: [
              {
                type: 'quote',
                id: 'q1',
                content: [
                  {
                    type: 'box',
                    id: 'b1',
                    content: [
                      {
                        type: 'list',
                        id: 'l1',
                        ordered: true,
                        items: [
                          [
                            {
                              type: 'paragraph',
                              id: 'p_deep',
                              content: [
                                {
                                  t: 'footnote',
                                  blocks: [
                                    {
                                      type: 'equation',
                                      id: 'eq_in_footnote',
                                      latex: 'x = y',
                                      numbered: true,
                                      status: 'ok',
                                    } as EquationBlock,
                                    {
                                      type: 'paragraph',
                                      id: 'p_fn',
                                      content: [
                                        { t: 'cite', refIds: ['ref_nested'] },
                                      ],
                                    } as ParagraphBlock,
                                  ],
                                },
                              ],
                            } as ParagraphBlock,
                          ],
                        ],
                      } as ListBlock,
                    ],
                  } as BoxBlock,
                ],
              } as QuoteBlock,
            ],
            children: [
              {
                id: 'sec_sub',
                level: 2,
                title: [{ t: 'text', v: 'Subsection' }],
                blocks: [
                  {
                    type: 'figure',
                    id: 'fig_in_sub',
                    assetId: 'a_sub',
                    caption: [{ t: 'text', v: 'Sub Fig' }],
                    layout: {},
                  } as FigureBlock,
                ],
                children: [],
              },
            ],
          },
        ],
      });

      const res = computeNumbering(doc);
      expect(res.equations.get('eq_in_footnote')).toBe(1);
      expect(res.figures.get('fig_in_sub')).toBe(1);
      expect(res.citationOrder).toEqual(['ref_nested']);
      expect(res.citations.get('ref_nested')).toBe(1);
    });
  });
});
