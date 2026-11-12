import type { PaperSection } from '@/types/paper';

export type GroupColumns = '1-column' | '2-column';
export type GroupOrientation = 'portrait' | 'landscape';

/** What a whole document does when a section carries no page-layout marker (layout settings). */
export interface PageDefaults {
  oneColumn: boolean;
  landscape: boolean;
}

/**
 * A run of consecutive sections that share one page layout. Every group after the first starts a new
 * page (its first section carries a `pageLayout` marker), so editing the layout of a group is editing
 * that marker. These are "layout groups", not physical pages: the app cannot know where a page really
 * breaks without the compiled PDF.
 */
export interface PageGroup {
  /** 0-based position among the groups. */
  index: number;
  /** Index into `sections` of the group's first / last section (citations, which are never listed, are skipped). */
  startIdx: number;
  endIdx: number;
  /** Id of the first section: the one that holds the marker. */
  startId: string;
  /** Number of listed sections in the group. */
  count: number;
  columns: GroupColumns;
  orientation: GroupOrientation;
  /** The first section carries a marker (the group starts a new page on purpose). */
  explicit: boolean;
  /** The layout fields the marker leaves out, so they follow the document settings. */
  inherits: { columns: boolean; orientation: boolean };
}

/**
 * Splits the body into layout groups with exactly the rules the PDF uses (`PageLayoutTracker`):
 * a marker starts a new group; a field the marker leaves out falls back to the document default;
 * an empty marker means "new page, document default"; a landscape document is landscape from its
 * first section. Citation sections are not part of the body list and are skipped.
 */
export function derivePageGroups(sections: PaperSection[], defaults: PageDefaults): PageGroup[] {
  const groups: PageGroup[] = [];
  const defCols: GroupColumns = defaults.oneColumn ? '1-column' : '2-column';
  const defOrient: GroupOrientation = defaults.landscape ? 'landscape' : 'portrait';

  sections.forEach((sec, i) => {
    if (sec.type === 'citation') return;
    const marker = sec.pageLayout;
    if (marker || groups.length === 0) {
      groups.push({
        index: groups.length,
        startIdx: i,
        endIdx: i,
        startId: sec.id,
        count: 0,
        columns: marker?.columns ?? defCols,
        orientation: marker?.orientation ?? defOrient,
        explicit: !!marker,
        inherits: { columns: !marker?.columns, orientation: !marker?.orientation },
      });
    }
    const g = groups[groups.length - 1];
    g.endIdx = i;
    g.count++;
  });
  return groups;
}

/** Group number (0-based) of each listed section, by section id. */
export function groupIndexById(groups: PageGroup[], sections: PaperSection[]): Map<string, number> {
  const out = new Map<string, number>();
  let g = -1;
  sections.forEach((sec, i) => {
    if (sec.type === 'citation') return;
    if (g + 1 < groups.length && groups[g + 1].startIdx === i) g++;
    out.set(sec.id, Math.max(g, 0));
  });
  return out;
}

/** Short label such as "Ngang · 2 cột". */
export function describeGroupLayout(g: Pick<PageGroup, 'columns' | 'orientation'>): string {
  return `${g.orientation === 'landscape' ? 'Ngang' : 'Dọc'} · ${g.columns === '1-column' ? '1 cột' : '2 cột'}`;
}

/** One of a small set of accent colours per group, for the rail and the overview (cycles). */
export const GROUP_COLORS = ['#78C841', '#0EA5E9', '#F59E0B', '#8B5CF6', '#EC4899', '#14B8A6'] as const;
export const groupColor = (index: number): string => GROUP_COLORS[index % GROUP_COLORS.length];
