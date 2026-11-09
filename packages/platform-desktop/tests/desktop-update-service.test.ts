// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { UpdateInfo, UpdateState } from '@structpaper/platform';
import type { DownloadEvent } from '@tauri-apps/plugin-updater';
import {
  createDesktopPlatform,
  DesktopUpdateService,
  DesktopFileService,
  DesktopShellService,
  mapErrorToCode,
} from '../src';

describe('packages/platform-desktop: createDesktopPlatform', () => {
  it('creates desktop platform with expected capabilities and default config', () => {
    const platform = createDesktopPlatform();

    expect(platform.capabilities).toEqual({
      kind: 'desktop',
      canInstallApp: false,
      hasAppUpdater: true,
      hasNativeCompiler: true,
      hasFileSystem: true,
    });

    expect(platform.config.appVersion).toBe('1.0.8');
    expect(platform.config.channel).toBe('stable');
    expect(platform.config.buildId).toBe('desktop-dev');
    expect(platform.files).toBeInstanceOf(DesktopFileService);
    expect(platform.updates).toBeInstanceOf(DesktopUpdateService);
    expect(platform.shell).toBeInstanceOf(DesktopShellService);
  });

  it('allows customizing RuntimeConfig and channel', () => {
    const platform = createDesktopPlatform({
      config: {
        apiBaseUrl: 'https://api.structpaper.org',
        appVersion: '2.5.0',
        buildId: 'desktop-release-102',
        channel: 'beta',
      },
    });

    expect(platform.config.apiBaseUrl).toBe('https://api.structpaper.org');
    expect(platform.config.appVersion).toBe('2.5.0');
    expect(platform.config.buildId).toBe('desktop-release-102');
    expect(platform.config.channel).toBe('beta');
    expect(platform.updates.channel).toBe('beta');
  });

  it('wires onBeforeInstall option to DesktopUpdateService', async () => {
    const hook = vi.fn().mockResolvedValue(undefined);
    const platform = createDesktopPlatform({
      onBeforeInstall: hook,
    });

    const info: UpdateInfo = {
      version: '1.1.0',
      kind: 'app-binary',
      mandatory: false,
    };

    await platform.updates.install(info);
    expect(hook).toHaveBeenCalledTimes(1);
  });
});

describe('packages/platform-desktop: DesktopUpdateService State Transitions', () => {
  let relaunchMock: () => Promise<void>;

  beforeEach(() => {
    relaunchMock = vi.fn().mockResolvedValue(undefined);
  });

  it('follows full state machine: idle -> checking -> available -> downloading -> ready -> installing', async () => {
    let downloadCallback: ((event: DownloadEvent) => void) | undefined;
    const downloadMock = vi.fn().mockImplementation(async (onEvent) => {
      downloadCallback = onEvent;
      // Emit Started
      onEvent({ event: 'Started', data: { contentLength: 1000 } });
      // Emit Progress chunks
      onEvent({ event: 'Progress', data: { chunkLength: 400 } });
      onEvent({ event: 'Progress', data: { chunkLength: 600 } });
      // Emit Finished
      onEvent({ event: 'Finished' });
    });
    const installMock = vi.fn().mockResolvedValue(undefined);

    const mockUpdate = {
      available: true,
      currentVersion: '1.0.0',
      version: '1.1.0',
      body: 'Bug fixes and performance improvements',
      date: '2026-11-09T00:00:00Z',
      download: downloadMock,
      install: installMock,
    };

    const checkMock = vi.fn().mockResolvedValue(mockUpdate);

    const service = new DesktopUpdateService({
      currentVersion: '1.0.0',
      channel: 'stable',
      checkUpdater: checkMock,
      relaunchFn: relaunchMock,
    });

    const stateHistory: UpdateState[] = [];
    service.subscribe((state) => stateHistory.push(state));

    expect(service.getState()).toEqual({ s: 'idle' });

    // 1. Check for update
    const info = await service.check();
    expect(info).toEqual({
      version: '1.1.0',
      notes: 'Bug fixes and performance improvements',
      publishedAt: '2026-11-09T00:00:00Z',
      mandatory: false,
      kind: 'app-binary',
    });
    expect(service.getState().s).toBe('available');

    // 2. Install update (triggers download)
    await service.install(info!);
    expect(downloadMock).toHaveBeenCalled();
    expect(service.getState()).toEqual({ s: 'ready', info: info! });

    // 3. Restart app (triggers install and relaunch)
    await service.restart();
    expect(installMock).toHaveBeenCalled();
    expect(relaunchMock).toHaveBeenCalled();
    expect(service.getState()).toEqual({ s: 'installing', info: info! });

    // Verify all transition states in order
    const stateNames = stateHistory.map((st) => st.s);
    expect(stateNames).toEqual([
      'checking',
      'available',
      'downloading', // Initial 0 received
      'downloading', // Started (total 1000)
      'downloading', // Progress (400)
      'downloading', // Progress (1000)
      'ready',
      'installing',
    ]);
  });

  it('transitions to installing when install() is called in ready state', async () => {
    const installMock = vi.fn().mockResolvedValue(undefined);
    const mockUpdate = {
      available: true,
      currentVersion: '1.0.0',
      version: '1.1.0',
      download: vi.fn().mockResolvedValue(undefined),
      install: installMock,
    };

    const service = new DesktopUpdateService({
      checkUpdater: vi.fn().mockResolvedValue(mockUpdate),
      relaunchFn: relaunchMock,
    });

    const info = (await service.check())!;
    await service.install(info);
    expect(service.getState().s).toBe('ready');

    // Second call to install while ready
    await service.install(info);
    expect(service.getState()).toEqual({ s: 'installing', info });
    expect(installMock).toHaveBeenCalledTimes(1);
  });
});

describe('packages/platform-desktop: Safety Hooks Execution', () => {
  it('executes flushAutosave and settleCompile sequentially before download', async () => {
    const executionOrder: string[] = [];

    const flushAutosave = vi.fn().mockImplementation(async () => {
      executionOrder.push('flushAutosave');
    });

    const settleCompile = vi.fn().mockImplementation(async () => {
      executionOrder.push('settleCompile');
    });

    const downloadMock = vi.fn().mockImplementation(async () => {
      executionOrder.push('download');
    });

    const mockUpdate = {
      available: true,
      version: '2.0.0',
      download: downloadMock,
    };

    const service = new DesktopUpdateService({
      checkUpdater: vi.fn().mockResolvedValue(mockUpdate),
      onBeforeInstall: {
        flushAutosave,
        settleCompile,
      },
    });

    const info = (await service.check())!;
    await service.install(info);

    expect(executionOrder).toEqual(['flushAutosave', 'settleCompile', 'download']);
    expect(service.getState().s).toBe('ready');
  });

  it('aborts install and transitions to error U7_INSTALL if flushAutosave fails', async () => {
    const downloadMock = vi.fn();
    const settleCompileMock = vi.fn();

    const service = new DesktopUpdateService({
      checkUpdater: vi.fn().mockResolvedValue({
        available: true,
        version: '2.0.0',
        download: downloadMock,
      }),
      onBeforeInstall: {
        flushAutosave: async () => {
          throw new Error('IndexedDB quota exceeded on autosave');
        },
        settleCompile: settleCompileMock,
      },
    });

    const info = (await service.check())!;
    await expect(service.install(info)).rejects.toThrow('IndexedDB quota exceeded');

    expect(settleCompileMock).not.toHaveBeenCalled();
    expect(downloadMock).not.toHaveBeenCalled();
    expect(service.getState()).toEqual({
      s: 'error',
      code: 'U7_INSTALL',
      message: 'Safety hook failed before install: IndexedDB quota exceeded on autosave',
    });
  });

  it('aborts install and transitions to error U7_INSTALL if settleCompile fails', async () => {
    const downloadMock = vi.fn();
    const flushAutosaveMock = vi.fn().mockResolvedValue(undefined);

    const service = new DesktopUpdateService({
      checkUpdater: vi.fn().mockResolvedValue({
        available: true,
        version: '2.0.0',
        download: downloadMock,
      }),
      onBeforeInstall: {
        flushAutosave: flushAutosaveMock,
        settleCompile: async () => {
          throw new Error('Active XeTeX compilation failed to settle');
        },
      },
    });

    const info = (await service.check())!;
    await expect(service.install(info)).rejects.toThrow('XeTeX compilation');

    expect(flushAutosaveMock).toHaveBeenCalled();
    expect(downloadMock).not.toHaveBeenCalled();
    expect(service.getState()).toEqual({
      s: 'error',
      code: 'U7_INSTALL',
      message: 'Safety hook failed before install: Active XeTeX compilation failed to settle',
    });
  });

  it('supports an array of safety hooks in sequential execution', async () => {
    const steps: number[] = [];
    const hook1 = vi.fn().mockImplementation(async () => steps.push(1));
    const hook2 = vi.fn().mockImplementation(async () => steps.push(2));

    const service = new DesktopUpdateService({
      onBeforeInstall: [hook1, hook2],
    });

    const info: UpdateInfo = { version: '1.2.0', kind: 'app-binary', mandatory: false };
    await service.install(info);

    expect(steps).toEqual([1, 2]);
    expect(service.getState().s).toBe('ready');
  });
});

describe('packages/platform-desktop: Error Code Mapping', () => {
  it('maps network and offline failures to U1_OFFLINE', async () => {
    expect(mapErrorToCode(new Error('Failed to fetch: network offline'))).toBe('U1_OFFLINE');
    expect(mapErrorToCode(new Error('getaddrinfo ENOTFOUND github.com'))).toBe('U1_OFFLINE');
    expect(mapErrorToCode(new Error('Connection timed out'))).toBe('U1_OFFLINE');

    const service = new DesktopUpdateService({
      checkUpdater: vi.fn().mockRejectedValue(new Error('Network offline')),
    });

    await service.check({ manual: true });
    expect(service.getState()).toEqual(
      expect.objectContaining({
        s: 'error',
        code: 'U1_OFFLINE',
      })
    );
  });

  it('silently ignores offline error on non-manual periodic check', async () => {
    const service = new DesktopUpdateService({
      checkUpdater: vi.fn().mockRejectedValue(new Error('Network offline')),
    });

    const result = await service.check({ manual: false });
    expect(result).toBeNull();
    expect(service.getState()).toEqual({ s: 'idle' });
  });

  it('maps signature and verification failures to U2_SIGNATURE', async () => {
    expect(mapErrorToCode(new Error('Signature verification failed'))).toBe('U2_SIGNATURE');
    expect(mapErrorToCode(new Error('Minisign signature untrusted'))).toBe('U2_SIGNATURE');

    const service = new DesktopUpdateService({
      checkUpdater: vi.fn().mockRejectedValue(new Error('Invalid signature')),
    });

    await service.check({ manual: true });
    expect(service.getState()).toEqual(
      expect.objectContaining({
        s: 'error',
        code: 'U2_SIGNATURE',
      })
    );
  });

  it('maps download interruptions to U3_DOWNLOAD', async () => {
    expect(mapErrorToCode(new Error('Download stream interrupted: chunk transfer failed'))).toBe(
      'U3_DOWNLOAD'
    );

    const service = new DesktopUpdateService({
      checkUpdater: vi.fn().mockResolvedValue({
        available: true,
        version: '1.5.0',
        download: vi.fn().mockRejectedValue(new Error('Connection reset while downloading chunk')),
      }),
    });

    const info = (await service.check())!;
    await expect(service.install(info)).rejects.toThrow();
    expect(service.getState()).toEqual(
      expect.objectContaining({
        s: 'error',
        code: 'U3_DOWNLOAD',
      })
    );
  });

  it('maps disk space errors to U4_DISK and permissions to U5_PERMISSION', () => {
    expect(mapErrorToCode(new Error('ENOSPC: no space left on device'))).toBe('U4_DISK');
    expect(mapErrorToCode(new Error('EACCES: permission denied'))).toBe('U5_PERMISSION');
  });

  it('maps 404 / 500 endpoint errors to U6_ENDPOINT', async () => {
    expect(mapErrorToCode(new Error('Endpoint returned 404 Not Found'))).toBe('U6_ENDPOINT');
    expect(mapErrorToCode(new Error('Bad JSON response from endpoint'))).toBe('U6_ENDPOINT');

    const service = new DesktopUpdateService({
      checkUpdater: vi.fn().mockRejectedValue(new Error('Endpoint status code 503')),
    });

    await service.check({ manual: true });
    expect(service.getState()).toEqual(
      expect.objectContaining({
        s: 'error',
        code: 'U6_ENDPOINT',
      })
    );
  });
});

describe('packages/platform-desktop: skipVersion and remindLater', () => {
  it('handles skipVersion properly', async () => {
    const service = new DesktopUpdateService({
      checkUpdater: vi.fn().mockResolvedValue({
        available: true,
        version: '1.3.0',
      }),
    });

    await service.check();
    expect(service.getState().s).toBe('available');

    service.skipVersion('1.3.0');
    expect(service.getState()).toEqual({ s: 'idle' });

    // Subsequent non-manual check returns null
    const result = await service.check();
    expect(result).toBeNull();

    // Manual check bypasses skip
    const manualResult = await service.check({ manual: true });
    expect(manualResult?.version).toBe('1.3.0');
  });

  it('handles remindLater properly', async () => {
    const checkMock = vi.fn().mockResolvedValue({
      available: true,
      version: '1.4.0',
    });

    const service = new DesktopUpdateService({
      checkUpdater: checkMock,
    });

    await service.check();
    expect(service.getState().s).toBe('available');

    service.remindLater(24);
    expect(service.getState()).toEqual({ s: 'idle' });

    checkMock.mockClear();
    const result = await service.check();
    expect(result).toBeNull();
    expect(checkMock).not.toHaveBeenCalled();

    // Manual check bypasses remindLater
    const manualResult = await service.check({ manual: true });
    expect(manualResult?.version).toBe('1.4.0');
  });
});

describe('packages/platform-desktop: Non-Tauri environment safety & fallbacks', () => {
  it('DesktopUpdateService check() does not crash in non-Tauri tests without mocks', async () => {
    const service = new DesktopUpdateService();
    // In happy-dom / Node without tauri internals or mocks, check should safely return null
    const result = await service.check();
    expect(result).toBeNull();
    expect(service.getState()).toEqual({ s: 'idle' });
  });

  it('DesktopUpdateService check() gracefully handles plugin-updater null meta.available bug as up-to-date', async () => {
    const service = new DesktopUpdateService({
      checkUpdater: vi.fn().mockRejectedValue(new TypeError("Cannot read properties of null (reading 'available')")),
    });

    const result = await service.check();
    expect(result).toBeNull();
    expect(service.getState()).toEqual({ s: 'idle' });
  });

  it('DesktopUpdateService restart() does not throw uncaught error without Tauri', async () => {
    const service = new DesktopUpdateService();
    await expect(service.restart()).resolves.toBeUndefined();
  });

  it('DesktopFileService saves and opens files via custom functions or safe fallback', async () => {
    const saveDialogFn = vi.fn().mockResolvedValue('C:/test/file.txt');
    const writeFileFn = vi.fn().mockResolvedValue(undefined);
    const openDialogFn = vi.fn().mockResolvedValue('C:/test/opened.txt');
    const readFileFn = vi
      .fn()
      .mockResolvedValue(new TextEncoder().encode('Desktop file content'));

    const fileService = new DesktopFileService({
      saveDialogFn,
      writeFileFn,
      openDialogFn,
      readFileFn,
    });

    await fileService.saveFile('file.txt', 'Hello Tauri');
    expect(saveDialogFn).toHaveBeenCalledWith({ defaultPath: 'file.txt' });
    expect(writeFileFn).toHaveBeenCalledWith('C:/test/file.txt', 'Hello Tauri');

    const file = await fileService.openFile('.txt');
    expect(openDialogFn).toHaveBeenCalled();
    expect(file?.name).toBe('opened.txt');
    expect(new TextDecoder().decode(file?.content)).toBe('Desktop file content');
  });

  it('DesktopShellService delegates to openFn or fallback', async () => {
    const openFn = vi.fn().mockResolvedValue(undefined);
    const shellService = new DesktopShellService({ openFn });

    await shellService.openExternal('https://structpaper.org');
    expect(openFn).toHaveBeenCalledWith('https://structpaper.org');
  });
});
