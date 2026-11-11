import type { ManagedJournalProfile } from '@/lib/templates/journal-storage';
import type { BatchJournal } from './types';

/** The journal fields a paper gets from a template card (same rule as the single-file flow). */
export function toBatchJournal(managed: ManagedJournalProfile): BatchJournal {
  return {
    journalId: `VNUHCM-${managed.id.toUpperCase()}`,
    journalName: managed.profile.names?.vi || managed.profile.names?.en || managed.id,
    journalAbbv: managed.profile.names?.short || managed.id.toUpperCase(),
  };
}
