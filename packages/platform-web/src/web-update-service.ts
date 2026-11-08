import type {
  UpdateInfo,
  UpdateService,
  UpdateState,
} from '@structpaper/platform';

export interface WebUpdateServiceOptions {
  currentVersion?: string;
  versionEndpoint?: string;
  channel?: 'stable' | 'beta';
  reloadFn?: () => void;
  fetchFn?: typeof fetch;
}

export class WebUpdateService implements UpdateService {
  readonly channel: 'stable' | 'beta';
  private state: UpdateState = { s: 'idle' };
  private readonly listeners = new Set<(state: UpdateState) => void>();
  private readonly currentVersion: string;
  private readonly versionEndpoint: string;
  private readonly reloadFn?: () => void;
  private readonly fetchFn?: typeof fetch;
  private readonly skippedVersions = new Set<string>();
  private remindUntil: number | null = null;

  constructor(options?: WebUpdateServiceOptions) {
    this.channel = options?.channel ?? 'stable';
    this.currentVersion = options?.currentVersion ?? '0.1.0';
    this.versionEndpoint = options?.versionEndpoint ?? '/version.json';
    this.reloadFn = options?.reloadFn;
    this.fetchFn = options?.fetchFn;
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

  async check(opts?: { manual?: boolean }): Promise<UpdateInfo | null> {
    const isManual = !!opts?.manual;

    if (!isManual && this.remindUntil && Date.now() < this.remindUntil) {
      return null;
    }

    this.setState({ s: 'checking' });

    const fetcher = this.fetchFn ?? (typeof fetch !== 'undefined' ? fetch : undefined);
    if (!fetcher) {
      this.setState({ s: 'idle' });
      return null;
    }

    try {
      const res = await fetcher(this.versionEndpoint, {
        cache: 'no-store',
        headers: { Accept: 'application/json' },
      });

      if (!res.ok) {
        this.setState({ s: 'idle' });
        return null;
      }

      const data = await res.json();
      const newVersion = data?.version;

      if (!newVersion || newVersion === this.currentVersion) {
        this.setState({ s: 'idle' });
        return null;
      }

      if (!isManual && this.skippedVersions.has(newVersion)) {
        this.setState({ s: 'idle' });
        return null;
      }

      const info: UpdateInfo = {
        version: newVersion,
        notes: data?.notes,
        publishedAt: data?.publishedAt,
        mandatory: Boolean(data?.mandatory),
        kind: 'web-reload',
      };

      this.setState({ s: 'available', info });
      return info;
    } catch {
      this.setState({ s: 'idle' });
      return null;
    }
  }

  async install(info: UpdateInfo): Promise<void> {
    this.setState({ s: 'installing', info });
    this.doReload();
  }

  async restart(): Promise<void> {
    this.doReload();
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

  private doReload(): void {
    if (this.reloadFn) {
      this.reloadFn();
      return;
    }
    if (typeof window !== 'undefined' && window.location?.reload) {
      window.location.reload();
    }
  }
}
