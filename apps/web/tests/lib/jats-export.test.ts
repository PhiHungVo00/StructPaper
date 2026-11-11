import { describe, it, expect } from 'vitest';
import { XMLValidator, XMLParser } from 'fast-xml-parser';
import { createEmptyPaper, type CompletePaper } from '@/types/paper';
import { exportToJatsXml, journalInitial, figureHref, inlineToJats } from '@/lib/jats-export';

function samplePaper(): CompletePaper {
  const p = createEmptyPaper('VNUHCM-HS');
  p.metadata.title = 'Các yếu tố & tác động <SDGs>';
  p.metadata.doi = 'https://doi.org/10.32508/stdj.v23i1.1767';
  p.metadata.volume = '23';
  p.metadata.issue = '1';
  p.metadata.authors = [
    { id: 'a1', name: 'Phạm Mỹ Duyên', affiliationIds: [1], email: 'd@x.vn', isCorresponding: true },
  ];
  p.metadata.affiliations = [{ id: 1, name: 'Trường ĐH Kinh tế - Luật' }];
  p.metadata.abstract = 'Tóm tắt có công thức $x^2$ và trích dẫn [1].';
  p.metadata.keywords = ['SDGs', 'FGLS'];
  p.metadata.dates = { received: '08-09-2025', revised: '20-03-2026', accepted: '21-05-2026', published: '' };
  p.sections = [
    { id: '1', type: 'h1', title: 'Giới thiệu', content: '' },
    { id: '2', type: 'paragraph', content: 'Nghiên cứu [1,2] cho thấy $a<b$ & hơn nữa.' },
    { id: '3', type: 'h2', title: 'Mô hình', content: '' },
    { id: '4', type: 'equation', content: '', equation: { latex: '\\frac{a}{b} < c', numbered: true, num: 1 } },
    { id: '5', type: 'h1', title: 'Kết quả', content: '' },
    {
      id: '6',
      type: 'table',
      content: '',
      table: { id: 't', num: 1, caption: 'Bảng đo lường', source: 'Nguồn: tác giả', headers: ['A', 'B'], rows: [['1', '2']] },
    },
    { id: '7', type: 'figure', content: '', figure: { id: 'f', num: 1, caption: 'Hình mô tả', src: 'data:image/png;base64,AAA', source: 'Nguồn: tác giả' } },
  ];
  p.references = [
    { id: 1, raw: 'Tác giả A. Tiêu đề. 2020.', isCited: true, citationCount: 1 },
    { id: 2, raw: 'Tác giả B & C. 2021.', isCited: true, citationCount: 1 },
  ];
  return p;
}

describe('JATS XML export', () => {
  it('produces well-formed XML even with special characters', () => {
    const xml = exportToJatsXml(samplePaper(), { articleId: '1767' });
    expect(XMLValidator.validate(xml)).toBe(true);
  });

  it('nests sections properly (h2 inside h1) and keeps content after sub-headings', () => {
    const xml = exportToJatsXml(samplePaper());
    const doc = new XMLParser({ ignoreAttributes: false, isArray: (n) => n === 'sec' }).parse(xml);
    const secs = doc.article.body.sec;
    expect(secs).toHaveLength(2);
    expect(secs[0].title).toBe('Giới thiệu');
    expect(secs[0].sec[0].title).toBe('Mô hình');
    expect(secs[0].sec[0]['disp-formula']['tex-math']).toContain('\\frac{a}{b} < c');
  });

  it('emits formulas, bibliography xrefs and escapes markup', () => {
    const xml = exportToJatsXml(samplePaper());
    expect(xml).toContain('<inline-formula><tex-math><![CDATA[a<b]]></tex-math></inline-formula>');
    expect(xml).toContain('<xref ref-type="bibr" rid="R1">[1,2]</xref>');
    expect(xml).toContain('&amp; hơn nữa');
    expect(xml).toContain('<label>(1)</label>');
    expect(xml).toContain('<ref id="R2">');
  });

  it('uses the platform static URL pattern for figures when the article id is known', () => {
    const p = samplePaper();
    expect(figureHref(p, 1, 'data:image/png;base64,AAA', { articleId: '1767' })).toBe(
      'https://static.vnuhcmjournal.com.vn/articles/hs/v-23/i-1/a-1767/img-1.png'
    );
    expect(exportToJatsXml(p, { articleId: '1767' })).toContain('a-1767/img-1.png');
    expect(exportToJatsXml(p)).toContain('images/img-1.png');
  });

  it('never emits duplicate xml ids (found by validating against the real JATS 1.2 DTD)', () => {
    const p = samplePaper();
    p.metadata.affiliations = [
      { id: 1, name: 'Khoa Thương mại và Du lịch' },
      { id: 1, name: 'Faculty of Commerce and Tourism' },
    ];
    const xml = exportToJatsXml(p);
    const ids = [...xml.matchAll(/ id="([^"]+)"/g)].map((m) => m[1]);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('derives the journal initial', () => {
    expect(journalInitial('VNUHCM-HS')).toBe('hs');
    expect(journalInitial('VNUHCMJ-ET')).toBe('et');
    expect(journalInitial('')).toBe('std');
  });

  it('does not let a formula break out of CDATA', () => {
    expect(inlineToJats('$a]]>b$')).not.toContain(']]>b');
  });
});
