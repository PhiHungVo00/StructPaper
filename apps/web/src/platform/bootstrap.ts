import type { PlatformServices } from '@structpaper/platform';

let platformInstance: PlatformServices | null = null;
let platformPromise: Promise<PlatformServices> | null = null;

/**
 * Detects whether the current runtime is a Tauri desktop environment.
 */
export function isTauriEnvironment(): boolean {
  return (
    typeof window !== 'undefined' &&
    Boolean(
      (window as any).__TAURI_INTERNALS__ ||
      (window as any).__TAURI__
    )
  );
}

/**
 * Dynamically imports and initializes the appropriate platform adapter
 * (Web or Desktop) based on runtime capabilities.
 * Dynamic imports guarantee that Tauri native bindings are not bundled into
 * pure web distributions.
 */
export async function createPlatform(): Promise<PlatformServices> {
  if (platformInstance) {
    return platformInstance;
  }
  if (platformPromise) {
    return platformPromise;
  }

  platformPromise = (async () => {
    if (isTauriEnvironment()) {
      const { createDesktopPlatform } = await import('@structpaper/platform-desktop');
      platformInstance = createDesktopPlatform();
    } else {
      const { createWebPlatform } = await import('@structpaper/platform-web');
      platformInstance = createWebPlatform();
    }
    return platformInstance;
  })();

  try {
    return await platformPromise;
  } catch (err) {
    platformPromise = null;
    throw err;
  }
}

/**
 * Returns the currently active platform instance, if initialized.
 */
export function getPlatform(): PlatformServices | null {
  return platformInstance;
}

/**
 * Resets the cached platform instance (useful in tests or hot reloads).
 */
export function resetPlatform(): void {
  platformInstance = null;
  platformPromise = null;
}
