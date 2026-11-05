import { ResolvedProfile } from '../types';
import { BASE_PROFILE } from '../profiles/base.profile';
import {
  ALL_JOURNAL_IDS,
  JOURNAL_DEFINITIONS,
  normalizeJournalId,
} from '../profiles/journals';
import {
  ARTICLE_TYPE_DEFINITIONS,
  normalizeArticleTypeId,
} from '../profiles/article-types';
import { deepMerge } from './deep-merge';

/**
 * Resolves a Journal Profile through 3-tier inheritance:
 * 1. Tier 1: Base Profile (common default configuration)
 * 2. Tier 2: Journal Profile (e.g. std, hs, ssh, ebl, et, ees, arns)
 * 3. Tier 3: Article Type Profile (e.g. research, review, editorial, letter, etc.)
 * 4. Tier 4: Runtime Overrides (ad-hoc custom config passed by caller)
 *
 * @param journalId Target journal identifier or alias (e.g. 'hs', 'vnuhcm-hs', 'std')
 * @param articleTypeId Optional article type identifier or alias (e.g. 'research', 'editorial')
 * @param overrides Optional custom object overrides
 * @returns Fully resolved, deeply-merged, immutable ResolvedProfile
 */
export function resolveProfile(
  journalId: string,
  articleTypeId?: string,
  overrides?: Record<string, unknown>
): ResolvedProfile {
  const normalizedJournalId = normalizeJournalId(journalId);

  if (!normalizedJournalId || !JOURNAL_DEFINITIONS[normalizedJournalId]) {
    const available = ALL_JOURNAL_IDS.join(', ');
    throw new Error(
      `Unknown journal profile: "${journalId}". Available journals: [${available}]`
    );
  }

  const journalTier = JOURNAL_DEFINITIONS[normalizedJournalId];
  const targetJournalId = journalTier.id;

  // Tier 1 -> Tier 2
  let merged = deepMerge(
    BASE_PROFILE as unknown as Record<string, unknown>,
    journalTier as unknown as Record<string, unknown>
  );

  // Tier 3: Article Type
  let activeArticleTypeId: string | undefined;
  if (articleTypeId !== undefined && articleTypeId !== null && articleTypeId !== '') {
    const normalizedArticleTypeId = normalizeArticleTypeId(articleTypeId);
    const articleTypeTier = ARTICLE_TYPE_DEFINITIONS[normalizedArticleTypeId];

    if (!articleTypeTier) {
      const available = Object.keys(ARTICLE_TYPE_DEFINITIONS).join(', ');
      throw new Error(
        `Unknown article type: "${articleTypeId}". Available article types: [${available}]`
      );
    }

    activeArticleTypeId = normalizedArticleTypeId;
    const { id: _articleId, ...articleTypeOverrides } = articleTypeTier;
    merged = deepMerge(
      merged,
      articleTypeOverrides as unknown as Record<string, unknown>
    );
  }

  // Tier 4: Overrides
  if (overrides && Object.keys(overrides).length > 0) {
    merged = deepMerge(merged, overrides);
  }

  // Ensure journal ID is preserved unless explicitly overridden in overrides
  if (!overrides || !('id' in overrides)) {
    merged.id = targetJournalId;
  }

  if (activeArticleTypeId) {
    merged.articleType = activeArticleTypeId;
  }

  return merged as unknown as ResolvedProfile;
}
