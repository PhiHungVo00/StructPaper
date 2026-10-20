/**
 * SciSpace-Style Semantic Element Definitions and Finite Attribute Schema
 * Represents the pure Document Schema separated from style definitions.
 */

export type StandardSemanticElementType =
  | 'article-title'       // Tiêu đề chính bài báo (+ Tiêu đề tiếng Anh song ngữ)
  | 'author-list'         // Danh sách tác giả, đánh số mũ đơn vị & tác giả liên hệ
  | 'affiliation-list'    // Đơn vị công tác, viện/trường, email, địa chỉ
  | 'metadata-sidebar'    // Lịch sử nhận bài (Received, Revised, Accepted, Published), DOI, QR, License
  | 'abstract-box'        // Khối tóm tắt bài báo (Abstract)
  | 'keywords-group'      // Từ khóa nghiên cứu (Keywords)
  | 'heading-1'           // Tiêu đề mục cấp 1 (I. GIỚI THIỆU)
  | 'heading-2'           // Tiêu đề mục cấp 2 (1.1 Phương pháp)
  | 'heading-3'           // Tiêu đề mục cấp 3 (1.1.1 Chi tiết thực nghiệm)
  | 'paragraph'           // Đoạn văn thân bài (Paragraph)
  | 'figure-caption'      // Khối hình ảnh & Chú thích hình (Figure & Caption)
  | 'table-caption'       // Khối bảng biểu Booktabs & Chú thích bảng (Table & Caption)
  | 'equation-block'      // Công thức toán học đánh số (Numbered Equation)
  | 'callout-box'         // Hộp điểm nhấn, tóm tắt chính (Highlights, Note)
  | 'bibliography-item'   // Mục tài liệu tham khảo (References / Vancouver / APA)
  | 'running-header'      // Dòng tiêu đề đầu trang (Running Header)
  | 'running-footer'      // Dòng chân trang & số trang (Running Footer)
  | 'article-header-badge'// Khối phân loại bài báo & Open Access đầu trang
  | 'citation-strip'      // Dải trích dẫn bài báo chân trang bìa
  | 'abbreviations-list'  // Danh mục các từ viết tắt học thuật
  | 'conflict-of-interest'// Tuyên bố xung đột lợi ích
  | 'author-contribution' // Đóng góp của các tác giả (CRediT)
  | 'acknowledgement-box';// Lời cảm ơn & Nguồn tài trợ nghiên cứu

export type ElementCategory =
  | 'frontmatter'   // Phần đầu bài báo (Tiêu đề, tác giả, tóm tắt)
  | 'headings'      // Hệ thống tiêu đề các cấp
  | 'body'          // Thân bài, công thức toán
  | 'floats'        // Hình ảnh, bảng biểu
  | 'backmatter';   // Tài liệu tham khảo, lời cảm ơn

export interface SemanticElementMeta {
  type: StandardSemanticElementType;
  label: string;
  category: ElementCategory;
  description: string;
  defaultColumnSpan: 'all' | 'single';
}

export const SEMANTIC_ELEMENTS_CATALOG: SemanticElementMeta[] = [
  // Frontmatter
  {
    type: 'article-header-badge',
    label: 'Thẻ đầu trang & Loại bài báo',
    category: 'frontmatter',
    description: 'Thẻ Open Access Full Text Article và loại bài báo (Bài tổng quan)',
    defaultColumnSpan: 'all',
  },
  {
    type: 'article-title',
    label: 'Tựa đề bài báo',
    category: 'frontmatter',
    description: 'Tiêu đề chính tiếng Việt và tiêu đề tiếng Anh phụ',
    defaultColumnSpan: 'all',
  },
  {
    type: 'author-list',
    label: 'Danh sách tác giả',
    category: 'frontmatter',
    description: 'Tên các tác giả, ký hiệu mũ đơn vị, tác giả liên hệ (*)',
    defaultColumnSpan: 'all',
  },
  {
    type: 'affiliation-list',
    label: 'Đơn vị công tác',
    category: 'frontmatter',
    description: 'Viện trường, khoa bộ môn, địa chỉ công tác',
    defaultColumnSpan: 'single',
  },
  {
    type: 'citation-strip',
    label: 'Dải trích dẫn bài báo',
    category: 'frontmatter',
    description: 'Dải hướng dẫn cách trích dẫn bài báo chân trang bìa (#DBEAFE)',
    defaultColumnSpan: 'all',
  },
  {
    type: 'metadata-sidebar',
    label: 'Khung mốc thời gian & DOI',
    category: 'frontmatter',
    description: 'Ngày nhận bài, ngày duyệt, ngày xuất bản, mã định danh DOI, QR Code',
    defaultColumnSpan: 'single',
  },
  {
    type: 'abstract-box',
    label: 'Khối tóm tắt (Abstract)',
    category: 'frontmatter',
    description: 'Nội dung tóm tắt nghiên cứu kèm khung nền/viền trang trí',
    defaultColumnSpan: 'all',
  },
  {
    type: 'keywords-group',
    label: 'Từ khóa (Keywords)',
    category: 'frontmatter',
    description: 'Danh mục từ khóa học thuật phân tách bằng dấu chấm phẩy',
    defaultColumnSpan: 'all',
  },

  // Headings
  {
    type: 'heading-1',
    label: 'Tiêu đề cấp 1 (H1)',
    category: 'headings',
    description: 'Tiêu đề các phần chính: Giới thiệu, Phương pháp, Kết quả...',
    defaultColumnSpan: 'single',
  },
  {
    type: 'heading-2',
    label: 'Tiêu đề cấp 2 (H2)',
    category: 'headings',
    description: 'Tiêu đề các tiểu mục cấp 2',
    defaultColumnSpan: 'single',
  },
  {
    type: 'heading-3',
    label: 'Tiêu đề cấp 3 (H3)',
    category: 'headings',
    description: 'Tiêu đề các tiểu mục con cấp 3',
    defaultColumnSpan: 'single',
  },

  // Body
  {
    type: 'paragraph',
    label: 'Đoạn văn thân bài (Paragraph)',
    category: 'body',
    description: 'Nội dung văn bản chính, thụt đầu dòng, căn đều 2 bên',
    defaultColumnSpan: 'single',
  },
  {
    type: 'equation-block',
    label: 'Công thức toán (Equation)',
    category: 'body',
    description: 'Khối công thức toán học căn giữa kèm số thứ tự (1), (2)',
    defaultColumnSpan: 'single',
  },
  {
    type: 'callout-box',
    label: 'Khung điểm nhấn (Highlights)',
    category: 'body',
    description: 'Khối thông tin chú ý, điểm nhấn nghiên cứu hoặc cảnh báo',
    defaultColumnSpan: 'single',
  },

  // Floats
  {
    type: 'figure-caption',
    label: 'Hình ảnh & Chú thích (Figure)',
    category: 'floats',
    description: 'Khung chứa hình vẽ, đồ thị và chú thích Hình 1',
    defaultColumnSpan: 'single',
  },
  {
    type: 'table-caption',
    label: 'Bảng biểu & Chú thích (Table)',
    category: 'floats',
    description: 'Khung chứa bảng biểu chuẩn Booktabs và chú thích Bảng 1',
    defaultColumnSpan: 'single',
  },

  // Backmatter
  {
    type: 'abbreviations-list',
    label: 'Danh mục từ viết tắt',
    category: 'backmatter',
    description: 'Bảng từ viết tắt học thuật 2 cột chuẩn y sinh (ASA, PPI, COX-1...)',
    defaultColumnSpan: 'single',
  },
  {
    type: 'conflict-of-interest',
    label: 'Xung đột lợi ích',
    category: 'backmatter',
    description: 'Tuyên bố đạo đức xuất bản về mâu thuẫn quyền lợi',
    defaultColumnSpan: 'single',
  },
  {
    type: 'author-contribution',
    label: 'Đóng góp của các tác giả',
    category: 'backmatter',
    description: 'Phân định chi tiết vai trò của tác giả theo phân loại CRediT',
    defaultColumnSpan: 'single',
  },
  {
    type: 'acknowledgement-box',
    label: 'Lời cảm ơn & Tài trợ',
    category: 'backmatter',
    description: 'Ghi nhận đóng góp và công bố mã số đề tài tài trợ nghiên cứu',
    defaultColumnSpan: 'single',
  },
  {
    type: 'bibliography-item',
    label: 'Tài liệu tham khảo (References)',
    category: 'backmatter',
    description: 'Mục trích dẫn tài liệu tham khảo chuẩn Vancouver/IEEE/APA',
    defaultColumnSpan: 'single',
  },
  {
    type: 'running-header',
    label: 'Tiêu đề đầu trang (Header)',
    category: 'frontmatter',
    description: 'Dòng tiêu đề chạy ở đầu trang, số tập san, Open Access badge',
    defaultColumnSpan: 'all',
  },
  {
    type: 'running-footer',
    label: 'Chân trang & Số trang (Footer)',
    category: 'backmatter',
    description: 'Thanh trích dẫn chân trang, số trang đối xứng',
    defaultColumnSpan: 'all',
  },
];


// --- FINITE ATTRIBUTE SETS (Kiểu SciSpace) ---

export interface TypographyAttributes {
  fontFamily: string;
  fontSizePt: number;
  fontWeight: '300' | '400' | '500' | '600' | '700' | '800' | '900';
  fontStyle: 'normal' | 'italic';
  textTransform: 'uppercase' | 'capitalize' | 'lowercase' | 'none';
  color: string;
  lineHeight: number; // e.g. 1.15, 1.25, 1.4
  letterSpacingEm?: number; // e.g. 0.02
}

export interface SpacingAttributes {
  marginTopPt: number;
  marginBottomPt: number;
  paddingTopMm: number;
  paddingRightMm: number;
  paddingBottomMm: number;
  paddingLeftMm: number;
  firstLineIndentMm: number; // Thụt đầu dòng (cho paragraph)
  hangingIndentMm?: number;   // Thụt dòng sau (cho references)
  textAlign: 'justify' | 'left' | 'center' | 'right';
}

export interface LayoutScopeAttributes {
  columnSpan: 'all' | 'single'; // Tràn mọi cột (100% trang) hay nằm trong 1 cột
  display: 'block' | 'inline' | 'inline-block' | 'flex';
  float?: 'none' | 'left' | 'right';
  clear?: 'none' | 'both' | 'left' | 'right';
  pageScope?: 'all' | 'first-page' | 'subsequent-pages';
}

export interface DecorationAttributes {
  borderTop: boolean;
  borderBottom: boolean;
  borderLeft: boolean;
  borderRight: boolean;
  borderWidthPt: number;
  borderStyle: 'solid' | 'dashed' | 'dotted' | 'double' | 'none';
  borderColor: string;
  backgroundColor: string;
  borderRadiusPx: number;
  boxShadow?: string;
}

export interface NumberingAttributes {
  scheme: 'none' | 'arabic' | 'roman' | 'decimal' | 'alphabet'; // e.g. 1., I., 1.1, A.
  prefix?: string; // e.g. "Hình ", "Bảng "
  suffix?: string; // e.g. "." hoặc ":"
  citationStyle?: 'Vancouver' | 'IEEE' | 'APA' | 'Harvard' | 'Nature';
}

export interface SciSpaceElementAttributes {
  typography: TypographyAttributes;
  spacing: SpacingAttributes;
  layoutScope: LayoutScopeAttributes;
  decorations: DecorationAttributes;
  numbering: NumberingAttributes;
  customCss?: string; // Tùy biến CSS nâng cao (nếu cần)
}
