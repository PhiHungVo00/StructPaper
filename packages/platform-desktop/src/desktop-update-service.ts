import type {
  UpdateErrorCode,
  UpdateInfo,
  UpdateService,
  UpdateState,
} from '@structpaper/platform';
import type { check as checkUpdaterType, DownloadEvent, Update } from '@tauri-apps/plugin-updater';
import type { relaunch as relaunchType } from '@tauri-apps/plugin-process';

export interface BeforeInstallHooks {
  flushAutosave?: () => Promise<void> | void;
  settleCompile?: () => Promise<void> | void;
  flushOutbox?: () => Promise<void> | void;
  createBackup?: () => Promise<void> | void;
  closeDialogs?: () => Promise<void> | void;
  [key: string]: (() => Promise<void> | void) | undefined;
}

export type BeforeInstallHook = () => Promise<void> | void;

export interface DesktopUpdateServiceOptions {
  channel?: 'stable' | 'beta';
  currentVersion?: string;
  onBeforeInstall?: BeforeInstallHook | BeforeInstallHook[] | BeforeInstallHooks;
  checkUpdater?: typeof checkUpdaterType;
  relaunchFn?: typeof relaunchType;
  target?: string;
  timeout?: number;
}

export function mapErrorToCode(err: unknown): UpdateErrorCode {
  const msg = (err instanceof Error ? err.message : String(err)).toLowerCase();

  if (
    msg.includes('signature') ||
    msg.includes('pubkey') ||
    msg.includes('verify') ||
    msg.includes('checksum') ||
    msg.includes('minisign') ||
    msg.includes('tamper')
  ) {
    return 'U2_SIGNATURE';
  }

  if (
    msg.includes('space') ||
    msg.includes('disk') ||
    msg.includes('enospc') ||
    msg.includes('full') ||
    msg.includes('storage')
  ) {
    return 'U4_DISK';
  }

  if (
    msg.includes('permission') ||
    msg.includes('access denied') ||
    msg.includes('eacces') ||
    msg.includes('eperm') ||
    msg.includes('unauthorized')
  ) {
    return 'U5_PERMISSION';
  }

  if (
    msg.includes('download') ||
    msg.includes('chunk') ||
    msg.includes('transfer')
  ) {
    return 'U3_DOWNLOAD';
  }

  if (
    msg.includes('offline') ||
    msg.includes('network') ||
    msg.includes('failed to fetch') ||
    msg.includes('enotfound') ||
    msg.includes('econnrefused') ||
    msg.includes('connection') ||
    msg.includes('dns') ||
    msg.includes('internet') ||
    msg.includes('timed out') ||
    msg.includes('timeout')
  ) {
    return 'U1_OFFLINE';
  }

  if (
    msg.includes('endpoint') ||
    msg.includes('invalid response') ||
    msg.includes('json') ||
    msg.includes('404') ||
    msg.includes('500') ||
    msg.includes('502') ||
    msg.includes('503') ||
    msg.includes('bad url') ||
    msg.includes('invalid url') ||
    msg.includes('status code')
  ) {
    return 'U6_ENDPOINT';
  }

  if (
    msg.includes('install') ||
    msg.includes('extract') ||
    msg.includes('patch')
  ) {
    return 'U7_INSTALL';
  }

  return 'U7_INSTALL';
}

export class DesktopUpdateService implements UpdateService {
  readonly channel: 'stable' | 'beta';
  private state: UpdateState = { s: 'idle' };
  private readonly listeners = new Set<(state: UpdateState) => void>();
  private readonly currentVersion?: string;
  private readonly onBeforeInstall?: BeforeInstallHook | BeforeInstallHook[] | BeforeInstallHooks;
  private readonly checkUpdater?: typeof checkUpdaterType;
  private readonly relaunchFn?: typeof relaunchType;
  private readonly target?: string;
  private readonly timeout?: number;
  private readonly skippedVersions = new Set<string>();
  private remindUntil: number | null = null;
  private currentUpdate: Update | null = null;

  constructor(options?: DesktopUpdateServiceOptions) {
    this.channel = options?.channel ?? 'stable';
    this.currentVersion = options?.currentVersion;
    this.onBeforeInstall = options?.onBeforeInstall;
    this.checkUpdater = options?.checkUpdater;
    this.relaunchFn = options?.relaunchFn;
    this.target = options?.target;
    this.timeout = options?.timeout;
  }

  getState(): UpdateState {
    return this.state;
  }

  subscribe(listener: (state: UpdateState) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private setState(next: UpdateState): void {
    this.state = next;
    for (const listener of this.listeners) {
      try {
        listener(next);
      } catch (err) {
        console.error('Error in UpdateService listener:', err);
      }
    }
  }

  private async getCheckFn(): Promise<typeof checkUpdaterType | null> {
    if (this.checkUpdater) {
      return this.checkUpdater;
    }
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      const updaterMod = await import('@tauri-apps/plugin-updater');
      return (async (options?: any) => {
        try {
          if (options?.headers) {
            options.headers = Array.from(new Headers(options.headers).entries());
          }
          const meta = await invoke<any>('plugin:updater|check', options ?? {});
          if (!meta) {
            return null;
          }
          // Tauri Rust returns Metadata without `available` property (Some(meta) implies available).
          // Explicitly set available: true so Update instance and callers recognize it.
          return new updaterMod.Update({ ...meta, available: true });
        } catch (err: unknown) {
          const msg = (err instanceof Error ? err.message : String(err)).toLowerCase();
          if (
            msg.includes("reading 'available'") ||
            msg.includes('available of null') ||
            (msg.includes('available') && msg.includes('null'))
          ) {
            return null;
          }
          throw err;
        }
      }) as unknown as typeof checkUpdaterType;
    } catch {
      return null;
    }
  }

  private async getRelaunchFn(): Promise<typeof relaunchType | null> {
    if (this.relaunchFn) {
      return this.relaunchFn;
    }
    try {
      const processMod = await import('@tauri-apps/plugin-process');
      return processMod.relaunch;
    } catch {
      return null;
    }
  }

  async check(opts?: { manual?: boolean }): Promise<UpdateInfo | null> {
    const isManual = Boolean(opts?.manual);

    if (!isManual && this.remindUntil && Date.now() < this.remindUntil) {
      return null;
    }

    this.setState({ s: 'checking' });

    try {
      const checkFn = await this.getCheckFn();
      if (!checkFn) {
        this.setState({ s: 'idle' });
        return null;
      }

      const update = await checkFn({
        target: this.target,
        timeout: this.timeout,
      });

      if (!update || !update.available) {
        this.setState({ s: 'idle' });
        return null;
      }

      if (this.currentVersion && update.version === this.currentVersion) {
        this.setState({ s: 'idle' });
        return null;
      }

      if (!isManual && this.skippedVersions.has(update.version)) {
        this.setState({ s: 'idle' });
        return null;
      }

      this.currentUpdate = update;

      const info: UpdateInfo = {
        version: update.version,
        notes: update.body,
        publishedAt: update.date,
        mandatory: false,
        kind: 'app-binary',
      };

      this.setState({ s: 'available', info });
      return info;
    } catch (err: unknown) {
      const msg = (err instanceof Error ? err.message : String(err)).toLowerCase();
      // Handle running in non-Tauri test environments or updater null bug
      if (
        msg.includes('window is not defined') ||
        msg.includes("reading 'invoke'") ||
        (msg.includes('invoke') && msg.includes('undefined')) ||
        msg.includes("reading 'available'") ||
        msg.includes('available of null') ||
        (msg.includes('available') && msg.includes('null'))
      ) {
        this.setState({ s: 'idle' });
        return null;
      }

      const code = mapErrorToCode(err);

      // In automatic check (opts.manual === false), silent for offline/endpoint
      if (opts?.manual === false && (code === 'U1_OFFLINE' || code === 'U6_ENDPOINT')) {
        this.setState({ s: 'idle' });
        return null;
      }

      const message = err instanceof Error ? err.message : String(err);
      this.setState({
        s: 'error',
        code,
        message,
        retryAt: Date.now() + 60_000,
      });
      return null;
    }
  }

  private async runBeforeInstallHooks(): Promise<void> {
    const hooks = this.onBeforeInstall;
    if (!hooks) return;

    if (typeof hooks === 'function') {
      await hooks();
      return;
    }

    if (Array.isArray(hooks)) {
      for (const hook of hooks) {
        if (typeof hook === 'function') {
          await hook();
        }
      }
      return;
    }

    if (typeof hooks === 'object') {
      // 1. flushAutosave (flush pending edits to IndexedDB)
      // 2. settleCompile (wait for active compilation)
      // 3. flushOutbox
      // 4. createBackup
      // 5. closeDialogs
      const specOrder: (keyof BeforeInstallHooks)[] = [
        'flushAutosave',
        'settleCompile',
        'flushOutbox',
        'createBackup',
        'closeDialogs',
      ];

      for (const key of specOrder) {
        const fn = hooks[key];
        if (typeof fn === 'function') {
          await fn();
        }
      }

      for (const [key, fn] of Object.entries(hooks)) {
        if (!specOrder.includes(key as keyof BeforeInstallHooks) && typeof fn === 'function') {
          await fn();
        }
      }
    }
  }

  async install(info: UpdateInfo): Promise<void> {
    // If state is already ready, transition to installing
    if (this.state.s === 'ready') {
      this.setState({ s: 'installing', info });
      if (this.currentUpdate && typeof this.currentUpdate.install === 'function') {
        try {
          await this.currentUpdate.install();
        } catch (err: unknown) {
          const code = mapErrorToCode(err);
          const message = err instanceof Error ? err.message : String(err);
          this.setState({ s: 'error', code, message });
          throw err;
        }
      }
      return;
    }

    // 1. Execute safety hooks sequentially
    try {
      await this.runBeforeInstallHooks();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      this.setState({
        s: 'error',
        code: 'U7_INSTALL',
        message: `Safety hook failed before install: ${message}`,
      });
      throw err;
    }

    // 2. Transition to downloading
    this.setState({ s: 'downloading', info, received: 0 });

    // 3. Download package
    if (this.currentUpdate && typeof this.currentUpdate.download === 'function') {
      try {
        let receivedBytes = 0;
        let totalBytes: number | undefined;

        await this.currentUpdate.download((event: DownloadEvent) => {
          if (event.event === 'Started') {
            totalBytes = event.data?.contentLength;
            receivedBytes = 0;
            this.setState({
              s: 'downloading',
              info,
              received: receivedBytes,
              total: totalBytes,
            });
          } else if (event.event === 'Progress') {
            receivedBytes += event.data?.chunkLength ?? 0;
            this.setState({
              s: 'downloading',
              info,
              received: receivedBytes,
              total: totalBytes,
            });
          } else if (event.event === 'Finished') {
            // Finished
          }
        });

        this.setState({ s: 'ready', info });
      } catch (err: unknown) {
        let code = mapErrorToCode(err);
        if (code === 'U7_INSTALL' || code === 'U1_OFFLINE') {
          code = 'U3_DOWNLOAD';
        }
        const message = err instanceof Error ? err.message : String(err);
        this.setState({ s: 'error', code, message });
        throw err;
      }
    } else {
      this.setState({ s: 'ready', info });
    }
  }

  async restart(): Promise<void> {
    if (this.state.s === 'ready' || this.state.s === 'available') {
      this.setState({ s: 'installing', info: this.state.info });
    }

    if (this.currentUpdate && typeof this.currentUpdate.install === 'function') {
      try {
        await this.currentUpdate.install();
      } catch {
        // Continue to relaunch if already prepared
      }
    }

    try {
      const relaunchFn = await this.getRelaunchFn();
      if (relaunchFn) {
        await relaunchFn();
      }
    } catch (err: unknown) {
      // In unmocked environments, do not throw uncaught exceptions
    }
  }

  skipVersion(version: string): void {
    this.skippedVersions.add(version);
    if (this.state.s === 'available' && this.state.info.version === version) {
      this.setState({ s: 'idle' });
    }
  }

  remindLater(hours: number): void {
    this.remindUntil = Date.now() + Math.max(0, hours) * 3600 * 1000;
    if (this.state.s === 'available') {
      this.setState({ s: 'idle' });
    }
  }
}
