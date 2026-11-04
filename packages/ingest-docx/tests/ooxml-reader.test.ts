import { describe, it, expect } from 'vitest';
import path from 'path';
import fs from 'fs';
import { DocxPackage } from '../src/package/docx-package';
import { StyleResolver } from '../src/ooxml/style-resolver';
import { RawDocVisitor } from '../src/ooxml/raw-doc-visitor';
import { RawParagraph, RawTable } from '../src/types/raw-doc';

const TEMPLATES_DIR = path.resolve(__dirname, '../../../fixtures/golden/templates');

describe('DocxPackage', () => {
  it('extracts mandatory and optional XML parts from Template_EN.docx', async () => {
    const filePath = path.join(TEMPLATES_DIR, 'Template_EN.docx');
    const buffer = fs.readFileSync(filePath);

    const pkg = await DocxPackage.load(buffer);

    expect(pkg.documentXml).toBeDefined();
    expect(pkg.documentXml.length).toBeGreaterThan(100);
    expect(pkg.documentXml).toContain('<w:document');

    expect(pkg.stylesXml).toBeDefined();
    expect(pkg.stylesXml).toContain('<w:styles');

    expect(pkg.numberingXml).toBeDefined();
    expect(pkg.relsXml).toBeDefined();
    expect(pkg.rels.size).toBeGreaterThan(0);
    expect(pkg.rels.get('rId2')).toBe('styles.xml');
  });

  it('extracts media files from docx package with embedded images', async () => {
    const filePath = path.join(TEMPLATES_DIR, 'Bài mẫu template tiếng Anh.docx');
    const buffer = fs.readFileSync(filePath);

    const pkg = await DocxPackage.load(buffer);

    expect(pkg.media.size).toBeGreaterThan(0);
    expect(pkg.media.has('media/image1.png')).toBe(true);

    const imageBytes = pkg.getMedia('media/image1.png');
    expect(imageBytes).toBeDefined();
    expect(imageBytes instanceof Uint8Array).toBe(true);
    // PNG magic bytes: 0x89 0x50 0x4E 0x47
    expect(imageBytes![0]).toBe(0x89);
    expect(imageBytes![1]).toBe(0x50);
    expect(imageBytes![2]).toBe(0x4e);
    expect(imageBytes![3]).toBe(0x47);

    // Can resolve by relationship ID
    const imageByRid = pkg.getMediaByRId('rId5');
    expect(imageByRid).toBeDefined();
    expect(imageByRid?.length).toBe(imageBytes?.length);

    // Can resolve by base filename
    const imageByBasename = pkg.getMedia('image1.png');
    expect(imageByBasename).toBeDefined();
  });

  it('throws a descriptive error when loading an invalid DOCX archive', async () => {
    const invalidBuffer = new Uint8Array([0, 1, 2, 3]);
    await expect(DocxPackage.load(invalidBuffer)).rejects.toThrow();
  });
});

describe('StyleResolver', () => {
  it('parses styles and resolves style names in Template_EN.docx', async () => {
    const filePath = path.join(TEMPLATES_DIR, 'Template_EN.docx');
    const buffer = fs.readFileSync(filePath);
    const pkg = await DocxPackage.load(buffer);

    const resolver = new StyleResolver(pkg.stylesXml);

    expect(resolver.getStyle('ArticleTitle')).toBeDefined();
    expect(resolver.resolveStyleName('ArticleTitle')).toBe('ArticleTitle');

    expect(resolver.getStyle('Authors')).toBeDefined();
    expect(resolver.resolveStyleName('Authors')).toBe('Authors');

    expect(resolver.getStyle('SectionAbstract')).toBeDefined();
    expect(resolver.resolveStyleName('SectionAbstract')).toBe('SectionAbstract');

    expect(resolver.getStyle('TableCaption')).toBeDefined();
    expect(resolver.resolveStyleName('TableCaption')).toBe('TableCaption');

    expect(resolver.getStyle('Equation')).toBeDefined();
    expect(resolver.resolveStyleName('Equation')).toBe('Equation');
  });

  it('resolves inheritance hierarchy and checks ancestor relationships', () => {
    const stylesXml = `
      <w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
        <w:style w:type="paragraph" w:styleId="Normal">
          <w:name w:val="Normal"/>
        </w:style>
        <w:style w:type="paragraph" w:styleId="Heading1">
          <w:name w:val="heading 1"/>
          <w:basedOn w:val="Normal"/>
        </w:style>
        <w:style w:type="paragraph" w:styleId="SubHeading">
          <w:name w:val="Sub Heading"/>
          <w:basedOn w:val="Heading1"/>
        </w:style>
      </w:styles>
    `;

    const resolver = new StyleResolver(stylesXml);

    const chain = resolver.getInheritanceChain('SubHeading');
    expect(chain).toEqual(['SubHeading', 'Heading1', 'Normal']);

    expect(resolver.isBasedOn('SubHeading', 'Heading1')).toBe(true);
    expect(resolver.isBasedOn('SubHeading', 'Normal')).toBe(true);
    expect(resolver.isBasedOn('SubHeading', 'heading 1')).toBe(true);
    expect(resolver.isBasedOn('Heading1', 'SubHeading')).toBe(false);
  });

  it('safely handles circular inheritance without infinite loops', () => {
    const circularXml = `
      <w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
        <w:style w:type="paragraph" w:styleId="A">
          <w:name w:val="Style A"/>
          <w:basedOn w:val="B"/>
        </w:style>
        <w:style w:type="paragraph" w:styleId="B">
          <w:name w:val="Style B"/>
          <w:basedOn w:val="A"/>
        </w:style>
      </w:styles>
    `;

    const resolver = new StyleResolver(circularXml);
    const chain = resolver.getInheritanceChain('A');
    expect(chain).toEqual(['A', 'B']);
    expect(resolver.isBasedOn('A', 'B')).toBe(true);
  });

  it('handles case-insensitive lookups for styleId and styleName', () => {
    const stylesXml = `
      <w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
        <w:style w:type="paragraph" w:styleId="ArticleTitle">
          <w:name w:val="Article Title"/>
        </w:style>
      </w:styles>
    `;

    const resolver = new StyleResolver(stylesXml);
    expect(resolver.getStyle('articletitle')).toBeDefined();
    expect(resolver.resolveStyleName('articletitle')).toBe('Article Title');
    expect(resolver.resolveStyleId('Article Title')).toBe('ArticleTitle');
    expect(resolver.resolveStyleId('article title')).toBe('ArticleTitle');
  });
});

describe('RawDocVisitor with Golden Fixtures', () => {
  it('reads Template_EN.docx and extracts structured blocks, styles, and tables', async () => {
    const filePath = path.join(TEMPLATES_DIR, 'Template_EN.docx');
    const buffer = fs.readFileSync(filePath);
    const pkg = await DocxPackage.load(buffer);

    const visitor = new RawDocVisitor();
    const rawDoc = visitor.visit(pkg);

    expect(rawDoc.blocks.length).toBeGreaterThan(0);
    expect(rawDoc.styles.size).toBeGreaterThan(0);

    const paragraphs = rawDoc.blocks.filter((b): b is RawParagraph => b.type === 'paragraph');
    const tables = rawDoc.blocks.filter((b): b is RawTable => b.type === 'table');

    expect(paragraphs.length).toBeGreaterThan(0);
    expect(tables.length).toBeGreaterThan(0);

    // Verify style names are extracted on paragraphs
    const styleNames = paragraphs.map((p) => p.styleName).filter(Boolean);
    expect(styleNames).toContain('ArticleTitle');
    expect(styleNames).toContain('Authors');
    expect(styleNames).toContain('SectionAbstract');
    expect(styleNames).toContain('TableCaption');

    // Verify table structure
    const firstTable = tables[0];
    expect(firstTable.rowCount).toBeGreaterThan(0);
    expect(firstTable.colCount).toBeGreaterThan(0);
    expect(firstTable.rows[0].cells.length).toBeGreaterThan(0);
    expect(firstTable.rows[0].cells[0].paragraphs.length).toBeGreaterThan(0);
  });

  it('reads Template_VI.docx and extracts Vietnamese text accurately', async () => {
    const filePath = path.join(TEMPLATES_DIR, 'Template_VI.docx');
    const buffer = fs.readFileSync(filePath);
    const pkg = await DocxPackage.load(buffer);

    const visitor = new RawDocVisitor();
    const rawDoc = visitor.visit(pkg);

    const paragraphs = rawDoc.blocks.filter((b): b is RawParagraph => b.type === 'paragraph');
    expect(paragraphs.length).toBeGreaterThan(0);

    const styleNames = paragraphs.map((p) => p.styleName).filter(Boolean);
    expect(styleNames).toContain('ArticleTitle');
    expect(styleNames).toContain('SectionAbstract');

    // Check Vietnamese content preservation
    const allText = paragraphs.map((p) => p.rawText).join('\n');
    expect(allText).toMatch(/Tạp chí|Đại học Quốc gia|Tóm tắt|Từ khóa/i);
  });

  it('extracts OMML math tags from Bài mẫu template tiếng Việt.docx', async () => {
    const filePath = path.join(TEMPLATES_DIR, 'Bài mẫu template tiếng Việt.docx');
    const buffer = fs.readFileSync(filePath);
    const pkg = await DocxPackage.load(buffer);

    const visitor = new RawDocVisitor();
    const rawDoc = visitor.visit(pkg);

    const paragraphsWithMath = rawDoc.blocks
      .filter((b): b is RawParagraph => b.type === 'paragraph')
      .filter((p) => p.math && p.math.length > 0);

    expect(paragraphsWithMath.length).toBeGreaterThan(0);
    const firstMath = paragraphsWithMath[0].math![0];
    expect(firstMath.omml).toContain('m:oMath');
    expect(firstMath.omml).toContain('m:sSub');
  });

  it('extracts drawings and fields from Bài mẫu template tiếng Anh.docx', async () => {
    const filePath = path.join(TEMPLATES_DIR, 'Bài mẫu template tiếng Anh.docx');
    const buffer = fs.readFileSync(filePath);
    const pkg = await DocxPackage.load(buffer);

    const visitor = new RawDocVisitor();
    const rawDoc = visitor.visit(pkg);

    // Verify drawings
    const paragraphsWithDrawings = rawDoc.blocks
      .filter((b): b is RawParagraph => b.type === 'paragraph')
      .filter((p) => p.drawings && p.drawings.length > 0);

    expect(paragraphsWithDrawings.length).toBeGreaterThan(0);
    const drawing = paragraphsWithDrawings[0].drawings![0];
    expect(drawing.rId).toBeDefined();
    expect(drawing.filename).toMatch(/image\d+\.(png|jpeg|jpg)/i);

    // Verify fields
    const paragraphsWithFields = rawDoc.blocks
      .filter((b): b is RawParagraph => b.type === 'paragraph')
      .filter((p) => p.fields && p.fields.length > 0);

    expect(paragraphsWithFields.length).toBeGreaterThan(0);
    const field = paragraphsWithFields[0].fields![0];
    expect(field.instruction).toBeDefined();
  });
});

describe('RawDocVisitor Synthetic Unit Tests', () => {
  it('parses inline run formatting (bold, italic, sup, sub, code, font, size)', () => {
    const docXml = `
      <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
        <w:body>
          <w:p>
            <w:r>
              <w:rPr>
                <w:b/>
                <w:i/>
                <w:vertAlign w:val="superscript"/>
                <w:rFonts w:ascii="Consolas"/>
                <w:sz w:val="28"/>
              </w:rPr>
              <w:t>Formatted</w:t>
            </w:r>
            <w:r>
              <w:rPr>
                <w:vertAlign w:val="subscript"/>
              </w:rPr>
              <w:t>2</w:t>
            </w:r>
          </w:p>
        </w:body>
      </w:document>
    `;

    const visitor = new RawDocVisitor();
    const blocks = visitor.visitXml(docXml);

    expect(blocks.length).toBe(1);
    const p = blocks[0] as RawParagraph;
    expect(p.runs.length).toBe(2);

    expect(p.runs[0].text).toBe('Formatted');
    expect(p.runs[0].bold).toBe(true);
    expect(p.runs[0].italic).toBe(true);
    expect(p.runs[0].sup).toBe(true);
    expect(p.runs[0].code).toBe(true);
    expect(p.runs[0].font).toBe('Consolas');
    expect(p.runs[0].size).toBe(14); // 28 half-points = 14pt

    expect(p.runs[1].text).toBe('2');
    expect(p.runs[1].sub).toBe(true);
  });

  it('resolves table gridSpan and vMerge (restart and continue)', () => {
    const docXml = `
      <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
        <w:body>
          <w:tbl>
            <w:tr>
              <w:trPr><w:tblHeader/></w:trPr>
              <w:tc>
                <w:tcPr>
                  <w:gridSpan w:val="2"/>
                  <w:vMerge w:val="restart"/>
                  <w:tcW w:w="4800" w:type="dxa"/>
                </w:tcPr>
                <w:p><w:r><w:t>Spanned Header</w:t></w:r></w:p>
              </w:tc>
            </w:tr>
            <w:tr>
              <w:tc>
                <w:tcPr>
                  <w:gridSpan w:val="2"/>
                  <w:vMerge/>
                </w:tcPr>
                <w:p><w:r><w:t>Merged continuation</w:t></w:r></w:p>
              </w:tc>
            </w:tr>
          </w:tbl>
        </w:body>
      </w:document>
    `;

    const visitor = new RawDocVisitor();
    const blocks = visitor.visitXml(docXml);

    expect(blocks.length).toBe(1);
    const table = blocks[0] as RawTable;
    expect(table.rowCount).toBe(2);
    expect(table.colCount).toBe(2);

    expect(table.rows[0].isHeader).toBe(true);
    expect(table.rows[0].cells[0].gridSpan).toBe(2);
    expect(table.rows[0].cells[0].vMerge).toBe('restart');
    expect(table.rows[0].cells[0].width).toBe(4800);

    expect(table.rows[1].isHeader).toBeUndefined();
    expect(table.rows[1].cells[0].gridSpan).toBe(2);
    expect(table.rows[1].cells[0].vMerge).toBe('continue');
  });

  it('handles Track Changes acceptAll policy (accepts w:ins, ignores w:del)', () => {
    const docXml = `
      <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
        <w:body>
          <w:p>
            <w:r><w:t>The </w:t></w:r>
            <w:del><w:r><w:delText>old</w:delText></w:r></w:del>
            <w:ins><w:r><w:t>new</w:t></w:r></w:ins>
            <w:r><w:t> method</w:t></w:r>
          </w:p>
        </w:body>
      </w:document>
    `;

    const visitorAccept = new RawDocVisitor({ trackChanges: 'acceptAll' });
    const blocksAccept = visitorAccept.visitXml(docXml);
    const pAccept = blocksAccept[0] as RawParagraph;
    expect(pAccept.rawText).toBe('The new method');

    const visitorReject = new RawDocVisitor({ trackChanges: 'rejectAll' });
    const blocksReject = visitorReject.visitXml(docXml);
    const pReject = blocksReject[0] as RawParagraph;
    expect(pReject.rawText).toBe('The old method');
  });

  it('unwraps Structured Document Tags (w:sdt) transparently', () => {
    const docXml = `
      <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
        <w:body>
          <w:sdt>
            <w:sdtContent>
              <w:p><w:r><w:t>Inside content control</w:t></w:r></w:p>
            </w:sdtContent>
          </w:sdt>
        </w:body>
      </w:document>
    `;

    const visitor = new RawDocVisitor();
    const blocks = visitor.visitXml(docXml);

    expect(blocks.length).toBe(1);
    const p = blocks[0] as RawParagraph;
    expect(p.rawText).toBe('Inside content control');
  });

  it('parses complex field codes (w:fldChar and w:instrText)', () => {
    const docXml = `
      <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
        <w:body>
          <w:p>
            <w:r><w:t>See Figure </w:t></w:r>
            <w:r><w:fldChar w:fldCharType="begin"/></w:r>
            <w:r><w:instrText xml:space="preserve"> REF _Ref123456 \\h </w:instrText></w:r>
            <w:r><w:fldChar w:fldCharType="separate"/></w:r>
            <w:r><w:t>1</w:t></w:r>
            <w:r><w:fldChar w:fldCharType="end"/></w:r>
            <w:r><w:t> for details.</w:t></w:r>
          </w:p>
        </w:body>
      </w:document>
    `;

    const visitor = new RawDocVisitor();
    const blocks = visitor.visitXml(docXml);

    const p = blocks[0] as RawParagraph;
    expect(p.rawText).toBe('See Figure 1 for details.');
    expect(p.fields).toBeDefined();
    expect(p.fields!.length).toBe(1);
    expect(p.fields![0].instruction).toBe('REF _Ref123456 \\h');
    expect(p.fields![0].resultText).toBe('1');
  });
});
