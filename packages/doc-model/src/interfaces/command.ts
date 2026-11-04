export interface Command<P = unknown> {
  type: string;
  payload?: P;
  undoable?: boolean;
  timestamp?: number;
}

export interface Patch {
  op: 'add' | 'remove' | 'replace' | 'move' | 'copy' | 'test';
  path: (string | number)[];
  value?: unknown;
}

export type InversePatch = Patch;
