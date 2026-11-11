import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import type { CompletePaper } from '@/types/paper';
import { AutosaveController, type SaveState } from '@/lib/documents/autosave-controller';
import { DocumentApi } from '@/lib/documents/document-api';
import { DocumentSync } from '@/lib/documents/document-sync';

export interface UseDocumentAutosaveOptions {
  /** Current editor content. A new object identity means "edited". */
  paper: CompletePaper;
  /** Identity of the loaded document; resets the baseline when it changes. */
  documentId: string;
  saveLocal: (paper: CompletePaper) => Promise<boolean>;
  /** Pass false to disable server sync (tests, fully-offline desktop). */
  remote?: boolean;
  debounceMs?: number;
}

export function useDocumentAutosave({
  paper,
  documentId,
  saveLocal,
  remote = true,
  debounceMs = 1200,
}: UseDocumentAutosaveOptions) {
  const [state, setState] = useState<SaveState>('idle');
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const baseline = useRef<CompletePaper>(paper);
  const saveLocalRef = useRef(saveLocal);
  saveLocalRef.current = saveLocal;

  const sync = useMemo(() => (remote ? new DocumentSync({ api: new DocumentApi() }) : null), [remote]);

  const controller = useMemo(
    () =>
      new AutosaveController({
        debounceMs,
        sync,
        saveLocal: (p) => saveLocalRef.current(p),
        onState: (s, info) => {
          setState(s);
          if (info?.savedAt) setSavedAt(info.savedAt);
        },
      }),
    [sync, debounceMs]
  );

  // New document loaded: it is by definition clean.
  useEffect(() => {
    baseline.current = paper;
    setState('idle');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documentId]);

  // Any later content change schedules an autosave.
  useEffect(() => {
    if (paper !== baseline.current) controller.notify(paper);
  }, [paper, controller]);

  // Don't lose the last edits when the tab is hidden/closed.
  useEffect(() => {
    controller.activate();
    const flush = () => void controller.flush();
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') flush();
    };
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pagehide', flush);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pagehide', flush);
      void controller.flush();
      controller.dispose();
    };
  }, [controller]);

  const saveNow = useCallback((p?: CompletePaper) => controller.saveNow(p ?? paper), [controller, paper]);
  const flush = useCallback(() => controller.flush(), [controller]);
  const resolveKeepMine = useCallback(() => controller.resolveKeepMine(), [controller]);

  return { state, savedAt, saveNow, flush, resolveKeepMine, sync };
}
