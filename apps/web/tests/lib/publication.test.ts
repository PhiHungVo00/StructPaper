import { describe, it, expect } from 'vitest';
import { createEmptyPaper } from '@/types/paper';
import {
  publicationValue,
  resolvePublication,
  articleIdFromFileName,
  composeDoi,
  hasPublicationValue,
} from '@/lib/publication';
import { generateFullJournalLatex } from '@/lib/latex-template';
import { exportToJatsXml } from '@/lib/jats-export';
import { validateForImport } from '@/lib/validation/validators';

const base = () => {
  const p = createEmptyPaper('VNUHCM-EBL');
  p.metadata.title = 'Tiêu đề';
  p.metadata.abstract = 'Tóm tắt.';
  p.metadata.volume = '';
  p.metadata.issue = '';
  p.metadata.doi = '';
  p.metadata.firstPage = 0;
  p.metadata.lastPage = 0;
  p.metadata.dates = { received: '', revised: '', accepted: '', published: '' };
  p.sections = [{ id: 'a', type: 'paragraph', content: 'Nội dung.' }];
  return p;
};

describe('publication info: "?" until entered, blank if cleared', () => {
  it('shows "?" for everything never entered', () => {
    const r = resolvePublication(base().metadata);
    expect(Object.values(r).every((v) => v === '?')).toBe(true);
  });

  it('an entered value wins; clearing it gives blank, not "?"', () => {
    const p = base();
    p.metadata.publication = { volume: '10', issue: '' };
    expect(publicationValue(p.metadata, 'volume')).toBe('10');
    expect(publicationValue(p.metadata, 'issue')).toBe('');
    expect(publicationValue(p.metadata, 'doi')).toBe('?');
  });

  it('falls back to the legacy fields (data already stored in older documents)', () => {
    const p = base();
    p.metadata.volume = '7';
    p.metadata.firstPage = 12;
    expect(publicationValue(p.metadata, 'volume')).toBe('7');
    expect(publicationValue(p.metadata, 'firstPage')).toBe('12');
  });

  it('gets the article id from the file name and composes the DOI', () => {
    expect(articleIdFromFileName('eic_stdjelm,+Journal+editor,+3.+1750.docx')).toBe('1750');
    expect(articleIdFromFileName('bai bao.docx')).toBeUndefined();
    expect(composeDoi('10.32508/vnuhcmj-ebl', '10', '3', '1750')).toBe('https://doi.org/10.32508/vnuhcmj-ebl.v10i3.1750');
    expect(composeDoi('10.32508/vnuhcmj-ebl', '?', '3', '1750')).toBeNull();
    expect(hasPublicationValue('?')).toBe(false);
    expect(hasPublicationValue('')).toBe(false);
    expect(hasPublicationValue('10')).toBe(true);
  });
});

describe('where the data goes', () => {
  it('PDF header and side box print "?" when unknown', () => {
    const tex = generateFullJournalLatex(base());
    expect(tex).toContain('\\def\\cmVolume{?}');
    expect(tex).toContain('\\def\\cmIssue{?}');
    expect(tex).toContain('\\def\\cmfirstpage{?}');
    expect(tex).toContain('\\def\\cmDoi{?}');
    expect(tex).toContain('\\def\\cmPublished{?}');
  });

  it('prints the values entered, and nothing for cleared fields', () => {
    const p = base();
    p.metadata.publication = { volume: '10', issue: '3', firstPage: '6906', lastPage: '6916', doi: '', published: '10-08-2026' };
    const tex = generateFullJournalLatex(p);
    expect(tex).toContain('\\def\\cmVolume{10}');
    expect(tex).toContain('\\def\\cmfirstpage{6906}');
    expect(tex).toContain('\\def\\cmDoi{}');
    expect(tex).toContain('\\def\\cmPublished{10-08-2026}');
  });

  it('XML omits unknown and cleared values instead of writing "?"', () => {
    const xml = exportToJatsXml(base());
    expect(xml).not.toContain('<volume>');
    expect(xml).not.toContain('<article-id');
    expect(xml).not.toContain('>?<');
    const p = base();
    p.metadata.publication = { volume: '10', issue: '3', doi: 'https://doi.org/10.32508/x.1' };
    const xml2 = exportToJatsXml(p);
    expect(xml2).toContain('<volume>10</volume>');
    expect(xml2).toContain('<article-id pub-id-type="doi">10.32508/x.1</article-id>');
  });

  it('validator warns for "?" but not for deliberately blank fields', () => {
    const unknown = validateForImport(base()).issues.find((i) => i.code === 'field.publication.missing');
    expect(unknown?.title).toContain('DOI');
    const p = base();
    p.metadata.publication = { volume: '', issue: '', firstPage: '', lastPage: '', doi: '', published: '' };
    expect(validateForImport(p).issues.some((i) => i.code === 'field.publication.missing')).toBe(false);
  });
});
