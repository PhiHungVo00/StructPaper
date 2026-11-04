import { describe, it, expect } from 'vitest';
import type { Manuscript } from '@structpaper/doc-model';
import { VNUHCM_HS_PROFILE } from '@structpaper/journal-profiles';
import {
  QcEngine,
  runQc,
  quickFix,
  titleRule,
  abstractRule,
  keywordsRule,
  authorsAffiliationsRule,
  danglingCitesRule,
  uncitedRefsRule,
  firstMentionBeforeFloatRule,
  brokenXrefRule,
  tableCaptionRule,
  tableEmptyRule,
  figureCaptionRule,
  figureEmptyRule,
  figureDpiRule,
  referenceFormatRule,
  referenceDoiRule,
  imradStructureRule,
} from '../src';

function createMockManuscript(overrides?: Partial<Manuscript>): Manuscript {
  const words280 = Array.from({ length: 280 }, (_, i) => `từ${i}`).join(' ');
  const wordsEn40 = Array.from({ length: 40 }, (_, i) => `word${i}`).join(' ');

  return {
    schemaVersion: 2,
    id: 'doc-1',
    lang: 'vi',
    journalId: 'VNUHCM-HS',
    articleType: 'research-article',
    meta: {
      title: [{ t: 'text', v: 'Nghiên cứu về cấu trúc tế bào trong điều trị bệnh lý' }],
      translations: {
        en: [{ t: 'text', v: 'A study on cellular structure in clinical treatments' }],
        enAbstract: wordsEn40,
        keywordsEn: ['cellular', 'clinical', 'treatment', 'pathology'],
      },
      authors: [
        {
          id: 'auth-1',
          name: 'Nguyễn Văn A',
          affiliationIds: ['aff-1'],
          email: 'nguyenvana@med.vnuhcm.edu.vn',
          isCorresponding: true,
        },
      ],
      affiliations: [
        {
          id: 'aff-1',
          institution: 'Đại học Khoa học Sức khỏe ĐHQG-HCM',
          department: 'Khoa Y',
        },
      ],
      abstract: [[{ t: 'text', v: words280 }]],
      keywords: ['tế bào', 'lâm sàng', 'điều trị', 'bệnh lý'],
      dates: { received: '2026-01-01' },
      doi: '10.32508/vnuhcm-hs.100',
    },
    body: [
      {
        id: 'sec-1',
        level: 1,
        title: [{ t: 'text', v: '1. Đặt vấn đề và Giới thiệu' }],
        blocks: [
          {
            type: 'paragraph',
            id: 'p-1',
            content: [
              { t: 'text', v: 'Nghiên cứu tham khảo ' },
              { t: 'cite', refIds: ['ref-1'] },
              { t: 'text', v: ' và quan sát thấy trong Hình 1 và Bảng 1.' },
            ],
          },
          {
            type: 'figure',
            id: 'fig-1',
            assetId: 'asset-1',
            caption: [{ t: 'text', v: 'Hình 1: Cấu trúc mô bệnh học' }],
            layout: { columnSpan: '1-column' },
          },
          {
            type: 'table',
            id: 'tbl-1',
            caption: [{ t: 'text', v: 'Bảng 1: Các chỉ số sinh hóa' }],
            grid: [
              [
                { content: [{ t: 'text', v: 'Chỉ số' }], rowSpan: 1, colSpan: 1, header: true },
                { content: [{ t: 'text', v: 'Giá trị' }], rowSpan: 1, colSpan: 1, header: true },
              ],
              [
                { content: [{ t: 'text', v: 'FEV1' }], rowSpan: 1, colSpan: 1 },
                { content: [{ t: 'text', v: '85%' }], rowSpan: 1, colSpan: 1 },
              ],
            ],
            headerRows: 1,
            layout: {},
          },
        ],
        children: [],
      },
      {
        id: 'sec-2',
        level: 1,
        title: [{ t: 'text', v: '2. Phương pháp nghiên cứu' }],
        blocks: [
          {
            type: 'paragraph',
            id: 'p-2',
            content: [{ t: 'text', v: 'Quy trình thu thập mẫu và phân tích.' }],
          },
        ],
        children: [],
      },
      {
        id: 'sec-3',
        level: 1,
        title: [{ t: 'text', v: '3. Kết quả' }],
        blocks: [
          {
            type: 'paragraph',
            id: 'p-3',
            content: [{ t: 'text', v: 'Dữ liệu cho thấy hiệu quả rõ rệt.' }],
          },
        ],
        children: [],
      },
      {
        id: 'sec-4',
        level: 1,
        title: [{ t: 'text', v: '4. Kết luận' }],
        blocks: [
          {
            type: 'paragraph',
            id: 'p-4',
            content: [{ t: 'text', v: 'Tóm lược các đóng góp chính của đề tài.' }],
          },
        ],
        children: [],
      },
    ],
    back: [],
    references: [
      {
        id: 'ref-1',
        raw: 'Nguyen VA, et al. Cellular Medicine. 2025; 10(2): 100-105.',
        doi: '10.1000/182',
        parse: 'ok',
      },
    ],
    assets: {
      'asset-1': {
        id: 'asset-1',
        sha256: 'abc123sha',
        mimeType: 'image/png',
        width: 1200,
        height: 800,
        dpi: 300,
      },
    },
    ...overrides,
  };
}

describe('@structpaper/qc-engine: Specification Rules', () => {
  describe('Metadata Rules', () => {
    it('detects short or missing title', () => {
      const doc = createMockManuscript({
        meta: {
          ...createMockManuscript().meta,
          title: [{ t: 'text', v: 'Quá ngắn' }],
        },
      });
      const issues = titleRule.check(doc, VNUHCM_HS_PROFILE);
      expect(issues.some((i) => i.id === 'iss_title')).toBe(true);
    });

    it('detects abstract under 275 words for VNUHCM-HS', () => {
      const shortAbstract = Array.from({ length: 100 }, (_, i) => `từ${i}`).join(' ');
      const doc = createMockManuscript({
        meta: {
          ...createMockManuscript().meta,
          abstract: [[{ t: 'text', v: shortAbstract }]],
        },
      });
      const issues = abstractRule.check(doc, VNUHCM_HS_PROFILE);
      expect(issues.some((i) => i.id === 'iss_abstract' && i.severity === 'warning')).toBe(true);
    });

    it('detects abstract over 500 words for VNUHCM-HS', () => {
      const longAbstract = Array.from({ length: 550 }, (_, i) => `từ${i}`).join(' ');
      const doc = createMockManuscript({
        meta: {
          ...createMockManuscript().meta,
          abstract: [[{ t: 'text', v: longAbstract }]],
        },
      });
      const issues = abstractRule.check(doc, VNUHCM_HS_PROFILE);
      expect(issues.some((i) => i.id === 'iss_abstract_long')).toBe(true);
    });

    it('detects invalid keywords count (< 3 or > 5)', () => {
      const docFew = createMockManuscript({
        meta: {
          ...createMockManuscript().meta,
          keywords: ['chỉ một'],
        },
      });
      const issuesFew = keywordsRule.check(docFew, VNUHCM_HS_PROFILE);
      expect(issuesFew.some((i) => i.id === 'iss_keywords')).toBe(true);

      const docMany = createMockManuscript({
        meta: {
          ...createMockManuscript().meta,
          keywords: ['k1', 'k2', 'k3', 'k4', 'k5', 'k6', 'k7'],
        },
      });
      const issuesMany = keywordsRule.check(docMany, VNUHCM_HS_PROFILE);
      expect(issuesMany.some((i) => i.id === 'iss_keywords_excess')).toBe(true);
    });

    it('detects missing authors, affiliations, or corresponding email', () => {
      const docNoAuthor = createMockManuscript({
        meta: {
          ...createMockManuscript().meta,
          authors: [],
          affiliations: [],
        },
      });
      const issues = authorsAffiliationsRule.check(docNoAuthor, VNUHCM_HS_PROFILE);
      expect(issues.some((i) => i.id === 'iss_authors')).toBe(true);
      expect(issues.some((i) => i.id === 'iss_affiliations')).toBe(true);
      expect(issues.some((i) => i.id === 'iss_corresponding')).toBe(true);
    });
  });

  describe('Numbering Rules', () => {
    it('detects dangling citations exceeding references catalog', () => {
      const doc = createMockManuscript();
      // Add a paragraph citing ref-999 which does not exist
      doc.body[0].blocks.push({
        type: 'paragraph',
        id: 'p-dangling',
        content: [{ t: 'cite', refIds: ['ref-999'] }],
      });

      const issues = danglingCitesRule.check(doc, VNUHCM_HS_PROFILE);
      expect(issues.some((i) => i.id === 'iss_missing_cites')).toBe(true);
      expect(issues[0].severity).toBe('error');
    });

    it('detects uncited references in catalog', () => {
      const doc = createMockManuscript({
        references: [
          { id: 'ref-1', raw: 'Ref 1 text', parse: 'ok' },
          { id: 'ref-2', raw: 'Ref 2 uncited text', parse: 'ok' },
        ],
      });
      const issues = uncitedRefsRule.check(doc, VNUHCM_HS_PROFILE);
      expect(issues.some((i) => i.id === 'iss_uncited_refs')).toBe(true);
    });

    it('detects broken cross-references', () => {
      const doc = createMockManuscript();
      doc.body[0].blocks.push({
        type: 'paragraph',
        id: 'p-xref',
        content: [{ t: 'xref', target: 'non-existent-fig' }],
      });
      const issues = brokenXrefRule.check(doc, VNUHCM_HS_PROFILE);
      expect(issues.some((i) => i.id === 'iss_xref_broken')).toBe(true);
    });
  });

  describe('Float Rules & DPI Detection', () => {
    it('detects image with DPI < 300', () => {
      const doc = createMockManuscript({
        assets: {
          'asset-1': {
            id: 'asset-1',
            sha256: 'abc123sha',
            mimeType: 'image/jpeg',
            dpi: 150, // Below 300
          },
        },
      });

      const issues = figureDpiRule.check(doc, VNUHCM_HS_PROFILE);
      expect(issues.length).toBe(1);
      expect(issues[0].id).toContain('iss_fig_dpi_fig-1');
      expect(issues[0].message).toContain('150 DPI');
      expect(issues[0].severity).toBe('warning');
    });

    it('detects missing table caption and empty table', () => {
      const doc = createMockManuscript();
      (doc.body[0].blocks[2] as any).caption = [];
      (doc.body[0].blocks[2] as any).grid = [];

      const capIssues = tableCaptionRule.check(doc, VNUHCM_HS_PROFILE);
      expect(capIssues.some((i) => i.id === 'iss_tbl_no_cap_tbl-1')).toBe(true);

      const emptyIssues = tableEmptyRule.check(doc, VNUHCM_HS_PROFILE);
      expect(emptyIssues.some((i) => i.id === 'iss_empty_table_tbl-1')).toBe(true);
    });

    it('detects missing figure caption and empty figure', () => {
      const doc = createMockManuscript();
      (doc.body[0].blocks[1] as any).caption = [];
      (doc.body[0].blocks[1] as any).assetId = '';

      const capIssues = figureCaptionRule.check(doc, VNUHCM_HS_PROFILE);
      expect(capIssues.some((i) => i.id === 'iss_fig_no_cap_fig-1')).toBe(true);

      const emptyIssues = figureEmptyRule.check(doc, VNUHCM_HS_PROFILE);
      expect(emptyIssues.some((i) => i.id === 'iss_empty_fig_fig-1')).toBe(true);
    });
  });

  describe('Reference Rules', () => {
    it('detects reference missing DOI and failed parse', () => {
      const doc = createMockManuscript({
        references: [
          { id: 'ref-1', raw: 'Nguyen VA. Test. 2024.', parse: 'failed' },
        ],
      });
      const formatIssues = referenceFormatRule.check(doc, VNUHCM_HS_PROFILE);
      expect(formatIssues.some((i) => i.id === 'iss_parse_failed_ref_ref-1')).toBe(true);

      const doiIssues = referenceDoiRule.check(doc, VNUHCM_HS_PROFILE);
      expect(doiIssues.some((i) => i.id === 'iss_missing_doi_ref-1')).toBe(true);
    });
  });

  describe('Structure Rules', () => {
    it('detects missing IMRaD sections', () => {
      const doc = createMockManuscript({
        body: [
          {
            id: 'sec-misc',
            level: 1,
            title: [{ t: 'text', v: 'Phần tổng hợp chung' }],
            blocks: [],
            children: [],
          },
        ],
      });
      const issues = imradStructureRule.check(doc, VNUHCM_HS_PROFILE);
      expect(issues.some((i) => i.id === 'iss_intro')).toBe(true);
      expect(issues.some((i) => i.id === 'iss_imrad_incomplete')).toBe(true);
    });
  });

  describe('QcEngine & 6 Pillars Aggregation', () => {
    it('produces perfect 100/100 score for a clean manuscript', () => {
      const doc = createMockManuscript();
      const result = runQc(doc, VNUHCM_HS_PROFILE);

      expect(result.valid).toBe(true);
      expect(result.score).toBe(100);
      expect(result.issues.length).toBe(0);

      // Verify all 6 pillars exist and have full score
      expect(result.pillars.imrad.score).toBe(20);
      expect(result.pillars.figures.score).toBe(15);
      expect(result.pillars.tables.score).toBe(15);
      expect(result.pillars.citations.score).toBe(20);
      expect(result.pillars.authors_abstract.score).toBe(20);
      expect(result.pillars.format.score).toBe(10);
    });

    it('deducts score and invalidates document on critical errors', () => {
      const doc = createMockManuscript();
      // Introduce an error: empty table caption, dangling cite, missing author
      (doc.body[0].blocks[2] as any).caption = [];
      doc.meta.authors = [];
      doc.body[0].blocks.push({
        type: 'paragraph',
        id: 'p-err',
        content: [{ t: 'cite', refIds: ['ref-missing'] }],
      });

      const engine = new QcEngine();
      const result = engine.run(doc, VNUHCM_HS_PROFILE);

      expect(result.valid).toBe(false);
      expect(result.score).toBeLessThan(100);
      expect(result.issues.some((i) => i.severity === 'error')).toBe(true);

      // Quick fix returns a command for the issue
      const fixCmd = engine.quickFix('iss_authors', result.issues);
      expect(fixCmd).not.toBeNull();
      expect(fixCmd?.type).toBe('NAVIGATE_TAB');
    });
  });
});
