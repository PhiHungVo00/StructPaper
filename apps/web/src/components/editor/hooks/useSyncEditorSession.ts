'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useEditorSession } from '@/context/EditorSessionContext';
import type { AutosaveStatus } from './useEditorAutoSave';
import {
  resolveDocumentDisplayTitle,
  resolveDocumentSaveState,
} from '@/lib/editor/save-status';

export interface UseSyncEditorSessionOptions {
  paperId?: string;
  displayName?: string;
  autosaveStatus: AutosaveStatus;
  isDirty: boolean;
  saveSuccess: boolean;
  onManualSave?: () => Promise<void> | void;
}

/**
 * Synchronizes the active manuscript's display name ("Tên hiển thị bài báo") and save state
 * with EditorSessionContext so top-level chrome (DesktopTitleBar) stays decoupled.
 */
export function useSyncEditorSession({
  paperId,
  displayName,
  autosaveStatus,
  isDirty,
  saveSuccess,
  onManualSave,
}: UseSyncEditorSessionOptions): void {
  const { setDocumentSession } = useEditorSession();
  const manualSaveRef = useRef(onManualSave);
  manualSaveRef.current = onManualSave;

  const triggerManualSave = useCallback(async () => {
    await manualSaveRef.current?.();
  }, []);

  const resolvedTitle = resolveDocumentDisplayTitle(displayName);
  const saveState = resolveDocumentSaveState({
    autosaveStatus,
    isDirty,
    saveSuccess,
  });

  useEffect(() => {
    setDocumentSession({
      paperId,
      title: resolvedTitle,
      saveState,
      onManualSave: manualSaveRef.current ? triggerManualSave : undefined,
    });
  }, [paperId, resolvedTitle, saveState, triggerManualSave, setDocumentSession]);

  useEffect(() => {
    return () => {
      setDocumentSession(null);
    };
  }, [setDocumentSession]);
}
