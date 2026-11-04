import type { QcIssue, QcPillarResult } from '../interfaces/rule';

export interface PillarDefinition {
  id: string;
  name: string;
  maxScore: number;
}

export const DEFAULT_PILLARS: PillarDefinition[] = [
  { id: 'imrad', name: 'Khung cấu trúc IMRaD', maxScore: 20 },
  { id: 'figures', name: 'Hình ảnh & Minh họa', maxScore: 15 },
  { id: 'tables', name: 'Bảng biểu', maxScore: 15 },
  { id: 'citations', name: 'Trích dẫn & Tài liệu tham khảo', maxScore: 20 },
  { id: 'authors_abstract', name: 'Tác giả & Tóm tắt', maxScore: 20 },
  { id: 'format', name: 'Định dạng & Tiêu chuẩn', maxScore: 10 },
];

export function normalizePillarId(pillar: string, issueId = ''): string {
  const p = pillar.toLowerCase().trim();
  if (p === 'imrad' || p === 'structure') return 'imrad';
  if (p === 'figures' || p === 'figure') return 'figures';
  if (p === 'tables' || p === 'table') return 'tables';
  if (p === 'citations' || p === 'references' || p === 'citation' || p === 'reference') return 'citations';
  if (p === 'authors_abstract' || p === 'authors' || p === 'author' || p === 'abstract') return 'authors_abstract';
  if (p === 'floats') {
    return issueId.includes('tbl') || issueId.includes('table') ? 'tables' : 'figures';
  }
  return 'format';
}

export function computePillarsAndScore(
  issues: QcIssue[],
  customPillars: PillarDefinition[] = DEFAULT_PILLARS
): { score: number; valid: boolean; pillars: Record<string, QcPillarResult> } {
  const pillarsRecord: Record<string, QcPillarResult> = {};
  const issuesByPillar: Record<string, QcIssue[]> = {};

  for (const p of customPillars) {
    pillarsRecord[p.id] = {
      name: p.name,
      score: p.maxScore,
      maxScore: p.maxScore,
      issuesCount: 0,
    };
    issuesByPillar[p.id] = [];
  }

  for (const issue of issues) {
    const targetPillar = normalizePillarId(issue.pillar, issue.id);
    if (!issuesByPillar[targetPillar]) {
      issuesByPillar[targetPillar] = [];
    }
    issuesByPillar[targetPillar].push(issue);
    if (pillarsRecord[targetPillar]) {
      pillarsRecord[targetPillar].issuesCount++;
    }
  }

  let totalScore = 0;

  for (const p of customPillars) {
    const pillarIssues = issuesByPillar[p.id] || [];
    let deduction = 0;

    for (const issue of pillarIssues) {
      if (issue.severity === 'error') {
        deduction += Math.round(p.maxScore * 0.4); // ~40% of pillar per error
      } else if (issue.severity === 'warning') {
        deduction += Math.round(p.maxScore * 0.2); // ~20% of pillar per warning
      }
    }

    const calculatedScore = Math.max(0, p.maxScore - deduction);
    pillarsRecord[p.id].score = calculatedScore;
    totalScore += calculatedScore;
  }

  const finalScore = Math.min(100, Math.max(0, totalScore));
  const valid = !issues.some((i) => i.severity === 'error');

  return {
    score: finalScore,
    valid,
    pillars: pillarsRecord,
  };
}
