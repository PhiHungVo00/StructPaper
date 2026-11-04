import { enablePatches, produceWithPatches } from 'immer';
import type { Command, Manuscript, Patch } from '@structpaper/doc-model';
import type { ManuscriptStore } from '../store/manuscript-store';
import { registerBaseCommands } from '../commands/base-commands';

enablePatches();

export type PatchListener = (
  patches: Patch[],
  inversePatches: Patch[],
  doc: Manuscript
) => void;

export type CommandHandler<P = any> = (
  draft: Manuscript,
  payload: P
) => void;

export interface CommandBusOptions {
  store?: ManuscriptStore;
  initialDoc?: Manuscript | null;
}

/**
 * CommandBus dispatches mutations to the manuscript document immutably via Immer,
 * generating atomic forward and inverse patches and notifying subscribers.
 */
export class CommandBus {
  private handlers = new Map<string, CommandHandler<any>>();
  private listeners = new Set<PatchListener>();
  private store?: ManuscriptStore;
  private fallbackDoc: Manuscript | null = null;

  constructor(options?: CommandBusOptions | ManuscriptStore) {
    if (options && 'getState' in options) {
      this.store = options;
    } else if (options) {
      if (options.store) {
        this.store = options.store;
      }
      if (options.initialDoc) {
        this.fallbackDoc = options.initialDoc;
      }
    }
    registerBaseCommands(this);
  }

  registerHandler<P = any>(type: string, handler: CommandHandler<P>): void {
    this.handlers.set(type, handler);
  }

  register<P = any>(type: string, handler: CommandHandler<P>): void {
    this.registerHandler(type, handler);
  }

  onPatch(listener: PatchListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  getDocument(): Manuscript | null {
    if (this.store) {
      return this.store.getState().manuscript;
    }
    return this.fallbackDoc;
  }

  setDocument(doc: Manuscript): void {
    if (this.store) {
      this.store.getState().setDocument(doc, false);
    }
    this.fallbackDoc = doc;
  }

  dispatch<P = unknown>(command: Command<P>): {
    doc: Manuscript;
    patches: Patch[];
    inversePatches: Patch[];
  } {
    const doc = this.getDocument();
    if (!doc) {
      throw new Error(
        `Cannot dispatch command "${command.type}": No manuscript is currently loaded.`
      );
    }

    const handler = this.handlers.get(command.type);
    if (!handler) {
      throw new Error(`Unknown command type: "${command.type}". No handler registered.`);
    }

    const [nextDoc, rawPatches, rawInversePatches] = produceWithPatches(doc, (draft) => {
      handler(draft as Manuscript, command.payload);
    });

    const patches = rawPatches as unknown as Patch[];
    const inversePatches = rawInversePatches as unknown as Patch[];

    if (patches.length > 0) {
      if (this.store) {
        this.store.getState().setDocument(nextDoc as Manuscript, true);
      }
      this.fallbackDoc = nextDoc as Manuscript;

      for (const listener of this.listeners) {
        try {
          listener(patches, inversePatches, nextDoc as Manuscript);
        } catch (err) {
          console.error('Error in onPatch listener:', err);
        }
      }
    }

    return {
      doc: nextDoc as Manuscript,
      patches,
      inversePatches,
    };
  }
}
