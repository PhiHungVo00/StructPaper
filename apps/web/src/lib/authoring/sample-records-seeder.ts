import type { Manuscript, ManuscriptRecord, WorkflowStatus } from '@structpaper/doc-model';
import { extractTitle } from '@structpaper/storage';

export function createSampleVnuManuscript(
  id: string,
  journalId: string,
  title: string,
  authors: string[],
  submissionId: string,
  workflowStatus: WorkflowStatus,
  tags: string[],
  note?: string,
  pinned = false,
  offsetMinutes = 0
): ManuscriptRecord {
  const now = new Date(Date.now() - offsetMinutes * 60000);
  const updatedAt = now.toISOString();

  const doc: Manuscript = {
    schemaVersion: 2,
    id,
    lang: 'vi',
    journalId,
    articleType: 'Research Article',
    meta: {
      title: [{ t: 'text', v: title }],
      authors: authors.map((name, idx) => ({
        id: `auth_${idx + 1}`,
        name,
        affiliationIds: ['aff_1'],
        email: `author${idx + 1}@vnuhcm.edu.vn`,
        isCorresponding: idx === 0,
      })),
      affiliations: [
        {
          id: 'aff_1',
          institution: 'Đại học Quốc gia TP. Hồ Chí Minh (VNUHCM)',
        },
      ],
      abstract: [
        [
          {
            t: 'text',
            v: `Nội dung tóm tắt nghiên cứu cho bài báo "${title}". Đóng góp phương pháp luận và kết quả thực nghiệm đạt chuẩn mực học thuật quốc tế.`,
          },
        ],
      ],
      keywords: tags,
      dates: {
        received: '2026-03-15',
        revised: '2026-06-20',
        accepted: '2026-08-10',
        published: '2026-10-14',
      },
      doi: `10.32508/vnuhcm-${journalId}.${id.replace(/[^0-9]/g, '') || '101'}`,
    },
    body: [
      {
        id: 'sec_1',
        level: 1,
        title: [{ t: 'text', v: '1. Đặt vấn đề & Tổng quan nghiên cứu' }],
        blocks: [
          {
            type: 'paragraph',
            id: 'p_1',
            content: [
              {
                t: 'text',
                v: 'Bài báo trình bày các luận điểm cốt lõi và đóng góp giải pháp đổi mới sáng tạo trong bối cảnh thực tiễn.',
              },
            ],
          },
        ],
        children: [],
      },
      {
        id: 'sec_2',
        level: 1,
        title: [{ t: 'text', v: '2. Phương pháp nghiên cứu & Thực nghiệm' }],
        blocks: [
          {
            type: 'paragraph',
            id: 'p_2',
            content: [
              {
                t: 'text',
                v: 'Quy trình thu thập dữ liệu, huấn luyện mô hình và kiểm chứng độ chính xác thông qua các độ đo định lượng.',
              },
            ],
          },
        ],
        children: [],
      },
    ],
    back: [],
    references: [
      {
        id: 'ref_1',
        raw: 'Nguyen, V. A., et al. (2025). Advanced Machine Learning in Academic Publishing. VNUHCM Journal.',
        parse: 'ok',
      },
    ],
    assets: {},
  };

  return {
    info: {
      id,
      displayName: title,
      submissionId,
      note,
      tags,
      workflowStatus,
      pinned,
      archived: false,
      createdAt: new Date(now.getTime() - 7 * 86400000).toISOString(),
      updatedAt,
      lastOpenedAt: updatedAt,
    },
    doc,
    revision: 1,
  };
}

export const SAMPLE_VNUHCM_RECORDS: ManuscriptRecord[] = [
  createSampleVnuManuscript(
    'vnuhcm-hs-id630',
    'hs',
    'Nghiên cứu ứng dụng mô hình trí tuệ nhân tạo trong nhận dạng chữ viết tay tiếng Việt cổ',
    ['TS. Nguyễn Hoàng Nam', 'ThS. Trần Thị Mai', 'GS. Lê Văn Khoa'],
    'ID630_HS',
    'published',
    ['AI', 'Khoa học Sức khỏe', 'Xử lý ảnh', 'VNUHCM-HS'],
    'Bài báo nghiên cứu ứng dụng mô hình AI và thị giác máy tính.',
    true,
    5
  ),
  createSampleVnuManuscript(
    'vnuhcm-std-412',
    'std',
    'Phân tích hiệu năng giao thức định tuyến không dây thích ứng trong mạng cảm biến IoT',
    ['TS. Nguyễn Hoàng Nam', 'Kỹ sư Phạm Quốc Bảo'],
    'ID412_STD',
    'in-review',
    ['IoT', 'Mạng cảm biến', 'WSN', 'STDJ'],
    'Đang trong vòng phản biện thứ hai với 2 chuyên gia độc lập.',
    true,
    15
  ),
  createSampleVnuManuscript(
    'vnuhcm-ssh-185',
    'ssh',
    'Tác động của chuyển đổi số đến thói quen tiêu dùng của người trẻ đô thị Việt Nam',
    ['TS. Đỗ Minh Trí', 'ThS. Hoàng Thu Thảo'],
    'ID185_SSH',
    'draft',
    ['Xã hội học', 'Kinh tế số', 'VNUHCM-SSH'],
    'Bản phác thảo sơ bộ, tiếp tục mở rộng mẫu khảo sát.',
    false,
    45
  ),
  createSampleVnuManuscript(
    'vnuhcm-ees-220',
    'ees',
    'Đánh giá chất lượng nước mặt lưu vực sông Đồng Nai giai đoạn 2020-2025',
    ['PGS.TS. Trần Quốc Hùng', 'ThS. Lê Thanh Tâm'],
    'ID220_EES',
    'proofing',
    ['Môi trường', 'Nguồn nước', 'VNUHCM-EES'],
    'Đang hiệu đính bản in và rà soát tài liệu trích dẫn.',
    false,
    120
  ),
  createSampleVnuManuscript(
    'vnuhcm-et-305',
    'et',
    'Tối ưu hóa hệ thống pin năng lượng mặt trời tích hợp lưới điện thông minh',
    ['TS. Vũ Đình Khôi', 'KTS. Bùi Minh Quân'],
    'ID305_ET',
    'ready',
    ['Năng lượng sạch', 'Smart Grid', 'Kỹ thuật'],
    'Đã thông qua phản biện, sẵn sàng chuyển bộ phận chế bản.',
    false,
    240
  ),
  createSampleVnuManuscript(
    'vnuhcm-ebl-140',
    'ebl',
    'Khung pháp lý về tài sản ảo và tiền mã hóa tại các quốc gia đang phát triển',
    ['TS. Phan Anh Tuấn', 'ThS. Đặng Cẩm Tú'],
    'ID140_EBL',
    'draft',
    ['Luật học', 'Fintech', 'Tài chính'],
    'Bản nháp thảo luận tại hội thảo chuyên đề.',
    false,
    360
  ),
  createSampleVnuManuscript(
    'vnuhcm-arns-512',
    'arns',
    'Tổng hợp và đặc trưng cấu trúc vật liệu nano oxit kim loại ứng dụng xúc tác quang hóa',
    ['GS.TS. Hoàng Minh Đạo', 'ThS. Vũ Ngọc Bích'],
    'ID512_ARNS',
    'published',
    ['Vật liệu nano', 'Hóa học', 'Xúc tác'],
    'Công bố chính thức trên Tạp chí Khoa học Tự nhiên.',
    false,
    480
  ),
];
