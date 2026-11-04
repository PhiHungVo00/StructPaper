import type { Manuscript, Inline } from '@structpaper/doc-model';
import { inlineToPlainText } from '@structpaper/doc-model';
import type { JournalProfile } from '@structpaper/journal-profiles';
import type { QcRule, QcIssue, QcContext } from '../interfaces/rule';

function inlinesToString(inlines?: Inline[]): string {
  if (!inlines || inlines.length === 0) return '';
  return inlineToPlainText(inlines).trim();
}

function countWords(text: string): number {
  if (!text) return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export const titleRule: QcRule = {
  id: 'meta-title',
  name: 'Kiểm tra tiêu đề bài báo',
  category: 'metadata',
  check(doc: Manuscript): QcIssue[] {
    const issues: QcIssue[] = [];
    const titleText = inlinesToString(doc.meta.title);
    const titleOk = Boolean(
      titleText &&
      titleText !== 'Bản thảo chưa đặt tiêu đề' &&
      titleText.length > 10
    );

    if (!titleOk) {
      issues.push({
        id: 'iss_title',
        ruleId: 'meta-title',
        severity: 'error',
        pillar: 'format',
        title: 'Thiếu tiêu đề bài báo chính',
        message: 'Bản thảo chưa có tựa đề tiếng Việt hợp lệ hoặc tựa đề quá ngắn.',
        suggestion: 'Vui lòng bổ sung tiêu đề bài báo chính xác theo bản thảo nộp tạp chí.',
        fixTab: 'metadata',
        fix: { type: 'NAVIGATE_TAB', payload: { tab: 'metadata' } },
      });
    }

    const enInlines = doc.meta.translations?.en as Inline[] | undefined;
    const titleEn = enInlines ? inlinesToString(enInlines) : ((doc.meta as unknown as Record<string, unknown>).titleEn as string || '');
    const titleEnOk = Boolean(titleEn && titleEn.trim().length > 10);

    if (!titleEnOk) {
      issues.push({
        id: 'iss_title_en',
        ruleId: 'meta-title',
        severity: 'warning',
        pillar: 'format',
        title: 'Thiếu tiêu đề tiếng Anh (Title)',
        message: 'Quy chuẩn tạp chí ĐHQG-HCM bắt buộc có tiêu đề tiếng Anh để phục vụ chỉ mục Scopus / ACI.',
        suggestion: 'Bổ sung tiêu đề tiếng Anh trong tab "Thông tin chung".',
        fixTab: 'metadata',
        fix: { type: 'NAVIGATE_TAB', payload: { tab: 'metadata' } },
      });
    }

    return issues;
  },
};

export const abstractRule: QcRule = {
  id: 'meta-abstract',
  name: 'Kiểm tra tóm tắt (Abstract)',
  category: 'metadata',
  check(doc: Manuscript, profile: JournalProfile): QcIssue[] {
    const issues: QcIssue[] = [];
    const minWords = profile.frontMatter?.abstract?.minWords ?? 275;
    const maxWords = profile.frontMatter?.abstract?.maxWords ?? 500;

    const abstractParagraphs = doc.meta.abstract || [];
    const abstractText = abstractParagraphs
      .map((p) => inlinesToString(p))
      .filter(Boolean)
      .join('\n\n');

    const wordCount = countWords(abstractText);
    const hasPlaceholder = abstractText.includes('Chưa phát hiện phần tóm tắt');

    if (!abstractText || hasPlaceholder) {
      issues.push({
        id: 'iss_abstract',
        ruleId: 'meta-abstract',
        severity: 'error',
        pillar: 'authors_abstract',
        title: 'Thiếu tóm tắt tiếng Việt',
        message: 'Bản thảo chưa có nội dung tóm tắt tiếng Việt đạt chuẩn.',
        suggestion: 'Bổ sung phần tóm tắt theo cấu trúc quy định của tạp chí.',
        fixTab: 'abstract',
        fix: { type: 'NAVIGATE_TAB', payload: { tab: 'abstract' } },
      });
    } else if (wordCount < minWords) {
      issues.push({
        id: 'iss_abstract',
        ruleId: 'meta-abstract',
        severity: 'warning',
        pillar: 'authors_abstract',
        title: 'Tóm tắt tiếng Việt chưa đạt chuẩn độ dài tối thiểu',
        message: `Tóm tắt hiện có ${wordCount} từ (tiêu chuẩn ${profile.names?.short || 'VNUHCM-HS'} yêu cầu từ ${minWords} - ${maxWords} từ).`,
        suggestion: 'Bổ sung tóm tắt bao gồm: mục tiêu, phương pháp, kết quả nổi bật và kết luận.',
        fixTab: 'abstract',
        fix: { type: 'NAVIGATE_TAB', payload: { tab: 'abstract' } },
      });
    } else if (wordCount > maxWords) {
      issues.push({
        id: 'iss_abstract_long',
        ruleId: 'meta-abstract',
        severity: 'warning',
        pillar: 'authors_abstract',
        title: 'Tóm tắt tiếng Việt vượt quá độ dài tối đa',
        message: `Tóm tắt hiện có ${wordCount} từ, vượt quá giới hạn tối đa ${maxWords} từ của tạp chí.`,
        suggestion: 'Rút gọn nội dung tóm tắt để không vượt quá giới hạn từ quy định.',
        fixTab: 'abstract',
        fix: { type: 'NAVIGATE_TAB', payload: { tab: 'abstract' } },
      });
    }

    // English abstract check
    const rawMeta = doc.meta as unknown as Record<string, unknown>;
    const trans = doc.meta.translations as Record<string, unknown> | undefined;
    const abstractEnText = (trans?.enAbstract as string) ||
      (rawMeta.abstractEn as string) ||
      (trans?.abstractEn as string) ||
      '';
    const enWordCount = countWords(abstractEnText);

    if (!abstractEnText || enWordCount < 30) {
      issues.push({
        id: 'iss_abstract_en',
        ruleId: 'meta-abstract',
        severity: 'warning',
        pillar: 'authors_abstract',
        title: 'Thiếu tóm tắt tiếng Anh (Abstract)',
        message: 'Chưa trích xuất được Abstract tiếng Anh hoặc nội dung quá ngắn.',
        suggestion: 'Bổ sung Abstract tiếng Anh trong tab "Tóm tắt & Từ khóa".',
        fixTab: 'abstract',
        fix: { type: 'NAVIGATE_TAB', payload: { tab: 'abstract' } },
      });
    }

    return issues;
  },
};

export const keywordsRule: QcRule = {
  id: 'meta-keywords',
  name: 'Kiểm tra từ khóa (Keywords)',
  category: 'metadata',
  check(doc: Manuscript, profile: JournalProfile): QcIssue[] {
    const issues: QcIssue[] = [];
    const minKeys = profile.frontMatter?.keywords?.min ?? 3;
    const maxKeys = profile.frontMatter?.keywords?.max ?? 5;

    const keywords = (doc.meta.keywords || []).filter((k) => k && k.trim());
    const count = keywords.length;

    if (count < minKeys) {
      issues.push({
        id: 'iss_keywords',
        ruleId: 'meta-keywords',
        severity: 'warning',
        pillar: 'authors_abstract',
        title: `Số từ khóa tiếng Việt (${count}) chưa đủ`,
        message: `Quy định ${profile.names?.short || 'VNUHCM-HS'} yêu cầu tối thiểu từ ${minKeys} đến ${maxKeys} từ khóa chuyên ngành.`,
        suggestion: 'Thêm từ khóa phân cách bằng dấu chấm phẩy hoặc phẩy trong tab "Tóm tắt & Từ khóa".',
        fixTab: 'abstract',
        fix: { type: 'NAVIGATE_TAB', payload: { tab: 'abstract' } },
      });
    } else if (count > maxKeys) {
      issues.push({
        id: 'iss_keywords_excess',
        ruleId: 'meta-keywords',
        severity: 'warning',
        pillar: 'authors_abstract',
        title: `Số từ khóa tiếng Việt (${count}) vượt quá giới hạn`,
        message: `Tạp chí quy định tối đa ${maxKeys} từ khóa, hiện có ${count} từ khóa.`,
        suggestion: 'Rút gọn danh sách từ khóa về phạm vi quy định.',
        fixTab: 'abstract',
        fix: { type: 'NAVIGATE_TAB', payload: { tab: 'abstract' } },
      });
    }

    const rawMeta = doc.meta as unknown as Record<string, unknown>;
    const trans = doc.meta.translations as Record<string, unknown> | undefined;
    const keywordsEn = ((trans?.keywordsEn as string[]) ||
      (rawMeta.keywordsEn as string[]) ||
      (trans?.keywords as string[]) ||
      []).filter((k) => k && k.trim());

    if (keywordsEn.length < minKeys) {
      issues.push({
        id: 'iss_keywords_en',
        ruleId: 'meta-keywords',
        severity: 'info',
        pillar: 'authors_abstract',
        title: 'Chưa có đủ từ khóa tiếng Anh (Keywords)',
        message: `Khuyến nghị bổ sung ${minKeys} - ${maxKeys} keywords tiếng Anh song song với từ khóa tiếng Việt.`,
        suggestion: 'Bổ sung keywords trong tab "Tóm tắt & Từ khóa".',
        fixTab: 'abstract',
        fix: { type: 'NAVIGATE_TAB', payload: { tab: 'abstract' } },
      });
    }

    return issues;
  },
};

export const authorsAffiliationsRule: QcRule = {
  id: 'meta-authors',
  name: 'Kiểm tra tác giả và đơn vị công tác',
  category: 'metadata',
  check(doc: Manuscript): QcIssue[] {
    const issues: QcIssue[] = [];
    const authors = doc.meta.authors || [];
    const affiliations = doc.meta.affiliations || [];

    if (authors.length === 0) {
      issues.push({
        id: 'iss_authors',
        ruleId: 'meta-authors',
        severity: 'error',
        pillar: 'authors_abstract',
        title: 'Chưa có danh sách tác giả',
        message: 'Bài báo chưa được gán tên tác giả.',
        suggestion: 'Thêm danh sách tác giả trong tab "Tác giả & Đơn vị".',
        fixTab: 'authors',
        fix: { type: 'NAVIGATE_TAB', payload: { tab: 'authors' } },
      });
    }

    if (affiliations.length === 0) {
      issues.push({
        id: 'iss_affiliations',
        ruleId: 'meta-authors',
        severity: 'warning',
        pillar: 'authors_abstract',
        title: 'Chưa có cơ quan / đơn vị công tác',
        message: 'Chưa có thông tin Trường, Viện hoặc Khoa công tác của tác giả.',
        suggestion: 'Bổ sung đơn vị công tác có đánh số thứ tự mũ.',
        fixTab: 'authors',
        fix: { type: 'NAVIGATE_TAB', payload: { tab: 'authors' } },
      });
    }

    const hasValidCorresponding = authors.some(
      (a) => a.isCorresponding && a.email && a.email.includes('@')
    ) || authors.some((a) => a.email && a.email.includes('@'));

    if (!hasValidCorresponding) {
      issues.push({
        id: 'iss_corresponding',
        ruleId: 'meta-authors',
        severity: 'warning',
        pillar: 'authors_abstract',
        title: 'Chưa chỉ định tác giả liên hệ hoặc thiếu Email',
        message: 'Bản thảo cần chỉ định 1 tác giả liên hệ kèm địa chỉ email chính xác để liên lạc phản biện.',
        suggestion: 'Cập nhật email tác giả liên hệ trong tab "Tác giả & Đơn vị".',
        fixTab: 'authors',
        fix: { type: 'NAVIGATE_TAB', payload: { tab: 'authors' } },
      });
    }

    return issues;
  },
};

export const metadataRules: QcRule[] = [
  titleRule,
  abstractRule,
  keywordsRule,
  authorsAffiliationsRule,
];
