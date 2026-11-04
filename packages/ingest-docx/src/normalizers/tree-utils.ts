import type {
  Manuscript,
  Section,
  Block,
  Inline,
  TableBlock,
  FigureBlock,
  ParagraphBlock,
  QuoteBlock,
  ListBlock,
  BoxBlock,
  Cell,
  BackMatterItem,
} from '@structpaper/doc-model';

/**
 * Transforms all Inline[] arrays throughout a Manuscript.
 */
export function transformManuscriptInlines(
  doc: Manuscript,
  transform: (inlines: Inline[]) => Inline[]
): Manuscript {
  // 1. Transform FrontMatter
  const title = transform(doc.meta.title);
  const translations = doc.meta.translations
    ? {
        ...doc.meta.translations,
        ...(doc.meta.translations.en
          ? { en: transform(doc.meta.translations.en) }
          : {}),
      }
    : undefined;

  const abstract = doc.meta.abstract.map((p) => transform(p));

  // 2. Transform Body Sections
  const body = doc.body.map((sec) => transformSectionInlines(sec, transform));

  // 3. Transform BackMatter
  const back = doc.back.map((item) => {
    if ('type' in item && 'content' in item) {
      const bm = item as BackMatterItem;
      return {
        ...bm,
        title: bm.title ? transform(bm.title) : undefined,
        content: bm.content.map((b) => transformBlockInlines(b, transform)),
      };
    }
    return item;
  });

  return {
    ...doc,
    meta: {
      ...doc.meta,
      title,
      translations,
      abstract,
    },
    body,
    back,
  };
}

function transformSectionInlines(
  sec: Section,
  transform: (inlines: Inline[]) => Inline[]
): Section {
  return {
    ...sec,
    title: transform(sec.title),
    blocks: sec.blocks.map((b) => transformBlockInlines(b, transform)),
    children: sec.children.map((child) => transformSectionInlines(child, transform)),
  };
}

function transformBlockInlines(
  block: Block,
  transform: (inlines: Inline[]) => Inline[]
): Block {
  switch (block.type) {
    case 'paragraph': {
      const p = block as ParagraphBlock;
      return {
        ...p,
        content: transform(p.content),
      };
    }
    case 'quote': {
      const q = block as QuoteBlock;
      return {
        ...q,
        content: transform(q.content),
      };
    }
    case 'list': {
      const l = block as ListBlock;
      return {
        ...l,
        items: l.items.map((item) => transform(item)),
      };
    }
    case 'box': {
      const b = block as BoxBlock;
      return {
        ...b,
        content: b.content.map((inner) => transformBlockInlines(inner, transform)),
      };
    }
    case 'table': {
      const t = block as TableBlock;
      return {
        ...t,
        caption: transform(t.caption),
        notes: t.notes ? transform(t.notes) : undefined,
        source: t.source ? transform(t.source) : undefined,
        grid: t.grid.map((row) =>
          row.map((cell) => ({
            ...cell,
            content: transform(cell.content),
          }))
        ),
      };
    }
    case 'figure': {
      const f = block as FigureBlock;
      return {
        ...f,
        caption: transform(f.caption),
        source: f.source ? transform(f.source) : undefined,
        panels: f.panels?.map((panel) => ({
          ...panel,
          caption: panel.caption ? transform(panel.caption) : undefined,
        })),
      };
    }
    default:
      return block;
  }
}

/**
 * Transforms all Block objects throughout a Manuscript.
 */
export function transformManuscriptBlocks(
  doc: Manuscript,
  transform: (block: Block) => Block
): Manuscript {
  const body = doc.body.map((sec) => transformSectionBlocks(sec, transform));
  const back = doc.back.map((item) => {
    if ('type' in item && 'content' in item) {
      const bm = item as BackMatterItem;
      return {
        ...bm,
        content: bm.content.map((b) => transform(b)),
      };
    }
    return item;
  });

  return {
    ...doc,
    body,
    back,
  };
}

function transformSectionBlocks(
  sec: Section,
  transform: (block: Block) => Block
): Section {
  return {
    ...sec,
    blocks: sec.blocks.map((b) => transform(b)),
    children: sec.children.map((c) => transformSectionBlocks(c, transform)),
  };
}
