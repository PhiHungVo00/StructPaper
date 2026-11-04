export type PageSize = 'A4' | 'A5' | 'B5' | 'Letter' | 'Legal' | 'Executive' | 'Custom';
export type PageOrientation = 'portrait' | 'landscape';

import type {
  ZoneCssLayout,
  SciSpaceElementAttributes,
  StandardSemanticElementType,
} from './template-engine';
export type PageNumberPosition =
  | 'bottom-center'
  | 'bottom-right'
  | 'bottom-left'
  | 'bottom-alternating'
  | 'top-right'
  | 'top-left'
  | 'top-center'
  | 'top-alternating'
  | 'margin-outer'
  | 'none';

export type PageNumberFormat =
  | 'arabic' // 1, 2, 3
  | 'roman-lower' // i, ii, iii
  | 'roman-upper' // I, II, III
  | 'alpha-lower' // a, b, c
  | 'alpha-upper' // A, B, C
  | 'hyphen' // - 1 -
  | 'custom-prefix' // Trang {p} / {total}
  | 'page-of-n' // Page {p} of {total}
  | 'page-x-of-y'; // Trang {p} / {total}

export type ZoneLayoutType =
  | 'full-width' // 1 cột 100%
  | 'multi-column' // 2 hoặc 3 cột đều nhau
  | 'sidebar-split' // Cột trái metadata/timeline (25-33%), cột phải nội dung (67-75%)
  | 'asymmetric-grid'; // Tùy biến tỷ lệ cột

export type ElementType =
  | 'article-title' // Tiêu đề chính + Tiêu đề song ngữ phụ
  | 'author-block' // Tác giả, số mũ đơn vị công tác, tác giả liên hệ
  | 'affiliation-list' // Danh sách đơn vị công tác, viện trường
  | 'metadata-grid' // Lịch sử nhận bài, ngày duyệt, DOI, mã bài báo, custom fields
  | 'abstract-box' // Tóm tắt bài báo (có thể có tóm tắt tiếng Anh phụ)
  | 'keywords-group' // Từ khoá nghiên cứu
  | 'heading' // Heading cấp 1, 2, 3, 4
  | 'body-text' // Đoạn văn thân bài (có hỗ trợ drop cap, thụt lề)
  | 'callout-box' // Hộp điểm nhấn: Highlights, Key Findings, Lưu ý biên tập
  | 'figure-box' // Chú thích hình vẽ & đồ thị (Figures)
  | 'table-box' // Chú thích bảng biểu & kiểu bảng Booktabs (Tables)
  | 'equation-box' // Công thức toán học có đánh số (Math Equations)
  | 'code-algorithm' // Khối mã nguồn & Thuật toán học thuật (Algorithms & Code)
  | 'link-box' // Liên kết ngoài, DOI, Repository mở kèm QR Code (Links)
  | 'biography-box' // Tiểu sử tác giả cuối bài (kèm ảnh chân dung)
  | 'references-block' // Danh mục tài liệu tham khảo (Vancouver, IEEE, APA...)
  | 'abbreviations-list' // Danh mục các từ viết tắt học thuật (Abbreviations)
  | 'conflict-of-interest' // Tuyên bố xung đột lợi ích (Conflict of Interest)
  | 'author-contribution' // Đóng góp của các tác giả (CRediT Authorship)
  | 'citation-strip' // Dải trích dẫn bài báo chân trang bìa (How to Cite Banner)
  | 'article-header-badge' // Khối phân loại bài báo & Open Access đầu trang
  | 'acknowledgement-box' // Lời cảm ơn & Nguồn tài trợ nghiên cứu (Funding)
  | 'custom-field' // Bất kỳ trường dữ liệu mới nào người dùng tự định nghĩa
  | 'custom-composite' // Khối thành phần tùy biến ghép từ các Hằng (Label) và Biến (Variable)
  | 'divider-line' // Đường kẻ phân cách trang trí
  | 'custom-block'; // Khối tùy biến (như dải trích dẫn chân trang bìa)

export type TextAlignment = 'left' | 'center' | 'justify' | 'right';
export type HeadingNumbering = 'ROMAN' | 'ARABIC' | 'LETTER' | 'LEGAL' | 'NONE';
export type CitationStyle = 'Vancouver' | 'IEEE' | 'APA' | 'Harvard' | 'Nature' | 'Chicago';
export type BorderStyle = 'none' | 'left-solid' | 'all-borders' | 'top-bottom' | 'double-rule';

// --- Header / Footer Slot Specification ---
export interface HeaderFooterSlot {
  leftText: string;
  centerText: string;
  rightText: string;
  fontFamily: string;
  fontSize: number;
  textColor: string;
  showDividerLine: boolean;
  dividerLineColor: string;
  dividerLineThickness: number; // in pt
}

export interface HeaderFooterConfig {
  firstPage: HeaderFooterSlot;
  oddPages: HeaderFooterSlot;
  evenPages: HeaderFooterSlot;
  differentFirstPage: boolean;
  differentOddEven: boolean;
}

// --- Page Architecture ---
export interface PageArchitectureConfig {
  size: PageSize;
  customDimensions?: { width: number; height: number }; // in mm
  orientation: PageOrientation;
  margins: {
    top: number; // mm
    bottom: number;
    left: number;
    right: number;
  };
  pageNumbering: {
    position: PageNumberPosition;
    format: PageNumberFormat;
    prefixText: string; // e.g. "Trang " / "Page "
    suppressOnFirstPage: boolean;
    startNumber: number;
  };
  headers: HeaderFooterConfig;
  footers: HeaderFooterConfig;
}

// --- Grid Area Specification for CSS Grid Zone Builder ---
export interface GridAreaCoords {
  rowStart: number; // 1-indexed (1 to rows)
  colStart: number; // 1-indexed (1 to cols)
  rowSpan: number; // >= 1
  colSpan: number; // >= 1
}

export interface TemplateGridConfig {
  enabled: boolean;
  columns: number; // e.g. 5
  rows: number; // e.g. 5
  rowGap: number; // e.g. 8 (px or mm)
  colGap: number; // e.g. 8 (px or mm)
  gapSync?: boolean; // whether rowGap and colGap are locked together
  unit?: 'px' | 'mm'; // default 'px'
}

export type ZoneHeightMode = 'auto' | 'grid';

// --- Layout Zone Model ---
export interface LayoutZoneConfig {
  id: string;
  name: string;
  description: string;
  type: ZoneLayoutType;
  columns: 1 | 2 | 3;
  columnGap: number; // in mm
  showColumnRule: boolean;
  columnRuleColor: string;
  sidebarWidthPercentage?: number; // e.g. 28% for VNUHCM Health Sci sidebar
  balanceLastPageColumns?: boolean;
  order: number;
  gridArea?: GridAreaCoords;
  autoFitHeight?: boolean; // Tự động co dãn theo chiều dọc khi tắt lưới: ôm sát nội dung chữ, các vùng dưới tự động đẩy sát lên
  heightMode?: ZoneHeightMode; // 'auto': Tự co dãn theo chữ khi tắt lưới | 'grid': Theo ô lưới mặc định
  overflowBehavior?: 'push-down' | 'overflow-up' | 'clip' | 'auto-fit'; // Cơ chế khi tràn
  allowOverflowPush?: boolean; // Tự động đẩy phân vùng dưới
  secondaryGridArea?: GridAreaCoords; // Khối tiếp nối biệt lập: khi khối 1 đầy thì tự động đổ tiếp sang khối 2
  page?: number; // Trang mục tiêu hiển thị độc lập (1, 2, 3...)
  pageScope?: 'all' | 'first-page' | 'subsequent-pages'; // Mục tiêu trang hiển thị: Tất cả, Trang đầu (Bìa/Frontmatter), hoặc Trang sau (Thân bài)
  cssLayout?: ZoneCssLayout; // Cấu hình bố cục CSS hiện đại (Grid, Flex, Multi-Column, Block, Sub-slots)
  // --- Bố cục đa cấp lồng nhau (Hierarchical Sub-grid & Recursive Sub-zones) ---
  subGridConfig?: TemplateGridConfig; // Lưới con bên trong phân vùng này (Sub-grid: cột, hàng, gap riêng)
  subZones?: LayoutZoneConfig[]; // Danh sách các phân vùng con lồng nhau đệ quy
  parentId?: string | null; // ID của phân vùng cha (nếu là phân vùng con cấp 2, 3...)
}

// --- Dynamic Metadata Field Item ---
export interface MetadataFieldItem {
  id: string;
  label: string; // e.g. "Ngày nhận", "DOI", "Nguồn tài trợ", "Mã đề tài"
  defaultValue: string;
  isCustom: boolean;
  visible: boolean;
}

// --- General Element Styling ---
export interface ElementStyling {
  fontFamily: string;
  fontSize: number; // pt
  fontWeight: 'normal' | 'medium' | 'semibold' | 'bold' | 'extrabold' | 'black';
  fontStyle: 'normal' | 'italic';
  textColor: string;
  textAlign: TextAlignment;
  lineHeight: number;
  letterSpacing?: number; // em
  textTransform: 'uppercase' | 'capitalize' | 'lowercase' | 'none';
  backgroundColor: string;
  borderStyle: BorderStyle;
  borderColor: string;
  borderWidth: number; // pt
  borderRadius: number; // px
  padding: { top: number; right: number; bottom: number; left: number }; // mm
  margin: { top: number; bottom: number }; // pt
  firstLineIndent?: number; // mm (for body text)
  hangingIndent?: number; // mm (for references)
  dropCap?: boolean; // For initial letter drop cap
  accentBar?: boolean; // Vertical bar beside headings
  accentBarColor?: string;
}

// --- Dynamic Semantic Element Definition ---
export interface SemanticElement {
  id: string;
  type: ElementType;
  name: string; // Tên hiển thị (e.g. "Khối Tóm tắt", "Nguồn tài trợ nghiên cứu", "Tiểu sử tác giả")
  zoneId: string; // Thuộc phân vùng nào (Zone ID)
  order: number;
  spanColumns: boolean; // Tràn toàn bộ số cột trong zone hay đi theo dòng cột
  visible: boolean;
  styling: ElementStyling;
  subSlotId?: string; // Sub-slot ID khi zone sử dụng bố cục hòa trộn (Hybrid Sub-Slots)
  sciSpaceAttributes?: Partial<SciSpaceElementAttributes>; // Thuộc tính chuẩn hóa dạng SciSpace

  // Type-specific specialized parameters
  specialProps: {
    // For Title & Subtitle
    supportBilingual?: boolean;
    bilingualLabel?: string;
    bilingualFontSize?: number;

    // For Authors
    showAffiliations?: boolean;
    showCorresponding?: boolean;
    showOrcid?: boolean;

    // For Affiliations
    affiliations?: Array<{
      id: string;
      index?: string;
      department?: string;
      institution?: string;
      address?: string;
    }>;
    affiliationText?: string;

    // For Metadata Grid
    metadataFields?: MetadataFieldItem[];
    metadataLayout?: 'vertical-stack' | 'two-column-grid' | 'inline-pills' | 'sidebar-academic';
    correspondenceAuthor?: string;
    correspondenceEmail?: string;
    correspondenceAffiliation?: string;
    historyReceived?: string;
    historyRevised?: string;
    historyAccepted?: string;
    historyPublished?: string;
    doiUrl?: string;
    badgeImageSrc?: string;
    copyrightNotice?: string;
    logoImageSrc?: string;

    // For Abstract & Callout
    calloutTitle?: string;
    calloutIcon?: string;
    abstractLabel?: string;
    abstractTitle?: string;
    bilingualAbstractLabel?: string;

    // For Keywords
    keywordLabel?: string;
    keywordSeparator?: ', ' | '; ' | ' • ';
    badgeStyle?: boolean;
    keywords?: string[];

    // For Body & Paragraph
    dropCapEnabled?: boolean;
    firstLineIndent?: number;

    // For Headings
    headingLevel?: 1 | 2 | 3 | 4;
    numberingFormat?: HeadingNumbering;
    headingNumbering?: HeadingNumbering;

    // For Figures & Tables
    captionPrefix?: string; // 'Hình ' / 'Fig.' / 'Bảng ' / 'Table'
    captionPosition?: 'above' | 'below'; // Bảng thường ở trên, Hình thường ở dưới
    captionText?: string;
    figureSource?: string;
    figureAlignment?: 'center' | 'left' | 'right';
    figureSubfigures?: boolean; // Hỗ trợ 2 hình con (a) và (b)
    figureImageSrc?: string;
    figureNumber?: number | string;
    figureHeightMm?: number;
    tableHeaderBackground?: string;
    tableBorderMode?: 'booktabs' | 'grid' | 'clean';
    zebraStriping?: boolean;
    tableFootnote?: string;
    tableNumber?: number | string;
    tableHeaders?: string[];
    tableRows?: Array<{ isSubheader?: boolean; subheaderText?: string; cols?: string[] }>;
    tableSource?: string;

    // For Equations
    equationNumber?: string; // e.g. '(1)' or '(2.1)'
    equationLatex?: string;
    equationAlign?: 'center' | 'left';

    // For Code / Algorithm
    algorithmTitle?: string; // 'Thuật toán 1: Phân tích cú pháp'
    codeLanguage?: string;
    showLineNumbers?: boolean;
    algorithmInputs?: string;
    algorithmOutputs?: string;

    // For Links / DOI / Repositories
    linkType?: 'doi' | 'github' | 'url' | 'dataset';
    linkLabel?: string;
    linkUrl?: string;
    linkStyle?: 'pill' | 'callout' | 'minimal';
    showQrCode?: boolean;
    qrImageSrc?: string;
    qrCaption?: string;

    // For Biography
    authorName?: string;
    showAuthorPhoto?: boolean;
    bioText?: string;

    // For References
    citationStyle?: CitationStyle;
    referenceHeadingText?: string;
    referenceItems?: Array<{ num: string; text: string; doi?: string; url?: string }>;

    // For Abbreviations List (ID630)
    abbreviations?: Array<{ term: string; definition: string }>;

    // For Conflict of Interest Statement (ID630)
    conflictText?: string;

    // For Authors Contributions (ID630)
    contributions?: Array<{ author: string; role: string }>;

    // For Citation Strip (ID630 Bottom Banner)
    citationLabel?: string;
    citationText?: string;
    citationJournal?: string;

    // For Article Header Badge & Type Banner
    articleType?: string;
    isOpenAccess?: boolean;
    openAccessText?: string;
    articleJournalHeader?: string;

    // For Acknowledgement / Funding Box
    acknowledgementText?: string;
    grantNumber?: string;

    // For Custom Fields / Generic Text / Flow Split
    customContentSample?: string;
    isContinuation?: boolean;
    isFlowSource?: boolean;
    originalBaseId?: string;
    flowPart?: number;
    siblingPartText?: string;

    // For Custom Composite (Biến & Hằng kết hợp)
    compositeLayout?: 'inline' | 'stacked' | 'split-cols';
    subItems?: CompositeSubItem[];
  };
}

// --- Dynamic Composite Sub-Item (Biến & Hằng kết hợp) ---
export interface CompositeSubItem {
  id: string;
  kind: 'constant' | 'variable'; // 'constant' (Nhãn hằng cố định) | 'variable' (Nội dung biến động)
  label: string; // Tên gợi nhớ (e.g. "Nhãn Tóm tắt", "Nội dung tóm tắt")
  defaultValue: string; // Giá trị hiển thị mẫu
  styling: {
    fontFamily?: string;
    fontSize?: number; // pt
    fontWeight?: 'normal' | 'medium' | 'semibold' | 'bold' | 'black';
    fontStyle?: 'normal' | 'italic';
    textColor?: string;
    textTransform?: 'none' | 'uppercase' | 'capitalize' | 'lowercase';
    display?: 'inline' | 'block';
    suffix?: string; // e.g. ": "
  };
}

// --- Global Design Rules for Floating & Dynamic Elements ---
// (Figures, Tables, Equations, Algorithms, Links, Callouts, Footnotes, Bio)
export interface FloatingElementsDesignRules {
  figure: {
    captionPrefix: string; // 'Hình' / 'Fig.'
    captionPosition: 'above' | 'below'; // default 'below'
    captionFontSize: number; // pt
    captionFontFamily: string;
    captionWeight: 'bold' | 'normal';
    captionLabelWeight?: 'bold' | 'normal' | 'semibold'; // Độ đậm chữ "Hình 1:"
    captionLabelColor?: string;
    captionTextColor?: string;
    captionTextItalic?: boolean;
    sourceFontSize?: number;
    sourceTextColor?: string;
    figureAlignment: 'center' | 'left' | 'right';
    borderStyle: 'none' | 'subtle' | 'card';
    showSubfiguresSupport: boolean;
    defaultSpanColumns: boolean;
  };
  table: {
    captionPrefix: string; // 'Bảng' / 'Table'
    captionPosition: 'above' | 'below'; // default 'above'
    captionFontSize: number;
    captionFontFamily: string;
    captionWeight: 'bold' | 'normal';
    captionLabelWeight?: 'bold' | 'normal' | 'semibold'; // Độ đậm chữ "Bảng 1:"
    captionLabelColor?: string;
    captionTextColor?: string;
    captionTextItalic?: boolean;
    borderMode: 'booktabs' | 'grid' | 'clean';
    zebraStriping: boolean;
    headerBackground: string;
    headerTextColor: string;
    headerFontSize?: number;
    headerFontWeight?: 'bold' | 'semibold' | 'normal';
    dataFontSize?: number;
    dataTextColor?: string;
    noteFontSize?: number;
    noteTextColor?: string;
    defaultSpanColumns: boolean;
  };
  equation: {
    numberingFormat: '(1)' | '[1]' | '(1.1)' | 'none';
    fontFamily: string;
    fontSize: number;
    alignment: 'center' | 'left';
    numberWeight?: 'bold' | 'normal';
    numberColor?: string;
  };
  codeAlgorithm: {
    titlePrefix: string; // 'Thuật toán' / 'Algorithm' / 'Mã nguồn'
    fontFamily: string;
    fontSize: number;
    showLineNumbers: boolean;
    borderMode: 'booktabs-rules' | 'box' | 'clean';
    backgroundColor: string;
  };
  linkDoi: {
    displayStyle: 'pill' | 'inline' | 'card';
    showQrCodeOnPrint: boolean;
    showDoiPrefix: boolean;
  };
  callout: {
    borderStyle: 'left-solid' | 'all-borders' | 'double-rule';
    borderColor: string;
    backgroundColor: string;
  };
  biography: {
    showAuthorPhoto: boolean;
    photoBorderRadius: number; // px
    fontSize: number;
  };
  footnote: {
    numberingStyle: 'arabic' | 'asterisk' | 'roman';
    showSeparatorRule: boolean;
    fontSize: number;
    numColor?: string;
    numWeight?: 'bold' | 'normal';
    noteTextColor?: string;
    ruleColor?: string;
  };
  citation: {
    citationStyle: 'ieee' | 'apa' | 'nature' | 'harvard' | 'vancouver';
    inTextFormat: 'brackets-number' | 'superscript' | 'author-year';
    sortOrder: 'appearance' | 'alphabetical';
    hangingIndent: number; // mm, default 5mm
    fontSize: number; // pt, default 8pt
    fontFamily: string;
    showDoiInBibliography: boolean;
    maxAuthorsBeforeEtAl: number;
    inTextColor?: string; // Màu số trích dẫn trong văn bản [1]
    inTextWeight?: 'bold' | 'normal';
    inTextPill?: boolean; // Hiển thị dạng badge pill nhẹ
    refLabelWeight?: 'bold' | 'normal'; // Độ đậm số thứ tự [1] trong danh mục TLTK
    refLabelColor?: string;
    refTextColor?: string;
    doiColor?: string;
    doiUnderline?: boolean;
  };
}

export const DEFAULT_FLOATING_RULES: FloatingElementsDesignRules = {
  figure: {
    captionPrefix: 'Hình',
    captionPosition: 'below',
    captionFontSize: 8,
    captionFontFamily: 'Arial',
    captionWeight: 'bold',
    captionLabelWeight: 'bold',
    captionLabelColor: '#0F172A',
    captionTextColor: '#334155',
    captionTextItalic: true,
    sourceFontSize: 6.5,
    sourceTextColor: '#64748B',
    figureAlignment: 'center',
    borderStyle: 'none',
    showSubfiguresSupport: false,
    defaultSpanColumns: false,
  },
  table: {
    captionPrefix: 'Bảng',
    captionPosition: 'above',
    captionFontSize: 8,
    captionFontFamily: 'Arial',
    captionWeight: 'bold',
    captionLabelWeight: 'bold',
    captionLabelColor: '#0F172A',
    captionTextColor: '#334155',
    captionTextItalic: true,
    borderMode: 'booktabs',
    zebraStriping: false,
    headerBackground: '#F8FAFC',
    headerTextColor: '#0F172A',
    headerFontSize: 7.5,
    headerFontWeight: 'bold',
    dataFontSize: 7,
    dataTextColor: '#1E293B',
    noteFontSize: 6.5,
    noteTextColor: '#64748B',
    defaultSpanColumns: false,
  },
  equation: {
    numberingFormat: '(1)',
    fontFamily: 'Times New Roman',
    fontSize: 9.5,
    alignment: 'center',
    numberWeight: 'bold',
    numberColor: '#334155',
  },
  codeAlgorithm: {
    titlePrefix: 'Thuật toán',
    fontFamily: 'Courier',
    fontSize: 7.5,
    showLineNumbers: true,
    borderMode: 'booktabs-rules',
    backgroundColor: '#F8FAFC',
  },
  linkDoi: {
    displayStyle: 'pill',
    showQrCodeOnPrint: true,
    showDoiPrefix: true,
  },
  callout: {
    borderStyle: 'left-solid',
    borderColor: '#78C841',
    backgroundColor: '#F0FDF4',
  },
  biography: {
    showAuthorPhoto: true,
    photoBorderRadius: 6,
    fontSize: 7.5,
  },
  footnote: {
    numberingStyle: 'arabic',
    showSeparatorRule: true,
    fontSize: 7.5,
    numColor: '#0F172A',
    numWeight: 'bold',
    noteTextColor: '#334155',
    ruleColor: '#94A3B8',
  },
  citation: {
    citationStyle: 'ieee',
    inTextFormat: 'brackets-number',
    sortOrder: 'appearance',
    hangingIndent: 5,
    fontSize: 8,
    fontFamily: 'Times New Roman',
    showDoiInBibliography: true,
    maxAuthorsBeforeEtAl: 3,
    inTextColor: '#2563EB',
    inTextWeight: 'bold',
    inTextPill: false,
    refLabelWeight: 'bold',
    refLabelColor: '#0F172A',
    refTextColor: '#1E293B',
    doiColor: '#2563EB',
    doiUnderline: false,
  },
};

// --- Universal Document Template Schema ---
export interface UniversalTemplateSchema {
  id: string;
  name: string;
  category: 'journal-article' | 'conference-proceeding' | 'thesis-report' | 'custom-open';
  description: string;
  author: string;
  institution?: string;
  version: string;
  createdAt: string;
  updatedAt: string;
  primaryColor: string;
  secondaryColor: string;
  pageArchitecture: PageArchitectureConfig;
  zones: LayoutZoneConfig[];
  elements: SemanticElement[];
  gridConfig?: TemplateGridConfig;
  floatingRules?: FloatingElementsDesignRules; // Quy chuẩn thiết kế mặc định cho các thành phần nổi/đặc biệt
}

export type BuilderStudioStep =
  | 'page-zones' // Bước 1: Khổ giấy, Lề & Tiêu đề (Page Architecture & Headers/Footers)
  | 'grid-zones' // Bước 2: Bố cục Lưới & Phân vùng (CSS/Typst Grid Layout & Zones Overlay)
  | 'elements-tree' // Bước 3: Cấu trúc Thành phần Động (Semantic Elements Tree & Custom Fields)
  | 'deep-styling' // Bước 4: Định dạng Sâu & Thuộc tính Typst (Deep Typography & Semantic Rules)
  | 'special-elements' // Bước 5: Quy chuẩn Thành phần Đặc biệt & Nổi (Figures, Tables, Math, Algorithms, Citations, Links, Bio)
  | 'preview-export' // Bước 6: Xem trước In ấn & Xuất mã nguồn Typst / LaTeX / PDF
  | 'advanced-manager'; // Quản lý Toàn bộ Thành phần & Tạo thành phần Biến/Hằng

// =====================================================================
// BACKWARDS-COMPATIBLE LEGACY SCHEMAS & TYPES
// =====================================================================
export type FirstPageLayout = 'standard-span' | 'sidebar-split';

export interface PageSetupConfig {
  size: PageSize;
  margins: { top: number; bottom: number; left: number; right: number };
  columns: 1 | 2;
  columnGap: number;
  showColumnRule: boolean;
  columnRuleColor: string;
  firstPageLayout: FirstPageLayout;
  articleType: string;
  articleTypeColor: string;
  headerText: string;
  journalName: string;
  showRunningHeader: boolean;
  showPageNumbers: boolean;
  pageNumberPosition: 'bottom-center' | 'bottom-right' | 'top-right';
}

export interface TitleElementConfig {
  fontFamily: string;
  fontSize: number;
  fontWeight: 'bold' | 'black' | 'extrabold' | 'normal';
  align: TextAlignment;
  color: string;
  lineHeight: number;
  spaceAfter: number;
  spanColumns: boolean;
  supportBilingual: boolean;
  enTitleFontSize: number;
}

export interface AuthorElementConfig {
  fontSize: number;
  fontWeight: 'bold' | 'normal';
  fontStyle: 'normal' | 'italic';
  align: TextAlignment;
  showAffiliations: boolean;
  showCorresponding: boolean;
  spaceAfter: number;
  spanColumns: boolean;
}

export interface AbstractElementConfig {
  fontSize: number;
  fontStyle: 'normal' | 'italic';
  lineHeight: number;
  borderStyle: BorderStyle;
  borderColor: string;
  backgroundColor: string;
  label: string;
  labelWeight: 'bold' | 'extrabold';
  padding: number;
  spaceAfter: number;
  spanColumns: boolean;
  supportBilingual: boolean;
  enLabel: string;
}

export interface KeywordsElementConfig {
  fontSize: number;
  label: string;
  labelBold: boolean;
  separator: ', ' | '; ' | ' • ';
  spaceAfter: number;
}

export interface HeadingElementConfig {
  fontFamily: string;
  fontSize: number;
  fontWeight: 'bold' | 'black' | 'extrabold' | 'normal';
  textTransform: 'uppercase' | 'capitalize' | 'none';
  numbering: HeadingNumbering;
  accentBar: boolean;
  accentColor: string;
  spaceBefore: number;
  spaceAfter: number;
}

export interface BodyElementConfig {
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  firstLineIndent: number;
  align: 'justify' | 'left';
  paragraphSpacing: number;
  hyphenation: boolean;
}

export interface FloatElementConfig {
  captionFontSize: number;
  captionWeight: 'bold' | 'normal';
  captionPrefix: string;
  tableHeaderBackground: string;
  zebraStripes: boolean;
  spaceAround: number;
}

export interface ReferencesElementConfig {
  style: CitationStyle;
  fontSize: number;
  hangingIndent: number;
  lineHeight: number;
  headingText: string;
}

export interface DocumentTemplateSchema {
  id: string;
  name: string;
  description: string;
  author: string;
  version: string;
  createdAt: string;
  updatedAt: string;
  primaryColor: string;
  secondaryColor?: string;
  pageSetup: PageSetupConfig;
  title: TitleElementConfig;
  authors: AuthorElementConfig;
  abstract: AbstractElementConfig;
  keywords: KeywordsElementConfig;
  heading1: HeadingElementConfig;
  heading2: HeadingElementConfig;
  heading3: HeadingElementConfig;
  body: BodyElementConfig;
  floats: FloatElementConfig;
  references: ReferencesElementConfig;
}

export type TemplateBuilderCategory =
  | 'page'
  | 'title'
  | 'abstract'
  | 'headings'
  | 'body'
  | 'floats'
  | 'references';

