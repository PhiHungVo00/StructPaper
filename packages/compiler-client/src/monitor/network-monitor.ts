import type { CompileContext } from '../interfaces/compiler-router.types';

/**
 * Snapshot of current network and backend server status.
 */
export interface NetworkState {
  /** Whether the browser or client has active internet connectivity */
  online: boolean;

  /** Whether the compiler backend server is reachable via health probe / API */
  serverReachable: boolean;

  /** Timestamp in milliseconds of the last reachability check */
  lastCheckedAt?: number;

  /** Error message or diagnostic details if reachability probe failed */
  lastError?: string;
}

/**
 * Listener callback invoked whenever network or server reachability status changes.
 */
export type NetworkStateListener = (state: NetworkState) => void;

/**
 * Configuration options for initializing NetworkMonitor.
 */
export interface NetworkMonitorOptions {
  /** Initial online status (default: navigator.onLine if available, otherwise true) */
  initialOnline?: boolean;

  /** Initial server reachability status (default: true) */
  initialServerReachable?: boolean;

  /** Health probe endpoint URL (default: '/api/health') */
  serverEndpoint?: string;

  /** Timeout for probe fetch in milliseconds (default: 3000ms) */
  timeoutMs?: number;

  /** Dependency injection for fetch */
  fetchFn?: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

  /** Custom event target for online/offline events (default: window if in browser) */
  eventTarget?: {
    addEventListener(type: string, listener: (event?: unknown) => void): void;
    removeEventListener(type: string, listener: (event?: unknown) => void): void;
  };

  /** Periodic polling interval in milliseconds. If > 0, automatically starts polling */
  pollIntervalMs?: number;

  /** Whether to trigger checkServerReachability when online event fires (default: true) */
  checkOnOnline?: boolean;
}

/**
 * NetworkMonitor
 *
 * Monitors browser online/offline status (`navigator.onLine`) and probes backend
 * server reachability with configurable timeout and polling.
 * Supports dependency injection for seamless testing in Node/browser environments.
 */
export class NetworkMonitor {
  private _online: boolean;
  private _serverReachable: boolean;
  private _lastCheckedAt?: number;
  private _lastError?: string;

  private readonly _listeners = new Set<NetworkStateListener>();
  private readonly _options: NetworkMonitorOptions;
  private readonly _eventTarget?: NetworkMonitorOptions['eventTarget'];

  private _pollTimer: ReturnType<typeof setInterval> | null = null;
  private _onlineHandler?: (e?: unknown) => void;
  private _offlineHandler?: (e?: unknown) => void;
  private _disposed = false;

  constructor(options: NetworkMonitorOptions = {}) {
    this._options = options;

    if (options.initialOnline !== undefined) {
      this._online = options.initialOnline;
    } else if (typeof navigator !== 'undefined' && typeof navigator.onLine === 'boolean') {
      this._online = navigator.onLine;
    } else {
      this._online = true;
    }

    this._serverReachable = options.initialServerReachable ?? true;

    // Resolve event target for online/offline listeners
    if (options.eventTarget) {
      this._eventTarget = options.eventTarget;
    } else if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
      this._eventTarget = window;
    }

    if (this._eventTarget) {
      this._onlineHandler = () => this._handleOnline();
      this._offlineHandler = () => this._handleOffline();

      this._eventTarget.addEventListener('online', this._onlineHandler);
      this._eventTarget.addEventListener('offline', this._offlineHandler);
    }

    if (options.pollIntervalMs && options.pollIntervalMs > 0) {
      this.startPolling(options.pollIntervalMs);
    }
  }

  /**
   * Returns whether internet connectivity is currently present.
   */
  public isOnline(): boolean {
    return this._online;
  }

  /**
   * Returns whether backend compile server is reachable.
   */
  public isServerReachable(): boolean {
    return this._serverReachable;
  }

  /**
   * Returns a snapshot of current network state.
   */
  public getState(): NetworkState {
    const state: NetworkState = {
      online: this._online,
      serverReachable: this._serverReachable,
    };
    if (this._lastCheckedAt !== undefined) {
      state.lastCheckedAt = this._lastCheckedAt;
    }
    if (this._lastError !== undefined) {
      state.lastError = this._lastError;
    }
    return state;
  }

  /**
   * Subscribes to network and server reachability updates.
   * Returns an unsubscribe callback.
   */
  public subscribe(listener: NetworkStateListener): () => void {
    if (this._disposed) {
      return () => {};
    }
    this._listeners.add(listener);
    return () => {
      this._listeners.delete(listener);
    };
  }

  /**
   * Probes server reachability using lightweight HEAD request with timeout.
   * If client is offline, short-circuits to false.
   */
  public async checkServerReachability(endpoint?: string): Promise<boolean> {
    if (this._disposed) {
      return false;
    }

    // When client is offline, server is unreachable
    if (!this._online) {
      const prevReachable = this._serverReachable;
      this._serverReachable = false;
      if (prevReachable) {
        this._notify();
      }
      return false;
    }

    const url = endpoint ?? this._options.serverEndpoint ?? '/api/health';
    const timeoutMs = this._options.timeoutMs ?? 3000;
    const fetchFn = this._options.fetchFn ?? (typeof fetch !== 'undefined' ? fetch.bind(globalThis) : undefined);

    if (!fetchFn) {
      return this._serverReachable;
    }

    const controller = new AbortController();
    let isTimeout = false;
    const timeoutHandle = setTimeout(() => {
      isTimeout = true;
      controller.abort();
    }, timeoutMs);

    try {
      const res = await fetchFn(url, {
        method: 'HEAD',
        signal: controller.signal,
      });
      clearTimeout(timeoutHandle);

      const reachable = res.ok || (res.status >= 200 && res.status < 400);
      const changed = this._serverReachable !== reachable;

      this._serverReachable = reachable;
      this._lastCheckedAt = Date.now();
      if (!reachable) {
        this._lastError = `Server responded with status ${res.status}${res.statusText ? ` (${res.statusText})` : ''}`;
      } else {
        this._lastError = undefined;
      }

      if (changed || this._lastError) {
        this._notify();
      }

      return reachable;
    } catch (err: unknown) {
      clearTimeout(timeoutHandle);
      const prevReachable = this._serverReachable;
      this._serverReachable = false;
      this._lastCheckedAt = Date.now();

      if (isTimeout) {
        this._lastError = `Server reachability check timed out after ${timeoutMs}ms`;
      } else if (err instanceof Error) {
        this._lastError = err.message;
      } else {
        this._lastError = String(err);
      }

      if (prevReachable || this._lastError) {
        this._notify();
      }

      return false;
    }
  }

  /**
   * Starts periodic polling for server reachability.
   */
  public startPolling(intervalMs?: number): void {
    if (this._disposed) {
      return;
    }
    this.stopPolling();

    const interval = intervalMs ?? this._options.pollIntervalMs ?? 15000;
    // Execute immediate check
    this.checkServerReachability().catch(() => {});

    this._pollTimer = setInterval(() => {
      this.checkServerReachability().catch(() => {});
    }, interval);
  }

  /**
   * Stops periodic polling.
   */
  public stopPolling(): void {
    if (this._pollTimer !== null) {
      clearInterval(this._pollTimer);
      this._pollTimer = null;
    }
  }

  /**
   * Helper to update CompileContext with the latest network & reachability state.
   */
  public updateCompileContext<T extends Partial<CompileContext>>(context: T): T {
    return {
      ...context,
      online: this.isOnline(),
      serverReachable: this.isServerReachable(),
    };
  }

  /**
   * Simulates browser transitioning to offline state (for testing / manual override).
   */
  public simulateOffline(): void {
    this._handleOffline();
  }

  /**
   * Simulates browser transitioning to online state (for testing / manual override).
   */
  public simulateOnline(): void {
    this._handleOnline();
  }

  /**
   * Simulates updating server reachability directly (for testing / manual override).
   */
  public simulateServerReachable(reachable: boolean): void {
    if (this._disposed) {
      return;
    }
    if (this._serverReachable !== reachable) {
      this._serverReachable = reachable;
      this._notify();
    }
  }

  /**
   * Cleans up event listeners, intervals, and subscriber sets.
   */
  public dispose(): void {
    if (this._disposed) {
      return;
    }
    this._disposed = true;
    this.stopPolling();

    if (this._eventTarget && this._onlineHandler && this._offlineHandler) {
      this._eventTarget.removeEventListener('online', this._onlineHandler);
      this._eventTarget.removeEventListener('offline', this._offlineHandler);
    }

    this._listeners.clear();
  }

  private _handleOnline(): void {
    if (this._disposed) {
      return;
    }
    const changed = !this._online;
    this._online = true;

    if (changed) {
      this._notify();
    }

    if (this._options.checkOnOnline !== false) {
      this.checkServerReachability().catch(() => {});
    }
  }

  private _handleOffline(): void {
    if (this._disposed) {
      return;
    }
    const changedOnline = this._online;
    const changedServer = this._serverReachable;

    this._online = false;
    this._serverReachable = false;

    if (changedOnline || changedServer) {
      this._notify();
    }
  }

  private _notify(): void {
    if (this._disposed) {
      return;
    }
    const state = this.getState();
    for (const listener of this._listeners) {
      try {
        listener(state);
      } catch {
        // Prevent subscriber exceptions from breaking caller loop
      }
    }
  }
}
