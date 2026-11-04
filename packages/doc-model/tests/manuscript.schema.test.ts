import { describe, it, expect } from 'vitest';
import {
  InlineSchema,
  CellSchema,
  BlockSchema,
  SectionSchema,
  ReferenceSchema,
  AuthorSchema,
  AffiliationSchema,
  FrontMatterSchema,
  AssetMetaSchema,
  ManuscriptSchema,
} from '../src/schemas';
import type { Manuscript } from '../src/types';

describe('packages/doc-model Zod Schemas', () => {
  describe('InlineSchema', () => {
    it('validates plain text and text with formatting marks', () => {
      const plain = InlineSchema.parse({ t: 'text', v: 'Hello world' });
      expect(plain).toEqual({ t: 'text', v: 'Hello world' });

      const styled = InlineSchema.parse({
        t: 'text',
        v: 'H. pylori',
        marks: ['i', 'b'],
      });
      expect(styled).toEqual({
        t: 'text',
        v: 'H. pylori',
        marks: ['i', 'b'],
      });
    });

    it('validates citation, xref, and math inlines', () => {
      const cite = InlineSchema.parse({ t: 'cite', refIds: ['ref_001', 'ref_002'] });
      expect(cite.t).toBe('cite');

      const xref = InlineSchema.parse({
        t: 'xref',
        target: 'fig_001',
        kind: 'figure',
      });
      expect(xref.t).toBe('xref');

      const math = InlineSchema.parse({
        t: 'math',
        latex: '\\text{FEV}_1',
      });
      expect(math.t).toBe('math');
    });

    it('validates link and recursive footnote inlines', () => {
      const link = InlineSchema.parse({
        t: 'link',
        href: 'https://example.com',
        content: [{ t: 'text', v: 'Click here' }],
      });
      expect(link.t).toBe('link');

      const footnote = InlineSchema.parse({
        t: 'footnote',
        blocks: [
          {
            type: 'paragraph',
            id: 'blk_fn_1',
            content: [{ t: 'text', v: 'Footnote content' }],
          },
        ],
      });
      expect(footnote.t).toBe('footnote');
    });

    it('rejects invalid marks or unknown inline types', () => {
      expect(() =>
        InlineSchema.parse({
          t: 'text',
          v: 'Bad mark',
          marks: ['underline' as any],
        })
      ).toThrow();

      expect(() =>
        InlineSchema.parse({
          t: 'unknown_type' as any,
          v: 'test',
        })
      ).toThrow();
    });
  });

  describe('CellSchema & BlockSchema', () => {
    it('validates table cell structure', () => {
      const cell = CellSchema.parse({
        content: [{ t: 'text', v: 'Cell header' }],
        rowSpan: 1,
        colSpan: 2,
        align: 'c',
        header: true,
      });
      expect(cell.colSpan).toBe(2);
      expect(cell.header).toBe(true);
    });

    it('validates paragraph, list, quote, and box blocks', () => {
      const para = BlockSchema.parse({
        type: 'paragraph',
        id: 'p_001',
        content: [{ t: 'text', v: 'Paragraph content' }],
      });
      expect(para.type).toBe('paragraph');

      const list = BlockSchema.parse({
        type: 'list',
        id: 'lst_001',
        ordered: true,
        items: [
          [
            {
              type: 'paragraph',
              id: 'p_item_1',
              content: [{ t: 'text', v: 'Item 1' }],
            },
          ],
        ],
      });
      expect(list.type).toBe('list');

      const quote = BlockSchema.parse({
        type: 'quote',
        id: 'q_001',
        content: [para],
      });
      expect(quote.type).toBe('quote');

      const box = BlockSchema.parse({
        type: 'box',
        id: 'box_001',
        content: [para],
      });
      expect(box.type).toBe('box');
    });

    it('validates equation block', () => {
      const eq = BlockSchema.parse({
        type: 'equation',
        id: 'eq_001',
        latex: 'E = mc^2',
        numbered: true,
        label: '1',
        status: 'ok',
      });
      expect(eq.type).toBe('equation');
    });

    it('validates figure block with panels and layout', () => {
      const figure = BlockSchema.parse({
        type: 'figure',
        id: 'fig_001',
        assetId: 'asset_sha_123',
        caption: [{ t: 'text', v: 'Figure 1. Architecture diagram' }],
        source: [{ t: 'text', v: 'Source: Authors' }],
        panels: [
          {
            id: 'panel_a',
            assetId: 'asset_sha_123',
            label: 'A',
            caption: [{ t: 'text', v: 'Sub-panel A' }],
          },
        ],
        layout: {
          columnSpan: '2-column',
          alignment: 'center',
          scalePercent: 90,
        },
      });
      expect(figure.type).toBe('figure');
    });

    it('validates table block with grid and layout', () => {
      const table = BlockSchema.parse({
        type: 'table',
        id: 'tab_001',
        caption: [{ t: 'text', v: 'Table 1. Experimental Results' }],
        grid: [
          [
            {
              content: [{ t: 'text', v: 'Header A' }],
              rowSpan: 1,
              colSpan: 1,
              header: true,
            },
            {
              content: [{ t: 'text', v: 'Header B' }],
              rowSpan: 1,
              colSpan: 1,
              header: true,
            },
          ],
          [
            {
              content: [{ t: 'text', v: '10.5' }],
              rowSpan: 1,
              colSpan: 1,
              align: 'r',
            },
            {
              content: [{ t: 'text', v: '20.8' }],
              rowSpan: 1,
              colSpan: 1,
              align: 'r',
            },
          ],
        ],
        headerRows: 1,
        notes: [{ t: 'text', v: 'Values are mean ± SD.' }],
        layout: {
          columnSpan: '1-column',
        },
      });
      expect(table.type).toBe('table');
    });

    it('validates pageBreak block', () => {
      const pb = BlockSchema.parse({
        type: 'pageBreak',
        id: 'pb_001',
      });
      expect(pb.type).toBe('pageBreak');
    });

    it('rejects invalid block structure', () => {
      expect(() =>
        BlockSchema.parse({
          type: 'paragraph',
          id: '',
          content: [],
        })
      ).toThrow();

      expect(() =>
        BlockSchema.parse({
          type: 'invalid_block_type' as any,
          id: 'id_1',
        })
      ).toThrow();
    });
  });

  describe('SectionSchema', () => {
    it('validates hierarchical sections with level 1, 2, 3', () => {
      const section = SectionSchema.parse({
        id: 'sec_001',
        level: 1,
        title: [{ t: 'text', v: '1. Introduction' }],
        blocks: [
          {
            type: 'paragraph',
            id: 'p_001',
            content: [{ t: 'text', v: 'Intro paragraph' }],
          },
        ],
        children: [
          {
            id: 'sec_002',
            level: 2,
            title: [{ t: 'text', v: '1.1 Background' }],
            blocks: [],
            children: [],
          },
        ],
      });
      expect(section.level).toBe(1);
      expect(section.children).toHaveLength(1);
      expect(section.children[0].level).toBe(2);
    });

    it('rejects invalid section levels (e.g. level 4)', () => {
      expect(() =>
        SectionSchema.parse({
          id: 'sec_001',
          level: 4 as any,
          title: [{ t: 'text', v: 'Invalid Level' }],
          blocks: [],
          children: [],
        })
      ).toThrow();
    });
  });

  describe('FrontMatter & Metadata Schemas', () => {
    it('validates Author and Affiliation', () => {
      const author = AuthorSchema.parse({
        id: 'auth_1',
        name: 'Nguyen Van A',
        affiliationIds: ['aff_1'],
        email: 'a@example.com',
        isCorresponding: true,
        orcid: '0000-0001-2345-6789',
      });
      expect(author.name).toBe('Nguyen Van A');

      const affiliation = AffiliationSchema.parse({
        id: 'aff_1',
        institution: 'VNU-HCM University of Science',
        department: 'Faculty of Information Technology',
        city: 'Ho Chi Minh City',
        country: 'Vietnam',
      });
      expect(affiliation.institution).toContain('VNU-HCM');
    });

    it('validates FrontMatter', () => {
      const frontMatter = FrontMatterSchema.parse({
        title: [{ t: 'text', v: 'Nghiên cứu về học máy' }],
        translations: {
          en: [{ t: 'text', v: 'A Study on Machine Learning' }],
        },
        authors: [
          {
            id: 'auth_1',
            name: 'Nguyen Van A',
            affiliationIds: ['aff_1'],
          },
        ],
        affiliations: [
          {
            id: 'aff_1',
            institution: 'ĐHQG-HCM',
          },
        ],
        abstract: [
          [
            {
              t: 'text',
              v: 'Bài báo này trình bày phương pháp mới...',
            },
          ],
        ],
        keywords: ['Học máy', 'AI', 'NLP'],
        dates: {
          received: '2026-01-01',
          revised: '2026-02-01',
          accepted: '2026-03-01',
          published: '2026-04-01',
        },
        doi: '10.1234/structpaper.2026.001',
        volume: '15',
        issue: '2',
        pages: [100, 115],
      });
      expect(frontMatter.keywords).toHaveLength(3);
      expect(frontMatter.pages).toEqual([100, 115]);
    });

    it('validates Reference and AssetMeta', () => {
      const ref = ReferenceSchema.parse({
        id: 'ref_001',
        raw: 'Nguyen, V. A. (2025). AI Research. Journal of Science, 1(1), 1-10.',
        doi: '10.1234/test',
        parse: 'ok',
      });
      expect(ref.parse).toBe('ok');

      const asset = AssetMetaSchema.parse({
        id: 'asset_001',
        sha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        mimeType: 'image/png',
        fileName: 'figure1.png',
        sizeBytes: 102400,
        width: 1200,
        height: 800,
        dpi: 300,
      });
      expect(asset.dpi).toBe(300);
    });
  });

  describe('ManuscriptSchema', () => {
    const validManuscript: Manuscript = {
      schemaVersion: 2,
      id: 'doc_01HX9J1234567890ABCDEF1234',
      lang: 'vi',
      journalId: 'vnuhcm-hs',
      articleType: 'Research Article',
      meta: {
        title: [{ t: 'text', v: 'Tiêu đề bài báo mẫu' }],
        authors: [
          {
            id: 'auth_1',
            name: 'Tran Thi B',
            affiliationIds: ['aff_1'],
            isCorresponding: true,
            email: 'b@vnuhcm.edu.vn',
          },
        ],
        affiliations: [
          {
            id: 'aff_1',
            institution: 'Đại học Quốc gia TP.HCM',
          },
        ],
        abstract: [
          [
            {
              t: 'text',
              v: 'Tóm tắt bài báo chi tiết...',
            },
          ],
        ],
        keywords: ['Kiến trúc', 'Tái cấu trúc'],
        dates: {
          received: '2026-10-01',
        },
      },
      body: [
        {
          id: 'sec_001',
          level: 1,
          title: [{ t: 'text', v: 'Đặt vấn đề' }],
          blocks: [
            {
              type: 'paragraph',
              id: 'p_001',
              content: [
                { t: 'text', v: 'Nội dung đặt vấn đề trích dẫn ' },
                { t: 'cite', refIds: ['ref_001'] },
                { t: 'text', v: '.' },
              ],
            },
          ],
          children: [],
        },
      ],
      back: [],
      references: [
        {
          id: 'ref_001',
          raw: 'Tac gia A. Bai bao khoa hoc. 2026.',
          parse: 'ok',
        },
      ],
      assets: {
        asset_001: {
          id: 'asset_001',
          sha256: 'abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
          mimeType: 'image/jpeg',
          sizeBytes: 50000,
        },
      },
      layoutOverrides: {
        twoColumn: true,
      },
      provenance: {
        p_001: { originalStyle: 'Normal' },
      },
    };

    it('validates a complete valid Manuscript v2 object', () => {
      const parsed = ManuscriptSchema.parse(validManuscript);
      expect(parsed.schemaVersion).toBe(2);
      expect(parsed.id).toBe(validManuscript.id);
      expect(parsed.body).toHaveLength(1);
    });

    it('rejects manuscript with unsupported schemaVersion', () => {
      const invalid = {
        ...validManuscript,
        schemaVersion: 1, // Must be 2
      };
      expect(() => ManuscriptSchema.parse(invalid)).toThrow();
    });

    it('rejects manuscript missing required fields', () => {
      const invalid = {
        ...validManuscript,
        journalId: '',
      };
      expect(() => ManuscriptSchema.parse(invalid)).toThrow();
    });

    it('rejects manuscript with invalid block inside section', () => {
      const invalid = {
        ...validManuscript,
        body: [
          {
            id: 'sec_001',
            level: 1,
            title: [{ t: 'text', v: 'Section' }],
            blocks: [
              {
                type: 'non_existent_type',
                id: 'bad_001',
              },
            ],
            children: [],
          },
        ],
      };
      expect(() => ManuscriptSchema.parse(invalid)).toThrow();
    });
  });
});
