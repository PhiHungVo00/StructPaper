import type { PaperSection, SectionPageLayout } from '@/types/paper';
import { derivePageGroups, type GroupColumns, type GroupOrientation, type PageDefaults } from './page-groups';

interface Layout {
  o: GroupOrientation;
  c: GroupColumns;
}

/**
 * Drops the markers that turning a page wrote (`turned`) once they no longer change anything: a marker whose
 * layout equals the layout in force before it. Markers the editor placed by hand are never touched, so turning a
 * page and turning it back leaves the sections exactly as they were.
 */
export function normalizeTurnedMarkers(sections: PaperSection[], defaults: PageDefaults): PaperSection[] {
  let eff: Layout = { o: defaults.landscape ? 'landscape' : 'portrait', c: defaults.oneColumn ? '1-column' : '2-column' };
  const def = { ...eff };
  let changed = false;
  const out = sections.map((s) => {
    const m = s.pageLayout;
    if (!m || s.type === 'citation') return s;
    const r: Layout = { o: m.orientation ?? def.o, c: m.columns ?? def.c };
    if (m.turned && r.o === eff.o && r.c === eff.c) {
      changed = true;
      const { pageLayout: _drop, ...rest } = s;
      return rest as PaperSection;
    }
    eff = r;
    return s;
  });
  return changed ? out : sections;
}

/**
 * Turns the page that starts at `anchorId`. That section opens a new page with the chosen orientation (keeping the
 * columns its group had); the section that opens the following page (`nextId`) gets a marker that brings the old
 * layout back, so exactly one page changes. A marker the next page already has is left alone. Markers written here
 * are tagged `turned` so that turning the page back removes them again.
 */
export function rotatePageAt(
  sections: PaperSection[],
  anchorId: string,
  nextId: string | null,
  orientation: GroupOrientation,
  defaults: PageDefaults
): PaperSection[] {
  const ai = sections.findIndex((s) => s.id === anchorId);
  if (ai < 0) return sections;
  const g = derivePageGroups(sections, defaults).find((x) => x.startIdx <= ai && ai <= x.endIdx);
  if (!g || g.orientation === orientation) return sections;

  const columns: SectionPageLayout = g.inherits.columns ? {} : { columns: g.columns };
  const own = sections[ai].pageLayout;
  const ni = nextId && nextId !== anchorId ? sections.findIndex((s) => s.id === nextId) : -1;
  const turned = sections.map((s, i) => {
    if (i === ai) return { ...s, pageLayout: { ...(own || columns), orientation, ...(own && !own.turned ? {} : { turned: true }) } };
    if (i === ni && ni > ai && !s.pageLayout && g.endIdx >= ni) {
      return { ...s, pageLayout: { ...(g.inherits.orientation ? {} : { orientation: g.orientation }), ...columns, turned: true } };
    }
    return s;
  });
  return normalizeTurnedMarkers(turned, defaults);
}
