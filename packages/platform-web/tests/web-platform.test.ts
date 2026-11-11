// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  createWebPlatform,
  WebUpdateService,
  WebFileService,
  WebShellService,
  WebWindowService,
} from '../src';
import type { UpdateState, UpdateInfo } from '@structpaper/platform';

describe('packages/platform-web: createWebPlatform', () => {
  it('creates web platform with expected capabilities and default config', () => {
    const platform = createWebPlatform();

    expect(platform.capabilities).toEqual({
      kind: 'web',
      canInstallApp: true,
      hasAppUpdater: false,
      hasNativeCompiler: false,
      hasFileSystem: false,
    });

    expect(platform.config.appVersion).toBe('0.1.0');
    expect(platform.config.channel).toBe('stable');
    expect(platform.config.buildId).toBe('web-dev');
    expect(platform.files).toBeInstanceOf(WebFileService);
    expect(platform.updates).toBeInstanceOf(WebUpdateService);
    expect(platform.shell).toBeInstanceOf(WebShellService);
    expect(platform.window).toBeInstanceOf(WebWindowService);
    expect(platform.window.isSupported()).toBe(false);
  });

  it('allows customizing RuntimeConfig', () => {
    const platform = createWebPlatform({
      config: {
        apiBaseUrl: 'https://cloud.structpaper.org/api',
        appVersion: '2.0.0',
        buildId: 'build-prod-42',
        channel: 'beta',
      },
    });

    expect(platform.config.apiBaseUrl).toBe('https://cloud.structpaper.org/api');
    expect(platform.config.appVersion).toBe('2.0.0');
    expect(platform.config.buildId).toBe('build-prod-42');
    expect(platform.config.channel).toBe('beta');
    expect(platform.updates.channel).toBe('beta');
  });
});

describe('packages/platform-web: WebUpdateService', () => {
  let reloadMock: () => void;

  beforeEach(() => {
    reloadMock = vi.fn();
  });

  it('initializes in idle state and defaults to stable channel', () => {
    const service = new WebUpdateService();
    expect(service.getState()).toEqual({ s: 'idle' });
    expect(service.channel).toBe('stable');
  });

  it('subscribes and unsubscribes listener', () => {
    const service = new WebUpdateService();
    const listener = vi.fn();
    const unsub = service.subscribe(listener);

    service.skipVersion('1.0.0'); // no change
    expect(listener).not.toHaveBeenCalled();

    unsub();
  });

  it('detects available update on check() when remote version is newer', async () => {
    const mockData = {
      version: '1.2.0',
      notes: 'New LaTeX engine features',
      publishedAt: '2026-11-09T01:00:00Z',
      mandatory: false,
    };

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockData,
    } as unknown as Response);

    const service = new WebUpdateService({
      currentVersion: '1.0.0',
      versionEndpoint: '/version.json',
      fetchFn: mockFetch as unknown as typeof fetch,
      reloadFn: reloadMock,
    });

    const states: UpdateState[] = [];
    service.subscribe((st) => states.push(st));

    const result = await service.check();

    expect(mockFetch).toHaveBeenCalledWith('/version.json', {
      cache: 'no-store',
      headers: { Accept: 'application/json' },
    });

    const expectedInfo: UpdateInfo = {
      version: '1.2.0',
      notes: 'New LaTeX engine features',
      publishedAt: '2026-11-09T01:00:00Z',
      mandatory: false,
      kind: 'web-reload',
    };

    expect(result).toEqual(expectedInfo);
    expect(service.getState()).toEqual({ s: 'available', info: expectedInfo });
    expect(states).toEqual([
      { s: 'checking' },
      { s: 'available', info: expectedInfo },
    ]);
  });

  it('returns null and transitions back to idle when current version matches remote', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ version: '1.0.0' }),
    } as unknown as Response);

    const service = new WebUpdateService({
      currentVersion: '1.0.0',
      fetchFn: mockFetch as unknown as typeof fetch,
    });

    const result = await service.check();
    expect(result).toBeNull();
    expect(service.getState()).toEqual({ s: 'idle' });
  });

  it('returns null and recovers gracefully when fetch endpoint returns 404 or fails', async () => {
    const mockFetch404 = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
    } as unknown as Response);

    const service404 = new WebUpdateService({
      fetchFn: mockFetch404 as unknown as typeof fetch,
    });
    expect(await service404.check()).toBeNull();
    expect(service404.getState()).toEqual({ s: 'idle' });

    const mockFetchError = vi.fn().mockRejectedValue(new Error('Network error'));
    const serviceError = new WebUpdateService({
      fetchFn: mockFetchError as unknown as typeof fetch,
    });
    expect(await serviceError.check()).toBeNull();
    expect(serviceError.getState()).toEqual({ s: 'idle' });
  });

  it('handles skipVersion and clears available state', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ version: '1.1.0' }),
    } as unknown as Response);

    const service = new WebUpdateService({
      currentVersion: '1.0.0',
      fetchFn: mockFetch as unknown as typeof fetch,
    });

    await service.check();
    expect(service.getState().s).toBe('available');

    // Skipping this version resets available state to idle
    service.skipVersion('1.1.0');
    expect(service.getState()).toEqual({ s: 'idle' });

    // Subsequent non-manual check returns null because it is skipped
    const subsequentCheck = await service.check();
    expect(subsequentCheck).toBeNull();

    // Manual check bypasses skip
    const manualCheck = await service.check({ manual: true });
    expect(manualCheck?.version).toBe('1.1.0');
  });

  it('handles remindLater and suppresses updates until timer expires', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ version: '1.2.0' }),
    } as unknown as Response);

    const service = new WebUpdateService({
      currentVersion: '1.0.0',
      fetchFn: mockFetch as unknown as typeof fetch,
    });

    await service.check();
    expect(service.getState().s).toBe('available');

    service.remindLater(24);
    expect(service.getState()).toEqual({ s: 'idle' });

    // Non-manual check returns null without checking endpoint
    mockFetch.mockClear();
    const res = await service.check();
    expect(res).toBeNull();
    expect(mockFetch).not.toHaveBeenCalled();

    // Manual check still checks
    const manualRes = await service.check({ manual: true });
    expect(manualRes?.version).toBe('1.2.0');
  });

  it('triggers reload and updates state on install()', async () => {
    const service = new WebUpdateService({ reloadFn: reloadMock });
    const updateInfo: UpdateInfo = {
      version: '2.0.0',
      mandatory: false,
      kind: 'web-reload',
    };

    await service.install(updateInfo);

    expect(service.getState()).toEqual({ s: 'installing', info: updateInfo });
    expect(reloadMock).toHaveBeenCalledTimes(1);
  });

  it('triggers reload on restart()', async () => {
    const service = new WebUpdateService({ reloadFn: reloadMock });
    await service.restart();
    expect(reloadMock).toHaveBeenCalledTimes(1);
  });
});

describe('packages/platform-web: WebFileService', () => {
  let createdUrls: string[] = [];
  let revokedUrls: string[] = [];
  const originalCreateObjectURL = URL.createObjectURL;
  const originalRevokeObjectURL = URL.revokeObjectURL;

  beforeEach(() => {
    createdUrls = [];
    revokedUrls = [];
    URL.createObjectURL = vi.fn((blob: Blob) => {
      const url = `blob:fake-url-${createdUrls.length + 1}`;
      createdUrls.push(url);
      return url;
    });
    URL.revokeObjectURL = vi.fn((url: string) => {
      revokedUrls.push(url);
    });
  });

  afterEach(() => {
    URL.createObjectURL = originalCreateObjectURL;
    URL.revokeObjectURL = originalRevokeObjectURL;
    vi.restoreAllMocks();
  });

  it('saves file content using DOM anchor element and URL.createObjectURL', async () => {
    const fileService = new WebFileService();
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    await fileService.saveFile('test.tex', '\\documentclass{article}');

    expect(URL.createObjectURL).toHaveBeenCalledTimes(1);
    expect(clickSpy).toHaveBeenCalledTimes(1);

    clickSpy.mockRestore();
  });

  it('saves Blob file content directly', async () => {
    const fileService = new WebFileService();
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    const pdfBlob = new Blob([new Uint8Array([0x25, 0x50, 0x44, 0x46])], {
      type: 'application/pdf',
    });
    await fileService.saveFile('document.pdf', pdfBlob);

    expect(URL.createObjectURL).toHaveBeenCalledTimes(1);
    expect(clickSpy).toHaveBeenCalledTimes(1);

    clickSpy.mockRestore();
  });

  it('opens file via hidden input element with file selection', async () => {
    const fileService = new WebFileService();

    const mockContent = new Uint8Array([1, 2, 3, 4]).buffer;
    const mockFile = new File(['1234'], 'sample.docx', { type: 'application/vnd.openxmlformats' });
    Object.defineProperty(mockFile, 'arrayBuffer', {
      value: async () => mockContent,
    });

    const clickSpy = vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(function (this: HTMLInputElement) {
      Object.defineProperty(this, 'files', {
        value: [mockFile],
        writable: false,
      });
      // Fire change event
      this.dispatchEvent(new Event('change'));
    });

    const resultPromise = fileService.openFile('.docx');
    const result = await resultPromise;

    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(result).not.toBeNull();
    expect(result?.name).toBe('sample.docx');
    expect(result?.content).toBe(mockContent);

    clickSpy.mockRestore();
  });

  it('returns null when openFile is cancelled', async () => {
    const fileService = new WebFileService();

    const clickSpy = vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(function (this: HTMLInputElement) {
      this.dispatchEvent(new Event('cancel'));
    });

    const result = await fileService.openFile();
    expect(result).toBeNull();

    clickSpy.mockRestore();
  });
});

describe('packages/platform-web: WebShellService', () => {
  it('opens external URL with _blank and secure features', async () => {
    const openMock = vi.fn();
    const shell = new WebShellService({ openFn: openMock });

    await shell.openExternal('https://structpaper.org');

    expect(openMock).toHaveBeenCalledWith(
      'https://structpaper.org',
      '_blank',
      'noopener,noreferrer'
    );
  });

  it('falls back to window.open when no custom openFn is provided', async () => {
    const windowOpenSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
    const shell = new WebShellService();

    await shell.openExternal('https://github.com/StructPaper');

    expect(windowOpenSpy).toHaveBeenCalledWith(
      'https://github.com/StructPaper',
      '_blank',
      'noopener,noreferrer'
    );

    windowOpenSpy.mockRestore();
  });
});

describe('packages/platform-web: WebWindowService', () => {
  it('exposes unsupported window controls that resolve safely as no-ops', async () => {
    const win = new WebWindowService();
    expect(win.isSupported()).toBe(false);
    await expect(win.minimize()).resolves.toBeUndefined();
    await expect(win.toggleMaximize()).resolves.toBeUndefined();
    await expect(win.close()).resolves.toBeUndefined();
    await expect(win.startDragging()).resolves.toBeUndefined();
    await expect(win.isMaximized()).resolves.toBe(false);
    const unsub = win.onMaximizedChange(() => {});
    expect(() => unsub()).not.toThrow();
  });
});
