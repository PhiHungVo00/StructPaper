/**
 * Unified LaTeX Exporter
 *
 * Generates production-ready, compilable LaTeX source code from Manuscript AST
 * targeting XeLaTeX / Tectonic and the structpaper-hs.cls template.
 *
 * Injects %%BLOCK:<id> comments before every block for error tracking / SyncTeX.
 */

import * as fs from 'fs';
import * as path from 'path';
import type {
  BackMatterItem,
  Inline,
  Manuscript,
  Section,
} from '@structpaper/doc-model';
import type { JournalProfile } from '@structpaper/journal-profiles';
import { escapeTex, formatLatexKey } from './escape-tex';
import { blocksToLatex, inlinesToLatex } from './blocks';

export interface LatexExportOptions {
  profile?: JournalProfile;
  documentClass?: string;
  lineNumbers?: boolean;
}

/**
 * Returns a human-friendly section title for recognized back matter item types.
 */
function defaultBackMatterTitle(type: string): string {
  switch (type.toLowerCase()) {
    case 'ethics':
    case 'ethics-statement':
      return 'Tuyên bố về Đạo đức Nghiên cứu';
    case 'conflict-of-interest':
    case 'coi':
      return 'Xung đột Lợi ích';
    case 'acknowledgments':
    case 'acknowledgement':
      return 'Lời cảm ơn';
    case 'author-contributions':
      return 'Đóng góp của các Tác giả';
    case 'funding':
      return 'Nguồn tài trợ';
    case 'data-availability':
      return 'Tính sẵn có của Dữ liệu';
    default:
      return type.replace(/[-_]/g, ' ').toUpperCase();
  }
}

/**
 * LatexExporter class encapsulates all LaTeX serialization routines.
 */
export class LatexExporter {
  /**
   * Reads and returns the raw structpaper-hs.cls template string.
   */
  public static getTemplateCls(): string {
    const clsPath = path.resolve(__dirname, 'templates/structpaper-hs.cls');
    if (fs.existsSync(clsPath)) {
      return fs.readFileSync(clsPath, 'utf8');
    }
    // Fallback if bundled or relocated
    const fallbackPath = path.resolve(
      __dirname,
      '../src/latex/templates/structpaper-hs.cls'
    );
    if (fs.existsSync(fallbackPath)) {
      return fs.readFileSync(fallbackPath, 'utf8');
    }
    throw new Error(`Cannot locate structpaper-hs.cls at ${clsPath}`);
  }

  /**
   * Exports a Manuscript AST to a complete, standalone LaTeX document.
   */
  public export(
    manuscript: Manuscript,
    options: LatexExportOptions = {}
  ): string {
    const { meta } = manuscript;
    const profile = options.profile;

    // 1. Document Class Resolution
    let docClass = options.documentClass;
    if (!docClass) {
      if (profile?.latex?.cls) {
        docClass = profile.latex.cls.replace(/\.cls$/i, '');
      } else {
        docClass = 'structpaper-hs';
      }
    }

    const lines: string[] = [];

    // 2. Class Declaration & Preamble
    lines.push(`\\documentclass{${docClass}}`);
    if (options.lineNumbers) {
      lines.push('\\usepackage{lineno}', '\\linenumbers');
    }

    // 3. Front Matter Metadata
    const articleType =
      manuscript.articleType || profile?.articleTypes?.[0]?.label?.vi || 'Bài báo nghiên cứu';
    lines.push(`\\spArticleType{${escapeTex(articleType)}}`);

    const journalName =
      profile?.names?.vi || 'Tạp chí Phát triển KH\\&CN - Khoa học Sức khỏe';
    lines.push(`\\spJournal{${escapeTex(journalName)}}`);

    const titleText = inlinesToLatex(meta.title);
    lines.push(`\\spTitle{${titleText || 'Tiêu đề bài báo'}}`);

    const titleEn = meta.translations?.en;
    if (Array.isArray(titleEn) && titleEn.length > 0) {
      lines.push(`\\spTitleEn{${inlinesToLatex(titleEn as Inline[])}}`);
    }

    // Build affiliation indices map
    const affilIndexMap = new Map<string, number>();
    (meta.affiliations || []).forEach((aff, idx) => {
      affilIndexMap.set(aff.id, idx + 1);
    });

    // Format authors
    if (meta.authors && meta.authors.length > 0) {
      const authorTokens = meta.authors.map((author) => {
        const affIndices = (author.affiliationIds || [])
          .map((id) => affilIndexMap.get(id))
          .filter((idx): idx is number => idx !== undefined);

        const affStr =
          affIndices.length > 0 ? `\\textsuperscript{${affIndices.join(',')}}` : '';
        const corrStr = author.isCorresponding ? '\\textsuperscript{*}' : '';
        const name = escapeTex(author.name || 'Tác giả');
        return `${name}${affStr}${corrStr}`;
      });
      lines.push(`\\spAuthors{${authorTokens.join(', ')}}`);
    }

    // Format affiliations
    if (meta.affiliations && meta.affiliations.length > 0) {
      const affilTokens = meta.affiliations.map((aff, idx) => {
        const parts: string[] = [];
        if (aff.department) parts.push(aff.department);
        if (aff.institution) parts.push(aff.institution);
        if (aff.city) parts.push(aff.city);
        if (aff.country) parts.push(aff.country);
        const text = escapeTex(parts.join(', '));
        return `\\textsuperscript{${idx + 1}}${text}`;
      });

      // Add corresponding author email note if present
      const corrAuthor = meta.authors?.find((a) => a.isCorresponding && a.email);
      let affilBlock = affilTokens.join('; ');
      if (corrAuthor?.email) {
        affilBlock += `\\\\ \\textit{*Tác giả liên hệ:} \\href{mailto:${corrAuthor.email}}{${escapeTex(corrAuthor.email)}}`;
      }
      lines.push(`\\spAffiliations{${affilBlock}}`);
    }

    // Dates
    if (meta.dates) {
      const dateParts: string[] = [];
      if (meta.dates.received) dateParts.push(`Ngày nhận: ${meta.dates.received}`);
      if (meta.dates.revised) dateParts.push(`Ngày chỉnh sửa: ${meta.dates.revised}`);
      if (meta.dates.accepted) dateParts.push(`Ngày chấp nhận: ${meta.dates.accepted}`);
      if (meta.dates.published) dateParts.push(`Ngày xuất bản: ${meta.dates.published}`);
      if (dateParts.length > 0) {
        lines.push(`\\spDates{${escapeTex(dateParts.join(' | '))}}`);
      }
    }

    // DOI
    if (meta.doi) {
      lines.push(`\\spDoi{${escapeTex(meta.doi)}}`);
    }

    // Abstract
    if (meta.abstract && meta.abstract.length > 0) {
      const abstractBody = meta.abstract
        .map((para) => inlinesToLatex(para))
        .join('\\par\n');
      lines.push(`\\spAbstract{${abstractBody}}`);
    }

    // Keywords
    if (meta.keywords && meta.keywords.length > 0) {
      const kw = meta.keywords.map((k) => escapeTex(k.trim())).join('; ');
      lines.push(`\\spKeywords{${kw}}`);
    }

    // 4. Begin Document
    lines.push('\n\\begin{document}\n', '\\makeSPTitle\n');

    // 5. Body Sections (Recursive)
    if (manuscript.body && manuscript.body.length > 0) {
      for (const section of manuscript.body) {
        lines.push(this.renderSection(section, 1));
      }
    }

    // 6. Back Matter
    if (manuscript.back && manuscript.back.length > 0) {
      for (const item of manuscript.back) {
        if (item && typeof item === 'object' && 'type' in item) {
          const backItem = item as BackMatterItem;
          const heading = backItem.title
            ? inlinesToLatex(backItem.title)
            : defaultBackMatterTitle(backItem.type);
          lines.push(`\\section*{${heading}}\n`);
          if (backItem.content && backItem.content.length > 0) {
            lines.push(blocksToLatex(backItem.content));
          }
        }
      }
    }

    // 7. Bibliography
    if (manuscript.references && manuscript.references.length > 0) {
      lines.push('\\begin{thebibliography}{99}\n');
      for (const ref of manuscript.references) {
        const key = formatLatexKey(ref.id, 'ref');
        const raw = escapeTex(ref.raw || '');
        lines.push(`\\bibitem{${key}}\n${raw}\n`);
      }
      lines.push('\\end{thebibliography}\n');
    }

    // 8. End Document
    lines.push('\\end{document}\n');

    return lines.join('\n');
  }

  /**
   * Recursively renders a Section and its nested subsections.
   */
  private renderSection(section: Section, depth: number): string {
    const parts: string[] = [];
    const titleText = inlinesToLatex(section.title);
    const labelKey = formatLatexKey(section.id, 'sec');

    if (depth === 1) {
      parts.push(`\\section{${titleText}}\\label{${labelKey}}\n`);
    } else if (depth === 2) {
      parts.push(`\\subsection{${titleText}}\\label{${labelKey}}\n`);
    } else {
      parts.push(`\\subsubsection{${titleText}}\\label{${labelKey}}\n`);
    }

    if (section.blocks && section.blocks.length > 0) {
      parts.push(blocksToLatex(section.blocks));
    }

    if (section.children && section.children.length > 0) {
      const nextDepth = Math.min(3, depth + 1);
      for (const child of section.children) {
        parts.push(this.renderSection(child, nextDepth));
      }
    }

    return parts.join('\n');
  }
}

/**
 * Functional convenience wrapper to export a Manuscript AST to LaTeX.
 */
export function exportToLatex(
  manuscript: Manuscript,
  options?: LatexExportOptions
): string {
  const exporter = new LatexExporter();
  return exporter.export(manuscript, options);
}
