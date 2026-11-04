import type { Id, Inline } from './inline';
import type { Block, Section } from './block';
import type { Reference } from './citation';

export interface Author {
  id: Id;
  name: string;
  affiliationIds: Id[];
  email?: string;
  isCorresponding?: boolean;
  orcid?: string;
}

export interface Affiliation {
  id: Id;
  institution: string;
  department?: string;
  city?: string;
  country?: string;
}

export interface Dates {
  received?: string;
  revised?: string;
  accepted?: string;
  published?: string;
}

export interface FrontMatter {
  title: Inline[];
  translations?: {
    en?: Inline[];
    [lang: string]: unknown;
  };
  authors: Author[];
  affiliations: Affiliation[];
  abstract: Inline[][];
  keywords: string[];
  dates: Dates;
  doi?: string;
  volume?: string;
  issue?: string;
  pages?: [number, number];
}

export interface AssetMeta {
  id: string;
  sha256: string;
  mimeType: string;
  fileName?: string;
  sizeBytes?: number;
  width?: number;
  height?: number;
  dpi?: number;
}

export interface BackMatterItem {
  id: Id;
  type: string;
  title?: Inline[];
  content: Block[];
}

export interface Manuscript {
  schemaVersion: 2;
  id: Id;
  lang: 'vi' | 'en';
  journalId: string;
  articleType: string;
  meta: FrontMatter;
  body: Section[];
  back: (BackMatterItem | unknown)[];
  references: Reference[];
  assets: Record<string, AssetMeta>;
  layoutOverrides?: Record<string, unknown>;
  provenance?: Record<Id, unknown>;
}
