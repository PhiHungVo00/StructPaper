import type {
  Capabilities,
  PlatformServices,
  RuntimeConfig,
} from '@structpaper/platform';
import {
  DesktopUpdateService,
  type DesktopUpdateServiceOptions,
  type BeforeInstallHook,
  type BeforeInstallHooks,
} from './desktop-update-service';
import {
  DesktopFileService,
  type DesktopFileServiceOptions,
} from './desktop-file-service';
import {
  DesktopShellService,
  type DesktopShellServiceOptions,
} from './desktop-shell-service';

export interface CreateDesktopPlatformOptions {
  config?: Partial<RuntimeConfig>;
  onBeforeInstall?: BeforeInstallHook | BeforeInstallHook[] | BeforeInstallHooks;
  updateOptions?: DesktopUpdateServiceOptions;
  fileOptions?: DesktopFileServiceOptions;
  shellOptions?: DesktopShellServiceOptions;
}

export function createDesktopPlatform(
  options?: CreateDesktopPlatformOptions
): PlatformServices {
  const capabilities: Capabilities = {
    kind: 'desktop',
    canInstallApp: false,
    hasAppUpdater: true,
    hasNativeCompiler: true,
    hasFileSystem: true,
  };

  const defaultApiBaseUrl =
    typeof window !== 'undefined' && window.location?.origin
      ? `${window.location.origin}/api`
      : 'http://localhost:3000/api';

  const config: RuntimeConfig = {
    apiBaseUrl: options?.config?.apiBaseUrl ?? defaultApiBaseUrl,
    appVersion: options?.config?.appVersion ?? '1.0.8',
    buildId: options?.config?.buildId ?? 'desktop-dev',
    channel: options?.config?.channel ?? 'stable',
  };

  const updates = new DesktopUpdateService({
    channel: config.channel,
    currentVersion: config.appVersion,
    onBeforeInstall: options?.onBeforeInstall ?? options?.updateOptions?.onBeforeInstall,
    ...options?.updateOptions,
  });

  const files = new DesktopFileService(options?.fileOptions);
  const shell = new DesktopShellService(options?.shellOptions);

  return {
    capabilities,
    config,
    files,
    updates,
    shell,
  };
}

export * from './desktop-update-service';
export * from './desktop-file-service';
export * from './desktop-shell-service';
