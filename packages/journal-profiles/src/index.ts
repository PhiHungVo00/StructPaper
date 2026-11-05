import { JournalProfile } from './types';
import { ALL_JOURNAL_PROFILES } from './profiles';
import { resolveProfile } from './resolver/resolve-profile';

export * from './types';
export * from './schemas';
export * from './profiles';
export * from './resolver';

/**
 * Retrieves a journal profile by its unique ID (case-insensitive).
 * Supports both legacy registered profiles and 3-tier resolved profiles.
 *
 * @param id The journal identifier, e.g. 'VNUHCM-HS' or 'vnuhcm-hs' or 'std'
 * @throws Error if no profile matches the provided id
 */
export function getJournalProfile(id: string): JournalProfile {
  const normalizedId = id.trim().toLowerCase();
  const profile = ALL_JOURNAL_PROFILES.find(
    (p) => p.id.toLowerCase() === normalizedId
  );

  if (profile) {
    return profile;
  }

  try {
    return resolveProfile(id);
  } catch {
    const available = ALL_JOURNAL_PROFILES.map((p) => p.id).join(', ');
    throw new Error(
      `No journal profile found for id: "${id}". Available profiles: [${available}]`
    );
  }
}

/**
 * Returns all registered journal profiles.
 */
export function getAllJournalProfiles(): JournalProfile[] {
  return [...ALL_JOURNAL_PROFILES];
}
