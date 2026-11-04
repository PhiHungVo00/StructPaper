import { describe, it, expect } from 'vitest';
import {
  migrateV1toV2,
  adaptV2toV1,
  parseCitationNumbers,
  parseTextWithCitations,
  inlineToPlainText,
  computeSha256,
  extractMimeType,
} from '../src/adapters';
import type { V1CompletePaper } from '../src/adapters/types';
import { DeterministicIdGenerator } from '../src/utils';
import { ManuscriptSchema } from '../src/schemas';
import type { ManuscriptRepository, AssetRepository, ManuscriptSummary, Command, Patch, InversePatch } from '../src/interfaces';

describe('Common Interfaces (Task 1.4)', () => {
  it('satisfies Command, Patch, InversePatch interface signatures', () => {
    const cmd: Command<{ title: string }> = {
      type: 'manuscript/updateTitle',
      payload: { title: 'New Title' },
      undoable: true,
      timestamp: Date.now(),
    };
    expect(cmd.type).toBe('manuscript/updateTitle');
    expect(cmd.payload?.title).toBe('New Title');

    const patch: Patch = {
      op: 'replace',
      path: ['meta', 'title'],
      value: 'Replaced',
    };
    const inv: InversePatch = {
      op: 'replace',
      path: ['meta', 'title'],
      value: 'Original',
    };
    expect(patch.op).toBe('replace');
    expect(inv.op).toBe('replace');
  });

  it('satisfies ManuscriptRepository and AssetRepository interface contracts', async () => {
    const summary: ManuscriptSummary = {
      id: 'doc_123',
      title: 'Bài báo nghiên cứu',
      journalId: 'VNUHCM-HS',
      updatedAt: '2026-11-04T00:00:00Z',
      rev: 1,
    };

    const mockDocRepo: ManuscriptRepository = {
      async getById(id: string) {
        return id === 'doc_123' ? ({} as any) : null;
      },
      async save(_doc) {},
      async delete(_id: string) {},
      async listRecent() {
        return [summary];
      },
    };

    const mockAssetRepo: AssetRepository = {
      async getByHash(hash: string) {
        return hash ? new Blob(['mock']) : null;
      },
      async save(_hash, _blob, _meta) {},
      async has(hash: string) {
        return hash === 'abc';
      },
    };

    const recents = await mockDocRepo.listRecent();
    expect(recents).toHaveLength(1);
    expect(recents[0].title).toBe('Bài báo nghiên cứu');

    const hasAsset = await mockAssetRepo.has('abc');
    expect(hasAsset).toBe(true);
  });
});

describe('Citation and Text Utilities', () => {
  describe('parseCitationNumbers', () => {
    it('parses empty string to empty array', () => {
      expect(parseCitationNumbers('')).toEqual([]);
      expect(parseCitationNumbers('   ')).toEqual([]);
    });

    it('parses single number', () => {
      expect(parseCitationNumbers('1')).toEqual([1]);
      expect(parseCitationNumbers(' 42 ')).toEqual([42]);
    });

    it('parses comma-separated numbers', () => {
      expect(parseCitationNumbers('1, 2')).toEqual([1, 2]);
      expect(parseCitationNumbers('1,2,3')).toEqual([1, 2, 3]);
      expect(parseCitationNumbers('3, 1, 2')).toEqual([1, 2, 3]); // sorts
    });

    it('parses hyphen and en-dash ranges', () => {
      expect(parseCitationNumbers('2-4')).toEqual([2, 3, 4]);
      expect(parseCitationNumbers('2–5')).toEqual([2, 3, 4, 5]); // en-dash
      expect(parseCitationNumbers('5—7')).toEqual([5, 6, 7]); // em-dash
    });

    it('parses composite ranges and numbers', () => {
      expect(parseCitationNumbers('1, 3-5, 8')).toEqual([1, 3, 4, 5, 8]);
      expect(parseCitationNumbers('1, 2, 4-6, 8, 9')).toEqual([1, 2, 4, 5, 6, 8, 9]);
    });
  });

  describe('parseTextWithCitations', () => {
    it('returns single text node if no citation is present', () => {
      const inlines = parseTextWithCitations('Đoạn văn bản thuần túy không có trích dẫn.');
      expect(inlines).toEqual([
        { t: 'text', v: 'Đoạn văn bản thuần túy không có trích dẫn.' },
      ]);
    });

    it('extracts [1] citation cleanly', () => {
      const refMap = new Map([[1, 'ref_001']]);
      const inlines = parseTextWithCitations('Theo tác giả [1] đã chứng minh.', refMap);
      expect(inlines).toEqual([
        { t: 'text', v: 'Theo tác giả ' },
        { t: 'cite', refIds: ['ref_001'] },
        { t: 'text', v: ' đã chứng minh.' },
      ]);
    });

    it('extracts multiple citations and ranges', () => {
      const refMap = new Map([
        [1, 'ref_001'],
        [2, 'ref_002'],
        [3, 'ref_003'],
        [4, 'ref_004'],
        [5, 'ref_005'],
      ]);
      const inlines = parseTextWithCitations(
        'Nghiên cứu ban đầu [1] được củng cố bởi [2-4] và gần đây [5].',
        refMap
      );
      expect(inlines).toEqual([
        { t: 'text', v: 'Nghiên cứu ban đầu ' },
        { t: 'cite', refIds: ['ref_001'] },
        { t: 'text', v: ' được củng cố bởi ' },
        { t: 'cite', refIds: ['ref_002', 'ref_003', 'ref_004'] },
        { t: 'text', v: ' và gần đây ' },
        { t: 'cite', refIds: ['ref_005'] },
        { t: 'text', v: '.' },
      ]);
    });

    it('handles dangling reference numbers smoothly', () => {
      const refMap = new Map([[1, 'ref_001']]);
      const inlines = parseTextWithCitations('Tham khảo [99] không có trong danh mục.', refMap);
      expect(inlines[1]).toMatchObject({
        t: 'cite',
        refIds: expect.arrayContaining([expect.stringContaining('99')]),
      });
    });
  });

  describe('computeSha256 and extractMimeType', () => {
    it('computes standard NIST SHA-256 hashes correctly', () => {
      expect(computeSha256('')).toBe(
        'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
      );
      expect(computeSha256('abc')).toBe(
        'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad'
      );
    });

    it('extracts MIME type from data URL and extensions', () => {
      expect(extractMimeType('data:image/jpeg;base64,/9j/4AAQSkZJRg==')).toBe('image/jpeg');
      expect(extractMimeType('data:image/png;base64,iVBORw0KGgo=')).toBe('image/png');
      expect(extractMimeType('sample-figure.jpg')).toBe('image/jpeg');
      expect(extractMimeType('diagram.svg')).toBe('image/svg+xml');
    });
  });
});

describe('migrateV1toV2 and adaptV2toV1 Adapters', () => {
  function createSampleV1Paper(): V1CompletePaper {
    return {
      id: 'paper_v1_001',
      metadata: {
        title: 'Nghiên cứu ứng dụng cấu trúc v2 trong xuất bản [1]',
        titleEn: 'Application of v2 structure in academic publishing [1]',
        articleType: 'Bài báo nghiên cứu',
        journalId: 'VNUHCM-HS',
        journalName: 'Tạp chí Phát triển Khoa học & Công nghệ – Health Sciences',
        journalAbbv: 'Sci. Tech. Dev. J. - Health Sci.',
        authors: [
          {
            id: 'auth_1',
            name: 'Nguyễn Văn A',
            affiliationIds: [1],
            isCorresponding: true,
            email: 'nva@vnuhcm.edu.vn',
            orcid: '0000-0001-2345-6789',
          },
          {
            id: 'auth_2',
            name: 'Trần Thị B',
            affiliationIds: [1, 2],
            isCorresponding: false,
          },
        ],
        affiliations: [
          { id: 1, name: 'Đại học Khoa học Tự nhiên', nameEn: 'University of Science' },
          { id: 2, name: 'Bệnh viện Chợ Rẫy', nameEn: 'Cho Ray Hospital' },
        ],
        corresponding: {
          name: 'Nguyễn Văn A',
          email: 'nva@vnuhcm.edu.vn',
          affiliation: 'Đại học Khoa học Tự nhiên',
        },
        abstract: 'Đây là tóm tắt bài báo nghiên cứu phương pháp v2.\n\nPhương pháp mang lại độ chính xác cao.',
        keywords: ['Tái cấu trúc', 'Biên tập', 'LaTeX'],
        dates: {
          received: '2026-01-15',
          revised: '2026-02-20',
          accepted: '2026-03-10',
          published: '2026-04-01',
        },
        doi: '10.32508/stdjhs.v1i1.123',
        volume: '7',
        issue: '2',
        firstPage: 101,
        lastPage: 110,
      },
      sections: [
        {
          id: 'sec_h1_1',
          type: 'h1',
          title: '1. ĐẶT VẤN ĐỀ',
          content: '',
        },
        {
          id: 'sec_p_1',
          type: 'paragraph',
          content: 'Nhiều nghiên cứu trước đây [1] đã chỉ ra rằng mô hình phẳng gây khó khăn khi biên tập [2, 3].',
        },
        {
          id: 'sec_h2_1',
          type: 'h2',
          title: '1.1. Mục tiêu nghiên cứu',
          content: 'Mục tiêu chính là chuyển đổi an toàn sang v2 [3].',
        },
        {
          id: 'sec_fig_1',
          type: 'figure',
          content: 'Sơ đồ luồng xử lý dữ liệu',
          figure: {
            id: 'fig_1',
            num: 1,
            caption: 'Sơ đồ luồng xử lý dữ liệu',
            src: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
            source: 'Nguồn: Nhóm tác giả tổng hợp',
            isFullWidth: true,
            columnSpan: '2-column',
            alignment: 'center',
          },
        },
        {
          id: 'sec_tbl_1',
          type: 'table',
          content: 'Bảng so sánh hiệu năng các engine',
          table: {
            id: 'tbl_1',
            num: 1,
            caption: 'Bảng so sánh hiệu năng các engine',
            headers: ['Engine', 'Thời gian (s)', 'Bộ nhớ (MB)'],
            rows: [
              ['XeLaTeX', '1.2', '45'],
              ['Tectonic', '0.4', '18'],
            ],
            headerRows: [
              [
                { text: 'Engine', isHeader: true, rowSpan: 1, colSpan: 1 },
                { text: 'Thời gian (s)', isHeader: true, rowSpan: 1, colSpan: 1 },
                { text: 'Bộ nhớ (MB)', isHeader: true, rowSpan: 1, colSpan: 1 },
              ],
            ],
            bodyRows: [
              [
                { text: 'XeLaTeX', isHeader: false, rowSpan: 1, colSpan: 1 },
                { text: '1.2', isHeader: false, rowSpan: 1, colSpan: 1 },
                { text: '45', isHeader: false, rowSpan: 1, colSpan: 1 },
              ],
              [
                { text: 'Tectonic', isHeader: false, rowSpan: 1, colSpan: 1 },
                { text: '0.4', isHeader: false, rowSpan: 1, colSpan: 1 },
                { text: '18', isHeader: false, rowSpan: 1, colSpan: 1 },
              ],
            ],
            isFullWidth: true,
            columnSpan: '2-column',
          },
        },
      ],
      references: [
        {
          id: 1,
          raw: 'Knuth DE. The TeXbook. Addison-Wesley; 1984.',
          authors: 'Knuth DE',
          title: 'The TeXbook',
          journal: 'Addison-Wesley',
          year: '1984',
          isCited: true,
          citationCount: 2,
        },
        {
          id: 2,
          raw: 'Lamport L. LaTeX: A Document Preparation System. 1994.',
          authors: 'Lamport L',
          title: 'LaTeX: A Document Preparation System',
          year: '1994',
          isCited: true,
          citationCount: 1,
        },
        {
          id: 3,
          raw: 'Mittelbach F. The LaTeX Companion. 2004.',
          authors: 'Mittelbach F',
          title: 'The LaTeX Companion',
          year: '2004',
          isCited: true,
          citationCount: 2,
        },
        {
          id: 4,
          raw: 'Uncited Reference Example. 2020.',
          authors: 'Uncited Author',
          title: 'Uncited Reference Example',
          year: '2020',
          isCited: false,
          citationCount: 0,
        },
      ],
      layoutSettings: {
        paperSize: 'custom',
        columnLayout: '2-column',
        fontSize: '9pt',
      },
      templateId: 'VNUHCM-HS',
      templateName: 'Mẫu Tạp chí Khoa học Sức khỏe ĐHQG-HCM',
    };
  }

  it('migrateV1toV2 converts V1 paper to a valid V2 Manuscript schema', () => {
    const v1 = createSampleV1Paper();
    const idGen = new DeterministicIdGenerator('det');
    const v2 = migrateV1toV2(v1, idGen);

    expect(v2.schemaVersion).toBe(2);
    expect(v2.id).toBe('paper_v1_001');
    expect(v2.lang).toBe('vi');
    expect(v2.journalId).toBe('VNUHCM-HS');
    expect(v2.articleType).toBe('Bài báo nghiên cứu');

    // Schema validation passes cleanly
    const parseResult = ManuscriptSchema.safeParse(v2);
    expect(parseResult.success).toBe(true);

    // FrontMatter checks
    expect(v2.meta.title).toEqual([
      { t: 'text', v: 'Nghiên cứu ứng dụng cấu trúc v2 trong xuất bản ' },
      { t: 'cite', refIds: [expect.any(String)] },
    ]);
    expect(v2.meta.authors).toHaveLength(2);
    expect(v2.meta.affiliations).toHaveLength(2);
    expect(v2.meta.abstract).toHaveLength(2); // 2 paragraphs

    // Figures & Assets checks
    const assetHashes = Object.keys(v2.assets);
    expect(assetHashes).toHaveLength(1);
    const asset = v2.assets[assetHashes[0]];
    expect(asset.sha256).toBe(assetHashes[0]);
    expect(asset.mimeType).toBe('image/png');

    // Body hierarchy: Section -> blocks
    expect(v2.body).toHaveLength(1); // 1 root H1 section
    const rootSec = v2.body[0];
    expect(rootSec.level).toBe(1);
    expect(inlineToPlainText(rootSec.title)).toBe('1. ĐẶT VẤN ĐỀ');
    expect(rootSec.blocks.length).toBeGreaterThanOrEqual(1);

    // Child H2 section
    expect(rootSec.children).toHaveLength(1);
    const h2Sec = rootSec.children[0];
    expect(h2Sec.level).toBe(2);
    expect(inlineToPlainText(h2Sec.title)).toBe('1.1. Mục tiêu nghiên cứu');

    // References mapping
    expect(v2.references).toHaveLength(4);
    expect(v2.references[0].raw).toBe('Knuth DE. The TeXbook. Addison-Wesley; 1984.');
  });

  it('handles flat tables with only headers and rows correctly', () => {
    const v1FlatTable: V1CompletePaper = {
      id: 'paper_flat_tbl',
      metadata: {
        title: 'Bảng phẳng',
        articleType: 'Research Article',
        journalId: 'vnuhcm-hs',
        authors: [],
        affiliations: [],
        abstract: 'Tóm tắt',
        keywords: [],
        dates: {},
      },
      sections: [
        {
          id: 'sec_tbl',
          type: 'table',
          content: 'Bảng mẫu phẳng',
          table: {
            id: 't_flat',
            num: 1,
            caption: 'Bảng mẫu phẳng',
            headers: ['A', 'B'],
            rows: [
              ['1', '2'],
              ['3', '4'],
            ],
          },
        },
      ],
      references: [],
    };

    const v2 = migrateV1toV2(v1FlatTable);
    const parseResult = ManuscriptSchema.safeParse(v2);
    expect(parseResult.success).toBe(true);

    const tblBlock = v2.body[0].blocks[0] as any;
    expect(tblBlock.type).toBe('table');
    expect(tblBlock.headerRows).toBe(1);
    expect(tblBlock.grid).toHaveLength(3); // 1 header row + 2 data rows
    expect(tblBlock.grid[0][0].header).toBe(true);
    expect(tblBlock.grid[1][0].header).toBe(false);
  });

  it('adaptV2toV1 converts V2 Manuscript back to V1 format with numbering and formatted citations', () => {
    const v1 = createSampleV1Paper();
    const idGen = new DeterministicIdGenerator('det');
    const v2 = migrateV1toV2(v1, idGen);

    const v1Reconstructed = adaptV2toV1(v2);

    expect(v1Reconstructed.id).toBe(v1.id);
    expect(v1Reconstructed.metadata.title).toBe(v1.metadata.title);
    expect(v1Reconstructed.metadata.journalId).toBe(v1.metadata.journalId);
    expect(v1Reconstructed.metadata.articleType).toBe(v1.metadata.articleType);
    expect(v1Reconstructed.metadata.authors).toHaveLength(2);
    expect(v1Reconstructed.metadata.authors[0].name).toBe('Nguyễn Văn A');
    expect(v1Reconstructed.metadata.affiliations).toHaveLength(2);
    expect(v1Reconstructed.metadata.corresponding?.name).toBe('Nguyễn Văn A');

    // Sections checks
    expect(v1Reconstructed.sections.length).toBeGreaterThanOrEqual(4);
    const pSec = v1Reconstructed.sections.find((s) => s.id === 'sec_p_1');
    expect(pSec?.content).toBe(
      'Nhiều nghiên cứu trước đây [1] đã chỉ ra rằng mô hình phẳng gây khó khăn khi biên tập [2, 3].'
    );

    // Figure check
    const figSec = v1Reconstructed.sections.find((s) => s.type === 'figure');
    expect(figSec?.figure).toBeDefined();
    expect(figSec?.figure?.num).toBe(1);
    expect(figSec?.figure?.caption).toBe('Sơ đồ luồng xử lý dữ liệu');
    expect(figSec?.figure?.src).toBe(v1.sections[3].figure?.src);

    // Table check
    const tblSec = v1Reconstructed.sections.find((s) => s.type === 'table');
    expect(tblSec?.table).toBeDefined();
    expect(tblSec?.table?.num).toBe(1);
    expect(tblSec?.table?.headers).toEqual(['Engine', 'Thời gian (s)', 'Bộ nhớ (MB)']);
    expect(tblSec?.table?.rows).toEqual([
      ['XeLaTeX', '1.2', '45'],
      ['Tectonic', '0.4', '18'],
    ]);

    // References check
    expect(v1Reconstructed.references).toHaveLength(4);
    expect(v1Reconstructed.references[0].id).toBe(1);
    expect(v1Reconstructed.references[0].isCited).toBe(true);
    expect(v1Reconstructed.references[3].id).toBe(4);
    expect(v1Reconstructed.references[3].isCited).toBe(false);
  });

  it('executes a roundtrip v1 -> v2 -> v1 faithfully preserving all major structures', () => {
    const originalV1 = createSampleV1Paper();
    const idGen = new DeterministicIdGenerator('rt');

    // Step 1: v1 -> v2
    const v2 = migrateV1toV2(originalV1, idGen);
    expect(ManuscriptSchema.safeParse(v2).success).toBe(true);

    // Step 2: v2 -> v1
    const roundtripV1 = adaptV2toV1(v2);

    // Step 3: Compare fields
    expect(roundtripV1.metadata.title).toBe(originalV1.metadata.title);
    expect(roundtripV1.metadata.titleEn).toBe(originalV1.metadata.titleEn);
    expect(roundtripV1.metadata.abstract).toBe(originalV1.metadata.abstract);
    expect(roundtripV1.metadata.keywords).toEqual(originalV1.metadata.keywords);
    expect(roundtripV1.metadata.authors.map((a) => a.name)).toEqual(
      originalV1.metadata.authors.map((a) => a.name)
    );
    expect(roundtripV1.metadata.affiliations.map((a) => a.name)).toEqual(
      originalV1.metadata.affiliations.map((a) => a.name)
    );

    // Sections
    const origParagraph = originalV1.sections.find((s) => s.id === 'sec_p_1')!;
    const rtParagraph = roundtripV1.sections.find((s) => s.id === 'sec_p_1')!;
    expect(rtParagraph.content).toBe(origParagraph.content);

    // Table headers & rows
    const origTable = originalV1.sections.find((s) => s.type === 'table')!.table!;
    const rtTable = roundtripV1.sections.find((s) => s.type === 'table')!.table!;
    expect(rtTable.headers).toEqual(origTable.headers);
    expect(rtTable.rows).toEqual(origTable.rows);

    // References
    expect(roundtripV1.references.map((r) => r.raw)).toEqual(
      originalV1.references.map((r) => r.raw)
    );
  });
});
