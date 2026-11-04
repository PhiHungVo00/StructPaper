import type { Manuscript, Command } from '@structpaper/doc-model';
import { computeNumbering } from '@structpaper/doc-model';
import type { JournalProfile } from '@structpaper/journal-profiles';
import { VNUHCM_HS_PROFILE } from '@structpaper/journal-profiles';
import type {
  QcRule,
  QcIssue,
  QcResult,
  QcContext,
} from '../interfaces/rule';
import { ALL_DEFAULT_QC_RULES } from '../rules';
import { computePillarsAndScore } from './scoring';

export class QcEngine {
  private rules: QcRule[];
  private lastIssues: Map<string, QcIssue> = new Map();

  constructor(customRules?: QcRule[]) {
    this.rules = customRules ? [...customRules] : [...ALL_DEFAULT_QC_RULES];
  }

  public registerRule(rule: QcRule): void {
    const existingIdx = this.rules.findIndex((r) => r.id === rule.id);
    if (existingIdx >= 0) {
      this.rules[existingIdx] = rule;
    } else {
      this.rules.push(rule);
    }
  }

  public getRules(): QcRule[] {
    return [...this.rules];
  }

  public run(
    doc: Manuscript,
    profile: JournalProfile = VNUHCM_HS_PROFILE,
    context?: QcContext
  ): QcResult {
    const activeContext: QcContext = {
      ...context,
      numbering: context?.numbering ?? computeNumbering(doc),
    };

    const allIssues: QcIssue[] = [];
    this.lastIssues.clear();

    for (const rule of this.rules) {
      try {
        const issues = rule.check(doc, profile, activeContext);
        if (issues && Array.isArray(issues)) {
          for (const issue of issues) {
            allIssues.push(issue);
            this.lastIssues.set(issue.id, issue);
          }
        }
      } catch (err) {
        console.error(`[QcEngine] Rule "${rule.id}" failed execution:`, err);
      }
    }

    const { score, valid, pillars } = computePillarsAndScore(allIssues);

    return {
      score,
      valid,
      issues: allIssues,
      pillars,
    };
  }

  public quickFix(issueId: string, issuesList?: QcIssue[]): Command | null {
    let issue: QcIssue | undefined;

    if (issuesList) {
      issue = issuesList.find((i) => i.id === issueId);
    }

    if (!issue) {
      issue = this.lastIssues.get(issueId);
    }

    if (issue && issue.fix) {
      return issue.fix;
    }

    if (issue && issue.fixTab) {
      return {
        type: 'NAVIGATE_TAB',
        payload: { tab: issue.fixTab, targetId: issue.targetId },
      };
    }

    return null;
  }
}

export const defaultQcEngine = new QcEngine();

export function runQc(
  doc: Manuscript,
  profile?: JournalProfile,
  context?: QcContext
): QcResult {
  return defaultQcEngine.run(doc, profile, context);
}

export function quickFix(
  issueId: string,
  issuesList?: QcIssue[]
): Command | null {
  return defaultQcEngine.quickFix(issueId, issuesList);
}
