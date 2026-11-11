import type {
  UpdateInfo,
  UpdateState,
  UpdateErrorCode,
  UpdateService,
} from './services/update-service';
import type { FileService } from './services/file-service';
import type { ShellService } from './services/shell-service';
import type { WindowService } from './services/window-service';

export type PlatformKind = 'web' | 'desktop';

export interface Capabilities {
  kind: PlatformKind;
  canInstallApp: boolean;
  hasAppUpdater: boolean;
  hasNativeCompiler: boolean;
  hasFileSystem: boolean;
}

export interface RuntimeConfig {
  apiBaseUrl: string;
  appVersion: string;
  buildId: string;
  channel: 'stable' | 'beta';
}

export interface PlatformServices {
  capabilities: Capabilities;
  config: RuntimeConfig;
  files: FileService;
  updates: UpdateService;
  shell: ShellService;
  window: WindowService;
}

export type { UpdateInfo, UpdateState, UpdateErrorCode, UpdateService };
export type { FileService };
export type { ShellService };
export type { WindowService, MaximizedChangeListener } from './services/window-service';
