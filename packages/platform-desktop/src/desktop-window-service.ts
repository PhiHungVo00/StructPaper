import type { MaximizedChangeListener, WindowService } from '@structpaper/platform';

export interface DesktopWindowHandle {
  minimize(): Promise<void>;
  toggleMaximize(): Promise<void>;
  close(): Promise<void>;
  startDragging(): Promise<void>;
  isMaximized(): Promise<boolean>;
  onResized(handler: () => void | Promise<void>): Promise<() => void>;
}

export interface DesktopWindowServiceOptions {
  getWindowFn?: () => Promise<DesktopWindowHandle | null>;
}

async function resolveTauriWindow(): Promise<DesktopWindowHandle | null> {
  try {
    const windowMod = await import('@tauri-apps/api/window');
    if (windowMod && typeof windowMod.getCurrentWindow === 'function') {
      return windowMod.getCurrentWindow() as unknown as DesktopWindowHandle;
    }
    return null;
  } catch {
    return null;
  }
}

export class DesktopWindowService implements WindowService {
  private readonly getWindowFn: () => Promise<DesktopWindowHandle | null>;

  constructor(options?: DesktopWindowServiceOptions) {
    this.getWindowFn = options?.getWindowFn ?? resolveTauriWindow;
  }

  isSupported(): boolean {
    return true;
  }

  async minimize(): Promise<void> {
    await this.withWindow((win) => win.minimize());
  }

  async toggleMaximize(): Promise<void> {
    await this.withWindow((win) => win.toggleMaximize());
  }

  async close(): Promise<void> {
    await this.withWindow((win) => win.close());
  }

  async startDragging(): Promise<void> {
    await this.withWindow((win) => win.startDragging());
  }

  async isMaximized(): Promise<boolean> {
    const result = await this.withWindow((win) => win.isMaximized());
    return Boolean(result);
  }

  onMaximizedChange(listener: MaximizedChangeListener): () => void {
    let disposed = false;
    let lastMaximized: boolean | null = null;
    let unlisten: (() => void) | null = null;

    const emitIfChanged = (next: boolean) => {
      if (disposed || lastMaximized === next) return;
      lastMaximized = next;
      listener(next);
    };

    const syncState = async (win: DesktopWindowHandle) => {
      try {
        const maximized = await win.isMaximized();
        emitIfChanged(Boolean(maximized));
      } catch {
        // Ignore transient native window queries during teardown
      }
    };

    void (async () => {
      const win = await this.safeGetWindow();
      if (!win || disposed) return;

      await syncState(win);
      if (disposed) return;

      try {
        const stopResize = await win.onResized(() => syncState(win));
        if (disposed) {
          stopResize();
          return;
        }
        unlisten = stopResize;
      } catch {
        // Safe fallback when resize events cannot be attached
      }
    })();

    return () => {
      disposed = true;
      if (unlisten) {
        unlisten();
        unlisten = null;
      }
    };
  }

  private async safeGetWindow(): Promise<DesktopWindowHandle | null> {
    try {
      return await this.getWindowFn();
    } catch {
      return null;
    }
  }

  private async withWindow<T>(action: (win: DesktopWindowHandle) => Promise<T>): Promise<T | undefined> {
    const win = await this.safeGetWindow();
    if (!win) return undefined;
    try {
      return await action(win);
    } catch {
      return undefined;
    }
  }
}
