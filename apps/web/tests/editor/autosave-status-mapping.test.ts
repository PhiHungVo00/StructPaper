import { describe, it, expect } from 'vitest';
import { autosaveStatusFromSaveState } from '@/lib/editor/autosave-status';

describe('autosaveStatusFromSaveState (document auto-save -> title bar / dock vocabulary)', () => {
  it.each([
    ['idle', 'idle'],
    ['dirty', 'idle'],
    ['saving', 'saving'],
    ['saved', 'saved'],
    ['saved-local', 'saved'],
    ['conflict', 'error'],
    ['error', 'error'],
  ] as const)('%s -> %s', (state, expected) => {
    expect(autosaveStatusFromSaveState(state)).toBe(expected);
  });
});
