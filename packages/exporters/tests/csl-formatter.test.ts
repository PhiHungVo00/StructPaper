import { describe, it, expect } from 'vitest';
import type { Reference } from '@structpaper/doc-model';
import {
  CslFormatter,
  compressNumberRanges,
} from '../src/csl/csl-formatter';

describe('CslFormatter', () => {
  describe('compressNumberRanges', () => {
    it('compresses single number', () => {
      expect(compressNumberRanges([1])).toBe('1');
    });

    it('formats two consecutive numbers with comma', () => {
      expect(compressNumberRanges([1, 2])).toBe('1, 2');
    });

    it('formats three or more consecutive numbers with hyphen', () => {
      expect(compressNumberRanges([1, 2, 3])).toBe('1-3');
      expect(compressNumberRanges([3, 4, 5, 6])).toBe('3-6');
    });

    it('compresses mixed sequences and sorts them properly', () => {
      expect(compressNumberRanges([8, 1, 4, 5, 3])).toBe('1, 3-5, 8');
    });

    it('handles duplicates correctly', () => {
      expect(compressNumberRanges([2, 1, 2, 3])).toBe('1-3');
    });
  });

  describe('formatCallout', () => {
    const numbering = new Map<string, number>([
      ['ref1', 1],
      ['ref2', 2],
      ['ref3', 3],
      ['ref5', 5],
    ]);

    it('formats Vancouver callouts with numeric ranges', () => {
      expect(
        CslFormatter.formatCallout(['ref1', 'ref2', 'ref3'], {
          style: 'vancouver',
          numbering,
        })
      ).toBe('[1-3]');

      expect(
        CslFormatter.formatCallout(['ref1', 'ref5'], {
          style: 'vancouver',
          numbering,
        })
      ).toBe('[1, 5]');
    });

    it('formats APA callouts with author and year', () => {
      const refs = new Map<string, Reference>([
        [
          'ref1',
          {
            id: 'ref1',
            raw: 'Nguyen, 2021',
            parse: 'ok',
            csl: {
              author: [{ family: 'Nguyen', given: 'Van A' }],
              issued: { 'date-parts': [[2021]] },
            },
          },
        ],
        [
          'ref2',
          {
            id: 'ref2',
            raw: 'Tran and Le, 2022',
            parse: 'ok',
            csl: {
              author: [
                { family: 'Tran', given: 'B C' },
                { family: 'Le', given: 'T H' },
              ],
              issued: { 'date-parts': [[2022]] },
            },
          },
        ],
        [
          'ref3',
          {
            id: 'ref3',
            raw: 'Smith et al., 2023',
            parse: 'ok',
            csl: {
              author: [
                { family: 'Smith', given: 'John' },
                { family: 'Doe', given: 'Jane' },
                { family: 'Lee', given: 'Bob' },
              ],
              issued: { 'date-parts': [[2023]] },
            },
          },
        ],
      ]);

      expect(
        CslFormatter.formatCallout(['ref1'], { style: 'apa', references: refs })
      ).toBe('(Nguyen, 2021)');

      expect(
        CslFormatter.formatCallout(['ref2'], { style: 'apa', references: refs })
      ).toBe('(Tran & Le, 2022)');

      expect(
        CslFormatter.formatCallout(['ref3'], { style: 'apa', references: refs })
      ).toBe('(Smith et al., 2023)');

      expect(
        CslFormatter.formatCallout(['ref1', 'ref2'], {
          style: 'apa',
          references: refs,
        })
      ).toBe('(Nguyen, 2021; Tran & Le, 2022)');
    });
  });

  describe('formatBibliography', () => {
    const references: Reference[] = [
      {
        id: 'r1',
        raw: 'Nguyen VA, Tran BC. Machine learning in medicine. J Sci. 2022;10(2):100-110.',
        parse: 'ok',
        doi: '10.1000/182',
        csl: {
          author: [
            { family: 'Nguyen', given: 'Van An' },
            { family: 'Tran', given: 'Binh Chanh' },
          ],
          title: 'Machine learning in medicine',
          'container-title': 'J Sci',
          volume: 10,
          issue: 2,
          page: '100-110',
          issued: { 'date-parts': [[2022]] },
          DOI: '10.1000/182',
        },
      },
      {
        id: 'r2',
        raw: 'Le TH, Pham D. Deep neural networks. IEEE Trans. 2021;5(1):15-20.',
        parse: 'ok',
        csl: {
          author: [
            { family: 'Le', given: 'Thi Hoa' },
            { family: 'Pham', given: 'Duc' },
          ],
          title: 'Deep neural networks',
          'container-title': 'IEEE Trans',
          volume: 5,
          issue: 1,
          page: '15-20',
          issued: { 'date-parts': [[2021]] },
        },
      },
      {
        id: 'r3',
        raw: 'A raw unparsed reference string without CSL data.',
        parse: 'failed',
      },
    ];

    it('formats Vancouver bibliography with numbers and correct punctuation', () => {
      const bib = CslFormatter.formatBibliography(references, 'vancouver');
      expect(bib).toHaveLength(3);

      expect(bib[0].text).toContain(
        '1. Nguyen VA, Tran BC. Machine learning in medicine. J Sci. 2022;10(2):100-110. https://doi.org/10.1000/182'
      );
      expect(bib[1].text).toContain(
        '2. Le TH, Pham D. Deep neural networks. IEEE Trans. 2021;5(1):15-20.'
      );
      expect(bib[2].text).toBe(
        '3. A raw unparsed reference string without CSL data.'
      );
    });

    it('formats APA bibliography with alphabetical sorting and proper style', () => {
      const bib = CslFormatter.formatBibliography(references, 'apa');
      expect(bib).toHaveLength(3);

      // r3 raw starts with 'A raw...', r2 starts with 'Le', r1 starts with 'Nguyen'
      // Le should come before Nguyen
      const leEntry = bib.find((e) => e.id === 'r2');
      const nguyenEntry = bib.find((e) => e.id === 'r1');

      expect(leEntry?.text).toContain(
        'Le, T. H., & Pham, D. (2021). Deep neural networks. IEEE Trans, 5(1), 15-20.'
      );
      expect(nguyenEntry?.text).toContain(
        'Nguyen, V. A., & Tran, B. C. (2022). Machine learning in medicine. J Sci, 10(2), 100-110. https://doi.org/10.1000/182'
      );
    });
  });
});
