import { CompletePaper } from '@/types/paper';
import { UniversalTemplateSchema, SemanticElement } from '@/types/template-builder';

/**
 * Injects a CompletePaper's real authoring content into a UniversalTemplateSchema's SemanticElements.
 * Returns a cloned schema with updated element contents ready for live rendering.
 */
export function mapPaperToTemplateSchema(
  paper: CompletePaper,
  templateSchema: UniversalTemplateSchema
): UniversalTemplateSchema {
  const meta = paper.metadata;
  const authorNames = meta.authors.map((a) => a.name).join(', ') || 'Tác giả';
  const affiliationsText = meta.affiliations
    .map((aff) => `${aff.id}. ${aff.name}`)
    .join('\n');
  const correspondingText = meta.corresponding?.email
    ? `Tác giả liên hệ: ${meta.corresponding.name || ''} (${meta.corresponding.email})`
    : '';

  const bodySections = paper.sections
    .map((s) => {
      if (s.type === 'h1' || s.type === 'h2' || s.type === 'h3') {
        return `\n${s.title}\n`;
      }
      if (s.type === 'table' && s.table) {
        return `\n[Bảng: ${s.table.caption}]\n`;
      }
      if (s.type === 'figure' && s.figure) {
        return `\n[Hình: ${s.figure.caption}]\n`;
      }
      return s.content;
    })
    .join('\n\n');

  const updatedElements: SemanticElement[] = templateSchema.elements.map((el) => {
    const elType = el.type;
    const elNameLower = el.name.toLowerCase();

    // 1. Title Banner / Title Elements
    if (elType === 'article-title' || elNameLower.includes('tiêu đề') || elNameLower.includes('title')) {
      return {
        ...el,
        name: meta.title || el.name,
        specialProps: {
          ...el.specialProps,
          customContentSample: meta.title || el.specialProps?.customContentSample,
          bilingualLabel: meta.titleEn || el.specialProps?.bilingualLabel,
        },
      };
    }

    // 2. Authors Block
    if (elType === 'author-block' || elNameLower.includes('tác giả') || elNameLower.includes('author')) {
      return {
        ...el,
        specialProps: {
          ...el.specialProps,
          customContentSample: `${authorNames}\n${affiliationsText}\n${correspondingText}`.trim(),
          ...(authorNames ? ({ authorNames } as any) : {}),
        },
      };
    }

    // 3. Affiliation List
    if (elType === 'affiliation-list' || elNameLower.includes('đơn vị') || elNameLower.includes('affiliation')) {
      return {
        ...el,
        specialProps: {
          ...el.specialProps,
          customContentSample: affiliationsText || el.specialProps?.customContentSample,
          affiliationText: affiliationsText,
        },
      };
    }

    // 4. Abstract Box
    if (elType === 'abstract-box' || elNameLower.includes('tóm tắt') || elNameLower.includes('abstract')) {
      return {
        ...el,
        specialProps: {
          ...el.specialProps,
          customContentSample: meta.abstract || el.specialProps?.customContentSample,
        },
      };
    }

    // 5. Keywords Group
    if (elType === 'keywords-group' || elNameLower.includes('từ khóa') || elNameLower.includes('keyword')) {
      return {
        ...el,
        specialProps: {
          ...el.specialProps,
          customContentSample:
            meta.keywords && meta.keywords.length > 0
              ? `Từ khóa: ${meta.keywords.join('; ')}`
              : el.specialProps?.customContentSample,
          keywords: meta.keywords || el.specialProps?.keywords,
        },
      };
    }

    // 6. Metadata Grid / Journal Info
    if (elType === 'metadata-grid' || elNameLower.includes('metadata') || elNameLower.includes('thông tin')) {
      return {
        ...el,
        specialProps: {
          ...el.specialProps,
          customContentSample: `${meta.journalName || ''} | DOI: ${meta.doi || ''} | Năm ${meta.year || '2026'}`.trim(),
          doiUrl: meta.doi || el.specialProps?.doiUrl,
          historyReceived: meta.dates?.received || el.specialProps?.historyReceived,
          historyRevised: meta.dates?.revised || el.specialProps?.historyRevised,
          historyAccepted: meta.dates?.accepted || el.specialProps?.historyAccepted,
          historyPublished: meta.dates?.published || el.specialProps?.historyPublished,
        },
      };
    }

    // 7. Body Text / Content Sections
    if (
      elType === 'body-text' ||
      elNameLower.includes('nội dung') ||
      elNameLower.includes('thân bài') ||
      elNameLower.includes('body')
    ) {
      return {
        ...el,
        specialProps: {
          ...el.specialProps,
          customContentSample: bodySections || el.specialProps?.customContentSample,
        },
      };
    }

    return el;
  });

  return {
    ...templateSchema,
    name: `${templateSchema.name} (${meta.title ? meta.title.slice(0, 30) + '...' : 'Bài báo'})`,
    elements: updatedElements,
  };
}
