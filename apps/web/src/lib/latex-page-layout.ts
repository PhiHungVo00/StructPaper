import type { PaperSection } from '@/types/paper';

/**
 * Page layout switches inside the body. A section that carries `pageLayout` starts a new page with the
 * given columns / orientation; the layout stays until the next marker (see SectionPageLayout).
 * The whole-document orientation is the default for every marker that leaves it out, and takes effect at
 * the first body section (the first page keeps its portrait title block with the side column).
 *
 * Switching reuses what the long-table code already does: `\onecolumn` / `\twocolumn` flush the page,
 * and pdflscape's `landscape` environment rotates the pages it spans.
 */
export class PageLayoutTracker {
  oneColumn: boolean;
  landscape = false;

  constructor(private readonly defaultOneColumn: boolean, private readonly defaultLandscape: boolean) {
    this.oneColumn = defaultOneColumn;
  }

  /** TeX to emit before `sec` (empty when it neither carries a marker nor is the first section of a landscape document). */
  enter(sec: PaperSection, index: number): string {
    const marker = sec.pageLayout;
    if (!marker && !(index === 0 && this.defaultLandscape)) return '';
    return this.switchTo({
      oneColumn: marker?.columns ? marker.columns === '1-column' : this.defaultOneColumn,
      landscape: marker?.orientation ? marker.orientation === 'landscape' : this.defaultLandscape,
    });
  }

  /** Back to the portrait, default-columns layout (before the closing English page). */
  close(): string {
    if (!this.landscape && this.oneColumn === this.defaultOneColumn) return '';
    let tex = this.landscape ? '\\end{landscape}\n' : '';
    if (this.oneColumn !== this.defaultOneColumn) tex += `\\clearpage\n${this.defaultOneColumn ? '\\onecolumn' : '\\twocolumn'}\n`;
    this.landscape = false;
    this.oneColumn = this.defaultOneColumn;
    return `\n${tex}`;
  }

  private switchTo(target: { oneColumn: boolean; landscape: boolean }): string {
    let tex = '\n';
    if (this.landscape) tex += '\\end{landscape}\n';
    tex += '\\clearpage\n';
    if (target.oneColumn !== this.oneColumn) tex += target.oneColumn ? '\\onecolumn\n' : '\\twocolumn\n';
    if (target.landscape) tex += '\\begin{landscape}\n';
    this.oneColumn = target.oneColumn;
    this.landscape = target.landscape;
    return tex;
  }
}
