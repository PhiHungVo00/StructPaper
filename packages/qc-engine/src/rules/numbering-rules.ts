import type { Manuscript } from '@structpaper/doc-model';
import { computeNumbering } from '@structpaper/doc-model';
import type { JournalProfile } from '@structpaper/journal-profiles';
import type { QcRule, QcIssue, QcContext } from '../interfaces/rule';

export const danglingCitesRule: QcRule = {
  id: 'num-dangling-cites',
  name: 'Kiểm tra trích dẫn thiếu danh mục (Dangling Citations)',
  category: 'numbering',
  check(doc: Manuscript, _profile: JournalProfile, context?: QcContext): QcIssue[] {
    const numbering = context?.numbering ?? computeNumbering(doc);
    const dangling = numbering.danglingCites || [];

    if (dangling.length === 0) return [];

    return [
      {
        id: 'iss_missing_cites',
        ruleId: 'num-dangling-cites',
        severity: 'error',
        pillar: 'citations',
        title: `Phát hiện ${dangling.length} trích dẫn thiếu trong danh mục tham khảo`,
        message: `Trong văn bản có viện dẫn các mã trích dẫn [${dangling.slice(0, 5).join(', ')}${dangling.length > 5 ? '...' : ''}] nhưng danh mục tài liệu chưa có mục tương ứng.`,
        suggestion: 'Thêm các mục tài liệu còn thiếu hoặc hiệu chỉnh lại chỉ số trích dẫn trong tab "Tài liệu tham khảo".',
        fixTab: 'refs',
        fix: { type: 'NAVIGATE_TAB', payload: { tab: 'refs' } },
      },
    ];
  },
};

export const uncitedRefsRule: QcRule = {
  id: 'num-uncited-refs',
  name: 'Kiểm tra tài liệu tham khảo chưa trích dẫn (Uncited References)',
  category: 'numbering',
  check(doc: Manuscript, _profile: JournalProfile, context?: QcContext): QcIssue[] {
    const numbering = context?.numbering ?? computeNumbering(doc);
    const uncited = numbering.uncitedRefs || [];

    if (uncited.length === 0) return [];

    return [
      {
        id: 'iss_uncited_refs',
        ruleId: 'num-uncited-refs',
        severity: 'warning',
        pillar: 'citations',
        title: `Có ${uncited.length} tài liệu tham khảo chưa được viện dẫn trong bài`,
        message: `Tài liệu số [${uncited.slice(0, 5).join(', ')}${uncited.length > 5 ? '...' : ''}] có trong danh mục nhưng chưa thấy xuất hiện mã trích dẫn trong văn bản.`,
        suggestion: 'Kiểm tra bổ sung trích dẫn [X] vào nội dung bài viết tương ứng.',
        fixTab: 'refs',
        fix: { type: 'NAVIGATE_TAB', payload: { tab: 'refs' } },
      },
    ];
  },
};

export const firstMentionBeforeFloatRule: QcRule = {
  id: 'num-first-mention',
  name: 'Kiểm tra thứ tự đề cập hình ảnh và bảng biểu (First Mention Before Float)',
  category: 'numbering',
  check(doc: Manuscript, _profile: JournalProfile, context?: QcContext): QcIssue[] {
    const numbering = context?.numbering ?? computeNumbering(doc);
    const issues: QcIssue[] = [];

    if (numbering.firstMentionBeforeFloat) {
      for (const [floatId, wasMentioned] of numbering.firstMentionBeforeFloat.entries()) {
        if (!wasMentioned) {
          const isTable = numbering.tables?.has(floatId);
          const kind = isTable ? 'Bảng' : 'Hình';
          const num = isTable ? numbering.tables.get(floatId) : numbering.figures?.get(floatId);
          const label = num !== undefined ? `${kind} ${num}` : `mục ${floatId}`;

          issues.push({
            id: `iss_first_mention_${floatId}`,
            ruleId: 'num-first-mention',
            severity: 'warning',
            pillar: 'format',
            targetId: floatId,
            title: `${label} xuất hiện trước khi được nhắc đến trong bài`,
            message: `Quy chuẩn bài báo yêu cầu ${label.toLowerCase()} phải được dẫn giải trong văn bản trước khi xuất hiện.`,
            suggestion: `Thêm câu đề cập đến ${label.toLowerCase()} trong đoạn văn phía trước khối minh họa.`,
            fixTab: 'sections',
            fix: { type: 'NAVIGATE_TAB', payload: { tab: 'sections', targetId: floatId } },
          });
        }
      }
    }

    return issues;
  },
};

export const brokenXrefRule: QcRule = {
  id: 'num-xref-broken',
  name: 'Kiểm tra liên kết chéo bị gãy (Broken Cross-references)',
  category: 'numbering',
  check(doc: Manuscript, _profile: JournalProfile, context?: QcContext): QcIssue[] {
    const numbering = context?.numbering ?? computeNumbering(doc);
    const broken = numbering.xrefBroken || [];

    if (broken.length === 0) return [];

    return [
      {
        id: 'iss_xref_broken',
        ruleId: 'num-xref-broken',
        severity: 'error',
        pillar: 'format',
        title: `Phát hiện ${broken.length} liên kết chéo (xref) bị gãy`,
        message: `Các tham chiếu liên kết chéo tới mục [${broken.join(', ')}] không tồn tại trong bản thảo.`,
        suggestion: 'Kiểm tra và cập nhật lại mã liên kết chéo tới mục tiêu hợp lệ.',
        fixTab: 'sections',
        fix: { type: 'NAVIGATE_TAB', payload: { tab: 'sections' } },
      },
    ];
  },
};

export const numberingRules: QcRule[] = [
  danglingCitesRule,
  uncitedRefsRule,
  firstMentionBeforeFloatRule,
  brokenXrefRule,
];
