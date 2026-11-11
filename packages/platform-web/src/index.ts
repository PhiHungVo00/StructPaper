import type {
  Capabilities,
  PlatformServices,
  RuntimeConfig,
} from '@structpaper/platform';
import { WebUpdateService, type WebUpdateServiceOptions } from './web-update-service';
import { WebFileService } from './web-file-service';
import { WebShellService, type WebShellServiceOptions } from './web-shell-service';
import { WebWindowService } from './web-window-service';

export interface CreateWebPlatformOptions {
  config?: Partial<RuntimeConfig>;
  updateOptions?: WebUpdateServiceOptions;
  shellOptions?: WebShellServiceOptions;
}

export function createWebPlatform(options?: CreateWebPlatformOptions): PlatformServices {
  const capabilities: Capabilities = {
    kind: 'web',
    canInstallApp: true,
    hasAppUpdater: false,
    hasNativeCompiler: false,
    hasFileSystem: false,
  };

  const defaultApiBaseUrl =
    typeof window !== 'undefined' && window.location?.origin
      ? `${window.location.origin}/api`
      : 'http://localhost:3000/api';

  const config: RuntimeConfig = {
    apiBaseUrl: options?.config?.apiBaseUrl ?? defaultApiBaseUrl,
    appVersion: options?.config?.appVersion ?? '0.1.0',
    buildId: options?.config?.buildId ?? 'web-dev',
    channel: options?.config?.channel ?? 'stable',
  };

  const updates = new WebUpdateService({
    currentVersion: config.appVersion,
    channel: config.channel,
    ...options?.updateOptions,
  });

  const files = new WebFileService();
  const shell = new WebShellService(options?.shellOptions);
  const windowService = new WebWindowService();

  return {
    capabilities,
    config,
    files,
    updates,
    shell,
    window: windowService,
  };
}

export * from './web-update-service';
export * from './web-file-service';
export * from './web-shell-service';
export * from './web-window-service';
