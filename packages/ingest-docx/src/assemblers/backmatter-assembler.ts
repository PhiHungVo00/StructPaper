import type { BackMatterItem, ParagraphBlock } from '@structpaper/doc-model';
import type { RawParagraph } from '../types/raw-doc';
import type { RecognizedBlock } from './types';
import { paragraphToInlines } from './inline-utils';

/**
 * BackmatterAssembler groups back matter statements (funding, acknowledgments,
 * ethics, conflict of interest, author contributions, data availability) into BackMatterItem[].
 */
export class BackmatterAssembler {
  private idCounter = 0;

  /**
   * Assembles BackMatterItem[] from recognized blocks.
   */
  public assemble(blocks: RecognizedBlock[]): BackMatterItem[] {
    const items: BackMatterItem[] = [];
    const grouped = new Map<string, ParagraphBlock[]>();

    for (const b of blocks) {
      const role = b.claim.role;
      if (!role.startsWith('back.')) continue;

      const type = this.normalizeType(role);
      if (!grouped.has(type)) {
        grouped.set(type, []);
      }

      if (b.raw.type === 'paragraph') {
        const block: ParagraphBlock = {
          type: 'paragraph',
          id: b.id || `bm-p-${++this.idCounter}`,
          content: paragraphToInlines(b.raw as RawParagraph),
        };
        grouped.get(type)!.push(block);
      }
    }

    for (const [type, content] of grouped.entries()) {
      items.push({
        id: `bm-${type}-${++this.idCounter}`,
        type,
        content,
      });
    }

    return items;
  }

  private normalizeType(role: string): string {
    switch (role) {
      case 'back.funding':
        return 'funding';
      case 'back.acknowledgments':
        return 'acknowledgments';
      case 'back.ethics':
        return 'ethics';
      case 'back.contributions':
        return 'contributions';
      case 'back.conflict':
        return 'conflict';
      case 'back.data_availability':
        return 'data_availability';
      default:
        return role.replace(/^back\./, '');
    }
  }
}
