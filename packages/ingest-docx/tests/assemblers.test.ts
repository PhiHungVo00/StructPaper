import { describe, it, expect } from 'vitest';
import {
  TableAssembler,
  EquationAssembler,
  FigureAssembler,
  ReferenceAssembler,
  FrontMatterAssembler,
  SectionTreeAssembler,
  BackmatterAssembler,
  DocAssembler,
  computeSha256,
} from '../src/assemblers';
import type { RecognizedBlock } from '../src/assemblers/types';
import type { RawParagraph, RawTable } from '../src/types/raw-doc';
import { FrontMatterSchema, SectionSchema } from '@structpaper/doc-model';

describe('Task 3.3: Ingest DOCX Assemblers', () => {
  describe('TableAssembler', () => {
    it('converts basic 2x2 RawTable to TableBlock with headerRows', () => {
      const rawTable: RawTable = {
        type: 'table',
        rowCount: 2,
        colCount: 2,
        rows: [
          {
            isHeader: true,
            cells: [
              {
                gridSpan: 1,
                paragraphs: [
                  {
                    type: 'paragraph',
                    rawText: 'Col 1',
                    runs: [{ text: 'Col 1', bold: true }],
                    alignment: 'center',
                  },
                ],
              },
              {
                gridSpan: 1,
                paragraphs: [
                  {
                    type: 'paragraph',
                    rawText: 'Col 2',
                    runs: [{ text: 'Col 2', bold: true }],
                  },
                ],
              },
            ],
          },
          {
            cells: [
              {
                gridSpan: 1,
                paragraphs: [{ type: 'paragraph', rawText: 'A', runs: [{ text: 'A' }] }],
              },
              {
                gridSpan: 1,
                paragraphs: [{ type: 'paragraph', rawText: 'B', runs: [{ text: 'B' }] }],
              },
            ],
          },
        ],
      };

      const assembler = new TableAssembler();
      const block = assembler.assembleTable(rawTable, { id: 'tbl-1' });

      expect(block.type).toBe('table');
      expect(block.id).toBe('tbl-1');
      expect(block.headerRows).toBe(1);
      expect(block.grid.length).toBe(2);
      expect(block.grid[0].length).toBe(2);
      expect(block.grid[0][0].content).toEqual([{ t: 'text', v: 'Col 1', marks: ['b'] }]);
      expect(block.grid[0][0].align).toBe('c');
      expect(block.grid[0][0].header).toBe(true);
      expect(block.grid[1][0].content).toEqual([{ t: 'text', v: 'A' }]);
      expect(block.grid[1][1].content).toEqual([{ t: 'text', v: 'B' }]);
    });

    it('resolves gridSpan (colSpan) and vMerge (rowSpan) into Cell matrix', () => {
      // Row 0: Cell 0 (vMerge restart, colSpan 1), Cell 1 (colSpan 2)
      // Row 1: Cell 0 (vMerge continue, colSpan 1), Cell 1 (colSpan 1), Cell 2 (colSpan 1)
      const rawTable: RawTable = {
        type: 'table',
        rowCount: 2,
        colCount: 3,
        rows: [
          {
            cells: [
              {
                gridSpan: 1,
                vMerge: 'restart',
                paragraphs: [{ type: 'paragraph', rawText: 'Merged Row', runs: [{ text: 'Merged Row' }] }],
              },
              {
                gridSpan: 2,
                paragraphs: [{ type: 'paragraph', rawText: 'Merged Col', runs: [{ text: 'Merged Col' }] }],
              },
            ],
          },
          {
            cells: [
              {
                gridSpan: 1,
                vMerge: 'continue',
                paragraphs: [{ type: 'paragraph', rawText: '', runs: [] }],
              },
              {
                gridSpan: 1,
                paragraphs: [{ type: 'paragraph', rawText: 'D1', runs: [{ text: 'D1' }] }],
              },
              {
                gridSpan: 1,
                paragraphs: [{ type: 'paragraph', rawText: 'D2', runs: [{ text: 'D2' }] }],
              },
            ],
          },
        ],
      };

      const assembler = new TableAssembler();
      const block = assembler.assembleTable(rawTable);

      expect(block.grid.length).toBe(2);
      // Row 0 has 2 cells: Merged Row (rowSpan 2, colSpan 1) and Merged Col (rowSpan 1, colSpan 2)
      expect(block.grid[0][0].content[0]).toMatchObject({ v: 'Merged Row' });
      expect(block.grid[0][0].rowSpan).toBe(2);
      expect(block.grid[0][0].colSpan).toBe(1);

      expect(block.grid[0][1].content[0]).toMatchObject({ v: 'Merged Col' });
      expect(block.grid[0][1].rowSpan).toBe(1);
      expect(block.grid[0][1].colSpan).toBe(2);

      // Row 1: continuation cell is swallowed into the rowSpan of row 0
      // So row 1 has 2 remaining cells: D1 and D2
      expect(block.grid[1].length).toBe(2);
      expect(block.grid[1][0].content[0]).toMatchObject({ v: 'D1' });
      expect(block.grid[1][0].rowSpan).toBe(1);
      expect(block.grid[1][0].colSpan).toBe(1);

      expect(block.grid[1][1].content[0]).toMatchObject({ v: 'D2' });
      expect(block.grid[1][1].rowSpan).toBe(1);
      expect(block.grid[1][1].colSpan).toBe(1);
    });

    it('resolves multi-row (3 rows) vertical merge correctly', () => {
      const rawTable: RawTable = {
        type: 'table',
        rowCount: 3,
        colCount: 2,
        rows: [
          {
            cells: [
              {
                gridSpan: 1,
                vMerge: 'restart',
                paragraphs: [{ type: 'paragraph', rawText: 'Spans 3', runs: [{ text: 'Spans 3' }] }],
              },
              {
                gridSpan: 1,
                paragraphs: [{ type: 'paragraph', rawText: 'R0', runs: [{ text: 'R0' }] }],
              },
            ],
          },
          {
            cells: [
              {
                gridSpan: 1,
                vMerge: 'continue',
                paragraphs: [{ type: 'paragraph', rawText: '', runs: [] }],
              },
              {
                gridSpan: 1,
                paragraphs: [{ type: 'paragraph', rawText: 'R1', runs: [{ text: 'R1' }] }],
              },
            ],
          },
          {
            cells: [
              {
                gridSpan: 1,
                vMerge: 'continue',
                paragraphs: [{ type: 'paragraph', rawText: '', runs: [] }],
              },
              {
                gridSpan: 1,
                paragraphs: [{ type: 'paragraph', rawText: 'R2', runs: [{ text: 'R2' }] }],
              },
            ],
          },
        ],
      };

      const assembler = new TableAssembler();
      const block = assembler.assembleTable(rawTable);

      expect(block.grid.length).toBe(3);
      expect(block.grid[0][0].rowSpan).toBe(3);
      expect(block.grid[0].length).toBe(2);
      expect(block.grid[1].length).toBe(1);
      expect(block.grid[1][0].content[0]).toMatchObject({ v: 'R1' });
      expect(block.grid[2].length).toBe(1);
      expect(block.grid[2][0].content[0]).toMatchObject({ v: 'R2' });
    });

    it('attaches nearby table.caption, table.note, and source', () => {
      const rawTable: RawTable = {
        type: 'table',
        rowCount: 1,
        colCount: 1,
        rows: [
          {
            cells: [
              {
                gridSpan: 1,
                paragraphs: [{ type: 'paragraph', rawText: 'Data', runs: [{ text: 'Data' }] }],
              },
            ],
          },
        ],
      };

      const captionBlock: RecognizedBlock = {
        id: 'cap-1',
        raw: {
          type: 'paragraph',
          rawText: 'Bảng 1: Kết quả khảo sát',
          runs: [{ text: 'Bảng 1: Kết quả khảo sát' }],
        },
        claim: { role: 'table.caption', confidence: 1.0, evidence: 'style:TableCaption' },
      };

      const noteBlock: RecognizedBlock = {
        id: 'note-1',
        raw: {
          type: 'paragraph',
          rawText: 'Ghi chú: p < 0.05',
          runs: [{ text: 'Ghi chú: p < 0.05' }],
        },
        claim: { role: 'table.note', confidence: 1.0, evidence: 'style:TableNote' },
      };

      const sourceBlock: RecognizedBlock = {
        id: 'src-1',
        raw: {
          type: 'paragraph',
          rawText: 'Nguồn: Nhóm tác giả tổng hợp',
          runs: [{ text: 'Nguồn: Nhóm tác giả tổng hợp' }],
        },
        claim: { role: 'source', confidence: 1.0, evidence: 'style:Source' },
      };

      const assembler = new TableAssembler();
      const block = assembler.assembleTable(rawTable, {
        captionBlock,
        noteBlock,
        sourceBlock,
      });

      expect(block.caption).toEqual([{ t: 'text', v: 'Bảng 1: Kết quả khảo sát' }]);
      expect(block.notes).toEqual([{ t: 'text', v: 'Ghi chú: p < 0.05' }]);
      expect(block.source).toEqual([{ t: 'text', v: 'Nguồn: Nhóm tác giả tổng hợp' }]);
    });
  });

  describe('EquationAssembler', () => {
    const assembler = new EquationAssembler();

    it('converts fraction OMML to LaTeX \\frac{num}{den}', () => {
      const omml = `
        <m:oMath xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math">
          <m:f>
            <m:num><m:r><m:t>a + b</m:t></m:r></m:num>
            <m:den><m:r><m:t>c</m:t></m:r></m:den>
          </m:f>
        </m:oMath>
      `;
      const latex = assembler.ommlToLatex(omml);
      expect(latex).toBe('\\frac{a + b}{c}');
    });

    it('converts radical OMML to LaTeX \\sqrt{x} and \\sqrt[n]{x}', () => {
      const ommlSquare = `
        <m:oMath xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math">
          <m:rad>
            <m:radPr><m:degHide m:val="1"/></m:radPr>
            <m:deg/>
            <m:e><m:r><m:t>x</m:t></m:r></m:e>
          </m:rad>
        </m:oMath>
      `;
      expect(assembler.ommlToLatex(ommlSquare)).toBe('\\sqrt{x}');

      const ommlCubic = `
        <m:oMath xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math">
          <m:rad>
            <m:deg><m:r><m:t>3</m:t></m:r></m:deg>
            <m:e><m:r><m:t>y + 1</m:t></m:r></m:e>
          </m:rad>
        </m:oMath>
      `;
      expect(assembler.ommlToLatex(ommlCubic)).toBe('\\sqrt[3]{y + 1}');
    });

    it('converts sub and superscripts m:sSup, m:sSub, m:sSubSup', () => {
      const ommlSup = `
        <m:oMath xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math">
          <m:sSup>
            <m:e><m:r><m:t>x</m:t></m:r></m:e>
            <m:sup><m:r><m:t>2</m:t></m:r></m:sup>
          </m:sSup>
        </m:oMath>
      `;
      expect(assembler.ommlToLatex(ommlSup)).toBe('{x}^{2}');

      const ommlSub = `
        <m:oMath xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math">
          <m:sSub>
            <m:e><m:r><m:t>x</m:t></m:r></m:e>
            <m:sub><m:r><m:t>i</m:t></m:r></m:sub>
          </m:sSub>
        </m:oMath>
      `;
      expect(assembler.ommlToLatex(ommlSub)).toBe('{x}_{i}');

      const ommlSubSup = `
        <m:oMath xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math">
          <m:sSubSup>
            <m:e><m:r><m:t>x</m:t></m:r></m:e>
            <m:sub><m:r><m:t>i</m:t></m:r></m:sub>
            <m:sup><m:r><m:t>2</m:t></m:r></m:sup>
          </m:sSubSup>
        </m:oMath>
      `;
      expect(assembler.ommlToLatex(ommlSubSup)).toBe('{x}_{i}^{2}');
    });

    it('converts delimiters m:d to \\left( ... \\right)', () => {
      const omml = `
        <m:oMath xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math">
          <m:d>
            <m:dPr>
              <m:begChr m:val="("/>
              <m:endChr m:val=")"/>
            </m:dPr>
            <m:e><m:r><m:t>x + y</m:t></m:r></m:e>
          </m:d>
        </m:oMath>
      `;
      expect(assembler.ommlToLatex(omml)).toBe('\\left( x + y \\right)');
    });

    it('converts n-ary operator m:nary to sum / integral', () => {
      const ommlSum = `
        <m:oMath xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math">
          <m:nary>
            <m:naryPr><m:chr m:val="∑"/></m:naryPr>
            <m:sub><m:r><m:t>i=1</m:t></m:r></m:sub>
            <m:sup><m:r><m:t>n</m:t></m:r></m:sup>
            <m:e><m:r><m:t>x</m:t></m:r></m:e>
          </m:nary>
        </m:oMath>
      `;
      expect(assembler.ommlToLatex(ommlSum)).toBe('\\sum_{i=1}^{n}{x}');

      const ommlInt = `
        <m:oMath xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math">
          <m:nary>
            <m:naryPr><m:chr m:val="∫"/></m:naryPr>
            <m:sub><m:r><m:t>0</m:t></m:r></m:sub>
            <m:sup><m:r><m:t>1</m:t></m:r></m:sup>
            <m:e><m:r><m:t>f(x)dx</m:t></m:r></m:e>
          </m:nary>
        </m:oMath>
      `;
      expect(assembler.ommlToLatex(ommlInt)).toBe('\\int_{0}^{1}{f(x)dx}');
    });

    it('converts nested OMML constructs (fraction with radical in numerator)', () => {
      const ommlNested = `
        <m:oMath xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math">
          <m:f>
            <m:num>
              <m:rad>
                <m:radPr><m:degHide m:val="1"/></m:radPr>
                <m:deg/>
                <m:e><m:r><m:t>x^2 + 1</m:t></m:r></m:e>
              </m:rad>
            </m:num>
            <m:den><m:r><m:t>2</m:t></m:r></m:den>
          </m:f>
        </m:oMath>
      `;
      expect(assembler.ommlToLatex(ommlNested)).toBe('\\frac{\\sqrt{x^2 + 1}}{2}');
    });

    it('assembles EquationBlock with numbered detection from label (1)', () => {
      const p: RawParagraph = {
        type: 'paragraph',
        rawText: 'E = mc^2    (1)',
        runs: [{ text: 'E = mc^2    (1)' }],
        math: [
          {
            omml: `
              <m:oMath xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math">
                <m:r><m:t>E = mc^2</m:t></m:r>
              </m:oMath>
            `,
            isBlock: true,
          },
        ],
      };

      const block = assembler.assembleEquation(p, 'eq-1');
      expect(block.type).toBe('equation');
      expect(block.id).toBe('eq-1');
      expect(block.latex).toBe('E = mc^2');
      expect(block.numbered).toBe(true);
      expect(block.label).toBe('1');
      expect(block.status).toBe('ok');
    });

    it('falls back gracefully to plain text on malformed OMML', () => {
      const p: RawParagraph = {
        type: 'paragraph',
        rawText: 'x + 1 = 2',
        runs: [{ text: 'x + 1 = 2' }],
        math: [{ omml: '<<<invalid xml>>', isBlock: true }],
      };
      const block = assembler.assembleEquation(p, 'eq-fallback');
      expect(block.latex).toBe('x + 1 = 2');
      expect(block.status).toBe('ok');
    });
  });

  describe('FigureAssembler', () => {
    it('hashes image bytes to SHA-256 and registers AssetMeta and FigureBlock', () => {
      const imageBytes = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13]); // PNG header
      const mediaMap = new Map<string, Uint8Array>([['media/image1.png', imageBytes]]);
      const relsMap = new Map<string, string>([['rId5', 'media/image1.png']]);

      const assembler = new FigureAssembler({ media: mediaMap, rels: relsMap });

      const p: RawParagraph = {
        type: 'paragraph',
        rawText: '',
        runs: [],
        drawings: [
          {
            rId: 'rId5',
            filename: 'image1.png',
            description: 'Architecture diagram',
            width: 600,
            height: 400,
          },
        ],
      };

      const captionBlock: RecognizedBlock = {
        id: 'cap-fig-1',
        raw: {
          type: 'paragraph',
          rawText: 'Hình 1: Kiến trúc tổng quan hệ thống',
          runs: [{ text: 'Hình 1: Kiến trúc tổng quan hệ thống' }],
        },
        claim: { role: 'figure.caption', confidence: 1.0, evidence: 'style:FigureCaption' },
      };

      const block = assembler.assembleFigure(p, {
        id: 'fig-1',
        captionBlock,
      });

      expect(block.type).toBe('figure');
      expect(block.id).toBe('fig-1');
      expect(block.caption).toEqual([{ t: 'text', v: 'Hình 1: Kiến trúc tổng quan hệ thống' }]);

      // Verify SHA-256 hash was generated
      expect(block.assetId).toMatch(/^[0-9a-f]{64}$/);

      const assets = assembler.getAssets();
      expect(assets[block.assetId]).toBeDefined();
      expect(assets[block.assetId]).toEqual({
        id: block.assetId,
        sha256: block.assetId,
        mimeType: 'image/png',
        fileName: 'image1.png',
        sizeBytes: imageBytes.length,
        width: 600,
        height: 400,
        dpi: 300,
      });
    });

    it('verifies computeSha256 against standard RFC test vectors', () => {
      // Empty string
      const empty = new Uint8Array([]);
      expect(computeSha256(empty)).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');

      // "abc"
      const abc = new TextEncoder().encode('abc');
      expect(computeSha256(abc)).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
    });

    it('handles drawing without binary gracefully with placeholder assetId', () => {
      const assembler = new FigureAssembler();
      const p: RawParagraph = {
        type: 'paragraph',
        rawText: '',
        runs: [],
        drawings: [{ rId: 'missing-id' }],
      };
      const block = assembler.assembleFigure(p, { id: 'fig-missing' });
      expect(block.assetId).toContain('missing-fig-missing');
    });
  });

  describe('ReferenceAssembler', () => {
    const assembler = new ReferenceAssembler();

    it('assembles clean references stripping [n] prefixes and extracting DOI and URLs', () => {
      const blocks: RecognizedBlock[] = [
        {
          id: 'ref-raw-1',
          raw: {
            type: 'paragraph',
            rawText: '[1] LeCun, Y., Bengio, Y., & Hinton, G. (2015). Deep learning. Nature, 521(7553), 436-444. doi: 10.1038/nature14539.',
            runs: [{ text: '[1] LeCun, Y., Bengio, Y., & Hinton, G. (2015). Deep learning. Nature, 521(7553), 436-444. doi: 10.1038/nature14539.' }],
          },
          claim: { role: 'reference', confidence: 1.0, evidence: 'style:Reference' },
        },
        {
          id: 'ref-raw-2',
          raw: {
            type: 'paragraph',
            rawText: '2. World Health Organization. (2020). COVID-19 report. https://www.who.int/emergencies/diseases/novel-coronavirus-2019',
            runs: [{ text: '2. World Health Organization. (2020). COVID-19 report. https://www.who.int/emergencies/diseases/novel-coronavirus-2019' }],
          },
          claim: { role: 'reference', confidence: 1.0, evidence: 'style:Reference' },
        },
      ];

      const refs = assembler.assembleReferences(blocks);

      expect(refs.length).toBe(2);
      expect(refs[0].id).toBe('ref-1');
      expect(refs[0].raw).not.toMatch(/^\[1\]/);
      expect(refs[0].raw.startsWith('LeCun, Y.')).toBe(true);
      expect(refs[0].doi).toBe('10.1038/nature14539');
      expect(refs[0].parse).toBe('ok');

      expect(refs[1].id).toBe('ref-2');
      expect(refs[1].raw.startsWith('World Health Organization')).toBe(true);
      expect(refs[1].url).toBe('https://www.who.int/emergencies/diseases/novel-coronavirus-2019');
      expect(refs[1].parse).toBe('ok');
    });
  });

  describe('FrontMatterAssembler', () => {
    it('assembles complete frontmatter with authors, affiliations, abstract, keywords, and dates', () => {
      const blocks: RecognizedBlock[] = [
        {
          id: 'b-title',
          raw: {
            type: 'paragraph',
            rawText: 'Nghiên cứu ứng dụng học sâu trong phân loại tài liệu khoa học',
            runs: [{ text: 'Nghiên cứu ứng dụng học sâu trong phân loại tài liệu khoa học', bold: true }],
          },
          claim: { role: 'title', confidence: 1.0, evidence: 'style:Title' },
        },
        {
          id: 'b-title-en',
          raw: {
            type: 'paragraph',
            rawText: 'Deep learning application in scientific document classification',
            runs: [{ text: 'Deep learning application in scientific document classification' }],
          },
          claim: { role: 'titleEn', confidence: 1.0, evidence: 'style:TitleEn' },
        },
        {
          id: 'b-authors',
          raw: {
            type: 'paragraph',
            rawText: 'Nguyễn Văn A1,*, Trần Thị B2',
            runs: [
              { text: 'Nguyễn Văn A' },
              { text: '1,*', sup: true },
              { text: ', Trần Thị B' },
              { text: '2', sup: true },
            ],
          },
          claim: { role: 'authors', confidence: 1.0, evidence: 'style:Authors' },
        },
        {
          id: 'b-affil-1',
          raw: {
            type: 'paragraph',
            rawText: '1 Trường Đại học Bách Khoa, ĐHQG-HCM, TP. Hồ Chí Minh, Việt Nam',
            runs: [{ text: '1 Trường Đại học Bách Khoa, ĐHQG-HCM, TP. Hồ Chí Minh, Việt Nam' }],
          },
          claim: { role: 'affiliations', confidence: 1.0, evidence: 'style:Affiliation' },
        },
        {
          id: 'b-affil-2',
          raw: {
            type: 'paragraph',
            rawText: '2 Viện Công nghệ Sinh học, Viện Hàn lâm KH&CN Việt Nam',
            runs: [{ text: '2 Viện Công nghệ Sinh học, Viện Hàn lâm KH&CN Việt Nam' }],
          },
          claim: { role: 'affiliations', confidence: 1.0, evidence: 'style:Affiliation' },
        },
        {
          id: 'b-corr',
          raw: {
            type: 'paragraph',
            rawText: '* Tác giả liên hệ: nva@hcmut.edu.vn',
            runs: [{ text: '* Tác giả liên hệ: nva@hcmut.edu.vn' }],
          },
          claim: { role: 'corresponding', confidence: 1.0, evidence: 'style:Corresponding' },
        },
        {
          id: 'b-abstract',
          raw: {
            type: 'paragraph',
            rawText: 'Tóm tắt — Bài báo này trình bày phương pháp phân loại bài báo khoa học dựa trên mô hình transformer.',
            runs: [{ text: 'Tóm tắt — Bài báo này trình bày phương pháp phân loại bài báo khoa học dựa trên mô hình transformer.' }],
          },
          claim: { role: 'abstract', confidence: 1.0, evidence: 'style:Abstract' },
        },
        {
          id: 'b-keywords',
          raw: {
            type: 'paragraph',
            rawText: 'Từ khóa: Học sâu; Phân loại văn bản; Xử lý ngôn ngữ tự nhiên',
            runs: [{ text: 'Từ khóa: Học sâu; Phân loại văn bản; Xử lý ngôn ngữ tự nhiên' }],
          },
          claim: { role: 'keywords', confidence: 1.0, evidence: 'style:Keywords' },
        },
        {
          id: 'b-date-rec',
          raw: {
            type: 'paragraph',
            rawText: 'Ngày nhận bài: 15/01/2026',
            runs: [{ text: 'Ngày nhận bài: 15/01/2026' }],
          },
          claim: { role: 'date.received', confidence: 1.0, evidence: 'style:DateReceived' },
        },
        {
          id: 'b-date-acc',
          raw: {
            type: 'paragraph',
            rawText: 'Ngày chấp nhận: 20/03/2026',
            runs: [{ text: 'Ngày chấp nhận: 20/03/2026' }],
          },
          claim: { role: 'date.accepted', confidence: 1.0, evidence: 'style:DateAccepted' },
        },
      ];

      const assembler = new FrontMatterAssembler();
      const meta = assembler.assemble(blocks);

      expect(meta.title).toEqual([{ t: 'text', v: 'Nghiên cứu ứng dụng học sâu trong phân loại tài liệu khoa học', marks: ['b'] }]);
      expect(meta.translations?.en).toEqual([{ t: 'text', v: 'Deep learning application in scientific document classification' }]);

      // Authors and affiliations linkage
      expect(meta.authors.length).toBe(2);
      expect(meta.authors[0].name).toBe('Nguyễn Văn A');
      expect(meta.authors[0].isCorresponding).toBe(true);
      expect(meta.authors[0].email).toBe('nva@hcmut.edu.vn');
      expect(meta.authors[0].affiliationIds).toEqual(['aff-1']);

      expect(meta.authors[1].name).toBe('Trần Thị B');
      expect(meta.authors[1].affiliationIds).toEqual(['aff-2']);

      expect(meta.affiliations.length).toBe(2);
      expect(meta.affiliations[0].institution).toContain('Đại học Bách Khoa');

      // Abstract and keywords
      expect(meta.abstract.length).toBe(1);
      expect(meta.abstract[0][0]).toMatchObject({
        v: 'Bài báo này trình bày phương pháp phân loại bài báo khoa học dựa trên mô hình transformer.',
      });
      expect(meta.keywords).toEqual(['Học sâu', 'Phân loại văn bản', 'Xử lý ngôn ngữ tự nhiên']);

      // Dates
      expect(meta.dates.received).toBe('15/01/2026');
      expect(meta.dates.accepted).toBe('20/03/2026');

      // Schema validation
      expect(() => FrontMatterSchema.parse(meta)).not.toThrow();
    });
  });

  describe('SectionTreeAssembler', () => {
    it('groups headings and blocks into a hierarchical Section[] tree', () => {
      const blocks: RecognizedBlock[] = [
        {
          id: 'h1-1',
          raw: { type: 'paragraph', rawText: '1. GIỚI THIỆU', runs: [{ text: '1. GIỚI THIỆU' }] },
          claim: { role: 'h1', confidence: 1.0, evidence: 'style:Heading1' },
        },
        {
          id: 'p-1',
          raw: { type: 'paragraph', rawText: 'Đoạn văn mở đầu giới thiệu bối cảnh nghiên cứu.', runs: [{ text: 'Đoạn văn mở đầu giới thiệu bối cảnh nghiên cứu.' }] },
          claim: { role: 'paragraph', confidence: 0.9, evidence: 'style:BodyText' },
        },
        {
          id: 'h2-1',
          raw: { type: 'paragraph', rawText: '1.1. Mục tiêu nghiên cứu', runs: [{ text: '1.1. Mục tiêu nghiên cứu' }] },
          claim: { role: 'h2', confidence: 1.0, evidence: 'style:Heading2' },
        },
        {
          id: 'p-2',
          raw: { type: 'paragraph', rawText: 'Mục tiêu chính là phân loại bài báo tự động.', runs: [{ text: 'Mục tiêu chính là phân loại bài báo tự động.' }] },
          claim: { role: 'paragraph', confidence: 0.9, evidence: 'style:BodyText' },
        },
        {
          id: 'h3-1',
          raw: { type: 'paragraph', rawText: '1.1.1. Phạm vi khảo sát', runs: [{ text: '1.1.1. Phạm vi khảo sát' }] },
          claim: { role: 'h3', confidence: 1.0, evidence: 'style:Heading3' },
        },
        {
          id: 'p-3',
          raw: { type: 'paragraph', rawText: 'Khảo sát 10.000 bài báo tiếng Việt.', runs: [{ text: 'Khảo sát 10.000 bài báo tiếng Việt.' }] },
          claim: { role: 'paragraph', confidence: 0.9, evidence: 'style:BodyText' },
        },
        {
          id: 'h1-2',
          raw: { type: 'paragraph', rawText: '2. PHƯƠNG PHÁP', runs: [{ text: '2. PHƯƠNG PHÁP' }] },
          claim: { role: 'h1', confidence: 1.0, evidence: 'style:Heading1' },
        },
        {
          id: 'p-4',
          raw: { type: 'paragraph', rawText: 'Trình bày mô hình và pipeline xử lý.', runs: [{ text: 'Trình bày mô hình và pipeline xử lý.' }] },
          claim: { role: 'paragraph', confidence: 0.9, evidence: 'style:BodyText' },
        },
      ];

      const assembler = new SectionTreeAssembler();
      const sections = assembler.assemble(blocks);

      expect(sections.length).toBe(2); // Two top-level H1 sections

      // Section 1: GIỚI THIỆU
      const s1 = sections[0];
      expect(s1.level).toBe(1);
      expect(s1.title[0]).toMatchObject({ v: '1. GIỚI THIỆU' });
      expect(s1.blocks.length).toBe(1); // p-1
      expect(s1.children.length).toBe(1); // h2-1

      // Section 1.1: Mục tiêu
      const s1_1 = s1.children[0];
      expect(s1_1.level).toBe(2);
      expect(s1_1.title[0]).toMatchObject({ v: '1.1. Mục tiêu nghiên cứu' });
      expect(s1_1.blocks.length).toBe(1); // p-2
      expect(s1_1.children.length).toBe(1); // h3-1

      // Section 1.1.1: Phạm vi
      const s1_1_1 = s1_1.children[0];
      expect(s1_1_1.level).toBe(3);
      expect(s1_1_1.title[0]).toMatchObject({ v: '1.1.1. Phạm vi khảo sát' });
      expect(s1_1_1.blocks.length).toBe(1); // p-3
      expect(s1_1_1.children.length).toBe(0);

      // Section 2: PHƯƠNG PHÁP
      const s2 = sections[1];
      expect(s2.level).toBe(1);
      expect(s2.title[0]).toMatchObject({ v: '2. PHƯƠNG PHÁP' });
      expect(s2.blocks.length).toBe(1); // p-4

      // Schema check
      for (const sec of sections) {
        expect(() => SectionSchema.parse(sec)).not.toThrow();
      }
    });

    it('handles blocks before first heading and skipped heading levels (H1 directly to H3)', () => {
      const blocks: RecognizedBlock[] = [
        {
          id: 'pre-1',
          raw: { type: 'paragraph', rawText: 'Đoạn mở đầu không có tiêu đề.', runs: [{ text: 'Đoạn mở đầu không có tiêu đề.' }] },
          claim: { role: 'paragraph', confidence: 0.9, evidence: 'default:body' },
        },
        {
          id: 'h1-1',
          raw: { type: 'paragraph', rawText: 'Tiêu đề 1', runs: [{ text: 'Tiêu đề 1' }] },
          claim: { role: 'h1', confidence: 1.0, evidence: 'style:H1' },
        },
        {
          id: 'h3-skip',
          raw: { type: 'paragraph', rawText: 'Tiêu đề con cấp 3 bỏ qua cấp 2', runs: [{ text: 'Tiêu đề con cấp 3 bỏ qua cấp 2' }] },
          claim: { role: 'h3', confidence: 1.0, evidence: 'style:H3' },
        },
        {
          id: 'p-sub',
          raw: { type: 'paragraph', rawText: 'Nội dung cấp 3.', runs: [{ text: 'Nội dung cấp 3.' }] },
          claim: { role: 'paragraph', confidence: 0.9, evidence: 'default:body' },
        },
      ];

      const assembler = new SectionTreeAssembler();
      const sections = assembler.assemble(blocks);

      expect(sections.length).toBe(2);
      expect(sections[0].title).toEqual([]);
      expect(sections[0].blocks.length).toBe(1);

      expect(sections[1].level).toBe(1);
      expect(sections[1].children.length).toBe(1);
      expect(sections[1].children[0].level).toBe(3);
      expect(sections[1].children[0].blocks.length).toBe(1);
    });
  });

  describe('BackmatterAssembler', () => {
    it('groups back matter statements into BackMatterItem[]', () => {
      const blocks: RecognizedBlock[] = [
        {
          id: 'b-ack',
          raw: {
            type: 'paragraph',
            rawText: 'Nghiên cứu được tài trợ bởi Đại học Quốc gia TP.HCM theo mã số ĐT-2026.',
            runs: [{ text: 'Nghiên cứu được tài trợ bởi Đại học Quốc gia TP.HCM theo mã số ĐT-2026.' }],
          },
          claim: { role: 'back.funding', confidence: 1.0, evidence: 'style:Funding' },
        },
        {
          id: 'b-conf',
          raw: {
            type: 'paragraph',
            rawText: 'Các tác giả cam kết không có xung đột lợi ích.',
            runs: [{ text: 'Các tác giả cam kết không có xung đột lợi ích.' }],
          },
          claim: { role: 'back.conflict', confidence: 1.0, evidence: 'style:Conflict' },
        },
      ];

      const assembler = new BackmatterAssembler();
      const items = assembler.assemble(blocks);

      expect(items.length).toBe(2);
      expect(items[0].type).toBe('funding');
      expect(items[0].content.length).toBe(1);
      expect(items[1].type).toBe('conflict');
      expect(items[1].content.length).toBe(1);
    });
  });

  describe('DocAssembler (End-to-End Orchestrator)', () => {
    it('assembles a full document matching AssembledDoc structure', () => {
      const blocks: RecognizedBlock[] = [
        {
          id: 'b1',
          raw: { type: 'paragraph', rawText: 'Tiêu đề bài báo', runs: [{ text: 'Tiêu đề bài báo' }] },
          claim: { role: 'title', confidence: 1.0, evidence: 'style:Title' },
        },
        {
          id: 'b2',
          raw: { type: 'paragraph', rawText: 'Tác giả A1', runs: [{ text: 'Tác giả A' }, { text: '1', sup: true }] },
          claim: { role: 'authors', confidence: 1.0, evidence: 'style:Authors' },
        },
        {
          id: 'b3',
          raw: { type: 'paragraph', rawText: '1 Đại học Quốc Gia', runs: [{ text: '1 Đại học Quốc Gia' }] },
          claim: { role: 'affiliations', confidence: 1.0, evidence: 'style:Affiliation' },
        },
        {
          id: 'b4',
          raw: { type: 'paragraph', rawText: '1. GIỚI THIỆU', runs: [{ text: '1. GIỚI THIỆU' }] },
          claim: { role: 'h1', confidence: 1.0, evidence: 'style:Heading1' },
        },
        {
          id: 'b5',
          raw: { type: 'paragraph', rawText: 'Nội dung giới thiệu.', runs: [{ text: 'Nội dung giới thiệu.' }] },
          claim: { role: 'paragraph', confidence: 0.9, evidence: 'style:Body' },
        },
        {
          id: 'b6',
          raw: { type: 'paragraph', rawText: '[1] Tài liệu tham khảo 1', runs: [{ text: '[1] Tài liệu tham khảo 1' }] },
          claim: { role: 'reference', confidence: 1.0, evidence: 'style:Reference' },
        },
      ];

      const assembler = new DocAssembler();
      const doc = assembler.assemble(blocks);

      expect(doc.meta.title).toEqual([{ t: 'text', v: 'Tiêu đề bài báo' }]);
      expect(doc.meta.authors.length).toBe(1);
      expect(doc.body.length).toBe(1);
      expect(doc.body[0].title).toEqual([{ t: 'text', v: '1. GIỚI THIỆU' }]);
      expect(doc.references.length).toBe(1);
      expect(doc.references[0].raw).toBe('Tài liệu tham khảo 1');
    });
  });
});
