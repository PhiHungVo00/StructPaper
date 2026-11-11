// Types added for dynamic theming and equations (kept out of paper.ts, a size-capped legacy file).

/**
 * Dynamic (non hard-coded) appearance options. Every field is optional;
 * resolveTheme() in lib/theme-config.ts merges them over the journal defaults.
 */
export interface ThemeSettings {
  titleColor?: string; // hex, e.g. '#2B74B7' (headings, captions, running footer)
  tableHeaderColor?: string; // hex, header row background
  tableZebraColor?: string; // hex, alternating body row background
  bodyFont?: string; // CSS/LaTeX family name, e.g. 'Times New Roman'
  headingFont?: string; // e.g. 'Calibri'
  bodyFontSizePt?: number; // 8-12
  lineHeight?: number; // 1.0 - 2.0
  /** Page margins in centimetres. */
  margins?: { top?: number; bottom?: number; left?: number; right?: number };
  /** Repeat the header row on every page a long table spans. Default true. */
  repeatTableHeader?: boolean;
  /** Tables with more body rows than this are typeset as breakable tables. Default 12. */
  longTableRowThreshold?: number;
  /** Append the closing English summary page (English title/abstract/affiliation). Default true. */
  englishSummaryPage?: boolean;
  /** Marker printed on top of each continuation page; "{n}" is the table number. */
  continuedTitleText?: string;
  /** Marker printed at the bottom of a table that continues on the next page. */
  continuedFootText?: string;
}

export interface PaperEquation {
  /** LaTeX source of the formula (without $ delimiters). */
  latex: string;
  /** Displayed number "(n)"; assigned in document order when numbered. */
  num?: number;
  numbered: boolean;
  /** Optional original OMML kept for lossless DOCX round-trips. */
  omml?: string;
}
