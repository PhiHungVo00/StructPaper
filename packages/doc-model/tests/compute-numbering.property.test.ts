import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import type {
  Manuscript,
  Block,
  FigureBlock,
  TableBlock,
  EquationBlock,
  ParagraphBlock,
  Reference,
  Section,
} from '../src/types';
import { computeNumbering } from '../src/numbering';

function createManuscriptFromBlocks(blocks: Block[], references: Reference[] = []): Manuscript {
  return {
    schemaVersion: 2,
    id: 'prop_doc',
    lang: 'vi',
    journalId: 'vnuhcm-hs',
    articleType: 'Research Article',
    meta: {
      title: [{ t: 'text', v: 'Property Test' }],
      authors: [],
      affiliations: [],
      abstract: [[]],
      keywords: [],
      dates: {},
    },
    body: [
      {
        id: 'sec_root',
        level: 1,
        title: [{ t: 'text', v: 'Section' }],
        blocks,
        children: [],
      },
    ],
    back: [],
    references,
    assets: {},
  };
}

describe('computeNumbering Property-based Tests (fast-check)', () => {
  // Arbitrary generator for blocks
  const figureArb = fc.record({
    type: fc.constant('figure' as const),
    id: fc.uuid().map((id) => `fig_${id}`),
    assetId: fc.string({ minLength: 1 }),
    caption: fc.constant([{ t: 'text' as const, v: 'Fig caption' }]),
    layout: fc.constant({}),
  }) as fc.Arbitrary<FigureBlock>;

  const tableArb = fc.record({
    type: fc.constant('table' as const),
    id: fc.uuid().map((id) => `tbl_${id}`),
    caption: fc.constant([{ t: 'text' as const, v: 'Tbl caption' }]),
    grid: fc.constant([]),
    headerRows: fc.constant(1),
    layout: fc.constant({}),
  }) as fc.Arbitrary<TableBlock>;

  const equationArb = fc.record({
    type: fc.constant('equation' as const),
    id: fc.uuid().map((id) => `eq_${id}`),
    latex: fc.constant('E=mc^2'),
    numbered: fc.boolean(),
    status: fc.constant('ok' as const),
  }) as fc.Arbitrary<EquationBlock>;

  const refIdArb = fc.constantFrom('ref_a', 'ref_b', 'ref_c', 'ref_d', 'ref_e', 'ref_f');

  const paragraphWithCitesArb = fc.record({
    type: fc.constant('paragraph' as const),
    id: fc.uuid().map((id) => `p_${id}`),
    content: fc.array(
      fc.oneof(
        fc.string().map((v) => ({ t: 'text' as const, v })),
        fc.array(refIdArb, { minLength: 1, maxLength: 3 }).map((refIds) => ({
          t: 'cite' as const,
          refIds,
        }))
      ),
      { minLength: 1, maxLength: 5 }
    ),
  }) as fc.Arbitrary<ParagraphBlock>;

  const blockArb = fc.oneof(figureArb, tableArb, equationArb, paragraphWithCitesArb);

  it('maintains strictly continuous sequential numbers (1..N) without gaps or duplicates', () => {
    fc.assert(
      fc.property(fc.array(blockArb, { minLength: 0, maxLength: 30 }), (blocks) => {
        const doc = createManuscriptFromBlocks(blocks);
        const res = computeNumbering(doc);

        // Figures sequentiality
        const figValues = Array.from(res.figures.values());
        expect(figValues).toEqual(
          Array.from({ length: res.figures.size }, (_, i) => i + 1)
        );

        // Tables sequentiality
        const tblValues = Array.from(res.tables.values());
        expect(tblValues).toEqual(
          Array.from({ length: res.tables.size }, (_, i) => i + 1)
        );

        // Equations sequentiality (only numbered ones)
        const eqValues = Array.from(res.equations.values());
        expect(eqValues).toEqual(
          Array.from({ length: res.equations.size }, (_, i) => i + 1)
        );

        // Citations sequentiality
        const citeValues = Array.from(res.citations.values());
        expect(citeValues).toEqual(
          Array.from({ length: res.citations.size }, (_, i) => i + 1)
        );
      }),
      { numRuns: 100 }
    );
  });

  it('ensures citationOrder always contains unique IDs with no duplicates', () => {
    fc.assert(
      fc.property(
        fc.array(paragraphWithCitesArb, { minLength: 0, maxLength: 20 }),
        fc.array(refIdArb, { minLength: 0, maxLength: 6 }),
        (paragraphs, knownRefIds) => {
          const refs: Reference[] = Array.from(new Set(knownRefIds)).map((id) => ({
            id,
            raw: `Reference for ${id}`,
            parse: 'ok',
          }));
          const doc = createManuscriptFromBlocks(paragraphs, refs);
          const res = computeNumbering(doc);

          // citationOrder must be unique
          const citeOrderSet = new Set(res.citationOrder);
          expect(citeOrderSet.size).toBe(res.citationOrder.length);

          // danglingCites must be unique
          const danglingSet = new Set(res.danglingCites);
          expect(danglingSet.size).toBe(res.danglingCites.length);

          // uncitedRefs must be unique
          const uncitedSet = new Set(res.uncitedRefs);
          expect(uncitedSet.size).toBe(res.uncitedRefs.length);

          // Uncited references and cited references must be disjoint
          for (const uncited of res.uncitedRefs) {
            expect(citeOrderSet.has(uncited)).toBe(false);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('guarantees consistent renumbering upon random block insertion', () => {
    fc.assert(
      fc.property(
        fc.array(figureArb, { minLength: 1, maxLength: 10 }),
        fc.nat(),
        (figures, rawInsertIndex) => {
          const docBefore = createManuscriptFromBlocks(figures);
          const resBefore = computeNumbering(docBefore);

          // Insert a new figure at bounded index
          const insertIdx = rawInsertIndex % (figures.length + 1);
          const newFig: FigureBlock = {
            type: 'figure',
            id: `fig_inserted_${Date.now()}_${Math.random()}`,
            assetId: 'new_asset',
            caption: [{ t: 'text', v: 'New' }],
            layout: {},
          };

          const newFigures = [...figures];
          newFigures.splice(insertIdx, 0, newFig);

          const docAfter = createManuscriptFromBlocks(newFigures);
          const resAfter = computeNumbering(docAfter);

          // Total size increases by exactly 1
          expect(resAfter.figures.size).toBe(resBefore.figures.size + 1);

          // Check all figures up to insertIdx retain their index
          for (let i = 0; i < insertIdx; i++) {
            expect(resAfter.figures.get(figures[i].id)).toBe(resBefore.figures.get(figures[i].id));
          }

          // Inserted figure gets (insertIdx + 1)
          expect(resAfter.figures.get(newFig.id)).toBe(insertIdx + 1);

          // All figures after insertIdx are incremented by 1
          for (let i = insertIdx; i < figures.length; i++) {
            expect(resAfter.figures.get(figures[i].id)).toBe(
              resBefore.figures.get(figures[i].id)! + 1
            );
          }
        }
      ),
      { numRuns: 50 }
    );
  });

  it('guarantees consistent renumbering upon random block deletion', () => {
    fc.assert(
      fc.property(
        fc.array(figureArb, { minLength: 2, maxLength: 10 }),
        fc.nat(),
        (figures, rawDeleteIndex) => {
          const docBefore = createManuscriptFromBlocks(figures);
          const resBefore = computeNumbering(docBefore);

          const deleteIdx = rawDeleteIndex % figures.length;
          const deletedFigId = figures[deleteIdx].id;

          const remainingFigures = figures.filter((_, i) => i !== deleteIdx);
          const docAfter = createManuscriptFromBlocks(remainingFigures);
          const resAfter = computeNumbering(docAfter);

          // Size decreases by 1
          expect(resAfter.figures.size).toBe(resBefore.figures.size - 1);
          expect(resAfter.figures.has(deletedFigId)).toBe(false);

          // Renumbered figures are still strictly 1..N-1
          const values = Array.from(resAfter.figures.values());
          expect(values).toEqual(
            Array.from({ length: resAfter.figures.size }, (_, i) => i + 1)
          );
        }
      ),
      { numRuns: 50 }
    );
  });
});
