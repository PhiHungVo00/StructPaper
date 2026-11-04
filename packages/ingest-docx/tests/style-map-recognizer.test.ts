import { describe, it, expect } from 'vitest';
import path from 'path';
import fs from 'fs';
import { getJournalProfile } from '@structpaper/journal-profiles';
import { DocxPackage } from '../src/package/docx-package';
import { StyleResolver } from '../src/ooxml/style-resolver';
import { RawDocVisitor } from '../src/ooxml/raw-doc-visitor';
import { RawParagraph, RawTable } from '../src/types/raw-doc';
import {
  StyleMapRecognizer,
  StructureRecognizer,
  RecognizerChain,
  IngestContext,
  Claim,
} from '../src/recognizers';

const TEMPLATES_DIR = path.resolve(__dirname, '../../../fixtures/golden/templates');

function createMockParagraph(
  text: string,
  options: {
    styleName?: string;
    styleId?: string;
    alignment?: string;
    bold?: boolean;
    italic?: boolean;
  } = {}
): RawParagraph {
  return {
    type: 'paragraph',
    styleName: options.styleName,
    styleId: options.styleId,
    alignment: options.alignment,
    rawText: text,
    runs: [
      {
        text,
        bold: options.bold,
        italic: options.italic,
      },
    ],
  };
}

function createMockContext(overrides: Partial<IngestContext> = {}): IngestContext {
  const profile = getJournalProfile('VNUHCM-HS');
  const styleResolver = new StyleResolver();
  return {
    profile,
    styleResolver,
    blockIndex: 0,
    totalBlocks: 1,
    previousClaims: [],
    ...overrides,
  };
}

describe('StyleMapRecognizer', () => {
  const profile = getJournalProfile('VNUHCM-HS');

  it('recognizes 35 standard styles mapped in VNUHCM-HS profile', () => {
    const recognizer = new StyleMapRecognizer();
    const styleResolver = new StyleResolver();

    // Map each expected role to style names in VNUHCM-HS
    const testCases: Array<{ style: string; expectedRole: string; isIgnore?: boolean }> = [
      { style: 'ArticleTitle', expectedRole: 'title' },
      { style: 'Authors', expectedRole: 'authors' },
      { style: 'Affiliation', expectedRole: 'affiliations' },
      { style: 'CorrespondingAuthor', expectedRole: 'corresponding' },
      { style: 'DateReceived', expectedRole: 'date.received' },
      { style: 'DateRevised', expectedRole: 'date.revised' },
      { style: 'DateAccepted', expectedRole: 'date.accepted' },
      { style: 'DatePublished', expectedRole: 'date.published' },
      { style: 'SectionAbstract', expectedRole: 'heading.abstract' },
      { style: 'Abstract', expectedRole: 'abstract' },
      { style: 'Keywords', expectedRole: 'keywords' },
      { style: 'Heading1', expectedRole: 'h1' },
      { style: 'Heading2', expectedRole: 'h2' },
      { style: 'Heading3', expectedRole: 'h3' },
      { style: 'BodyText', expectedRole: 'paragraph' },
      { style: 'TableCaption', expectedRole: 'table.caption' },
      { style: 'TableText', expectedRole: 'table.cell' },
      { style: 'TableNote', expectedRole: 'table.note' },
      { style: 'SourceLine', expectedRole: 'source' },
      { style: 'FigureCaption', expectedRole: 'figure.caption' },
      { style: 'FigurePlaceholder', expectedRole: 'figure.placeholder' },
      { style: 'Equation', expectedRole: 'equation' },
      { style: 'Reference', expectedRole: 'reference' },
      { style: 'EndNoteBibliography', expectedRole: 'reference' },
      { style: 'SectionReferences', expectedRole: 'heading.references' },
      { style: 'SectionEthics', expectedRole: 'back.ethics' },
      { style: 'SectionAcknowledgments', expectedRole: 'back.acknowledgments' },
      { style: 'SectionFunding', expectedRole: 'back.funding' },
      { style: 'SectionContributions', expectedRole: 'back.contributions' },
      { style: 'SectionConflict', expectedRole: 'back.conflict' },
      { style: 'SectionDataAvailability', expectedRole: 'back.data_availability' },
      { style: 'Instruction', expectedRole: 'ignore', isIgnore: true },
      { style: 'GuideHeading1', expectedRole: 'ignore', isIgnore: true },
      { style: 'GuideHeading2', expectedRole: 'ignore', isIgnore: true },
      { style: 'GuideText', expectedRole: 'ignore', isIgnore: true },
    ];

    for (const tc of testCases) {
      const block = createMockParagraph(`Sample text for ${tc.style}`, {
        styleName: tc.style,
        styleId: tc.style,
      });
      const ctx = createMockContext({ profile, styleResolver });
      const claim = recognizer.recognize(block, ctx);

      expect(claim).not.toBeNull();
      expect(claim?.role).toBe(tc.expectedRole);
      expect(claim?.confidence).toBe(1.0);
      if (tc.isIgnore) {
        expect(claim?.evidence).toBe('styleMap:ignore');
      } else {
        expect(claim?.evidence).toBe(`styleMap:${tc.style}`);
      }
    }
  });

  it('filters out Guide* and Instruction as ignore with confidence 1.0', () => {
    const recognizer = new StyleMapRecognizer();
    const ctx = createMockContext({ profile });

    const guideBlocks = [
      createMockParagraph('Hướng dẫn trình bày tiêu đề', { styleName: 'GuideHeading1' }),
      createMockParagraph('Nội dung hướng dẫn định dạng tác giả', { styleName: 'GuideText' }),
      createMockParagraph('Instruction for authors', { styleName: 'Instruction' }),
      createMockParagraph('Any custom guide', { styleName: 'GuideNote' }),
    ];

    for (const block of guideBlocks) {
      const claim = recognizer.recognize(block, ctx);
      expect(claim).toEqual({
        role: 'ignore',
        confidence: 1.0,
        evidence: 'styleMap:ignore',
        metadata: expect.any(Object),
      });
    }
  });

  it('resolves inheritance chain when block style is derived from a mapped style', () => {
    const stylesXml = `
      <w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
        <w:style w:type="paragraph" w:styleId="ArticleTitle">
          <w:name w:val="ArticleTitle"/>
        </w:style>
        <w:style w:type="paragraph" w:styleId="CustomPaperTitle">
          <w:name w:val="Custom Paper Title"/>
          <w:basedOn w:val="ArticleTitle"/>
        </w:style>
      </w:styles>
    `;
    const styleResolver = new StyleResolver(stylesXml);
    const recognizer = new StyleMapRecognizer();

    const block = createMockParagraph('My Derived Title', {
      styleId: 'CustomPaperTitle',
      styleName: 'Custom Paper Title',
    });
    const ctx = createMockContext({ profile, styleResolver });

    const claim = recognizer.recognize(block, ctx);
    expect(claim).not.toBeNull();
    expect(claim?.role).toBe('title');
    expect(claim?.confidence).toBe(1.0);
    expect(claim?.evidence).toBe('styleMap:ArticleTitle');
  });

  it('handles case-insensitivity and normalized spaces in style names', () => {
    const recognizer = new StyleMapRecognizer();
    const ctx = createMockContext({ profile });

    const block = createMockParagraph('Section Title', {
      styleName: 'heading 1',
      styleId: 'heading1',
    });
    const claim = recognizer.recognize(block, ctx);
    expect(claim?.role).toBe('h1');
    expect(claim?.confidence).toBe(1.0);
  });

  it('returns null for unstyled blocks or unknown styles not in styleMap', () => {
    const recognizer = new StyleMapRecognizer();
    const ctx = createMockContext({ profile });

    const unstyledBlock = createMockParagraph('Just normal unstyled paragraph', {
      styleName: 'Normal',
      styleId: 'Normal',
    });
    expect(recognizer.recognize(unstyledBlock, ctx)).toBeNull();

    const unknownBlock = createMockParagraph('Unknown custom styling', {
      styleName: 'RandomCustomStyle_xyz',
      styleId: 'RandomCustomStyle_xyz',
    });
    expect(recognizer.recognize(unknownBlock, ctx)).toBeNull();
  });

  it('recognizes styles accurately on real Template_EN.docx blocks', async () => {
    const buf = fs.readFileSync(path.join(TEMPLATES_DIR, 'Template_EN.docx'));
    const pkg = await DocxPackage.load(buf);
    const styleResolver = new StyleResolver(pkg.stylesXml);
    const visitor = new RawDocVisitor(styleResolver);
    const doc = visitor.visit(pkg);

    const recognizer = new StyleMapRecognizer();
    const ctx = createMockContext({
      profile,
      docxPackage: pkg,
      styleResolver,
      totalBlocks: doc.blocks.length,
    });

    const recognizedRoles = new Set<string>();

    for (let i = 0; i < doc.blocks.length; i++) {
      const block = doc.blocks[i];
      const claim = recognizer.recognize(block, { ...ctx, blockIndex: i });
      if (claim) {
        recognizedRoles.add(claim.role);
      }
    }

    // Verify key roles from Template_EN.docx are recognized with confidence 1.0
    expect(recognizedRoles.has('title')).toBe(true);
    expect(recognizedRoles.has('authors')).toBe(true);
    expect(recognizedRoles.has('affiliations')).toBe(true);
    expect(recognizedRoles.has('heading.abstract')).toBe(true);
    expect(recognizedRoles.has('abstract')).toBe(true);
    expect(recognizedRoles.has('keywords')).toBe(true);
    expect(recognizedRoles.has('h1')).toBe(true);
    expect(recognizedRoles.has('ignore')).toBe(true);
  });

  it('recognizes styles accurately on real Template_VI.docx blocks', async () => {
    const buf = fs.readFileSync(path.join(TEMPLATES_DIR, 'Template_VI.docx'));
    const pkg = await DocxPackage.load(buf);
    const styleResolver = new StyleResolver(pkg.stylesXml);
    const visitor = new RawDocVisitor(styleResolver);
    const doc = visitor.visit(pkg);

    const recognizer = new StyleMapRecognizer();
    const ctx = createMockContext({
      profile,
      docxPackage: pkg,
      styleResolver,
      totalBlocks: doc.blocks.length,
    });

    const titleBlock = doc.blocks.find(
      (b) => b.type === 'paragraph' && (b.styleName === 'ArticleTitle' || b.styleId === 'ArticleTitle')
    );
    expect(titleBlock).toBeDefined();
    const titleClaim = recognizer.recognize(titleBlock!, ctx);
    expect(titleClaim?.role).toBe('title');
    expect(titleClaim?.confidence).toBe(1.0);

    const authorsBlock = doc.blocks.find(
      (b) => b.type === 'paragraph' && (b.styleName === 'Authors' || b.styleId === 'Authors')
    );
    expect(authorsBlock).toBeDefined();
    const authorsClaim = recognizer.recognize(authorsBlock!, ctx);
    expect(authorsClaim?.role).toBe('authors');
    expect(authorsClaim?.confidence).toBe(1.0);
  });
});

describe('StructureRecognizer', () => {
  const profile = getJournalProfile('VNUHCM-HS');
  const recognizer = new StructureRecognizer();

  it('recognizes table blocks as table.cell with confidence 0.9', () => {
    const tableBlock: RawTable = {
      type: 'table',
      colCount: 2,
      rowCount: 2,
      rows: [
        {
          cells: [
            { paragraphs: [createMockParagraph('Cell 1')], gridSpan: 1 },
            { paragraphs: [createMockParagraph('Cell 2')], gridSpan: 1 },
          ],
        },
      ],
    };
    const ctx = createMockContext({ profile });
    const claim = recognizer.recognize(tableBlock, ctx);

    expect(claim).toEqual({
      role: 'table.cell',
      confidence: 0.9,
      evidence: 'structure:table',
    });
  });

  it('recognizes table captions in Vietnamese and English with confidence 0.85', () => {
    const ctx = createMockContext({ profile });

    const captions = [
      'Bảng 1: Đặc điểm lâm sàng của đối tượng nghiên cứu',
      'bảng 2. Kết quả phân tích hồi quy đa biến',
      'Table 1: Baseline demographics of participants',
      'TABLE 2. Summary of biochemical parameters',
    ];

    for (const text of captions) {
      const block = createMockParagraph(text);
      const claim = recognizer.recognize(block, ctx);
      expect(claim).not.toBeNull();
      expect(claim?.role).toBe('table.caption');
      expect(claim?.confidence).toBe(0.85);
      expect(claim?.evidence).toBe('structure:table-caption');
    }
  });

  it('recognizes figure captions in Vietnamese and English with confidence 0.85', () => {
    const ctx = createMockContext({ profile });

    const captions = [
      'Hình 1: Sơ đồ quy trình tuyển chọn bệnh nhân',
      'hình 2. Cấu trúc hiển vi quang học mô bệnh học',
      'Figure 1: Flowchart of study design',
      'Fig. 2: ROC curve analysis for diagnostic accuracy',
      'fig. 3. Transmission electron micrograph',
    ];

    for (const text of captions) {
      const block = createMockParagraph(text);
      const claim = recognizer.recognize(block, ctx);
      expect(claim).not.toBeNull();
      expect(claim?.role).toBe('figure.caption');
      expect(claim?.confidence).toBe(0.85);
      expect(claim?.evidence).toBe('structure:figure-caption');
    }
  });

  it('recognizes keywords prefixes in Vietnamese and English with confidence 0.85', () => {
    const ctx = createMockContext({ profile });

    const keywords = [
      'Từ khóa: Ung thư gan; Viêm gan B; TAFP',
      'từ khóa : Đái tháo đường, biến chứng',
      'Keywords: Liver neoplasms; Hepatitis B; Biomarkers',
      'Keyword: Machine learning; Classification',
    ];

    for (const text of keywords) {
      const block = createMockParagraph(text);
      const claim = recognizer.recognize(block, ctx);
      expect(claim).not.toBeNull();
      expect(claim?.role).toBe('keywords');
      expect(claim?.confidence).toBe(0.85);
      expect(claim?.evidence).toBe('structure:keywords');
    }
  });

  it('recognizes bracketed reference items with confidence 0.8', () => {
    const ctx = createMockContext({ profile });

    const refs = [
      '[1] World Health Organization. Guidelines on hepatitis B and C testing. Geneva: WHO; 2017.',
      '[2] Nguyễn Văn A, Trần Thị B. Đánh giá hiệu quả điều trị... Tạp chí Y học, 2023; 25(3): 45-52.',
      '[105] Smith J, Doe A. Deep learning in biomedical imaging. Nature Medicine, 2022.',
    ];

    for (const text of refs) {
      const block = createMockParagraph(text);
      const claim = recognizer.recognize(block, ctx);
      expect(claim).not.toBeNull();
      expect(claim?.role).toBe('reference');
      expect(claim?.confidence).toBe(0.8);
      expect(claim?.evidence).toBe('structure:reference-item');
    }
  });

  it('recognizes heading patterns (h1, h2, h3) with confidence 0.8', () => {
    const ctx = createMockContext({ profile });

    const h1Cases = [
      'I. ĐẶT VẤN ĐỀ',
      'II. PHƯƠNG PHÁP NGHIÊN CỨU',
      '1. INTRODUCTION',
      '2. METHODS',
    ];
    for (const text of h1Cases) {
      const block = createMockParagraph(text);
      const claim = recognizer.recognize(block, ctx);
      expect(claim).not.toBeNull();
      expect(claim?.role).toBe('h1');
      expect(claim?.confidence).toBe(0.8);
    }

    const h2Cases = [
      '1.1. Thiết kế nghiên cứu',
      '2.3. Statistical Analysis',
    ];
    for (const text of h2Cases) {
      const block = createMockParagraph(text);
      const claim = recognizer.recognize(block, ctx);
      expect(claim).not.toBeNull();
      expect(claim?.role).toBe('h2');
      expect(claim?.confidence).toBe(0.8);
    }

    const h3Cases = [
      '1.1.1. Tiêu chuẩn chọn mẫu',
      '2.3.1. Primary outcome measurement',
    ];
    for (const text of h3Cases) {
      const block = createMockParagraph(text);
      const claim = recognizer.recognize(block, ctx);
      expect(claim).not.toBeNull();
      expect(claim?.role).toBe('h3');
      expect(claim?.confidence).toBe(0.8);
    }
  });

  it('applies top-of-document heuristic for bold/centered title when blockIndex < 5', () => {
    const boldCenteredBlock = createMockParagraph(
      'NGHIÊN CỨU TỶ LỆ ĐỀ KHÁNG KHÁNG SINH CỦA VI KHUẨN TẠI BỆNH VIỆN X',
      { alignment: 'center', bold: true }
    );

    // Case 1: First block, no previous title -> claimed as title (confidence 0.6)
    const ctx0 = createMockContext({
      profile,
      blockIndex: 0,
      previousClaims: [],
    });
    const claim0 = recognizer.recognize(boldCenteredBlock, ctx0);
    expect(claim0).not.toBeNull();
    expect(claim0?.role).toBe('title');
    expect(claim0?.confidence).toBe(0.6);
    expect(claim0?.evidence).toBe('structure:top-bold-centered-title');

    // Case 2: blockIndex < 5, but title has already been claimed -> null
    const ctx1 = createMockContext({
      profile,
      blockIndex: 2,
      previousClaims: [{ role: 'title', confidence: 1.0, evidence: 'styleMap:ArticleTitle' }],
    });
    const claim1 = recognizer.recognize(boldCenteredBlock, ctx1);
    expect(claim1).toBeNull();

    // Case 3: blockIndex >= 5 -> null
    const ctxLate = createMockContext({
      profile,
      blockIndex: 7,
      previousClaims: [],
    });
    const claimLate = recognizer.recognize(boldCenteredBlock, ctxLate);
    expect(claimLate).toBeNull();
  });
});

describe('RecognizerChain', () => {
  const profile = getJournalProfile('VNUHCM-HS');

  it('arbitrates correctly: StyleMapRecognizer takes precedence over heuristics', () => {
    const chain = new RecognizerChain();

    // Block has TableCaption text pattern, but style is BodyText
    const block = createMockParagraph('Table 1: Some text inside body paragraph', {
      styleName: 'BodyText',
      styleId: 'BodyText',
    });
    const ctx = createMockContext({ profile });

    const claim = chain.recognizeBlock(block, ctx);
    expect(claim.role).toBe('paragraph');
    expect(claim.confidence).toBe(1.0);
    expect(claim.evidence).toBe('styleMap:BodyText');
  });

  it('falls back to StructureRecognizer when block has no styleMap match', () => {
    const chain = new RecognizerChain();

    const block = createMockParagraph('Table 1: Characteristics of cohort', {
      styleName: 'Normal',
      styleId: 'Normal',
    });
    const ctx = createMockContext({ profile });

    const claim = chain.recognizeBlock(block, ctx);
    expect(claim.role).toBe('table.caption');
    expect(claim.confidence).toBe(0.85);
    expect(claim.evidence).toBe('structure:table-caption');
  });

  it('falls back to default paragraph with confidence 0.5 for unstyled normal text', () => {
    const chain = new RecognizerChain();

    const block = createMockParagraph(
      'This is a regular narrative paragraph in the document that matches no special pattern.',
      { styleName: 'Normal', styleId: 'Normal' }
    );
    const ctx = createMockContext({ profile });

    const claim = chain.recognizeBlock(block, ctx);
    expect(claim.role).toBe('paragraph');
    expect(claim.confidence).toBe(0.5);
    expect(claim.evidence).toBe('default:body');
  });

  it('recognizes all blocks across an entire document maintaining sequential context', () => {
    const chain = new RecognizerChain();
    const styleResolver = new StyleResolver();

    const blocks = [
      createMockParagraph('EFFECTS OF DRUG X ON HYPERTENSION', {
        alignment: 'center',
        bold: true,
      }),
      createMockParagraph('John Doe, Jane Smith', {
        styleName: 'Authors',
        styleId: 'Authors',
      }),
      createMockParagraph('Keywords: Hypertension; Drug X', {
        styleName: 'Keywords',
        styleId: 'Keywords',
      }),
      createMockParagraph('1. Introduction', {
        styleName: 'Heading1',
        styleId: 'Heading1',
      }),
      createMockParagraph('Hypertension is a major risk factor...'),
      createMockParagraph('[1] WHO Report, 2023'),
    ];

    const claims = chain.recognizeAll(blocks, {
      profile,
      styleResolver,
    });

    expect(claims).toHaveLength(6);
    expect(claims[0].role).toBe('title'); // Top-of-doc bold/centered heuristic
    expect(claims[1].role).toBe('authors'); // styleMap:Authors
    expect(claims[2].role).toBe('keywords'); // styleMap:Keywords
    expect(claims[3].role).toBe('h1'); // styleMap:Heading1
    expect(claims[4].role).toBe('paragraph'); // default fallback
    expect(claims[5].role).toBe('reference'); // structure:reference-item
  });
});
