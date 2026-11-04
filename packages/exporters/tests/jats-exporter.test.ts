import { describe, it, expect } from 'vitest';
import type { Manuscript } from '@structpaper/doc-model';
import { JatsExporter } from '../src/jats/jats-exporter';

describe('JatsExporter', () => {
  const sampleManuscript: Manuscript = {
    schemaVersion: 2,
    id: 'test-manuscript-01',
    lang: 'vi',
    journalId: 'vnuhcm-stdj',
    articleType: 'research-article',
    meta: {
      title: [
        { t: 'text', v: 'Nghiên cứu về ' },
        { t: 'text', v: 'Trí tuệ nhân tạo', marks: ['b'] },
        { t: 'text', v: ' trong Y tế & Đời sống' },
      ],
      translations: {
        en: [
          { t: 'text', v: 'A study on Artificial Intelligence in Healthcare' },
        ],
      },
      doi: '10.32508/stdj.v26i1.1001',
      volume: '26',
      issue: '1',
      pages: [1, 10],
      dates: {
        received: '2026-01-10',
        accepted: '2026-02-15',
        published: '2026-03-01',
      },
      authors: [
        {
          id: 'auth1',
          name: 'Nguyễn Văn An',
          affiliationIds: ['aff1'],
          email: 'an.nv@hcmut.edu.vn',
          isCorresponding: true,
          orcid: '0000-0002-1825-0097',
        },
        {
          id: 'auth2',
          name: 'Trần Thị Bình',
          affiliationIds: ['aff1', 'aff2'],
        },
      ],
      affiliations: [
        {
          id: 'aff1',
          institution: 'Đại học Bách Khoa TP.HCM',
          department: 'Khoa Khoa học & Kỹ thuật Máy tính',
          city: 'TP. Hồ Chí Minh',
          country: 'Việt Nam',
        },
        {
          id: 'aff2',
          institution: 'Bệnh viện Chợ Rẫy',
          city: 'TP. Hồ Chí Minh',
          country: 'Việt Nam',
        },
      ],
      abstract: [
        [
          {
            t: 'text',
            v: 'Bài báo này trình bày phương pháp ứng dụng học sâu trong chẩn đoán.',
          },
        ],
      ],
      keywords: ['Trí tuệ nhân tạo', 'Học sâu', 'Y tế'],
    },
    body: [
      {
        id: 'sec1',
        level: 1,
        title: [{ t: 'text', v: 'Giới thiệu' }],
        blocks: [
          {
            type: 'paragraph',
            id: 'p1',
            content: [
              { t: 'text', v: 'Trí tuệ nhân tạo ' },
              { t: 'text', v: 'phát triển mạnh', marks: ['i'] },
              { t: 'text', v: ' trong những năm gần đây ' },
              { t: 'cite', refIds: ['ref1', 'ref2'] },
              { t: 'text', v: '. Xem chi tiết tại ' },
              {
                t: 'link',
                href: 'https://example.com/ai',
                content: [{ t: 'text', v: 'đường dẫn này' }],
              },
            ],
          },
          {
            type: 'equation',
            id: 'eq1',
            latex: 'E = mc^2',
            numbered: true,
            label: '(1)',
            status: 'ok',
          },
          {
            type: 'figure',
            id: 'fig1',
            assetId: 'asset-img-01',
            caption: [{ t: 'text', v: 'Kiến trúc mạng nơ-ron tích chập' }],
            source: [{ t: 'text', v: 'Tác giả tự vẽ' }],
            layout: { columnSpan: '1-column' },
          },
          {
            type: 'table',
            id: 'tbl1',
            caption: [{ t: 'text', v: 'Bảng đối sánh độ chính xác' }],
            headerRows: 1,
            grid: [
              [
                { content: [{ t: 'text', v: 'Mô hình' }], rowSpan: 1, colSpan: 1, header: true, align: 'l' },
                { content: [{ t: 'text', v: 'Độ chính xác (%)' }], rowSpan: 1, colSpan: 1, header: true, align: 'c' },
              ],
              [
                { content: [{ t: 'text', v: 'ResNet-50' }], rowSpan: 1, colSpan: 1, align: 'l' },
                { content: [{ t: 'text', v: '94.5' }], rowSpan: 1, colSpan: 1, align: 'c' },
              ],
            ],
            notes: [{ t: 'text', v: 'Được đánh giá trên tập test 1000 mẫu.' }],
            layout: { columnSpan: '1-column' },
          },
        ],
        children: [
          {
            id: 'sec1-1',
            level: 2,
            title: [{ t: 'text', v: 'Mục tiêu nghiên cứu' }],
            blocks: [
              {
                type: 'paragraph',
                id: 'p2',
                content: [{ t: 'text', v: 'Mục tiêu chính là tối ưu hóa mô hình.' }],
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
        type: 'ethics-statement',
        title: [{ t: 'text', v: 'Đạo đức nghiên cứu' }],
        content: [],
      },
    ],
    references: [
      {
        id: 'ref1',
        raw: 'LeCun Y, Bengio Y, Hinton G. Deep learning. Nature. 2015;521(7553):436-444.',
        parse: 'ok',
        doi: '10.1038/nature14539',
        csl: {
          author: [
            { family: 'LeCun', given: 'Yann' },
            { family: 'Bengio', given: 'Yoshua' },
            { family: 'Hinton', given: 'Geoffrey' },
          ],
          title: 'Deep learning',
          'container-title': 'Nature',
          volume: 521,
          issue: 7553,
          page: '436-444',
          issued: { 'date-parts': [[2015]] },
          DOI: '10.1038/nature14539',
        },
      },
      {
        id: 'ref2',
        raw: 'Goodfellow I, et al. Deep Learning. MIT Press, 2016.',
        parse: 'ok',
      },
    ],
    assets: {
      'asset-img-01': {
        id: 'asset-img-01',
        sha256: 'abc123sha',
        mimeType: 'image/png',
      },
    },
  };

  it('generates valid JATS XML 1.3 declaration, DOCTYPE and root article tag', () => {
    const exporter = new JatsExporter();
    const xml = exporter.export(sampleManuscript);

    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(xml).toContain('<!DOCTYPE article PUBLIC "-//NLM//DTD JATS (Z39.96) Journal Archiving and Interchange DTD v1.3');
    expect(xml).toContain('<article xmlns:xlink="http://www.w3.org/1999/xlink"');
    expect(xml).toContain('article-type="research-article"');
    expect(xml).toContain('dtd-version="1.3"');
  });

  it('renders front matter with title, translations, authors, affs, dates, abstract & keywords', () => {
    const exporter = new JatsExporter();
    const xml = exporter.export(sampleManuscript);

    // Front matter check
    expect(xml).toContain('<journal-id journal-id-type="publisher-id">vnuhcm-stdj</journal-id>');
    expect(xml).toContain('<article-id pub-id-type="doi">10.32508/stdj.v26i1.1001</article-id>');
    expect(xml).toContain('<article-title>Nghiên cứu về <bold>Trí tuệ nhân tạo</bold> trong Y tế &amp; Đời sống</article-title>');
    expect(xml).toContain('<trans-title-group xml:lang="en">');
    expect(xml).toContain('<trans-title>A study on Artificial Intelligence in Healthcare</trans-title>');

    // Authors and Affiliations
    expect(xml).toContain('<contrib contrib-type="author" corresp="yes">');
    expect(xml).toContain('<contrib-id contrib-id-type="orcid">0000-0002-1825-0097</contrib-id>');
    expect(xml).toContain('<surname>An</surname>');
    expect(xml).toContain('<given-names>Nguyễn Văn</given-names>');
    expect(xml).toContain('<email>an.nv@hcmut.edu.vn</email>');
    expect(xml).toContain('<xref ref-type="aff" rid="aff1" />');

    expect(xml).toContain('<aff id="aff1">');
    expect(xml).toContain('<institution content-type="orgname">Đại học Bách Khoa TP.HCM</institution>');
    expect(xml).toContain('<institution content-type="orgdiv">Khoa Khoa học &amp; Kỹ thuật Máy tính</institution>');

    // Dates
    expect(xml).toContain('<pub-date publication-format="electronic" date-type="pub">');
    expect(xml).toContain('<year>2026</year>');
    expect(xml).toContain('<month>3</month>');
    expect(xml).toContain('<day>1</day>');

    // Volume & pages
    expect(xml).toContain('<volume>26</volume>');
    expect(xml).toContain('<issue>1</issue>');
    expect(xml).toContain('<fpage>1</fpage>');
    expect(xml).toContain('<lpage>10</lpage>');

    // Abstract & keywords
    expect(xml).toContain('<abstract>');
    expect(xml).toContain('<p>Bài báo này trình bày phương pháp ứng dụng học sâu trong chẩn đoán.</p>');
    expect(xml).toContain('<kwd>Trí tuệ nhân tạo</kwd>');
    expect(xml).toContain('<kwd>Học sâu</kwd>');
  });

  it('renders body sections, nested sections, paragraphs, equations, figures and tables', () => {
    const exporter = new JatsExporter();
    const xml = exporter.export(sampleManuscript);

    // Section hierarchy
    expect(xml).toContain('<sec id="sec1">');
    expect(xml).toContain('<title>Giới thiệu</title>');
    expect(xml).toContain('<sec id="sec1-1">');
    expect(xml).toContain('<title>Mục tiêu nghiên cứu</title>');

    // Paragraph formatting & inlines
    expect(xml).toContain('<p id="p1">Trí tuệ nhân tạo <italic>phát triển mạnh</italic> trong những năm gần đây <xref ref-type="bibr" rid="ref1">ref1</xref>, <xref ref-type="bibr" rid="ref2">ref2</xref>. Xem chi tiết tại <ext-link ext-link-type="uri" xlink:href="https://example.com/ai">đường dẫn này</ext-link></p>');

    // Equation
    expect(xml).toContain('<disp-formula id="eq1"><label>(1)</label><tex-math><![CDATA[E = mc^2]]></tex-math></disp-formula>');

    // Figure
    expect(xml).toContain('<fig id="fig1" orientation="portrait" position="float">');
    expect(xml).toContain('<caption><title>Kiến trúc mạng nơ-ron tích chập</title></caption>');
    expect(xml).toContain('<graphic xlink:href="asset-img-01" />');
    expect(xml).toContain('<attrib>Tác giả tự vẽ</attrib>');

    // Table
    expect(xml).toContain('<table-wrap id="tbl1" orientation="portrait" position="float">');
    expect(xml).toContain('<caption><title>Bảng đối sánh độ chính xác</title></caption>');
    expect(xml).toContain('<table>');
    expect(xml).toContain('<thead>');
    expect(xml).toContain('<th align="left">Mô hình</th>');
    expect(xml).toContain('<tbody>');
    expect(xml).toContain('<td align="left">ResNet-50</td>');
    expect(xml).toContain('<table-wrap-foot>');
    expect(xml).toContain('<p>Được đánh giá trên tập test 1000 mẫu.</p>');
  });

  it('renders back matter with ethics statements and ref-list citations', () => {
    const exporter = new JatsExporter();
    const xml = exporter.export(sampleManuscript);

    // Back matter
    expect(xml).toContain('<sec sec-type="ethics-statement">');
    expect(xml).toContain('<title>Đạo đức nghiên cứu</title>');

    // Reference list with element-citation and mixed-citation fallback
    expect(xml).toContain('<ref-list>');
    expect(xml).toContain('<title>Tài liệu tham khảo</title>');
    expect(xml).toContain('<ref id="ref1">');
    expect(xml).toContain('<element-citation publication-type="journal">');
    expect(xml).toContain('<article-title>Deep learning</article-title>');
    expect(xml).toContain('<source>Nature</source>');
    expect(xml).toContain('<year>2015</year>');
    expect(xml).toContain('<volume>521</volume>');
    expect(xml).toContain('<issue>7553</issue>');
    expect(xml).toContain('<fpage>436</fpage>');
    expect(xml).toContain('<lpage>444</lpage>');
    expect(xml).toContain('<pub-id pub-id-type="doi">10.1038/nature14539</pub-id>');

    // Fallback mixed-citation
    expect(xml).toContain('<ref id="ref2">');
    expect(xml).toContain('<mixed-citation>');
    expect(xml).toContain('Goodfellow I, et al. Deep Learning. MIT Press, 2016.');
  });
});
