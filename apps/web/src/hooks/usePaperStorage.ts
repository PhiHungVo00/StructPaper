import { useState, useCallback } from 'react';
import type { CompletePaper } from '@/types/paper';
import { savePaperToIndexedDb, loadPaperFromIndexedDb } from '@/lib/storage/paper-sync';

export interface UsePaperStorageReturn {
  isSaving: boolean;
  isLoading: boolean;
  error: Error | null;
  savePaper: (paper: CompletePaper) => Promise<boolean>;
  loadPaper: (id: string) => Promise<CompletePaper | null>;
}

/**
 * Custom React hook for manuscript persistence & synchronization with IndexedDB.
 * Encapsulates all database operations, binary asset extraction, and loading states,
 * keeping the presentation layer clean, decoupled, and easily swappable (e.g. SQLite, Cloud).
 */
export function usePaperStorage(): UsePaperStorageReturn {
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const savePaper = useCallback(async (paper: CompletePaper): Promise<boolean> => {
    setIsSaving(true);
    setError(null);
    try {
      await savePaperToIndexedDb(paper);
      return true;
    } catch (err) {
      const errObj = err instanceof Error ? err : new Error(String(err));
      setError(errObj);
      console.error('[usePaperStorage] save error:', errObj);
      return false;
    } finally {
      setIsSaving(false);
    }
  }, []);

  const loadPaper = useCallback(async (id: string): Promise<CompletePaper | null> => {
    setIsLoading(true);
    setError(null);
    try {
      return await loadPaperFromIndexedDb(id);
    } catch (err) {
      const errObj = err instanceof Error ? err : new Error(String(err));
      setError(errObj);
      console.error('[usePaperStorage] load error:', errObj);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isSaving,
    isLoading,
    error,
    savePaper,
    loadPaper,
  };
}
