import type { Manuscript } from '@structpaper/doc-model';

export function createSampleManuscript(): Manuscript {
  return {
    schemaVersion: 2,
    id: 'doc_sample_01HX9J00000000000000000000',
    lang: 'vi',
    journalId: 'vnuhcm-hs',
    articleType: 'Research Article',
    meta: {
      title: [{ t: 'text', v: 'Tiêu đề ban đầu của bài báo' }],
      authors: [
        {
          id: 'auth_1',
          name: 'Nguyễn Văn A',
          affiliationIds: ['aff_1'],
          email: 'nva@vnuhcm.edu.vn',
          isCorresponding: true,
        },
      ],
      affiliations: [
        {
          id: 'aff_1',
          institution: 'Đại học Bách Khoa TP.HCM',
        },
      ],
      abstract: [
        [{ t: 'text', v: 'Đây là đoạn tóm tắt mở đầu của nghiên cứu.' }],
      ],
      keywords: ['Từ khóa 1', 'Từ khóa 2'],
      dates: {
        received: '2026-01-01',
      },
    },
    body: [
      {
        id: 'sec_intro',
        level: 1,
        title: [{ t: 'text', v: '1. Đặt vấn đề' }],
        blocks: [
          {
            type: 'paragraph',
            id: 'p_intro_1',
            content: [{ t: 'text', v: 'Nội dung giới thiệu ban đầu.' }],
          },
          {
            type: 'table',
            id: 'tbl_results',
            caption: [{ t: 'text', v: 'Bảng 1: Kết quả khảo nghiệm' }],
            grid: [
              [
                {
                  content: [{ t: 'text', v: 'Chỉ số' }],
                  rowSpan: 1,
                  colSpan: 1,
                  header: true,
                  align: 'c',
                },
                {
                  content: [{ t: 'text', v: 'Giá trị' }],
                  rowSpan: 1,
                  colSpan: 1,
                  header: true,
                  align: 'c',
                },
              ],
              [
                {
                  content: [{ t: 'text', v: 'Độ chính xác' }],
                  rowSpan: 1,
                  colSpan: 1,
                  align: 'l',
                },
                {
                  content: [{ t: 'text', v: '95%' }],
                  rowSpan: 1,
                  colSpan: 1,
                  align: 'r',
                },
              ],
            ],
            headerRows: 1,
            layout: { columnSpan: '1-column' },
          },
        ],
        children: [],
      },
    ],
    back: [],
    references: [
      {
        id: 'ref_001',
        raw: 'Nguyen, V. A. (2025). AI Research. Journal of Science, 1(1), 1-10.',
        parse: 'ok',
      },
    ],
    assets: {},
  };
}
