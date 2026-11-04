import { JournalProfile } from './types';
import { ALL_JOURNAL_PROFILES } from './profiles';

export * from './types';
export * from './schemas';
export * from './profiles';

/**
 * Retrieves a journal profile by its unique ID (case-insensitive).
 *
 * @param id The journal identifier, e.g. 'VNUHCM-HS' or 'vnuhcm-hs'
 * @throws Error if no profile matches the provided id
 */
export function getJournalProfile(id: string): JournalProfile {
  const normalizedId = id.trim().toLowerCase();
  const profile = ALL_JOURNAL_PROFILES.find(
    (p) => p.id.toLowerCase() === normalizedId
  );

  if (!profile) {
    const available = ALL_JOURNAL_PROFILES.map((p) => p.id).join(', ');
    throw new Error(
      `No journal profile found for id: "${id}". Available profiles: [${available}]`
    );
  }

  return profile;
}

/**
 * Returns all registered journal profiles.
 */
export function getAllJournalProfiles(): JournalProfile[] {
  return [...ALL_JOURNAL_PROFILES];
}
