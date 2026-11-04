import { describe, it, expect } from 'vitest';
import type { Manuscript } from '@structpaper/doc-model';
import {
  deepNormalizeNfc,
  normalizeUnicodeNfc,
  fixVietnameseSpacing,
  normalizeVietnameseSpacing,
  stripCaptionPrefix,
  stripCaptionNumbers,
  buildReferenceIdMap,
  linkInlineCitations,
  linkCitations,
  runNormalizers,
} from '../src/normalizers';

function createSampleManuscript(overrides?: Partial<Manuscript>): Manuscript {
  return {
    schemaVersion: 2,
    id: 'doc-test-1',
    lang: 'vi',
    journalId: 'vnuhcm-hs',
    articleType: 'research-article',
    meta: {
      title: [{ t: 'text', v: 'Tiêu đề bài báo' }],
      authors: [
        {
          id: 'auth-1',
          name: 'Nguyễn Văn A',
          affiliationIds: ['aff-1'],
        },
      ],
      affiliations: [
        {
          id: 'aff-1',
          institution: 'Đại học Quốc gia TP.HCM',
        },
      ],
      abstract: [[{ t: 'text', v: 'Tóm tắt bài báo.' }]],
      keywords: ['từ khóa 1', 'từ khóa 2'],
      dates: {},
    },
    body: [
      {
        id: 'sec-1',
        level: 1,
        title: [{ t: 'text', v: '1. ĐẶT VẤN ĐỀ' }],
        blocks: [
          {
            type: 'paragraph',
            id: 'p-1',
            content: [{ t: 'text', v: 'Nghiên cứu của tác giả [1] và [2, 3] chứng minh.' }],
          },
        ],
        children: [],
      },
    ],
    back: [],
    references: [
      {
        id: 'ref-1',
        raw: 'Tài liệu 1',
        csl: { id: 'ref-1', title: 'Bài báo 1' },
        parse: 'ok',
      },
      {
        id: 'ref-2',
        raw: 'Tài liệu 2',
        csl: { id: 'ref-2', title: 'Bài báo 2' },
        parse: 'ok',
      },
      {
        id: 'ref-3',
        raw: 'Tài liệu 3',
        csl: { id: 'ref-3', title: 'Bài báo 3' },
        parse: 'ok',
      },
    ],
    assets: {},
    ...overrides,
  };
}

describe('Task 3.4: Ingest DOCX Normalizers', () => {
  describe('Unicode NFC Normalizer', () => {
    it('converts NFD strings to canonical NFC', () => {
      // Decomposed "Nguyễn": 'Nguy' + 'e' + combining circumflex (\u0302) + combining tilde (\u0303) + 'n'
      const nfdName = 'Nguye\u0302\u0303n';
      expect(nfdName).not.toBe('Nguyễn');
      expect(nfdName.normalize('NFD')).toBe(nfdName);

      const normalized = deepNormalizeNfc(nfdName);
      expect(normalized).toBe('Nguyễn');
    });

    it('normalizes entire Manuscript tree to NFC', () => {
      const nfdDoc = createSampleManuscript({
        meta: {
          title: [{ t: 'text', v: 'Nghie\u0302n c\u01b0\u0301u' }], // "Nghiên cứu" in NFD
          authors: [{ id: 'a1', name: 'Nguye\u0302\u0303n Va\u0306n A', affiliationIds: [] }],
          affiliations: [{ id: 'aff1', institution: '\u0110a\u0323i ho\u0323c Quo\u0302\u0301c gia' }],
          abstract: [[{ t: 'text', v: 'To\u0301m t\u0103\u0301t' }]],
          keywords: ['t\u01b0\u0300 kho\u0301a'],
          dates: {},
        },
      });

      const cleanDoc = normalizeUnicodeNfc(nfdDoc);
      expect((cleanDoc.meta.title[0] as any).v).toBe('Nghiên cứu');
      expect(cleanDoc.meta.authors[0].name).toBe('Nguyễn Văn A');
      expect(cleanDoc.meta.affiliations[0].institution).toBe('Đại học Quốc gia');
      expect((cleanDoc.meta.abstract[0][0] as any).v).toBe('Tóm tắt');
      expect(cleanDoc.meta.keywords[0]).toBe('từ khóa');
    });
  });

  describe('Vietnamese Spacing Normalizer', () => {
    it('fixes split tone vowels in words (e.g., "Nguy ễ n" -> "Nguyễn")', () => {
      expect(fixVietnameseSpacing('Nguy ễ n')).toBe('Nguyễn');
      expect(fixVietnameseSpacing('ti ế ng')).toBe('tiếng');
      expect(fixVietnameseSpacing('nghi ệ p')).toBe('nghiệp');
      expect(fixVietnameseSpacing('b ệ nh')).toBe('bệnh');
      expect(fixVietnameseSpacing('k ế t')).toBe('kết');
    });

    it('fixes split vowel clusters and consonant clusters (e.g., "d ư ỡ ng" -> "dưỡng")', () => {
      expect(fixVietnameseSpacing('d ư ỡ ng')).toBe('dưỡng');
      expect(fixVietnameseSpacing('tr ư ờ ng')).toBe('trường');
      expect(fixVietnameseSpacing('ph ư ơ ng')).toBe('phương');
    });

    it('fixes spaced out syllables (e.g., "n g h i ệ p" -> "nghiệp", "V i ệ t" -> "Việt")', () => {
      expect(fixVietnameseSpacing('n g h i ệ p')).toBe('nghiệp');
      expect(fixVietnameseSpacing('V i ệ t')).toBe('Việt');
      expect(fixVietnameseSpacing('h ọ c')).toBe('học');
      expect(fixVietnameseSpacing('q u ả')).toBe('quả');
    });

    it('preserves valid standalone words and normal text', () => {
      expect(fixVietnameseSpacing('ở nhà đọc sách')).toBe('ở nhà đọc sách');
      expect(fixVietnameseSpacing('ý kiến của tôi')).toBe('ý kiến của tôi');
      expect(fixVietnameseSpacing('Nguyễn Văn A')).toBe('Nguyễn Văn A');
      expect(fixVietnameseSpacing('This is a test.')).toBe('This is a test.');
    });

    it('normalizes inlines across Manuscript blocks', () => {
      const doc = createSampleManuscript({
        body: [
          {
            id: 's1',
            level: 1,
            title: [{ t: 'text', v: '1. K ế t q u ả' }],
            blocks: [
              {
                type: 'paragraph',
                id: 'p1',
                content: [{ t: 'text', v: 'Bệnh nhân được b ồi d ư ỡ ng tại tr ư ờ ng.' }],
              },
            ],
            children: [],
          },
        ],
      });

      const fixed = normalizeVietnameseSpacing(doc);
      expect((fixed.body[0].title[0] as any).v).toBe('1. Kết quả');
      expect((fixed.body[0].blocks[0] as any).content[0].v).toBe(
        'Bệnh nhân được bồi dưỡng tại trường.'
      );
    });
  });

  describe('Caption Number Stripper', () => {
    it('strips "Bảng 1:", "Table 2.", "Hình 3 -", "Figure 4:" prefixes', () => {
      expect(stripCaptionPrefix([{ t: 'text', v: 'Bảng 1: Các thông số kỹ thuật' }])).toEqual([
        { t: 'text', v: 'Các thông số kỹ thuật' },
      ]);

      expect(stripCaptionPrefix([{ t: 'text', v: 'Bảng 1. Các thông số kỹ thuật' }])).toEqual([
        { t: 'text', v: 'Các thông số kỹ thuật' },
      ]);

      expect(stripCaptionPrefix([{ t: 'text', v: 'Table 2. Summary of results' }])).toEqual([
        { t: 'text', v: 'Summary of results' },
      ]);

      expect(stripCaptionPrefix([{ t: 'text', v: 'Hình 3: Biểu đồ tăng trưởng' }])).toEqual([
        { t: 'text', v: 'Biểu đồ tăng trưởng' },
      ]);

      expect(stripCaptionPrefix([{ t: 'text', v: 'Figure 4 - Architecture diagram' }])).toEqual([
        { t: 'text', v: 'Architecture diagram' },
      ]);

      expect(stripCaptionPrefix([{ t: 'text', v: 'Fig. 5: Accuracy curve' }])).toEqual([
        { t: 'text', v: 'Accuracy curve' },
      ]);

      expect(stripCaptionPrefix([{ t: 'text', v: 'Đồ thị 1: Biến thiên nhiệt độ' }])).toEqual([
        { t: 'text', v: 'Biến thiên nhiệt độ' },
      ]);

      expect(stripCaptionPrefix([{ t: 'text', v: 'Bảng 2.1: Ma trận tương quan' }])).toEqual([
        { t: 'text', v: 'Ma trận tương quan' },
      ]);
    });

    it('strips caption prefixes from TableBlock and FigureBlock in Manuscript', () => {
      const doc = createSampleManuscript({
        body: [
          {
            id: 's1',
            level: 1,
            title: [{ t: 'text', v: '1. Nội dung' }],
            blocks: [
              {
                type: 'table',
                id: 'tbl-1',
                caption: [{ t: 'text', v: 'Bảng 1: Ma trận phân tích' }],
                grid: [],
                headerRows: 1,
                layout: {},
              },
              {
                type: 'figure',
                id: 'fig-1',
                assetId: 'asset-1',
                caption: [{ t: 'text', v: 'Hình 2. Mô hình nghiên cứu' }],
                layout: {},
              },
            ],
            children: [],
          },
        ],
      });

      const stripped = stripCaptionNumbers(doc);
      const table = stripped.body[0].blocks[0] as any;
      const figure = stripped.body[0].blocks[1] as any;

      expect(table.caption).toEqual([{ t: 'text', v: 'Ma trận phân tích' }]);
      expect(figure.caption).toEqual([{ t: 'text', v: 'Mô hình nghiên cứu' }]);
    });
  });

  describe('Citation Linker', () => {
    it('detects [1], [2, 3], and [4-6] in text inlines and maps to references', () => {
      const refIdMap = new Map<number, string>([
        [1, 'ref-1'],
        [2, 'ref-2'],
        [3, 'ref-3'],
        [4, 'ref-4'],
        [5, 'ref-5'],
        [6, 'ref-6'],
      ]);

      const inlines = [
        { t: 'text' as const, v: 'Theo tác giả [1] và các công trình [2, 3], dải trích dẫn [4-6].' },
      ];

      const linked = linkInlineCitations(inlines, refIdMap);

      expect(linked).toEqual([
        { t: 'text', v: 'Theo tác giả ' },
        { t: 'cite', refIds: ['ref-1'] },
        { t: 'text', v: ' và các công trình ' },
        { t: 'cite', refIds: ['ref-2', 'ref-3'] },
        { t: 'text', v: ', dải trích dẫn ' },
        { t: 'cite', refIds: ['ref-4', 'ref-5', 'ref-6'] },
        { t: 'text', v: '.' },
      ]);
    });

    it('links citations across the Manuscript tree', () => {
      const doc = createSampleManuscript({
        references: [
          { id: 'ref-1', raw: '[1] Bài báo A', csl: {}, parse: 'ok' },
          { id: 'ref-2', raw: '[2] Bài báo B', csl: {}, parse: 'ok' },
          { id: 'ref-3', raw: '[3] Bài báo C', csl: {}, parse: 'ok' },
        ],
        body: [
          {
            id: 's1',
            level: 1,
            title: [{ t: 'text', v: '1. Giới thiệu' }],
            blocks: [
              {
                type: 'paragraph',
                id: 'p1',
                content: [{ t: 'text', v: 'Như đã báo cáo [1] và [2, 3].' }],
              },
            ],
            children: [],
          },
        ],
      });

      const linked = linkCitations(doc);
      const paraContent = (linked.body[0].blocks[0] as any).content;

      expect(paraContent).toHaveLength(5);
      expect(paraContent[0]).toEqual({ t: 'text', v: 'Như đã báo cáo ' });
      expect(paraContent[1]).toEqual({ t: 'cite', refIds: ['ref-1'] });
      expect(paraContent[2]).toEqual({ t: 'text', v: ' và ' });
      expect(paraContent[3]).toEqual({ t: 'cite', refIds: ['ref-2', 'ref-3'] });
      expect(paraContent[4]).toEqual({ t: 'text', v: '.' });
    });
  });

  describe('runNormalizers (Pipeline)', () => {
    it('executes full normalization chain in order', () => {
      const doc = createSampleManuscript({
        body: [
          {
            id: 's1',
            level: 1,
            title: [{ t: 'text', v: '1. K\u00ea\u0301t qua\u0309' }], // NFD
            blocks: [
              {
                type: 'table',
                id: 'tbl-1',
                caption: [{ t: 'text', v: 'Bảng 1: B\u1ec7nh nh\u00e2n [1]' }],
                grid: [],
                headerRows: 0,
                layout: {},
              },
            ],
            children: [],
          },
        ],
      });

      const result = runNormalizers(doc);

      // Title normalized to NFC
      expect((result.body[0].title[0] as any).v).toBe('1. Kết quả');

      // Table caption stripped of "Bảng 1:" and citation linked
      const tableCaption = (result.body[0].blocks[0] as any).caption;
      expect(tableCaption[0]).toEqual({ t: 'text', v: 'Bệnh nhân ' });
      expect(tableCaption[1]).toEqual({ t: 'cite', refIds: ['ref-1'] });
    });
  });
});
