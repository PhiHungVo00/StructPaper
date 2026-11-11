import { describe, it, expect } from 'vitest';
import { doiToUrl, qrToLatex, qrBlockFor } from '@/lib/qr-latex';
import { createEmptyPaper } from '@/types/paper';
import { generateFullJournalLatex } from '@/lib/latex-template';

describe('QR from DOI', () => {
  it('only real DOIs give a link', () => {
    expect(doiToUrl('?')).toBeNull();
    expect(doiToUrl('')).toBeNull();
    expect(doiToUrl('abc')).toBeNull();
    expect(doiToUrl('10.32508/vnuhcmj-ebl.v10i3.1750')).toBe('https://doi.org/10.32508/vnuhcmj-ebl.v10i3.1750');
    expect(doiToUrl('https://doi.org/10.32508/x.1')).toBe('https://doi.org/10.32508/x.1');
  });

  it('draws with TeX rules only (no image, no package)', () => {
    const tex = qrToLatex('https://doi.org/10.32508/x.1');
    expect(tex).toContain(String.raw`\vrule`);
    expect(tex).not.toContain('includegraphics');
    expect(qrBlockFor('?')).toBe(String.raw`\vspace*{1.5cm}`);
  });

  it('title block carries the code once a DOI is entered, and no fake code before', () => {
    const p = createEmptyPaper();
    p.metadata.title = 'T';
    expect(generateFullJournalLatex(p)).not.toContain(String.raw`\vrule width`);
    p.metadata.publication = { doi: '10.32508/vnuhcmj-ebl.v10i3.1750' } as never;
    expect(generateFullJournalLatex(p)).toContain(String.raw`\vrule width`);
  });
});
