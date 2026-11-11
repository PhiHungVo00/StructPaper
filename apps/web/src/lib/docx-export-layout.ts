import { PageOrientation, SectionType, type ISectionOptions, type Paragraph, type Table } from 'docx';
import type { SectionPageLayout } from '@/types/paper';
import { GEOM } from './docx-export-front';

export type Block = Paragraph | Table;

/**
 * Consecutive blocks that share one Word section: the same columns, orientation and start type.
 *  - fullWidth: a figure / table / equation set across both columns (one-column section inside a
 *    two-column layout);
 *  - oneColumn: the page layout itself is one column (document default or a page-layout marker);
 *  - landscape: the section is on landscape pages;
 *  - newPage: the section starts on a new page (page-layout marker, rotated table, landscape start).
 */
export interface Segment {
  fullWidth: boolean;
  oneColumn: boolean;
  landscape: boolean;
  newPage: boolean;
  children: Block[];
}

export interface PageWidths {
  /** Width between the margins (a landscape page is as wide as the portrait page is tall). */
  textW: number;
  /** One column of a two-column layout. */
  colW: number;
}

export function pageWidths(landscape: boolean): PageWidths {
  const textW = (landscape ? GEOM.pageH : GEOM.pageW) - GEOM.left - GEOM.right;
  return { textW, colW: Math.floor((textW - GEOM.gap) / 2) };
}

/** Page size and margins of a section. Landscape gives the portrait size plus the orientation: Word/docx swap it. */
export function pageFor(landscape: boolean) {
  return {
    size: { width: GEOM.pageW, height: GEOM.pageH, ...(landscape ? { orientation: PageOrientation.LANDSCAPE } : {}) },
    margin: { top: GEOM.top, bottom: GEOM.bottom, left: GEOM.left, right: GEOM.right, header: 500, footer: 450 },
  };
}

/**
 * Turns the body blocks into Word segments while tracking the page layout:
 * document defaults, `pageLayout` markers (new page, persists until the next marker) and rotated tables.
 */
export class SegmentBuilder {
  readonly segments: Segment[] = [];
  private oneColumn: boolean;
  private landscape: boolean;
  private newPage = false;

  /** A landscape document starts its body (not the portrait title page) on a landscape page. */
  constructor(private readonly defaultOneColumn: boolean, private readonly defaultLandscape: boolean) {
    this.oneColumn = defaultOneColumn;
    this.landscape = defaultLandscape;
    this.newPage = defaultLandscape;
  }

  /** A section carrying `pageLayout` starts a new page with those columns / orientation; gaps fall back to the defaults. */
  enter(marker?: SectionPageLayout) {
    if (!marker) return;
    this.oneColumn = marker.columns ? marker.columns === '1-column' : this.defaultOneColumn;
    this.landscape = marker.orientation ? marker.orientation === 'landscape' : this.defaultLandscape;
    this.newPage = true;
  }

  get isLandscape(): boolean {
    return this.landscape;
  }

  /** Is `want` (a full-width request) real, i.e. are we in a two-column layout? */
  spans(want: boolean): boolean {
    return want && !this.oneColumn;
  }

  /** Width available to a block that is (or is not) set across the page. */
  width(full: boolean): number {
    const w = pageWidths(this.landscape);
    return full || this.oneColumn ? w.textW : w.colW;
  }

  push(full: boolean, ...blocks: Block[]) {
    const wide = this.spans(full);
    const last = this.segments[this.segments.length - 1];
    const sameColumns = last && last.fullWidth === wide && last.oneColumn === this.oneColumn;
    if (!last || this.newPage || !sameColumns || last.landscape !== this.landscape) {
      this.segments.push({ fullWidth: wide, oneColumn: this.oneColumn, landscape: this.landscape, newPage: this.newPage, children: [] });
      this.newPage = false;
    }
    this.segments[this.segments.length - 1].children.push(...blocks);
  }

  /**
   * A rotated table gets its own landscape page(s), one column, then the previous layout resumes on a new page.
   * `make` builds the table blocks for the given width. Callers skip this when `isLandscape` (nothing to rotate).
   */
  rotated(make: (width: number) => Block[]) {
    const before = { oneColumn: this.oneColumn, landscape: this.landscape };
    this.oneColumn = true;
    this.landscape = true;
    this.newPage = true;
    this.push(false, ...make(pageWidths(true).textW));
    this.oneColumn = before.oneColumn;
    this.landscape = before.landscape;
    this.newPage = true;
  }

  done(): Segment[] {
    return this.segments.filter((s) => s.children.length > 0);
  }
}

/** Word sections for the body segments (headers/footers are inherited from the front-matter section). */
export function segmentSections(segments: Segment[]): ISectionOptions[] {
  return segments.map((seg) => ({
    properties: {
      type: seg.newPage ? SectionType.NEXT_PAGE : SectionType.CONTINUOUS,
      page: pageFor(seg.landscape),
      column: seg.fullWidth || seg.oneColumn ? { count: 1 } : { count: 2, space: GEOM.gap, equalWidth: true },
    },
    children: seg.children,
  }));
}
