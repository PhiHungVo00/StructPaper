import type {
  Id,
  Inline,
  Block,
  Section,
  Manuscript,
  CitationStyle,
  ComputedNumbering,
} from '../types';
import {
  vancouverCitationStyle,
  sortReferencesApa,
} from './styles';

export * from './styles';

function walkInlines(
  inlines: Inline[],
  fn: (inline: Inline) => void,
  blockVisitor: (blocks: Block[]) => void
): void {
  for (const inline of inlines) {
    fn(inline);
    if (inline.t === 'link' && inline.content) {
      walkInlines(inline.content, fn, blockVisitor);
    } else if (inline.t === 'footnote' && inline.blocks) {
      blockVisitor(inline.blocks);
    }
  }
}

function walkBlocks(
  blocks: Block[],
  blockFn: (block: Block) => void,
  inlineFn: (inline: Inline, inFloat: boolean) => void
): void {
  const visitBlocks = (innerBlocks: Block[]) => walkBlocks(innerBlocks, blockFn, inlineFn);

  for (const block of blocks) {
    blockFn(block);
    switch (block.type) {
      case 'paragraph':
        if (block.content) walkInlines(block.content, (il) => inlineFn(il, false), visitBlocks);
        break;
      case 'list':
        if (block.items) {
          for (const item of block.items) {
            walkBlocks(item, blockFn, inlineFn);
          }
        }
        break;
      case 'quote':
      case 'box':
        if (block.content) {
          walkBlocks(block.content, blockFn, inlineFn);
        }
        break;
      case 'equation':
        break;
      case 'figure':
        if (block.caption) walkInlines(block.caption, (il) => inlineFn(il, true), visitBlocks);
        if (block.source) walkInlines(block.source, (il) => inlineFn(il, true), visitBlocks);
        if (block.panels) {
          for (const panel of block.panels) {
            if (panel.caption) walkInlines(panel.caption, (il) => inlineFn(il, true), visitBlocks);
          }
        }
        break;
      case 'table':
        if (block.caption) walkInlines(block.caption, (il) => inlineFn(il, true), visitBlocks);
        if (block.source) walkInlines(block.source, (il) => inlineFn(il, true), visitBlocks);
        if (block.notes) walkInlines(block.notes, (il) => inlineFn(il, true), visitBlocks);
        if (block.grid) {
          for (const row of block.grid) {
            for (const cell of row) {
              if (cell.content) walkInlines(cell.content, (il) => inlineFn(il, true), visitBlocks);
            }
          }
        }
        break;
      case 'pageBreak':
        break;
    }
  }
}

function walkSections(
  sections: Section[],
  sectionFn: (section: Section) => void,
  blockFn: (block: Block) => void,
  inlineFn: (inline: Inline, inFloat: boolean) => void
): void {
  const visitBlocks = (blocks: Block[]) => walkBlocks(blocks, blockFn, inlineFn);

  for (const section of sections) {
    sectionFn(section);
    if (section.title) {
      walkInlines(section.title, (il) => inlineFn(il, false), visitBlocks);
    }
    if (section.blocks) {
      walkBlocks(section.blocks, blockFn, inlineFn);
    }
    if (section.children) {
      walkSections(section.children, sectionFn, blockFn, inlineFn);
    }
  }
}

/**
 * Computes derived numbering for Figures, Tables, Equations, Citations,
 * and validates cross-references and first-mention preflight rules.
 */
export function computeNumbering(
  doc: Manuscript,
  citationStyle?: CitationStyle
): ComputedNumbering {
  const style = citationStyle || vancouverCitationStyle;
  const sections = doc.body || [];
  const references = doc.references || [];
  const knownRefIds = new Set(references.map((r) => r.id));

  const figures = new Map<Id, number>();
  const tables = new Map<Id, number>();
  const equations = new Map<Id, number>();
  const existingTargetIds = new Set<Id>();
  const panelParentMap = new Map<Id, Id>();

  // Pass 1: Collect targets and compute 1-based sequential numbers for floats
  walkSections(
    sections,
    (sec) => {
      existingTargetIds.add(sec.id);
    },
    (block) => {
      switch (block.type) {
        case 'figure':
          existingTargetIds.add(block.id);
          if (!figures.has(block.id)) {
            figures.set(block.id, figures.size + 1);
          }
          if (block.panels) {
            for (const panel of block.panels) {
              existingTargetIds.add(panel.id);
              panelParentMap.set(panel.id, block.id);
            }
          }
          break;
        case 'table':
          existingTargetIds.add(block.id);
          if (!tables.has(block.id)) {
            tables.set(block.id, tables.size + 1);
          }
          break;
        case 'equation':
          existingTargetIds.add(block.id);
          if (block.numbered && !equations.has(block.id)) {
            equations.set(block.id, equations.size + 1);
          }
          break;
      }
    },
    () => {}
  );

  // Pass 2: Citations, xref validation, and firstMentionBeforeFloat check
  const citationOrder: Id[] = [];
  const danglingCites: Id[] = [];
  const xrefBroken: Id[] = [];
  const multiCites: Id[][] = [];
  const seenMentions = new Set<Id>();
  const firstMentionBeforeFloat = new Map<Id, boolean>();

  // Initialize firstMentionBeforeFloat for all figures and tables
  for (const figId of figures.keys()) {
    firstMentionBeforeFloat.set(figId, false);
  }
  for (const tblId of tables.keys()) {
    firstMentionBeforeFloat.set(tblId, false);
  }

  walkSections(
    sections,
    () => {},
    (block) => {
      if (block.type === 'figure') {
        const wasMentioned = seenMentions.has(block.id);
        firstMentionBeforeFloat.set(block.id, wasMentioned);
        seenMentions.add(block.id);
      } else if (block.type === 'table') {
        const wasMentioned = seenMentions.has(block.id);
        firstMentionBeforeFloat.set(block.id, wasMentioned);
        seenMentions.add(block.id);
      }
    },
    (inline, inFloat) => {
      // Inlines inside floats do not count towards "mention before float"
      if (!inFloat) {
        if (inline.t === 'xref') {
          if (figures.has(inline.target)) {
            seenMentions.add(inline.target);
          } else if (panelParentMap.has(inline.target)) {
            seenMentions.add(panelParentMap.get(inline.target)!);
          } else if (tables.has(inline.target)) {
            seenMentions.add(inline.target);
          }
        } else if (inline.t === 'text') {
          for (const [figId, num] of figures.entries()) {
            const figRegex = new RegExp(`\\b(fig(?:ure)?\\.?|hình)\\s*${num}\\b`, 'i');
            if (figRegex.test(inline.v) || inline.v.includes(figId)) {
              seenMentions.add(figId);
            }
          }
          for (const [tblId, num] of tables.entries()) {
            const tblRegex = new RegExp(`\\b(table|tab\\.?|bảng)\\s*${num}\\b`, 'i');
            if (tblRegex.test(inline.v) || inline.v.includes(tblId)) {
              seenMentions.add(tblId);
            }
          }
        }
      }

      // Process citations and xref broken across ALL inlines (even inside floats)
      if (inline.t === 'xref') {
        if (!existingTargetIds.has(inline.target)) {
          if (!xrefBroken.includes(inline.target)) {
            xrefBroken.push(inline.target);
          }
        }
      } else if (inline.t === 'cite') {
        for (const refId of inline.refIds) {
          if (!citationOrder.includes(refId)) {
            citationOrder.push(refId);
          }
          if (!knownRefIds.has(refId)) {
            if (!danglingCites.includes(refId)) {
              danglingCites.push(refId);
            }
          }
        }
        if (inline.refIds.length > 1) {
          multiCites.push(inline.refIds);
        }
      }
    }
  );

  // Citations mapping and formatting
  const citations = new Map<Id, number>();
  citationOrder.forEach((refId, idx) => {
    citations.set(refId, idx + 1);
  });

  const citationLabels = new Map<Id, string>();
  for (const refId of citationOrder) {
    const num = citations.get(refId)!;
    citationLabels.set(refId, style.formatCitation([num]));
  }

  for (const refIds of multiCites) {
    const nums = refIds
      .map((id) => citations.get(id))
      .filter((n): n is number => n !== undefined);
    citationLabels.set(refIds.join(','), style.formatCitation(nums));
  }

  // Uncited references
  const citedSet = new Set(citationOrder);
  const uncitedRefs: Id[] = [];
  for (const ref of references) {
    if (!citedSet.has(ref.id)) {
      uncitedRefs.push(ref.id);
    }
  }

  // Bibliography order
  const isApa = style.name.toLowerCase().includes('apa');
  const bibliographyOrder: Id[] = isApa
    ? sortReferencesApa(references)
    : [...citationOrder, ...uncitedRefs];

  return {
    figures,
    tables,
    equations,
    citations,
    citationOrder,
    citationLabels,
    bibliographyOrder,
    uncitedRefs,
    danglingCites,
    xrefBroken,
    firstMentionBeforeFloat,
  };
}

/**
 * Helper to format a specific citation list with numbers from computed numbering.
 */
export function formatCite(
  refIds: Id[],
  numbering: ComputedNumbering,
  style?: CitationStyle
): string {
  const activeStyle = style || vancouverCitationStyle;
  const numbers = refIds
    .map((id) => numbering.citations.get(id))
    .filter((n): n is number => n !== undefined);
  return activeStyle.formatCitation(numbers);
}
