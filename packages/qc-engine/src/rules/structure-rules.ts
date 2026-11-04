import type { Manuscript, Section, Block, Inline } from '@structpaper/doc-model';
import { inlineToPlainText } from '@structpaper/doc-model';
import type { JournalProfile } from '@structpaper/journal-profiles';
import type { QcRule, QcIssue } from '../interfaces/rule';

function inlinesToString(inlines?: Inline[]): string {
  if (!inlines || inlines.length === 0) return '';
  return inlineToPlainText(inlines).trim();
}

function collectSections(sections: Section[]): Section[] {
  const result: Section[] = [];
  for (const s of sections) {
    result.push(s);
    if (s.children && s.children.length > 0) {
      result.push(...collectSections(s.children));
    }
  }
  return result;
}

export const imradStructureRule: QcRule = {
  id: 'struct-imrad',
  name: 'Kiểm tra cấu trúc IMRaD chuẩn',
  category: 'structure',
  check(doc: Manuscript): QcIssue[] {
    const issues: QcIssue[] = [];
    const allSections = collectSections(doc.body || []);
    const titles = allSections.map((s) => inlinesToString(s.title).toLowerCase());

    const hasIntro = titles.some((t) =>
      /giới thiệu|đặt vấn đề|mở đầu|introduction/i.test(t)
    );
    const hasMethods = titles.some((t) =>
      /phương pháp|vật liệu|thực nghiệm|đối tượng|methods|materials|khảo sát/i.test(t)
    );
    const hasResults = titles.some((t) =>
      /kết quả|results|thực nghiệm và thảo luận/i.test(t)
    );
    const hasDiscussion = titles.some((t) =>
      /bàn luận|thảo luận|discussion|kết quả và thảo luận|tổng quan/i.test(t)
    );
    const hasConclusion = titles.some((t) =>
      /kết luận|conclusions?|kết luận và kiến nghị/i.test(t)
    );

    if (!hasIntro) {
      issues.push({
        id: 'iss_intro',
        ruleId: 'struct-imrad',
        severity: 'warning',
        pillar: 'imrad',
        title: 'Chưa phát hiện mục [Giới thiệu / Đặt vấn đề]',
        message: 'Khung bài báo khoa học chuẩn cần có mục Mở đầu hoặc Giới thiệu (Introduction).',
        suggestion: 'Kiểm tra lại tiêu đề mục cấp 1 (H1) trong nội dung bản thảo.',
        fixTab: 'sections',
        fix: { type: 'NAVIGATE_TAB', payload: { tab: 'sections' } },
      });
    }

    if (!hasMethods) {
      issues.push({
        id: 'iss_methods',
        ruleId: 'struct-imrad',
        severity: 'info',
        pillar: 'imrad',
        title: 'Khuyến nghị bổ sung mục [Phương pháp nghiên cứu]',
        message: 'Các bài báo thực nghiệm cần mục Methods / Phương pháp mô tả quy trình thực hiện.',
        suggestion: 'Đảm bảo có phần mô tả phương pháp, dữ liệu hoặc đối tượng nghiên cứu.',
        fixTab: 'sections',
        fix: { type: 'NAVIGATE_TAB', payload: { tab: 'sections' } },
      });
    }

    if (!hasConclusion) {
      issues.push({
        id: 'iss_conclusion',
        ruleId: 'struct-imrad',
        severity: 'info',
        pillar: 'imrad',
        title: 'Khuyến nghị bổ sung mục [Kết luận]',
        message: 'Bài báo nên có phần Kết luận (Conclusion) tóm lược đóng góp và hướng nghiên cứu tương lai.',
        suggestion: 'Đặt tiêu đề H1 rõ ràng cho phần Kết luận ở cuối bài.',
        fixTab: 'sections',
        fix: { type: 'NAVIGATE_TAB', payload: { tab: 'sections' } },
      });
    }

    const imradFoundCount = [hasIntro, hasMethods, hasResults, hasDiscussion, hasConclusion].filter(Boolean).length;
    if (imradFoundCount < 3) {
      issues.push({
        id: 'iss_imrad_incomplete',
        ruleId: 'struct-imrad',
        severity: 'warning',
        pillar: 'imrad',
        title: 'Cấu trúc bài viết chưa đạt chuẩn IMRaD đầy đủ',
        message: `Mới phát hiện ${imradFoundCount}/5 phân mục chính của cấu trúc IMRaD (Introduction, Methods, Results, Discussion, Conclusion).`,
        suggestion: 'Bổ sung các đề mục cấp 1 tương ứng để hoàn thiện cấu trúc IMRaD.',
        fixTab: 'sections',
        fix: { type: 'NAVIGATE_TAB', payload: { tab: 'sections' } },
      });
    }

    return issues;
  },
};

export const emptyHeadingRule: QcRule = {
  id: 'struct-empty-heading',
  name: 'Kiểm tra tiêu đề đề mục để trống',
  category: 'structure',
  check(doc: Manuscript): QcIssue[] {
    const issues: QcIssue[] = [];
    const allSections = collectSections(doc.body || []);

    for (const sec of allSections) {
      const text = inlinesToString(sec.title);
      if (!text) {
        issues.push({
          id: `iss_empty_heading_${sec.id}`,
          ruleId: 'struct-empty-heading',
          severity: 'error',
          pillar: 'format',
          targetId: sec.id,
          title: 'Tiêu đề đề mục (Section Heading) để trống',
          message: `Đề mục cấp ${sec.level || 1} [${sec.id}] chưa có nội dung tiêu đề.`,
          suggestion: 'Vui lòng nhập tên tiêu đề hoặc xóa mục này nếu không sử dụng.',
          fixTab: 'sections',
          fix: { type: 'NAVIGATE_TAB', payload: { tab: 'sections', targetId: sec.id } },
        });
      }
    }

    return issues;
  },
};

export const emptyParagraphRule: QcRule = {
  id: 'struct-empty-paragraph',
  name: 'Kiểm tra đoạn văn rỗng',
  category: 'structure',
  check(doc: Manuscript): QcIssue[] {
    const issues: QcIssue[] = [];
    const allSections = collectSections(doc.body || []);

    for (const sec of allSections) {
      if (sec.blocks) {
        for (const block of sec.blocks) {
          if (block.type === 'paragraph') {
            const text = inlinesToString(block.content);
            if (!text) {
              issues.push({
                id: `iss_empty_para_${block.id}`,
                ruleId: 'struct-empty-paragraph',
                severity: 'error',
                pillar: 'format',
                targetId: block.id,
                title: 'Đoạn văn bản để trống',
                message: 'Phát hiện đoạn văn bản trong bài đang để trống không có nội dung.',
                suggestion: 'Vui lòng nhập nội dung cho đoạn văn hoặc xóa đoạn trống này.',
                fixTab: 'sections',
                fix: { type: 'NAVIGATE_TAB', payload: { tab: 'sections', targetId: block.id } },
              });
            }
          }
        }
      }
    }

    return issues;
  },
};

export const structureRules: QcRule[] = [
  imradStructureRule,
  emptyHeadingRule,
  emptyParagraphRule,
];
