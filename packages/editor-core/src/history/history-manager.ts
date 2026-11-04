import { enablePatches, applyPatches } from 'immer';
import type { Manuscript, Patch } from '@structpaper/doc-model';
import type { CommandBus } from '../bus/command-bus';
import type { ManuscriptStore } from '../store/manuscript-store';

enablePatches();

export interface HistoryManagerOptions {
  commandBus?: CommandBus;
  store?: ManuscriptStore;
  maxHistory?: number;
}

export type HistoryListener = (doc: Manuscript, action: 'undo' | 'redo') => void;

/**
 * HistoryManager tracks forward and inverse patches produced by CommandBus
 * to provide atomic Undo and Redo capabilities.
 */
export class HistoryManager {
  public undoStack: Patch[][] = [];
  public redoStack: Patch[][] = [];
  public maxHistory: number = 100;

  private undoForwardStack: Patch[][] = [];
  private redoInverseStack: Patch[][] = [];
  private unsubscribeCommandBus?: () => void;
  private commandBus?: CommandBus;
  private store?: ManuscriptStore;
  private listeners = new Set<HistoryListener>();

  constructor(options?: HistoryManagerOptions | CommandBus) {
    if (options && 'dispatch' in options && 'onPatch' in options) {
      this.attach(options);
    } else if (options) {
      if (typeof options.maxHistory === 'number') {
        this.maxHistory = options.maxHistory;
      }
      if (options.store) {
        this.store = options.store;
      }
      if (options.commandBus) {
        this.attach(options.commandBus, options.store);
      }
    }
  }

  get canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  get canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  attach(commandBus: CommandBus, store?: ManuscriptStore): void {
    if (this.unsubscribeCommandBus) {
      this.unsubscribeCommandBus();
    }
    this.commandBus = commandBus;
    if (store) {
      this.store = store;
    }
    this.unsubscribeCommandBus = commandBus.onPatch((patches, inversePatches) => {
      this.record(patches, inversePatches);
    });
  }

  detach(): void {
    if (this.unsubscribeCommandBus) {
      this.unsubscribeCommandBus();
      this.unsubscribeCommandBus = undefined;
    }
  }

  record(patches: Patch[], inversePatches: Patch[]): void {
    if (!patches || patches.length === 0) return;

    this.undoStack.push(inversePatches);
    this.undoForwardStack.push(patches);

    if (this.undoStack.length > this.maxHistory) {
      this.undoStack.shift();
      this.undoForwardStack.shift();
    }

    // New mutation invalidates previous redo history
    this.redoStack = [];
    this.redoInverseStack = [];
  }

  undo(currentDoc?: Manuscript): Manuscript | null {
    if (!this.canUndo) return null;

    const doc =
      currentDoc ?? this.store?.getState().manuscript ?? this.commandBus?.getDocument();
    if (!doc) {
      throw new Error('No manuscript provided or found in store/commandBus to undo.');
    }

    const inversePatches = this.undoStack.pop()!;
    const forwardPatches = this.undoForwardStack.pop()!;

    const restoredDoc = applyPatches(doc, inversePatches as any) as Manuscript;

    this.redoStack.push(forwardPatches);
    this.redoInverseStack.push(inversePatches);

    if (this.store) {
      this.store.getState().setDocument(restoredDoc, true);
    } else if (this.commandBus) {
      this.commandBus.setDocument(restoredDoc);
    }

    for (const listener of this.listeners) {
      try {
        listener(restoredDoc, 'undo');
      } catch (err) {
        console.error('Error in onHistoryChange listener:', err);
      }
    }

    return restoredDoc;
  }

  redo(currentDoc?: Manuscript): Manuscript | null {
    if (!this.canRedo) return null;

    const doc =
      currentDoc ?? this.store?.getState().manuscript ?? this.commandBus?.getDocument();
    if (!doc) {
      throw new Error('No manuscript provided or found in store/commandBus to redo.');
    }

    const forwardPatches = this.redoStack.pop()!;
    const inversePatches = this.redoInverseStack.pop()!;

    const redoneDoc = applyPatches(doc, forwardPatches as any) as Manuscript;

    this.undoStack.push(inversePatches);
    this.undoForwardStack.push(forwardPatches);

    if (this.store) {
      this.store.getState().setDocument(redoneDoc, true);
    } else if (this.commandBus) {
      this.commandBus.setDocument(redoneDoc);
    }

    for (const listener of this.listeners) {
      try {
        listener(redoneDoc, 'redo');
      } catch (err) {
        console.error('Error in onHistoryChange listener:', err);
      }
    }

    return redoneDoc;
  }

  clear(): void {
    this.undoStack = [];
    this.redoStack = [];
    this.undoForwardStack = [];
    this.redoInverseStack = [];
  }

  onHistoryChange(listener: HistoryListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }
}
