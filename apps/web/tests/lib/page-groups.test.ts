import { describe, it, expect } from 'vitest';
import type { PaperSection, SectionPageLayout } from '@/types/paper';
import { derivePageGroups, groupIndexById, describeGroupLayout, groupColor } from '@/lib/editor/page-groups';
import { PageLayoutTracker } from '@/lib/latex-page-layout';

const sec = (id: string, pageLayout?: SectionPageLayout, type: PaperSection['type'] = 'paragraph'): PaperSection => ({
  id,
  type,
  content: `x ${id}`,
  ...(pageLayout ? { pageLayout } : {}),
});

describe('derivePageGroups', () => {
  it('a body without markers is one group with the document layout', () => {
    const g = derivePageGroups([sec('a'), sec('b'), sec('c')], { oneColumn: false, landscape: false });
    expect(g).toHaveLength(1);
    expect(g[0]).toMatchObject({ index: 0, startId: 'a', count: 3, columns: '2-column', orientation: 'portrait', explicit: false });
  });

  it('every marker starts a new group that lasts until the next marker', () => {
    const g = derivePageGroups(
      [sec('a'), sec('b', { orientation: 'landscape' }), sec('c'), sec('d', { columns: '1-column' }), sec('e')],
      { oneColumn: false, landscape: false }
    );
    expect(g.map((x) => [x.startId, x.count, x.columns, x.orientation, x.explicit])).toEqual([
      ['a', 1, '2-column', 'portrait', false],
      ['b', 2, '2-column', 'landscape', true],
      ['d', 2, '1-column', 'portrait', true],
    ]);
  });

  it('a field a marker leaves out follows the document default, and says so', () => {
    const [, g] = derivePageGroups([sec('a'), sec('b', { orientation: 'landscape' })], { oneColumn: true, landscape: false });
    expect(g.columns).toBe('1-column');
    expect(g.inherits).toEqual({ columns: true, orientation: false });
  });

  it('an empty marker is a new page back at the document default', () => {
    const g = derivePageGroups([sec('a'), sec('b', { orientation: 'landscape' }), sec('c', {})], { oneColumn: false, landscape: false });
    expect(g).toHaveLength(3);
    expect(g[2]).toMatchObject({ columns: '2-column', orientation: 'portrait', explicit: true });
  });

  it('a landscape document is landscape from its first section, and a marker without orientation keeps it', () => {
    const g = derivePageGroups([sec('a'), sec('b', { columns: '1-column' })], { oneColumn: false, landscape: true });
    expect(g[0].orientation).toBe('landscape');
    expect(g[1]).toMatchObject({ orientation: 'landscape', columns: '1-column' });
  });

  it('skips citation sections (they are never listed) and keeps original indexes', () => {
    const sections = [sec('cit', undefined, 'citation'), sec('a'), sec('b', { orientation: 'landscape' })];
    const g = derivePageGroups(sections, { oneColumn: false, landscape: false });
    expect(g.map((x) => [x.startId, x.startIdx, x.endIdx, x.count])).toEqual([
      ['a', 1, 1, 1],
      ['b', 2, 2, 1],
    ]);
    expect([...groupIndexById(g, sections)]).toEqual([['a', 0], ['b', 1]]);
  });

  it('an empty body has no groups', () => {
    expect(derivePageGroups([], { oneColumn: false, landscape: false })).toEqual([]);
  });

  it('labels and colours', () => {
    expect(describeGroupLayout({ columns: '1-column', orientation: 'landscape' })).toBe('Ngang · 1 cột');
    expect(describeGroupLayout({ columns: '2-column', orientation: 'portrait' })).toBe('Dọc · 2 cột');
    expect(groupColor(0)).not.toBe(groupColor(1));
    expect(groupColor(6)).toBe(groupColor(0));
  });
});

describe('the groups are exactly what the PDF does (PageLayoutTracker)', () => {
  // deterministic pseudo-random marker sequences
  let seed = 7;
  const rnd = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
  const markers: (SectionPageLayout | undefined)[] = [
    undefined, undefined, undefined, {}, { columns: '1-column' }, { columns: '2-column' },
    { orientation: 'landscape' }, { orientation: 'portrait' }, { columns: '1-column', orientation: 'landscape' },
  ];

  for (const oneColumn of [false, true]) {
    for (const landscape of [false, true]) {
      it(`layout of every section matches the tracker (default ${oneColumn ? '1' : '2'} cột, ${landscape ? 'ngang' : 'dọc'})`, () => {
        for (let run = 0; run < 60; run++) {
          const n = 1 + Math.floor(rnd() * 14);
          const sections = Array.from({ length: n }, (_, i) => sec(`s${i}`, markers[Math.floor(rnd() * markers.length)]));
          const groups = derivePageGroups(sections, { oneColumn, landscape });
          const of = groupIndexById(groups, sections);
          const tracker = new PageLayoutTracker(oneColumn, landscape);
          let switches = 0;
          sections.forEach((s, i) => {
            const tex = tracker.enter(s, i);
            if (tex) switches++;
            const g = groups[of.get(s.id)!];
            expect([tracker.oneColumn ? '1-column' : '2-column', tracker.landscape ? 'landscape' : 'portrait']).toEqual([g.columns, g.orientation]);
          });
          // the tracker switches at every marker (plus the first section of a landscape document)
          const markerCount = sections.filter((s) => s.pageLayout).length;
          const first = !sections[0].pageLayout && landscape ? 1 : 0;
          expect(switches).toBe(markerCount + first);
          // and the groups start at exactly those sections (the first group always exists)
          const starts = new Set(groups.map((g) => g.startId));
          sections.forEach((s, i) => {
            if (s.pageLayout) expect(starts.has(s.id)).toBe(true);
            else if (i > 0) expect(starts.has(s.id)).toBe(false);
          });
        }
      });
    }
  }
});
