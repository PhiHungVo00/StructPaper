// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  STRUCTPAPER_AUTOSAVE_PREF_KEY,
  readAutoSavePreference,
  writeAutoSavePreference,
  subscribeAutoSavePreference,
} from '@/lib/editor/autosave-preferences';
import {
  resolveDocumentSaveState,
  resolveDocumentDisplayTitle,
  getSaveStateMetadata,
} from '@/lib/editor/save-status';

describe('lib/editor/autosave-preferences', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('defaults to enabled (true) when preference is absent or corrupted', () => {
    expect(readAutoSavePreference()).toBe(true);

    window.localStorage.setItem(STRUCTPAPER_AUTOSAVE_PREF_KEY, 'invalid-value');
    expect(readAutoSavePreference()).toBe(true);
  });

  it('persists and reads boolean preference cleanly', () => {
    writeAutoSavePreference(false);
    expect(window.localStorage.getItem(STRUCTPAPER_AUTOSAVE_PREF_KEY)).toBe('false');
    expect(readAutoSavePreference()).toBe(false);

    writeAutoSavePreference(true);
    expect(window.localStorage.getItem(STRUCTPAPER_AUTOSAVE_PREF_KEY)).toBe('true');
    expect(readAutoSavePreference()).toBe(true);
  });

  it('notifies subscribers when storage event updates autosave preference', () => {
    const listener = vi.fn();
    const unsubscribe = subscribeAutoSavePreference(listener);

    window.dispatchEvent(
      new StorageEvent('storage', {
        key: STRUCTPAPER_AUTOSAVE_PREF_KEY,
        newValue: 'false',
      })
    );
    expect(listener).toHaveBeenCalledWith(false);

    window.dispatchEvent(
      new StorageEvent('storage', {
        key: 'unrelated_key',
        newValue: 'false',
      })
    );
    expect(listener).toHaveBeenCalledTimes(1);

    unsubscribe();
    window.dispatchEvent(
      new StorageEvent('storage', {
        key: STRUCTPAPER_AUTOSAVE_PREF_KEY,
        newValue: 'true',
      })
    );
    expect(listener).toHaveBeenCalledTimes(1);
  });
});

describe('lib/editor/save-status', () => {
  it('prioritizes saving and error states over dirty state', () => {
    expect(
      resolveDocumentSaveState({
        autosaveStatus: 'saving',
        isDirty: true,
        saveSuccess: false,
      })
    ).toBe('saving');

    expect(
      resolveDocumentSaveState({
        autosaveStatus: 'error',
        isDirty: true,
        saveSuccess: false,
      })
    ).toBe('error');
  });

  it('resolves unsaved whenever dirty, even if manual saveSuccess badge is still fading', () => {
    expect(
      resolveDocumentSaveState({
        autosaveStatus: 'idle',
        isDirty: true,
        saveSuccess: false,
      })
    ).toBe('unsaved');

    expect(
      resolveDocumentSaveState({
        autosaveStatus: 'idle',
        isDirty: true,
        saveSuccess: true,
      })
    ).toBe('unsaved');

    expect(
      resolveDocumentSaveState({
        autosaveStatus: 'idle',
        isDirty: false,
        saveSuccess: false,
      })
    ).toBe('saved');

    expect(
      resolveDocumentSaveState({
        autosaveStatus: 'saved',
        isDirty: false,
        saveSuccess: true,
      })
    ).toBe('saved');
  });

  it('formats display title with safe fallback for blank titles', () => {
    expect(resolveDocumentDisplayTitle('  Nghiên cứu VNUHCM  ')).toBe('Nghiên cứu VNUHCM');
    expect(resolveDocumentDisplayTitle('   ')).toBe('Bản thảo chưa đặt tên');
    expect(resolveDocumentDisplayTitle(undefined)).toBe('Bản thảo chưa đặt tên');
  });

  it('exposes consistent metadata for every save state', () => {
    expect(getSaveStateMetadata('saved').label).toBe('Saved');
    expect(getSaveStateMetadata('saving').label).toBe('Saving...');
    expect(getSaveStateMetadata('unsaved').label).toBe('Unsaved');
    expect(getSaveStateMetadata('error').label).toBe('Error');
  });
});
