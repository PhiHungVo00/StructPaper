import type {
  Affiliation,
  Author,
  Dates,
  FrontMatter,
  Inline,
} from '@structpaper/doc-model';
import type { RawParagraph } from '../types/raw-doc';
import type { RecognizedBlock } from './types';
import { paragraphToInlines, stripPrefixFromInlines } from './inline-utils';

/**
 * FrontMatterAssembler gathers all metadata blocks (title, authors, affiliations,
 * abstract, keywords, publication dates, DOI) and constructs a normalized FrontMatter object.
 */
export class FrontMatterAssembler {
  private authorIdCounter = 0;

  /**
   * Assembles a FrontMatter object from recognized blocks.
   */
  public assemble(blocks: RecognizedBlock[]): FrontMatter {
    let title: Inline[] = [];
    let titleEn: Inline[] | undefined;

    const authorBlocks: RecognizedBlock[] = [];
    const affiliationBlocks: RecognizedBlock[] = [];
    const correspondingBlocks: RecognizedBlock[] = [];
    const abstractBlocks: RecognizedBlock[] = [];
    const keywordBlocks: RecognizedBlock[] = [];

    const dates: Dates = {};
    let doi: string | undefined;
    let volume: string | undefined;
    let issue: string | undefined;

    for (const b of blocks) {
      const role = b.claim.role;
      const raw = b.raw;
      const text = raw.type === 'paragraph' ? raw.rawText.trim() : '';

      switch (role) {
        case 'title':
          if (title.length === 0 && raw.type === 'paragraph') {
            title = paragraphToInlines(raw);
          }
          break;

        case 'titleEn':
          if (!titleEn && raw.type === 'paragraph') {
            titleEn = paragraphToInlines(raw);
          }
          break;

        case 'authors':
          authorBlocks.push(b);
          break;

        case 'affiliations':
          affiliationBlocks.push(b);
          break;

        case 'corresponding':
          correspondingBlocks.push(b);
          break;

        case 'abstract':
          abstractBlocks.push(b);
          break;

        case 'keywords':
          keywordBlocks.push(b);
          break;

        case 'date.received':
          dates.received = this.cleanDateString(text);
          break;

        case 'date.revised':
          dates.revised = this.cleanDateString(text);
          break;

        case 'date.accepted':
          dates.accepted = this.cleanDateString(text);
          break;

        case 'date.published':
          dates.published = this.cleanDateString(text);
          break;
      }

      // Check for DOI, volume, issue anywhere in metadata blocks
      if (!doi) {
        const doiMatch = text.match(/10\.\d{4,9}\/[-._;()/:A-Za-z0-9]+/);
        if (doiMatch) {
          doi = doiMatch[0].replace(/[.,;)]+$/, '');
        }
      }
      if (!volume) {
        const volMatch = text.match(/(?:Tập|Vol\.?|Volume)\s*(\d+)/i);
        if (volMatch) volume = volMatch[1];
      }
      if (!issue) {
        const issMatch = text.match(/(?:Số|Issue|No\.?)\s*(\d+)/i);
        if (issMatch) issue = issMatch[1];
      }
    }

    const affiliations = this.assembleAffiliations(affiliationBlocks);
    const authors = this.assembleAuthors(authorBlocks, affiliations, correspondingBlocks);
    const abstract = this.assembleAbstract(abstractBlocks);
    const keywords = this.assembleKeywords(keywordBlocks);

    const meta: FrontMatter = {
      title,
      ...(titleEn && titleEn.length > 0 ? { translations: { en: titleEn } } : {}),
      authors,
      affiliations,
      abstract,
      keywords,
      dates,
      ...(doi ? { doi } : {}),
      ...(volume ? { volume } : {}),
      ...(issue ? { issue } : {}),
    };

    return meta;
  }

  private assembleAffiliations(blocks: RecognizedBlock[]): Affiliation[] {
    const affiliations: Affiliation[] = [];
    let counter = 0;

    for (const b of blocks) {
      if (b.raw.type !== 'paragraph') continue;
      const text = b.raw.rawText.trim();
      const lines = text.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);

      for (const line of lines) {
        counter++;
        const match = line.match(/^(\d+|[a-zA-Z]|\*)\.?\s*(.+)$/);
        let key = String(counter);
        let institution = line;

        if (match) {
          key = match[1];
          institution = match[2].trim();
        }

        const id = `aff-${key}`;
        affiliations.push({
          id,
          institution,
        });
      }
    }

    return affiliations;
  }

  private assembleAuthors(
    authorBlocks: RecognizedBlock[],
    affiliations: Affiliation[],
    correspondingBlocks: RecognizedBlock[]
  ): Author[] {
    const authors: Author[] = [];

    // Extract corresponding info (email, name)
    let correspondingEmail: string | undefined;
    for (const cb of correspondingBlocks) {
      if (cb.raw.type !== 'paragraph') continue;
      const text = cb.raw.rawText;
      const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
      if (emailMatch) {
        correspondingEmail = emailMatch[0];
        break;
      }
    }

    for (const b of authorBlocks) {
      if (b.raw.type !== 'paragraph') continue;
      const p = b.raw;

      const parsedAuthors = this.parseAuthorsFromParagraph(p, affiliations);
      for (const auth of parsedAuthors) {
        if (auth.isCorresponding && !auth.email && correspondingEmail) {
          auth.email = correspondingEmail;
        }
        authors.push(auth);
      }
    }

    // If corresponding email exists but no author marked yet, mark the first
    if (correspondingEmail && authors.length > 0 && !authors.some((a) => a.isCorresponding)) {
      authors[0].isCorresponding = true;
      authors[0].email = correspondingEmail;
    }

    return authors;
  }

  private parseAuthorsFromParagraph(p: RawParagraph, affiliations: Affiliation[]): Author[] {
    const authors: Author[] = [];

    // Check if runs have superscript marks linking authors to affiliations
    const hasSupRuns = p.runs && p.runs.some((r) => r.sup && r.text && r.text.trim());

    if (hasSupRuns && p.runs) {
      let currentName = '';
      let currentMarkers: string[] = [];

      for (const run of p.runs) {
        if (run.sup) {
          // Superscript run - contains affiliation numbers or *
          const markers = run.text.split(/[,;\s]+/).map((m) => m.trim()).filter((m) => m);
          currentMarkers.push(...markers);
        } else {
          // Normal run - check if it has comma separating authors
          const parts = run.text.split(/[,;]/);
          for (let i = 0; i < parts.length; i++) {
            const part = parts[i].trim();
            if (i > 0) {
              // Flush previous author
              if (currentName.trim()) {
                authors.push(this.createAuthor(currentName, currentMarkers, affiliations));
              }
              currentName = part;
              currentMarkers = [];
            } else {
              currentName += (currentName ? ' ' : '') + part;
            }
          }
        }
      }

      if (currentName.trim()) {
        authors.push(this.createAuthor(currentName, currentMarkers, affiliations));
      }
    } else {
      // Fallback regex parsing on rawText
      const chunks = p.rawText.split(/[,;]/).map((c) => c.trim()).filter((c) => c);
      for (const chunk of chunks) {
        const match = chunk.match(/^([^\d*¹²³⁴⁵]+)([\d*¹²³⁴⁵,\s]*)$/);
        if (match) {
          const name = match[1].trim();
          const rawMarkers = match[2].trim();
          const markers = rawMarkers
            .replace(/¹/g, '1')
            .replace(/²/g, '2')
            .replace(/³/g, '3')
            .replace(/⁴/g, '4')
            .replace(/⁵/g, '5')
            .split(/[\s,]+/)
            .filter((m) => m);

          authors.push(this.createAuthor(name, markers, affiliations));
        } else {
          authors.push(this.createAuthor(chunk, [], affiliations));
        }
      }
    }

    return authors;
  }

  private createAuthor(
    rawName: string,
    markers: string[],
    affiliations: Affiliation[]
  ): Author {
    const id = `auth-${++this.authorIdCounter}`;
    const cleanName = rawName.replace(/^[\s,;]+|[\s,;]+$/g, '').trim();

    const isCorresponding = markers.includes('*') || markers.some((m) => m.includes('*'));

    const affiliationIds: string[] = [];
    for (const marker of markers) {
      const cleanMarker = marker.replace('*', '').trim();
      if (!cleanMarker) continue;
      const targetId = `aff-${cleanMarker}`;
      if (affiliations.some((a) => a.id === targetId)) {
        affiliationIds.push(targetId);
      }
    }

    // Default to first affiliation if none explicitly matched but affiliations exist
    if (affiliationIds.length === 0 && affiliations.length > 0) {
      affiliationIds.push(affiliations[0].id);
    }

    return {
      id,
      name: cleanName,
      affiliationIds,
      ...(isCorresponding ? { isCorresponding: true } : {}),
    };
  }

  private assembleAbstract(blocks: RecognizedBlock[]): Inline[][] {
    const paragraphs: Inline[][] = [];
    const prefixRegex = /^(?:Tóm\s*tắt|Abstract)\s*[-—–:]\s*/i;

    for (const b of blocks) {
      if (b.raw.type !== 'paragraph') continue;
      const inlines = paragraphToInlines(b.raw);
      const cleaned = stripPrefixFromInlines(inlines, prefixRegex);
      if (cleaned.length > 0) {
        paragraphs.push(cleaned);
      }
    }

    return paragraphs;
  }

  private assembleKeywords(blocks: RecognizedBlock[]): string[] {
    const keywords: string[] = [];
    const prefixRegex = /^(?:Từ\s*khóa|Từ\s*khoá|Keywords|Index\s*Terms)\s*[-—–:]\s*/i;

    for (const b of blocks) {
      if (b.raw.type !== 'paragraph') continue;
      let text = b.raw.rawText.trim();
      text = text.replace(prefixRegex, '').trim();

      const delimiter = text.includes(';') ? ';' : ',';
      const items = text.split(delimiter).map((k) => k.trim()).filter((k) => k.length > 0);
      keywords.push(...items);
    }

    return keywords;
  }

  private cleanDateString(text: string): string {
    return text
      .replace(/^(?:Ngày\s*nhận(?:\s*bài)?|Received|Ngày\s*chấp\s*nhận|Accepted|Ngày\s*chỉnh\s*sửa|Revised|Ngày\s*xuất\s*bản|Published)\s*[-—–:]\s*/i, '')
      .trim();
  }
}
