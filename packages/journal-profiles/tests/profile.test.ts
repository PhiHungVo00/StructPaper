import { describe, it, expect } from 'vitest';
import {
  JournalProfileSchema,
  getJournalProfile,
  getAllJournalProfiles,
  VNUHCM_HS_PROFILE,
} from '../src';
import vnuhcmHsRaw from '../src/profiles/vnuhcm-hs.json';

describe('Task 1.3: packages/journal-profiles & Profile VNUHCM-HS', () => {
  describe('Zod Schema Validation', () => {
    it('validates raw vnuhcm-hs.json against JournalProfileSchema without errors', () => {
      const result = JournalProfileSchema.safeParse(vnuhcmHsRaw);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe('VNUHCM-HS');
      }
    });

    it('rejects profile with invalid hex color code', () => {
      const invalid = { ...vnuhcmHsRaw, color: 'blue' };
      const result = JournalProfileSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('rejects profile with invalid latex engine', () => {
      const invalid = {
        ...vnuhcmHsRaw,
        latex: { ...vnuhcmHsRaw.latex, engine: 'pdflatex' },
      };
      const result = JournalProfileSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('rejects profile with invalid keywords separator', () => {
      const invalid = {
        ...vnuhcmHsRaw,
        frontMatter: {
          ...vnuhcmHsRaw.frontMatter,
          keywords: { ...vnuhcmHsRaw.frontMatter.keywords, separator: '.' },
        },
      };
      const result = JournalProfileSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('rejects profile with missing required fields', () => {
      const { id: _, ...missingId } = vnuhcmHsRaw as Record<string, unknown>;
      const result = JournalProfileSchema.safeParse(missingId);
      expect(result.success).toBe(false);
    });
  });

  describe('VNUHCM-HS Profile Specifications', () => {
    it('contains accurate journal metadata and brand color', () => {
      expect(VNUHCM_HS_PROFILE.id).toBe('VNUHCM-HS');
      expect(VNUHCM_HS_PROFILE.version).toBe('1.0.0');
      expect(VNUHCM_HS_PROFILE.color).toBe('#0070BA');
      expect(VNUHCM_HS_PROFILE.names.vi).toBe(
        'Tạp chí Phát triển KH&CN - Khoa học Sức khỏe'
      );
      expect(VNUHCM_HS_PROFILE.names.en).toBe(
        'Science & Technology Development Journal - Health Sciences'
      );
      expect(VNUHCM_HS_PROFILE.names.short).toBe('VNUHCM-HS');
      expect(VNUHCM_HS_PROFILE.languages).toEqual(['vi', 'en']);
    });

    it('defines all 8 health sciences article types', () => {
      expect(VNUHCM_HS_PROFILE.articleTypes).toHaveLength(8);
      const articleTypeIds = VNUHCM_HS_PROFILE.articleTypes.map((t) => t.id);
      expect(articleTypeIds).toContain('research-article');
      expect(articleTypeIds).toContain('review-article');
      expect(articleTypeIds).toContain('case-report');
      expect(articleTypeIds).toContain('methodology');
      expect(articleTypeIds).toContain('commentary');
      expect(articleTypeIds).toContain('correction');
      expect(articleTypeIds).toContain('editorial');
      expect(articleTypeIds).toContain('letter');
    });

    it('enforces abstract word count constraints (275 - 500 words)', () => {
      const { abstract } = VNUHCM_HS_PROFILE.frontMatter;
      expect(abstract.minWords).toBe(275);
      expect(abstract.maxWords).toBe(500);
      expect(abstract.structured).toBe(true);
    });

    it('enforces keywords count constraints (3 - 5 keywords with semicolon)', () => {
      const { keywords } = VNUHCM_HS_PROFILE.frontMatter;
      expect(keywords.min).toBe(3);
      expect(keywords.max).toBe(5);
      expect(keywords.separator).toBe(';');
    });

    it('configures Vancouver citation style with brackets and range dash', () => {
      expect(VNUHCM_HS_PROFILE.citation.style).toBe('vancouver');
      expect(VNUHCM_HS_PROFILE.citation.inText).toBe('bracket');
      expect(VNUHCM_HS_PROFILE.citation.rangeDash).toBe('-');
    });

    it('configures XeLaTeX engine and structpaper-hs.cls', () => {
      expect(VNUHCM_HS_PROFILE.latex.engine).toBe('xelatex');
      expect(VNUHCM_HS_PROFILE.latex.cls).toBe('structpaper-hs.cls');
    });
  });

  describe('Word StyleMap (~35 styles)', () => {
    const expectedStyles: Record<string, string> = {
      ArticleTitle: 'title',
      Authors: 'authors',
      Affiliation: 'affiliations',
      CorrespondingAuthor: 'corresponding',
      DateReceived: 'date.received',
      DateRevised: 'date.revised',
      DateAccepted: 'date.accepted',
      DatePublished: 'date.published',
      SectionAbstract: 'heading.abstract',
      Abstract: 'abstract',
      Keywords: 'keywords',
      Heading1: 'h1',
      Heading2: 'h2',
      Heading3: 'h3',
      BodyText: 'paragraph',
      TableCaption: 'table.caption',
      TableText: 'table.cell',
      TableNote: 'table.note',
      SourceLine: 'source',
      FigureCaption: 'figure.caption',
      FigurePlaceholder: 'figure.placeholder',
      Equation: 'equation',
      Reference: 'reference',
      EndNoteBibliography: 'reference',
      SectionReferences: 'heading.references',
      SectionEthics: 'back.ethics',
      SectionAcknowledgments: 'back.acknowledgments',
      SectionFunding: 'back.funding',
      SectionContributions: 'back.contributions',
      SectionConflict: 'back.conflict',
      SectionDataAvailability: 'back.data_availability',
      Instruction: 'ignore',
      GuideHeading1: 'ignore',
      GuideHeading2: 'ignore',
      GuideText: 'ignore',
    };

    it('has exactly 35 mapped Word styles', () => {
      expect(Object.keys(expectedStyles)).toHaveLength(35);
      expect(Object.keys(VNUHCM_HS_PROFILE.styleMap)).toHaveLength(35);
    });

    it('contains all 35 expected Word style mappings', () => {
      for (const [styleName, expectedTarget] of Object.entries(expectedStyles)) {
        expect(
          VNUHCM_HS_PROFILE.styleMap[styleName],
          `Style "${styleName}" should map to "${expectedTarget}"`
        ).toBe(expectedTarget);
      }
    });

    it('correctly maps Guide* and Instruction styles to "ignore"', () => {
      expect(VNUHCM_HS_PROFILE.styleMap['Instruction']).toBe('ignore');
      expect(VNUHCM_HS_PROFILE.styleMap['GuideHeading1']).toBe('ignore');
      expect(VNUHCM_HS_PROFILE.styleMap['GuideHeading2']).toBe('ignore');
      expect(VNUHCM_HS_PROFILE.styleMap['GuideText']).toBe('ignore');
    });
  });

  describe('Helper Functions', () => {
    it('retrieves profile by exact id', () => {
      const profile = getJournalProfile('VNUHCM-HS');
      expect(profile).toBeDefined();
      expect(profile.id).toBe('VNUHCM-HS');
    });

    it('retrieves profile by case-insensitive id', () => {
      const profile = getJournalProfile('vnuhcm-hs');
      expect(profile).toBeDefined();
      expect(profile.id).toBe('VNUHCM-HS');
    });

    it('throws error when requesting an unknown journal id', () => {
      expect(() => getJournalProfile('NONEXISTENT-JOURNAL')).toThrow(
        /No journal profile found for id: "NONEXISTENT-JOURNAL"/
      );
    });

    it('returns all registered journal profiles', () => {
      const profiles = getAllJournalProfiles();
      expect(Array.isArray(profiles)).toBe(true);
      expect(profiles.length).toBeGreaterThanOrEqual(1);
      expect(profiles.some((p) => p.id === 'VNUHCM-HS')).toBe(true);
    });
  });
});
