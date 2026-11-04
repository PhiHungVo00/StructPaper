import type { Manuscript } from '@structpaper/doc-model';
import type { JournalProfile } from '@structpaper/journal-profiles';
import type { QcRule, QcIssue } from '../interfaces/rule';

export const referenceFormatRule: QcRule = {
  id: 'ref-format',
  name: 'Kiểm tra nội dung và định dạng tài liệu tham khảo',
  category: 'references',
  check(doc: Manuscript): QcIssue[] {
    const issues: QcIssue[] = [];
    const references = doc.references || [];

    if (references.length === 0) {
      issues.push({
        id: 'iss_no_refs',
        ruleId: 'ref-format',
        severity: 'error',
        pillar: 'citations',
        title: 'Chưa có danh mục tài liệu tham khảo',
        message: 'Bản thảo chưa có danh mục tài liệu tham khảo.',
        suggestion: 'Thêm tài liệu tham khảo vào tab "Tài liệu tham khảo".',
        fixTab: 'refs',
        fix: { type: 'NAVIGATE_TAB', payload: { tab: 'refs' } },
      });
      return issues;
    }

    for (const ref of references) {
      if (!ref.raw || !ref.raw.trim()) {
        issues.push({
          id: `iss_empty_ref_${ref.id}`,
          ruleId: 'ref-format',
          severity: 'error',
          pillar: 'citations',
          targetId: ref.id,
          title: `Tài liệu tham khảo [${ref.id}] để trống`,
          message: `Mục tài liệu tham khảo [${ref.id}] chưa có nội dung trích dẫn.`,
          suggestion: 'Vui lòng nhập thông tin trích dẫn hoặc xóa mục trống.',
          fixTab: 'refs',
          fix: { type: 'NAVIGATE_TAB', payload: { tab: 'refs', targetId: ref.id } },
        });
      } else if (ref.parse === 'failed') {
        issues.push({
          id: `iss_parse_failed_ref_${ref.id}`,
          ruleId: 'ref-format',
          severity: 'warning',
          pillar: 'citations',
          targetId: ref.id,
          title: `Định dạng tài liệu tham khảo [${ref.id}] chưa chuẩn hóa`,
          message: `Tài liệu tham khảo [${ref.id}] chưa phân tích được cấu trúc tác giả, năm, tên bài.`,
          suggestion: 'Hiệu chỉnh lại cấu trúc trích dẫn theo chuẩn quy định của tạp chí.',
          fixTab: 'refs',
          fix: { type: 'NAVIGATE_TAB', payload: { tab: 'refs', targetId: ref.id } },
        });
      }
    }

    return issues;
  },
};

export const referenceDoiRule: QcRule = {
  id: 'ref-doi',
  name: 'Kiểm tra mã định danh số DOI cho tài liệu tham khảo',
  category: 'references',
  check(doc: Manuscript): QcIssue[] {
    const issues: QcIssue[] = [];
    const references = doc.references || [];

    for (const ref of references) {
      const cslDoi = (ref.csl as Record<string, unknown> | undefined)?.DOI as string | undefined;
      const hasDoi = Boolean((ref.doi && ref.doi.trim()) || (cslDoi && cslDoi.trim()));

      if (!hasDoi && ref.raw && ref.raw.trim()) {
        issues.push({
          id: `iss_missing_doi_${ref.id}`,
          ruleId: 'ref-doi',
          severity: 'info',
          pillar: 'citations',
          targetId: ref.id,
          title: `Tài liệu tham khảo [${ref.id}] thiếu mã DOI`,
          message: `Khuyến nghị bổ sung mã DOI cho tài liệu [${ref.id}] để gia tăng chỉ số trích dẫn trực tuyến.`,
          suggestion: 'Tra cứu mã DOI (ví dụ: 10.xxxx/xxxx) và bổ sung vào thông tin tài liệu.',
          fixTab: 'refs',
          fix: { type: 'NAVIGATE_TAB', payload: { tab: 'refs', targetId: ref.id } },
        });
      }
    }

    return issues;
  },
};

export const referenceRules: QcRule[] = [
  referenceFormatRule,
  referenceDoiRule,
];
