import type {
  Manuscript,
  Block,
  Section,
  FigureBlock,
  TableBlock,
  Inline,
} from '@structpaper/doc-model';
import { inlineToPlainText } from '@structpaper/doc-model';
import type { JournalProfile } from '@structpaper/journal-profiles';
import type { QcRule, QcIssue } from '../interfaces/rule';

function inlinesToString(inlines?: Inline[]): string {
  if (!inlines || inlines.length === 0) return '';
  return inlineToPlainText(inlines).trim();
}

function walkAllBlocks(sections: Section[], visitor: (block: Block) => void): void {
  for (const sec of sections) {
    if (sec.blocks) {
      for (const block of sec.blocks) {
        visitor(block);
        if (block.type === 'quote' || block.type === 'box') {
          if (block.content) {
            for (const sub of block.content) {
              visitor(sub);
            }
          }
        }
      }
    }
    if (sec.children && sec.children.length > 0) {
      walkAllBlocks(sec.children, visitor);
    }
  }
}

export const tableCaptionRule: QcRule = {
  id: 'float-table-caption',
  name: 'Kiểm tra chú thích bảng biểu (Table Caption)',
  category: 'floats',
  check(doc: Manuscript): QcIssue[] {
    const issues: QcIssue[] = [];
    walkAllBlocks(doc.body || [], (block) => {
      if (block.type === 'table') {
        const tbl = block as TableBlock;
        const captionText = inlinesToString(tbl.caption);
        if (!captionText) {
          issues.push({
            id: `iss_tbl_no_cap_${tbl.id}`,
            ruleId: 'float-table-caption',
            severity: 'error',
            pillar: 'tables',
            targetId: tbl.id,
            title: `Bảng ${tbl.id} thiếu chú thích (Caption)`,
            message: `Bảng ${tbl.id} chưa có tên hoặc chú thích tiêu đề bảng (caption).`,
            suggestion: 'Quy chuẩn bài báo yêu cầu tất cả bảng biểu phải có chú thích tiêu đề phía trên.',
            fixTab: 'sections',
            fix: { type: 'SET_TABLE_CAPTION', payload: { tableId: tbl.id } },
          });
        }
      }
    });
    return issues;
  },
};

export const tableEmptyRule: QcRule = {
  id: 'float-table-empty',
  name: 'Kiểm tra bảng biểu rỗng (Empty Table)',
  category: 'floats',
  check(doc: Manuscript): QcIssue[] {
    const issues: QcIssue[] = [];
    walkAllBlocks(doc.body || [], (block) => {
      if (block.type === 'table') {
        const tbl = block as TableBlock;
        const hasContent =
          tbl.grid &&
          tbl.grid.length > 0 &&
          tbl.grid.some((row) =>
            row.some((cell) => cell.content && inlinesToString(cell.content).length > 0)
          );

        if (!hasContent) {
          issues.push({
            id: `iss_empty_table_${tbl.id}`,
            ruleId: 'float-table-empty',
            severity: 'error',
            pillar: 'tables',
            targetId: tbl.id,
            title: `Bảng ${tbl.id} trống không`,
            message: `Bảng số liệu ${tbl.id} chưa có bất kỳ dữ liệu hàng hay cột nào.`,
            suggestion: 'Nhập dữ liệu cho bảng, dán từ Clipboard hoặc xóa bảng nếu không dùng.',
            fixTab: 'sections',
            fix: { type: 'NAVIGATE_TAB', payload: { tab: 'sections', targetId: tbl.id } },
          });
        }
      }
    });
    return issues;
  },
};

export const figureCaptionRule: QcRule = {
  id: 'float-figure-caption',
  name: 'Kiểm tra chú thích hình ảnh (Figure Caption)',
  category: 'floats',
  check(doc: Manuscript): QcIssue[] {
    const issues: QcIssue[] = [];
    walkAllBlocks(doc.body || [], (block) => {
      if (block.type === 'figure') {
        const fig = block as FigureBlock;
        const captionText = inlinesToString(fig.caption);
        if (!captionText) {
          issues.push({
            id: `iss_fig_no_cap_${fig.id}`,
            ruleId: 'float-figure-caption',
            severity: 'error',
            pillar: 'figures',
            targetId: fig.id,
            title: `Hình ${fig.id} thiếu chú thích (Caption)`,
            message: `Hình ${fig.id} chưa có tên hoặc chú thích tiêu đề hình (caption).`,
            suggestion: 'Quy chuẩn bài báo yêu cầu tất cả hình ảnh minh họa phải có chú thích phía dưới.',
            fixTab: 'sections',
            fix: { type: 'SET_FIGURE_CAPTION', payload: { figureId: fig.id } },
          });
        }
      }
    });
    return issues;
  },
};

export const figureEmptyRule: QcRule = {
  id: 'float-figure-empty',
  name: 'Kiểm tra hình ảnh rỗng (Empty Figure)',
  category: 'floats',
  check(doc: Manuscript): QcIssue[] {
    const issues: QcIssue[] = [];
    walkAllBlocks(doc.body || [], (block) => {
      if (block.type === 'figure') {
        const fig = block as FigureBlock;
        const hasAsset = Boolean(fig.assetId && fig.assetId.trim().length > 0);
        const hasPanels = Boolean(
          fig.panels && fig.panels.length > 0 && fig.panels.some((p) => p.assetId && p.assetId.trim())
        );

        if (!hasAsset && !hasPanels) {
          issues.push({
            id: `iss_empty_fig_${fig.id}`,
            ruleId: 'float-figure-empty',
            severity: 'error',
            pillar: 'figures',
            targetId: fig.id,
            title: `Hình ảnh ${fig.id} chưa có tệp ảnh`,
            message: `Hình ${fig.id} chưa có tệp ảnh hoặc đường dẫn hình ảnh được tải lên.`,
            suggestion: 'Tải lên tệp ảnh hoặc dán ảnh vào khung hình ảnh minh họa.',
            fixTab: 'sections',
            fix: { type: 'NAVIGATE_TAB', payload: { tab: 'sections', targetId: fig.id } },
          });
        }
      }
    });
    return issues;
  },
};

export const figureDpiRule: QcRule = {
  id: 'float-figure-dpi',
  name: 'Kiểm tra độ phân giải hình ảnh (Figure DPI >= 300)',
  category: 'floats',
  check(doc: Manuscript): QcIssue[] {
    const issues: QcIssue[] = [];
    const assets = doc.assets || {};

    walkAllBlocks(doc.body || [], (block) => {
      if (block.type === 'figure') {
        const fig = block as FigureBlock;
        const assetIds: string[] = [];
        if (fig.assetId) assetIds.push(fig.assetId);
        if (fig.panels) {
          for (const p of fig.panels) {
            if (p.assetId) assetIds.push(p.assetId);
          }
        }

        for (const aId of assetIds) {
          const meta = assets[aId];
          if (meta && typeof meta.dpi === 'number' && meta.dpi < 300) {
            issues.push({
              id: `iss_fig_dpi_${fig.id}_${aId}`,
              ruleId: 'float-figure-dpi',
              severity: 'warning',
              pillar: 'figures',
              targetId: fig.id,
              title: `Độ phân giải hình ${fig.id} thấp (${meta.dpi} DPI < 300 DPI)`,
              message: `Tệp ảnh của hình ${fig.id} có độ phân giải ${meta.dpi} DPI. Tạp chí yêu cầu tối thiểu 300 DPI để chế bản in ấn chất lượng cao.`,
              suggestion: 'Thay thế bằng phiên bản hình ảnh có độ phân giải cao hơn (tối thiểu 300 DPI).',
              fixTab: 'sections',
              fix: { type: 'REPLACE_ASSET', payload: { assetId: aId, figureId: fig.id } },
            });
          }
        }
      }
    });

    return issues;
  },
};

export const floatRules: QcRule[] = [
  tableCaptionRule,
  tableEmptyRule,
  figureCaptionRule,
  figureEmptyRule,
  figureDpiRule,
];
