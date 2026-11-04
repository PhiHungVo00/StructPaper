import { createStore, type StoreApi } from 'zustand/vanilla';
import type { Manuscript } from '@structpaper/doc-model';

export interface ManuscriptState {
  manuscript: Manuscript | null;
  rev: number;
  savedRev: number;
  isDirty: boolean;
  setManuscript: (doc: Manuscript) => void;
  markSaved: (rev?: number) => void;
  setDocument: (doc: Manuscript, bumpRev?: boolean) => void;
  reset: () => void;
}

export type ManuscriptStore = StoreApi<ManuscriptState>;

/**
 * Creates an isolated Zustand vanilla store for managing a Manuscript lifecycle.
 * The store tracks revision counter (`rev`), last saved revision (`savedRev`),
 * and dirty flag (`isDirty`).
 */
export function createManuscriptStore(
  initialDoc: Manuscript | null = null
): ManuscriptStore {
  return createStore<ManuscriptState>((set, get) => ({
    manuscript: initialDoc,
    rev: 0,
    savedRev: 0,
    isDirty: false,

    setManuscript: (doc: Manuscript) =>
      set({
        manuscript: doc,
        rev: 0,
        savedRev: 0,
        isDirty: false,
      }),

    markSaved: (rev?: number) => {
      const currentRev = get().rev;
      const targetRev = rev !== undefined ? rev : currentRev;
      set({
        savedRev: targetRev,
        isDirty: currentRev !== targetRev,
      });
    },

    setDocument: (doc: Manuscript, bumpRev: boolean = true) => {
      const currentRev = get().rev;
      const nextRev = bumpRev ? currentRev + 1 : currentRev;
      set({
        manuscript: doc,
        rev: nextRev,
        isDirty: nextRev !== get().savedRev,
      });
    },

    reset: () =>
      set({
        manuscript: null,
        rev: 0,
        savedRev: 0,
        isDirty: false,
      }),
  }));
}

/**
 * Default singleton store instance.
 */
export const defaultManuscriptStore = createManuscriptStore();
export const useManuscriptStore = defaultManuscriptStore;
