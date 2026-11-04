export interface PreviewSampleContent {
  id: string;
  discipline: string;
  title: string;
  authors: { name: string; affilId: number; isCorr?: boolean }[];
  affiliations: string[];
  corrEmail: string;
  abstract: string;
  keywords: string[];
  sections: {
    title: string;
    level: 1 | 2;
    paragraphs: string[];
  }[];
  references: string[];
}

export const SAMPLE_CONTENTS: PreviewSampleContent[] = [
  {
    id: 'cs_ai',
    discipline: 'Khoa học Máy tính & AI',
    title: 'Nghiên cứu ứng dụng bóc tách cấu trúc OpenXML và tự động dàn trang báo cáo khoa học chuẩn VNUHCM',
    authors: [
      { name: 'Nguyễn Hoàng Nam', affilId: 1, isCorr: true },
      { name: 'Trần Minh Tuấn', affilId: 2 },
      { name: 'Lê Thu Hương', affilId: 1 },
    ],
    affiliations: [
      'Khoa Khoa học & Kỹ thuật Máy tính, Trường Đại học Bách khoa, ĐHQG TP.HCM',
      'Viện Khoa học Dữ liệu & Trí tuệ Nhân tạo, ĐHQG TP.HCM',
    ],
    corrEmail: 'nam.nh@vnuhcm.edu.vn',
    abstract:
      'Bài báo này đề xuất giải pháp bóc tách cấu trúc tài liệu DOCX bán cấu trúc và tự động chuyển đổi sang khuôn mẫu xuất bản khoa học 2 cột. Hệ thống kết hợp phân tích cú pháp OpenXML nội bộ với mô hình ngôn ngữ lớn để bảo toàn hoàn chỉnh ảnh đồ họa vector, công thức toán học MathML và mạng lưới trích dẫn tài liệu tham khảo theo quy chuẩn VNUHCM.',
    keywords: ['OpenXML', 'LaTeX XeTeX', 'Dàn trang tự động', 'Bài báo khoa học', 'ĐHQG TP.HCM'],
    sections: [
      {
        title: 'Giới thiệu',
        level: 1,
        paragraphs: [
          'Văn bản khoa học đóng vai trò trung tâm trong công tác công bố và lan toả tri thức học thuật. Các tạp chí thuộc hệ sinh thái Đại học Quốc gia TP.HCM đòi hỏi quy chuẩn dàn trang nghiêm ngặt về số cột, lề trang, font chữ và phong cách trích dẫn.',
          'Tuy nhiên, phần lớn tác giả nộp bản thảo dưới dạng Microsoft Word (.docx), trong khi khâu in ấn và xuất bản trực tuyến đòi hỏi định dạng PDF chất lượng cao biên dịch từ hệ thống LaTeX.',
        ],
      },
      {
        title: 'Phương pháp nghiên cứu & Kiến trúc',
        level: 1,
        paragraphs: [
          'Hệ thống trích xuất sử dụng kiến trúc phân tầng 3 bước: (1) Phân tích cây DOM của tập tin Word OpenXML (.docx); (2) Nhận diện khối ngữ nghĩa tiêu đề, tóm tắt, bảng biểu và công thức toán; (3) Ánh xạ sang các bộ tham số template.',
        ],
      },
      {
        title: 'Cơ chế chia cột và đồng bộ hoá',
        level: 2,
        paragraphs: [
          'Khối tiêu đề và tóm tắt được định nghĩa ở chế độ full-width (span-columns), trong khi toàn bộ thân bài được chia tự động thành 2 cột với khoảng cách column-gap chuẩn xác.',
        ],
      },
      {
        title: 'Kết quả thử nghiệm & Đánh giá',
        level: 1,
        paragraphs: [
          'Thử nghiệm trên 50 bản thảo DOCX thuộc tạp chí Sci. Tech. Dev. J. (STDJ) cho thấy thời gian xử lý trung bình đạt 2.8 giây, độ chính xác nhận diện phần tóm tắt đạt 98.4%, và bảo toàn 100% hình ảnh không bị méo tỷ lệ.',
        ],
      },
    ],
    references: [
      'Nguyen, H. N., & Tran, M. T. (2025). Automated Academic Typesetting from DOCX Documents. Sci. Tech. Dev. J., 28(2), 112-124.',
      'VNU-HCM Publishing House. (2024). Guidelines for Scientific Paper Formatting and Citation Standards.',
      'Knuth, D. E. (1984). The TeXbook. Addison-Wesley Professional.',
      'Mittelbach, F., & Goossens, M. (2004). The LaTeX Companion (2nd ed.). Addison-Wesley.',
    ],
  },
  {
    id: 'health_sci',
    discipline: 'Khoa học Y Dược (Health Sciences)',
    title: 'Khảo sát hiệu quả can thiệp dinh dưỡng đường ruột sớm ở bệnh nhân sau phẫu thuật ổ bụng',
    authors: [
      { name: 'Phạm Hồng Quân', affilId: 1, isCorr: true },
      { name: 'Nguyễn Thị Thuỳ Dương', affilId: 2 },
    ],
    affiliations: [
      'Khoa Y, Đại học Quốc gia TP.HCM',
      'Bệnh viện Đa khoa Trung tâm TP.HCM',
    ],
    corrEmail: 'quan.ph@vnuhcm.edu.vn',
    abstract:
      'Nghiên cứu can thiệp lâm sàng ngẫu nhiên có đối chứng nhằm đánh giá hiệu quả và độ an toàn của việc nuôi dưỡng đường ruột sớm (trong vòng 24 giờ đầu) đối với thời gian phục hồi nhu động ruột và tỷ lệ biến chứng nhiễm trùng ở 120 bệnh nhân phẫu thuật đường tiêu hóa.',
    keywords: ['Dinh dưỡng đường ruột sớm', 'Phẫu thuật ổ bụng', 'Hồi phục nhu động ruột', 'Biến chứng'],
    sections: [
      {
        title: 'Đặt vấn đề',
        level: 1,
        paragraphs: [
          'Nuôi dưỡng đường tiêu hóa sớm sau phẫu thuật bụng là một trong những thành tố quan trọng của chương trình chăm sóc hồi phục sớm sau mổ (ERAS).',
          'Nhiều nghiên cứu quốc tế đã ghi nhận giảm đáng kể thời gian nằm viện và biến chứng nhiễm trùng khi áp dụng nuôi ăn đường ruột sớm.',
        ],
      },
      {
        title: 'Đối tượng và phương pháp',
        level: 1,
        paragraphs: [
          'Nghiên cứu can thiệp thử nghiệm lâm sàng ngẫu nhiên có đối chứng, thực hiện từ tháng 1/2025 đến tháng 12/2025 tại Bệnh viện ĐHQG TP.HCM. Cỡ mẫu gồm 120 bệnh nhân được phân ngẫu nhiên thành 2 nhóm.',
        ],
      },
      {
        title: 'Kết quả',
        level: 1,
        paragraphs: [
          'Thời gian trung bình xuất hiện tiếng nhu động ruột ở nhóm can thiệp là 21.4 ± 4.2 giờ, ngắn hơn có ý nghĩa thống kê so với nhóm chứng (34.8 ± 6.1 giờ, p < 0.001).',
        ],
      },
    ],
    references: [
      'Pham, H. Q., et al. (2025). Early enteral nutrition in abdominal surgery. STDJ - Health Sci., 6(1), 45-52.',
      'Weimann, A., et al. (2021). ESPEN guideline: Clinical nutrition in surgery. Clin Nutr, 40(9), 4745-4761.',
    ],
  },
];
