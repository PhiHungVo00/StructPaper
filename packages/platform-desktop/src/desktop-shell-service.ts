import type { ShellService } from '@structpaper/platform';

export interface DesktopShellServiceOptions {
  openFn?: (url: string) => Promise<void> | void;
}

async function tryImport<T = any>(moduleName: string): Promise<T | null> {
  try {
    const mod = await import(/* @vite-ignore */ `${moduleName}`);
    return mod as T;
  } catch {
    return null;
  }
}

export class DesktopShellService implements ShellService {
  private readonly openFn?: (url: string) => Promise<void> | void;

  constructor(options?: DesktopShellServiceOptions) {
    this.openFn = options?.openFn;
  }

  async openExternal(url: string): Promise<void> {
    if (this.openFn) {
      await this.openFn(url);
      return;
    }

    try {
      const shellMod = await tryImport('@tauri-apps/plugin-shell');
      if (shellMod && typeof shellMod.open === 'function') {
        await shellMod.open(url);
        return;
      }
    } catch {
      // Safe fallback
    }

    if (typeof window !== 'undefined' && typeof window.open === 'function') {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  }
}
