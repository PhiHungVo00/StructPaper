/**
 * Journal Profile Types
 *
 * Defines the canonical configuration contract for target academic journals,
 * including Word style mappings, typography, layout, LaTeX engine templates,
 * and preflight QC requirements.
 */

export interface JournalProfileNames {
  vi: string;
  en: string;
  short: string;
}

export interface JournalArticleType {
  id: string;
  label: Record<string, string>;
  requiredSections: string[];
}

export interface JournalAbstractConfig {
  minWords: number;
  maxWords: number;
  structured: boolean;
}

export interface JournalKeywordsConfig {
  min: number;
  max: number;
  separator: ';' | ',';
}

export interface JournalFrontMatterConfig {
  abstract: JournalAbstractConfig | null;
  keywords: JournalKeywordsConfig;
  dateFormat: string;
  doiPattern: string;
}

export interface JournalCitationConfig {
  style: string;
  inText: 'bracket' | 'superscript';
  rangeDash: string;
}

export interface JournalLayoutMargins {
  top: number;
  bottom: number;
  left: number;
  right: number;
  unit?: 'mm' | 'pt' | 'in';
}

export interface JournalLayoutConfig {
  paperSize: string;
  columns: number;
  margins: JournalLayoutMargins;
  columnGap?: number;
  headerHeight?: number;
  footerHeight?: number;
  [key: string]: unknown;
}

export interface JournalTypographyFontFamilies {
  main: string;
  heading?: string;
  mono?: string;
  [key: string]: string | undefined;
}

export interface JournalTypographyFontSizes {
  title: number;
  heading1: number;
  heading2: number;
  heading3: number;
  body: number;
  caption: number;
  table: number;
  reference: number;
  [key: string]: number | undefined;
}

export interface JournalTypographyConfig {
  fontFamilies: JournalTypographyFontFamilies;
  fontSizes: JournalTypographyFontSizes;
  leading?: Record<string, number>;
  widowOrphan?: {
    widows: number;
    orphans: number;
  };
  [key: string]: unknown;
}

export interface JournalLatexFonts {
  main?: string;
  sans?: string;
  mono?: string;
  math?: string;
  [key: string]: unknown;
}

export interface JournalLatexConfig {
  cls: string;
  engine: 'xelatex' | 'lualatex';
  fonts: JournalLatexFonts;
  [key: string]: unknown;
}

export interface JournalQcConfig {
  ruleset: string[];
  weights: Record<string, number>;
}

export interface JournalProfile {
  id: string;
  version: string;
  names: JournalProfileNames;
  color: string;
  languages: ('vi' | 'en')[];
  articleTypes: JournalArticleType[];
  frontMatter: JournalFrontMatterConfig;
  citation: JournalCitationConfig;
  styleMap: Record<string, string>;
  layout: JournalLayoutConfig;
  typography: JournalTypographyConfig;
  latex: JournalLatexConfig;
  qc: JournalQcConfig;
  [key: string]: unknown;
}

export interface ArticleTypeProfile {
  id: string;
  label?: Record<string, string>;
  requiredSections?: string[];
  frontMatter?: Partial<Omit<JournalFrontMatterConfig, 'abstract'>> & {
    abstract?: JournalAbstractConfig | null;
  };
  layout?: Partial<JournalLayoutConfig>;
  typography?: Partial<JournalTypographyConfig>;
  latex?: Partial<JournalLatexConfig>;
  qc?: Partial<JournalQcConfig>;
  [key: string]: unknown;
}

export interface JournalTierProfile {
  id: string;
  names?: JournalProfileNames;
  color?: string;
  languages?: ('vi' | 'en')[];
  articleTypes?: JournalArticleType[];
  frontMatter?: Partial<JournalFrontMatterConfig>;
  citation?: Partial<JournalCitationConfig>;
  styleMap?: Record<string, string>;
  layout?: Partial<JournalLayoutConfig>;
  typography?: Partial<JournalTypographyConfig>;
  latex?: Partial<JournalLatexConfig>;
  qc?: Partial<JournalQcConfig>;
  [key: string]: unknown;
}

export interface ResolvedProfile extends JournalProfile {
  articleType?: string;
  [key: string]: unknown;
}
