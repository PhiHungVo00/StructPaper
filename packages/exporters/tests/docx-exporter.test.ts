import { describe, it, expect } from 'vitest';
import type { Manuscript } from '@structpaper/doc-model';
import { DocxExporter } from '../src/docx/docx-exporter';

describe('DocxExporter', () => {
  const sampleManuscript: Manuscript = {
    schemaVersion: 2,
    id: 'manuscript-docx-01',
    lang: 'vi',
    journalId: 'vnuhcm-stdj',
    articleType: 'research-article',
    meta: {
      title: [
        { t: 'text', v: 'Nghiên cứu về ' },
        { t: 'text', v: 'Trí tuệ nhân tạo', marks: ['b'] },
      ],
      translations: {
        en: [{ t: 'text', v: 'A study on Artificial Intelligence' }],
      },
      authors: [
        {
          id: 'auth1',
          name: 'Nguyễn Văn An',
          affiliationIds: ['aff1'],
          email: 'an.nv@hcmut.edu.vn',
          isCorresponding: true,
        },
      ],
      affiliations: [
        {
          id: 'aff1',
          institution: 'Đại học Bách Khoa TP.HCM',
          department: 'Khoa KH&KT Máy tính',
          city: 'TP. Hồ Chí Minh',
          country: 'Việt Nam',
        },
      ],
      abstract: [
        [{ t: 'text', v: 'Tóm tắt nội dung bài báo khoa học về học sâu.' }],
      ],
      keywords: ['AI', 'Học sâu', 'Y tế'],
      dates: { received: '2026-01-01', accepted: '2026-02-01' },
    },
    body: [
      {
        id: 'sec1',
        level: 1,
        title: [{ t: 'text', v: '1. Giới thiệu' }],
        blocks: [
          {
            type: 'paragraph',
            id: 'p1',
            content: [
              { t: 'text', v: 'Văn bản đoạn văn có ' },
              { t: 'text', v: 'chữ đậm', marks: ['b'] },
              { t: 'text', v: ' và ' },
              { t: 'text', v: 'chữ nghiêng', marks: ['i'] },
              { t: 'text', v: ', cùng trích dẫn ' },
              { t: 'cite', refIds: ['ref1'] },
              { t: 'text', v: '.' },
            ],
          },
          {
            type: 'list',
            id: 'l1',
            ordered: false,
            items: [
              [
                {
                  type: 'paragraph',
                  id: 'lp1',
                  content: [{ t: 'text', v: 'Mục thứ nhất' }],
                },
              ],
              [
                {
                  type: 'paragraph',
                  id: 'lp2',
                  content: [{ t: 'text', v: 'Mục thứ hai' }],
                },
              ],
            ],
          },
          {
            type: 'quote',
            id: 'q1',
            content: [
              {
                type: 'paragraph',
                id: 'qp1',
                content: [{ t: 'text', v: 'Trích dẫn đặc biệt từ tác giả.' }],
              },
            ],
          },
          {
            type: 'box',
            id: 'b1',
            content: [
              {
                type: 'paragraph',
                id: 'bp1',
                content: [{ t: 'text', v: 'Nội dung trong hộp lưu ý.' }],
              },
            ],
          },
          {
            type: 'equation',
            id: 'eq1',
            latex: '\\int_0^\\infty e^{-x^2} dx = \\frac{\\sqrt{\\pi}}{2}',
            numbered: true,
            label: '(1)',
            status: 'ok',
          },
          {
            type: 'figure',
            id: 'fig1',
            assetId: 'asset-1',
            caption: [{ t: 'text', v: 'Sơ đồ luồng xử lý' }],
            source: [{ t: 'text', v: 'Nhóm nghiên cứu' }],
            layout: { columnSpan: '1-column' },
          },
          {
            type: 'table',
            id: 'tbl1',
            caption: [{ t: 'text', v: 'Kết quả thử nghiệm' }],
            headerRows: 1,
            grid: [
              [
                { content: [{ t: 'text', v: 'Tham số' }], rowSpan: 1, colSpan: 1, header: true },
                { content: [{ t: 'text', v: 'Giá trị' }], rowSpan: 1, colSpan: 1, header: true },
              ],
              [
                { content: [{ t: 'text', v: 'Epoch' }], rowSpan: 1, colSpan: 1 },
                { content: [{ t: 'text', v: '100' }], rowSpan: 1, colSpan: 1 },
              ],
            ],
            layout: {},
          },
        ],
        children: [
          {
            id: 'sec1-1',
            level: 2,
            title: [{ t: 'text', v: '1.1 Chi tiết kỹ thuật' }],
            blocks: [
              {
                type: 'paragraph',
                id: 'p2',
                content: [{ t: 'text', v: 'Đoạn văn cấp con.' }],
              },
            ],
            children: [],
          },
        ],
      },
    ],
    back: [
      {
        id: 'back-ethics',
        type: 'ethics',
        title: [{ t: 'text', v: 'Đạo đức nghiên cứu' }],
        content: [
          {
            type: 'paragraph',
            id: 'ep1',
            content: [{ t: 'text', v: 'Nghiên cứu tuân thủ tuyên ngôn Helsinki.' }],
          },
        ],
      },
    ],
    references: [
      {
        id: 'ref1',
        raw: 'Nguyen VA, et al. AI In Health. 2022.',
        parse: 'ok',
        csl: {
          author: [{ family: 'Nguyen', given: 'Van An' }],
          title: 'AI In Health',
          'container-title': 'J Healthcare',
          issued: { 'date-parts': [[2022]] },
        },
      },
    ],
    assets: {},
  };

  it('exports manuscript to a valid Document instance', () => {
    const exporter = new DocxExporter();
    const doc = exporter.exportToDocument(sampleManuscript);
    expect(doc).toBeDefined();
  });

  it('generates a valid DOCX binary buffer with standard PK ZIP header', async () => {
    const exporter = new DocxExporter();
    const buffer = await exporter.exportToBuffer(sampleManuscript, {
      citationStyle: 'vancouver',
    });

    expect(Buffer.isBuffer(buffer)).toBe(true);
    expect(buffer.length).toBeGreaterThan(1000);

    // Check standard ZIP / OOXML magic header bytes: PK\x03\x04 (0x50, 0x4B, 0x03, 0x04)
    expect(buffer[0]).toBe(0x50);
    expect(buffer[1]).toBe(0x4b);
    expect(buffer[2]).toBe(0x03);
    expect(buffer[3]).toBe(0x04);
  });
});
