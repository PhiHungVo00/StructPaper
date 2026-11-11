export const STRUCTPAPER_AUTOSAVE_PREF_KEY = 'structpaper_autosave_enabled_v1';

/**
 * Reads persisted AutoSave enabled preference from localStorage.
 * Defaults to `true` when unavailable (SSR) or invalid.
 */
export function readAutoSavePreference(): boolean {
  if (typeof window === 'undefined') {
    return true;
  }

  try {
    const raw = window.localStorage.getItem(STRUCTPAPER_AUTOSAVE_PREF_KEY);
    if (raw === null) return true;
    if (raw === 'false') return false;
    if (raw === 'true') return true;
    return true;
  } catch {
    return true;
  }
}

/**
 * Persists the AutoSave toggle state safely to localStorage.
 */
export function writeAutoSavePreference(enabled: boolean): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(STRUCTPAPER_AUTOSAVE_PREF_KEY, String(Boolean(enabled)));
  } catch {
    // Ignore storage quota or restricted context errors
  }
}

/**
 * Subscribes to cross-window/tab storage changes for the AutoSave preference.
 */
export function subscribeAutoSavePreference(
  listener: (enabled: boolean) => void
): () => void {
  if (typeof window === 'undefined') {
    return () => {};
  }

  const handleStorage = (event: StorageEvent) => {
    if (event.key !== STRUCTPAPER_AUTOSAVE_PREF_KEY) return;
    if (event.newValue === 'false') {
      listener(false);
    } else if (event.newValue === 'true') {
      listener(true);
    }
  };

  window.addEventListener('storage', handleStorage);
  return () => {
    window.removeEventListener('storage', handleStorage);
  };
}
