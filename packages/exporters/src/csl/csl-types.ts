/**
 * CSL-JSON (Citation Style Language) and citation formatting types.
 */

export type CslStyle = 'vancouver' | 'apa';

export interface CslName {
  family?: string;
  given?: string;
  literal?: string;
  'dropping-particle'?: string;
  'non-dropping-particle'?: string;
  suffix?: string;
}

export interface CslDate {
  'date-parts'?: (number | string)[][];
  raw?: string;
  literal?: string;
}

export interface CslItem {
  id?: string;
  type?: string;
  title?: string;
  'container-title'?: string;
  author?: CslName[];
  editor?: CslName[];
  issued?: CslDate;
  volume?: string | number;
  issue?: string | number;
  page?: string | number;
  publisher?: string;
  'publisher-place'?: string;
  DOI?: string;
  URL?: string;
  abstract?: string;
  [key: string]: unknown;
}

export interface FormattedBibliographyEntry {
  id: string;
  number: number;
  text: string;
  doi?: string;
  url?: string;
}
