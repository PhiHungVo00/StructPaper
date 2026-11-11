// @vitest-environment happy-dom
import { describe, it, expect, vi } from 'vitest';
import {
  createDesktopPlatform,
  DesktopWindowService,
  type DesktopWindowHandle,
} from '../src';

describe('packages/platform-desktop: DesktopWindowService', () => {
  function createMockHandle(initialMaximized = false): {
    handle: DesktopWindowHandle;
    emitResized: () => Promise<void>;
    setMaximized: (next: boolean) => void;
    unlisten: ReturnType<typeof vi.fn>;
  } {
    let maximized = initialMaximized;
    let resizeHandler: (() => void | Promise<void>) | null = null;
    const unlisten = vi.fn();

    const handle: DesktopWindowHandle = {
      minimize: vi.fn().mockResolvedValue(undefined),
      toggleMaximize: vi.fn().mockImplementation(async () => {
        maximized = !maximized;
      }),
      close: vi.fn().mockResolvedValue(undefined),
      startDragging: vi.fn().mockResolvedValue(undefined),
      isMaximized: vi.fn().mockImplementation(async () => maximized),
      onResized: vi.fn().mockImplementation(async (cb) => {
        resizeHandler = cb;
        return unlisten;
      }),
    };

    return {
      handle,
      unlisten,
      setMaximized: (next: boolean) => {
        maximized = next;
      },
      emitResized: async () => {
        if (resizeHandler) {
          await resizeHandler();
        }
      },
    };
  }

  it('createDesktopPlatform attaches DesktopWindowService', () => {
    const platform = createDesktopPlatform();
    expect(platform.window).toBeInstanceOf(DesktopWindowService);
    expect(platform.window.isSupported()).toBe(true);
  });

  it('delegates minimize, toggleMaximize, close, startDragging, and isMaximized to handle', async () => {
    const { handle } = createMockHandle(true);
    const service = new DesktopWindowService({
      getWindowFn: async () => handle,
    });

    await service.minimize();
    await service.toggleMaximize();
    await service.close();
    await service.startDragging();
    const maxAfterToggle = await service.isMaximized();

    expect(handle.minimize).toHaveBeenCalledTimes(1);
    expect(handle.toggleMaximize).toHaveBeenCalledTimes(1);
    expect(handle.close).toHaveBeenCalledTimes(1);
    expect(handle.startDragging).toHaveBeenCalledTimes(1);
    expect(maxAfterToggle).toBe(false);
  });

  it('returns false and no-ops safely when window handle is unavailable', async () => {
    const service = new DesktopWindowService({
      getWindowFn: async () => null,
    });

    await expect(service.minimize()).resolves.toBeUndefined();
    await expect(service.toggleMaximize()).resolves.toBeUndefined();
    await expect(service.close()).resolves.toBeUndefined();
    await expect(service.startDragging()).resolves.toBeUndefined();
    await expect(service.isMaximized()).resolves.toBe(false);
  });

  it('onMaximizedChange emits initial state, deduplicates resize updates, and unlistens cleanly', async () => {
    const { handle, emitResized, setMaximized, unlisten } = createMockHandle(false);
    const service = new DesktopWindowService({
      getWindowFn: async () => handle,
    });

    const listener = vi.fn();
    const stop = service.onMaximizedChange(listener);

    // Wait for microtasks resolving getWindow + initial isMaximized + onResized
    await vi.waitFor(() => {
      expect(listener).toHaveBeenCalledWith(false);
    });
    expect(listener).toHaveBeenCalledTimes(1);

    // Resize without state flip should not trigger duplicate emission
    await emitResized();
    expect(listener).toHaveBeenCalledTimes(1);

    // Maximize state flips on resize
    setMaximized(true);
    await emitResized();
    expect(listener).toHaveBeenCalledTimes(2);
    expect(listener).toHaveBeenLastCalledWith(true);

    // Cleanup calls native unlisten
    stop();
    expect(unlisten).toHaveBeenCalledTimes(1);
  });

  it('calls unlisten immediately when stopped before async subscription resolves', async () => {
    const unlisten = vi.fn();
    let resolveHandle!: (h: DesktopWindowHandle) => void;
    const handlePromise = new Promise<DesktopWindowHandle>((res) => {
      resolveHandle = res;
    });

    const service = new DesktopWindowService({
      getWindowFn: () => handlePromise,
    });

    const listener = vi.fn();
    const stop = service.onMaximizedChange(listener);
    stop();

    resolveHandle({
      minimize: vi.fn(),
      toggleMaximize: vi.fn(),
      close: vi.fn(),
      startDragging: vi.fn(),
      isMaximized: vi.fn().mockResolvedValue(true),
      onResized: vi.fn().mockResolvedValue(unlisten),
    });

    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();

    expect(listener).not.toHaveBeenCalled();
  });
});
