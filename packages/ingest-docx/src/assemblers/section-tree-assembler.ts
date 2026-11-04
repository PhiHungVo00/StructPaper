import type { Block, ParagraphBlock, Section } from '@structpaper/doc-model';
import type { RawParagraph } from '../types/raw-doc';
import type { RecognizedBlock } from './types';
import { paragraphToInlines } from './inline-utils';

export type SectionInputItem = RecognizedBlock | Block;

/**
 * SectionTreeAssembler hierarchically organizes headings (h1, h2, h3) and document blocks
 * (paragraphs, tables, figures, equations) into a nested Section[] tree.
 */
export class SectionTreeAssembler {
  private idCounter = 0;

  /**
   * Assembles an array of recognized blocks or assembled blocks into a hierarchical Section[] tree.
   */
  public assemble(items: SectionInputItem[]): Section[] {
    const rootSections: Section[] = [];
    const stack: Array<{ section: Section; level: 1 | 2 | 3 }> = [];

    for (const item of items) {
      const headingLevel = this.extractHeadingLevel(item);

      if (headingLevel) {
        const headingBlock = item as RecognizedBlock;
        const section: Section = {
          id: headingBlock.id || `sec-${++this.idCounter}`,
          level: headingLevel,
          title: headingBlock.raw.type === 'paragraph'
            ? paragraphToInlines(headingBlock.raw)
            : [],
          blocks: [],
          children: [],
        };

        // Pop until we find a parent with strictly lower level number (e.g. level 1 is parent of level 2)
        while (stack.length > 0 && stack[stack.length - 1].level >= headingLevel) {
          stack.pop();
        }

        if (stack.length === 0) {
          rootSections.push(section);
        } else {
          stack[stack.length - 1].section.children.push(section);
        }

        stack.push({ section, level: headingLevel });
      } else {
        const block = this.normalizeToBlock(item);
        if (!block) continue;

        // If blocks appear before any heading, place in a default introductory section
        if (stack.length === 0) {
          const defaultSection: Section = {
            id: `sec-${++this.idCounter}`,
            level: 1,
            title: [],
            blocks: [],
            children: [],
          };
          rootSections.push(defaultSection);
          stack.push({ section: defaultSection, level: 1 });
        }

        stack[stack.length - 1].section.blocks.push(block);
      }
    }

    return rootSections;
  }

  private extractHeadingLevel(item: SectionInputItem): (1 | 2 | 3) | null {
    if (!('claim' in item)) return null;
    const role = item.claim.role;
    if (role === 'h1') return 1;
    if (role === 'h2') return 2;
    if (role === 'h3') return 3;
    return null;
  }

  private normalizeToBlock(item: SectionInputItem): Block | null {
    if ('type' in item && typeof item.type === 'string') {
      return item as Block;
    }

    const recognized = item as RecognizedBlock;
    if (recognized.claim.role === 'ignore') return null;

    if (recognized.raw.type === 'paragraph') {
      const paragraphBlock: ParagraphBlock = {
        type: 'paragraph',
        id: recognized.id || `p-${++this.idCounter}`,
        content: paragraphToInlines(recognized.raw as RawParagraph),
      };
      return paragraphBlock;
    }

    return null;
  }
}
