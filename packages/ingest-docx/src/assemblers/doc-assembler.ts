import type { Block } from '@structpaper/doc-model';
import type { DocxPackage } from '../package/docx-package';
import type { RawParagraph, RawTable } from '../types/raw-doc';
import type { AssembledDoc, RecognizedBlock } from './types';
import { FrontMatterAssembler } from './front-matter-assembler';
import { ReferenceAssembler } from './reference-assembler';
import { BackmatterAssembler } from './backmatter-assembler';
import { TableAssembler } from './table-assembler';
import { FigureAssembler } from './figure-assembler';
import { EquationAssembler } from './equation-assembler';
import { SectionTreeAssembler, SectionInputItem } from './section-tree-assembler';

export interface DocAssemblerOptions {
  docxPackage?: DocxPackage;
  media?: Map<string, Uint8Array>;
  rels?: Map<string, string>;
}

const FRONTMATTER_ROLES = new Set([
  'title',
  'titleEn',
  'authors',
  'affiliations',
  'corresponding',
  'date.received',
  'date.revised',
  'date.accepted',
  'date.published',
  'heading.abstract',
  'abstract',
  'keywords',
]);

/**
 * DocAssembler is the top-level orchestrator that coordinates individual assemblers
 * to transform an array of RecognizedBlocks into an AssembledDoc structure.
 */
export class DocAssembler {
  private readonly frontMatterAssembler = new FrontMatterAssembler();
  private readonly referenceAssembler = new ReferenceAssembler();
  private readonly backmatterAssembler = new BackmatterAssembler();
  private readonly tableAssembler = new TableAssembler();
  private readonly equationAssembler = new EquationAssembler();

  /**
   * Assembles a full AssembledDoc from recognized blocks.
   */
  public assemble(blocks: RecognizedBlock[], options: DocAssemblerOptions = {}): AssembledDoc {
    const media = options.media || options.docxPackage?.media;
    const rels = options.rels || options.docxPackage?.rels;
    const figureAssembler = new FigureAssembler({ media, rels });

    // 1. FrontMatter
    const meta = this.frontMatterAssembler.assemble(blocks);

    // 2. References
    const references = this.referenceAssembler.assembleReferences(blocks);

    // 3. BackMatter
    const back = this.backmatterAssembler.assemble(blocks);

    // 4. Body Blocks Assembly
    const bodyItems: SectionInputItem[] = [];
    const consumedIndices = new Set<number>();

    for (let i = 0; i < blocks.length; i++) {
      if (consumedIndices.has(i)) continue;

      const block = blocks[i];
      const role = block.claim.role;

      // Skip non-body items
      if (FRONTMATTER_ROLES.has(role)) continue;
      if (role === 'reference' || role === 'heading.references') continue;
      if (role.startsWith('back.')) continue;
      if (role === 'ignore') continue;

      // Check Table
      if (block.raw.type === 'table') {
        const { tableBlock, consumed } = this.processTable(blocks, i);
        bodyItems.push(tableBlock);
        for (const idx of consumed) consumedIndices.add(idx);
        continue;
      }

      // Check Drawing / Figure
      if (
        block.raw.type === 'paragraph' &&
        ((block.raw.drawings && block.raw.drawings.length > 0) || role === 'figure.placeholder')
      ) {
        const { figureBlock, consumed } = this.processFigure(blocks, i, figureAssembler);
        bodyItems.push(figureBlock);
        for (const idx of consumed) consumedIndices.add(idx);
        continue;
      }

      // Check Equation
      if (
        role === 'equation' ||
        (block.raw.type === 'paragraph' && block.raw.math && block.raw.math.length > 0)
      ) {
        const equationBlock = this.equationAssembler.assembleEquation(
          block.raw as RawParagraph,
          block.id
        );
        bodyItems.push(equationBlock);
        continue;
      }

      // Skip unattached captions/notes if encountered stand-alone
      if (role === 'table.caption' || role === 'table.note' || role === 'figure.caption') {
        continue;
      }

      // Heading or Paragraph block
      bodyItems.push(block);
    }

    // 5. Section Tree
    const sectionTreeAssembler = new SectionTreeAssembler();
    const body = sectionTreeAssembler.assemble(bodyItems);

    // 6. Assets
    const assets = figureAssembler.getAssets();

    return {
      meta,
      body,
      back,
      references,
      assets,
    };
  }

  private processTable(
    blocks: RecognizedBlock[],
    tableIndex: number
  ): { tableBlock: Block; consumed: number[] } {
    const rawTable = blocks[tableIndex].raw as RawTable;
    const consumed: number[] = [tableIndex];

    let captionBlock: RecognizedBlock | undefined;
    let noteBlock: RecognizedBlock | undefined;
    let sourceBlock: RecognizedBlock | undefined;

    // Check immediately preceding block for table.caption
    if (tableIndex > 0 && blocks[tableIndex - 1].claim.role === 'table.caption') {
      captionBlock = blocks[tableIndex - 1];
      consumed.push(tableIndex - 1);
    }

    // Check following blocks for table.caption, table.note, source
    let nextIdx = tableIndex + 1;
    while (nextIdx < blocks.length) {
      const nextRole = blocks[nextIdx].claim.role;
      if (!captionBlock && nextRole === 'table.caption') {
        captionBlock = blocks[nextIdx];
        consumed.push(nextIdx);
        nextIdx++;
      } else if (!noteBlock && nextRole === 'table.note') {
        noteBlock = blocks[nextIdx];
        consumed.push(nextIdx);
        nextIdx++;
      } else if (!sourceBlock && nextRole === 'source') {
        sourceBlock = blocks[nextIdx];
        consumed.push(nextIdx);
        nextIdx++;
      } else {
        break;
      }
    }

    const tableBlock = this.tableAssembler.assembleTable(rawTable, {
      id: blocks[tableIndex].id,
      captionBlock,
      noteBlock,
      sourceBlock,
    });

    return { tableBlock, consumed };
  }

  private processFigure(
    blocks: RecognizedBlock[],
    figureIndex: number,
    figureAssembler: FigureAssembler
  ): { figureBlock: Block; consumed: number[] } {
    const rawP = blocks[figureIndex].raw as RawParagraph;
    const consumed: number[] = [figureIndex];

    let captionBlock: RecognizedBlock | undefined;
    let sourceBlock: RecognizedBlock | undefined;

    // Check following blocks for figure.caption or source
    let nextIdx = figureIndex + 1;
    while (nextIdx < blocks.length) {
      const nextRole = blocks[nextIdx].claim.role;
      if (!captionBlock && nextRole === 'figure.caption') {
        captionBlock = blocks[nextIdx];
        consumed.push(nextIdx);
        nextIdx++;
      } else if (!sourceBlock && nextRole === 'source') {
        sourceBlock = blocks[nextIdx];
        consumed.push(nextIdx);
        nextIdx++;
      } else {
        break;
      }
    }

    // Check preceding block if caption not yet found
    if (!captionBlock && figureIndex > 0 && blocks[figureIndex - 1].claim.role === 'figure.caption') {
      captionBlock = blocks[figureIndex - 1];
      consumed.push(figureIndex - 1);
    }

    const figureBlock = figureAssembler.assembleFigure(rawP, {
      id: blocks[figureIndex].id,
      captionBlock,
      sourceBlock,
    });

    return { figureBlock, consumed };
  }
}
