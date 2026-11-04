import type { Manuscript, ManuscriptRepository } from '@structpaper/doc-model';
import type { CommandBus, ManuscriptStore } from '@structpaper/editor-core';

export type AutosaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export interface AutosaveEngineOptions {
  repo: ManuscriptRepository;
  debounceMs?: number;
  onStatusChange?: (status: AutosaveStatus, error?: unknown) => void;
}

/**
 * AutosaveEngine listens to document patch mutations from CommandBus,
 * debounces saves by debounceMs (default 1000ms), persists the latest
 * Manuscript to IndexedDB via ManuscriptRepository, and updates the store saved state.
 */
export class AutosaveEngine {
  private repo: ManuscriptRepository;
  private debounceMs: number;
  private onStatusChange?: (status: AutosaveStatus, error?: unknown) => void;

  private unlisten?: () => void;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private isSaving = false;
  private hasPendingSave = false;
  private status: AutosaveStatus = 'idle';

  private bus: CommandBus | null = null;
  private store: ManuscriptStore | null = null;

  constructor(options: AutosaveEngineOptions) {
    this.repo = options.repo;
    this.debounceMs = options.debounceMs ?? 1000;
    this.onStatusChange = options.onStatusChange;
  }

  /**
   * Current autosave status.
   */
  getStatus(): AutosaveStatus {
    return this.status;
  }

  /**
   * Attaches engine to CommandBus and ManuscriptStore.
   */
  attach(commandBus: CommandBus, store: ManuscriptStore): void {
    this.stop();

    this.bus = commandBus;
    this.store = store;

    this.unlisten = commandBus.onPatch(() => {
      this.scheduleSave();
    });
  }

  /**
   * Immediately flushes any pending debounced save.
   */
  async flush(): Promise<void> {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }

    this.hasPendingSave = true;
    await this.executeSave();

    // In case a concurrent save re-triggered pending flag
    while (this.isSaving || this.hasPendingSave) {
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
  }

  /**
   * Stops autosave engine, cancels pending debounce timers and unregisters listener.
   */
  stop(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    if (this.unlisten) {
      this.unlisten();
      this.unlisten = undefined;
    }
    this.hasPendingSave = false;
    this.bus = null;
    this.store = null;
    this.setStatus('idle');
  }

  private setStatus(status: AutosaveStatus, error?: unknown): void {
    if (this.status === status && status === 'idle') {
      return;
    }
    this.status = status;
    try {
      this.onStatusChange?.(status, error);
    } catch (e) {
      console.error('Error in onStatusChange callback:', e);
    }
  }

  private scheduleSave(): void {
    this.hasPendingSave = true;

    if (this.timer) {
      clearTimeout(this.timer);
    }

    this.timer = setTimeout(() => {
      this.timer = null;
      this.executeSave();
    }, this.debounceMs);
  }

  private async executeSave(): Promise<void> {
    if (this.isSaving) {
      this.hasPendingSave = true;
      return;
    }

    const doc: Manuscript | null =
      this.store?.getState().manuscript || this.bus?.getDocument() || null;

    if (!doc) {
      this.hasPendingSave = false;
      return;
    }

    this.isSaving = true;
    this.hasPendingSave = false;
    this.setStatus('saving');

    try {
      const targetRev =
        this.store?.getState().rev ?? (doc as any).rev ?? 1;

      // Attach rev to doc snapshot if not present
      const docToSave: Manuscript = {
        ...doc,
        rev: targetRev,
        updatedAt: new Date().toISOString(),
      } as unknown as Manuscript;

      await this.repo.save(docToSave);

      if (this.store) {
        this.store.getState().markSaved(targetRev);
      }

      this.setStatus('saved');
    } catch (err) {
      this.setStatus('error', err);
      console.error('AutosaveEngine save failed:', err);
    } finally {
      this.isSaving = false;
      if (this.hasPendingSave) {
        this.executeSave();
      }
    }
  }
}
