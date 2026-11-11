import { describe, it, expect } from 'vitest';
import { migrateV1toV2, adaptV2toV1 } from '../src/adapters';
import type { V1CompletePaper } from '../src/adapters/types';

const paper = (): V1CompletePaper =>
  ({
    id: 'p1',
    metadata: { title: 'T', authors: [], affiliations: [], keywords: [], dates: {} } as any,
    references: [],
    layoutSettings: { paperSize: 'a4', columnLayout: '2-column', orientation: 'landscape' } as any,
    sections: [
      { id: 's_h', type: 'h1', title: 'Giới thiệu', content: '' },
      { id: 's_p', type: 'paragraph', content: 'Đoạn một', pageLayout: { columns: '1-column', orientation: 'landscape' }, pageBreakAfter: true },
      { id: 's_e', type: 'equation', content: '', equation: { latex: 'a=b', numbered: true, num: 4, columnSpan: '2-column' } },
      { id: 's_q', type: 'paragraph', content: 'Đoạn hai', pageLayout: {} },
    ],
  }) as any;

describe('per-section options survive the v1 -> v2 -> v1 round trip (IndexedDB / server storage)', () => {
  it('keeps page-layout markers, page break, formula number and width, and the document orientation', () => {
    const back = adaptV2toV1(migrateV1toV2(paper()));
    const by = (id: string) => back.sections.find((s) => s.id === id)!;
    expect(by('s_p').pageLayout).toEqual({ columns: '1-column', orientation: 'landscape' });
    expect(by('s_p').pageBreakAfter).toBe(true);
    expect(by('s_q').pageLayout).toEqual({});
    expect(by('s_e').equation).toMatchObject({ num: 4, columnSpan: '2-column' });
    expect((back.layoutSettings as any).orientation).toBe('landscape');
  });

  it('adds nothing for a paper that uses none of them', () => {
    const p = paper();
    p.sections = p.sections.map(({ pageLayout, pageBreakAfter, ...s }) => ({ ...s, equation: s.equation && { latex: s.equation.latex, numbered: true } })) as any;
    expect(migrateV1toV2(p).layoutOverrides?.sectionExtras).toBeUndefined();
  });
});
