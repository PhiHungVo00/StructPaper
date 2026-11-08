import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NetworkMonitor } from '../src/monitor/network-monitor';
import type { CompileContext } from '../src/interfaces/compiler-router.types';

describe('NetworkMonitor', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe('Basic State & Defaults', () => {
    it('initializes with default online=true and serverReachable=true when no navigator', () => {
      const monitor = new NetworkMonitor();
      expect(monitor.isOnline()).toBe(true);
      expect(monitor.isServerReachable()).toBe(true);
      expect(monitor.getState()).toEqual({
        online: true,
        serverReachable: true,
      });
      monitor.dispose();
    });

    it('respects initialOnline and initialServerReachable options', () => {
      const monitor = new NetworkMonitor({
        initialOnline: false,
        initialServerReachable: false,
      });
      expect(monitor.isOnline()).toBe(false);
      expect(monitor.isServerReachable()).toBe(false);
      expect(monitor.getState()).toEqual({
        online: false,
        serverReachable: false,
      });
      monitor.dispose();
    });
  });

  describe('Subscription & State Transitions', () => {
    it('detects online/offline browser state and notifies listeners', () => {
      const monitor = new NetworkMonitor({ initialOnline: true });
      let state = monitor.getState();
      expect(state.online).toBe(true);

      const listener = vi.fn();
      const unsub = monitor.subscribe(listener);

      monitor.simulateOffline();
      expect(listener).toHaveBeenCalledWith(expect.objectContaining({ online: false }));

      monitor.simulateOnline();
      expect(listener).toHaveBeenCalledWith(expect.objectContaining({ online: true }));

      unsub();
      monitor.simulateOffline();
      expect(listener).toHaveBeenCalledTimes(2);
      monitor.dispose();
    });

    it('handles multiple subscribers and independent unsubscribes', () => {
      const monitor = new NetworkMonitor({ initialOnline: true });
      const listener1 = vi.fn();
      const listener2 = vi.fn();

      const unsub1 = monitor.subscribe(listener1);
      const unsub2 = monitor.subscribe(listener2);

      monitor.simulateOffline();
      expect(listener1).toHaveBeenCalledTimes(1);
      expect(listener2).toHaveBeenCalledTimes(1);

      unsub1();
      monitor.simulateOnline();
      expect(listener1).toHaveBeenCalledTimes(1);
      expect(listener2).toHaveBeenCalledTimes(2);

      unsub2();
      monitor.dispose();
    });

    it('does not re-notify listeners if state does not change', () => {
      const monitor = new NetworkMonitor({ initialOnline: true });
      const listener = vi.fn();
      monitor.subscribe(listener);

      monitor.simulateOnline(); // Already online
      expect(listener).not.toHaveBeenCalled();

      monitor.simulateOffline(); // Transitions to false
      expect(listener).toHaveBeenCalledTimes(1);

      monitor.simulateOffline(); // Still false
      expect(listener).toHaveBeenCalledTimes(1);

      monitor.dispose();
    });

    it('allows manually updating server reachability via simulateServerReachable', () => {
      const monitor = new NetworkMonitor({ initialServerReachable: true });
      const listener = vi.fn();
      monitor.subscribe(listener);

      monitor.simulateServerReachable(false);
      expect(monitor.isServerReachable()).toBe(false);
      expect(listener).toHaveBeenCalledWith(expect.objectContaining({ serverReachable: false }));

      monitor.simulateServerReachable(true);
      expect(monitor.isServerReachable()).toBe(true);
      expect(listener).toHaveBeenCalledWith(expect.objectContaining({ serverReachable: true }));

      monitor.dispose();
    });
  });

  describe('EventTarget / Window Listeners Integration', () => {
    it('binds to custom eventTarget and responds to online/offline events', () => {
      const listeners: Record<string, (e?: unknown) => void> = {};
      const mockEventTarget = {
        addEventListener: vi.fn((type: string, fn: (e?: unknown) => void) => {
          listeners[type] = fn;
        }),
        removeEventListener: vi.fn((type: string) => {
          delete listeners[type];
        }),
      };

      const monitor = new NetworkMonitor({
        initialOnline: true,
        eventTarget: mockEventTarget,
      });

      expect(mockEventTarget.addEventListener).toHaveBeenCalledWith('online', expect.any(Function));
      expect(mockEventTarget.addEventListener).toHaveBeenCalledWith('offline', expect.any(Function));

      // Trigger offline event
      listeners['offline']?.();
      expect(monitor.isOnline()).toBe(false);
      expect(monitor.isServerReachable()).toBe(false);

      // Trigger online event
      listeners['online']?.();
      expect(monitor.isOnline()).toBe(true);

      // Disposing monitor cleans up event listeners
      monitor.dispose();
      expect(mockEventTarget.removeEventListener).toHaveBeenCalledWith('online', expect.any(Function));
      expect(mockEventTarget.removeEventListener).toHaveBeenCalledWith('offline', expect.any(Function));
    });
  });

  describe('Server Reachability Probe (checkServerReachability)', () => {
    it('returns true on successful HTTP 200 HEAD response', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
      } as unknown as Response);

      const monitor = new NetworkMonitor({
        serverEndpoint: '/api/health',
        fetchFn: mockFetch,
        initialServerReachable: false,
      });

      const resultPromise = monitor.checkServerReachability();
      await vi.runAllTimersAsync();
      const result = await resultPromise;

      expect(result).toBe(true);
      expect(monitor.isServerReachable()).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/health',
        expect.objectContaining({
          method: 'HEAD',
          signal: expect.any(AbortSignal),
        })
      );
      expect(monitor.getState().lastCheckedAt).toBeDefined();
      monitor.dispose();
    });

    it('returns false immediately when offline without sending network probe', async () => {
      const mockFetch = vi.fn();
      const monitor = new NetworkMonitor({
        initialOnline: false,
        initialServerReachable: true,
        fetchFn: mockFetch,
      });

      const result = await monitor.checkServerReachability();
      expect(result).toBe(false);
      expect(monitor.isServerReachable()).toBe(false);
      expect(mockFetch).not.toHaveBeenCalled();
      monitor.dispose();
    });

    it('handles HTTP error status (500 Internal Server Error)', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      } as unknown as Response);

      const monitor = new NetworkMonitor({
        fetchFn: mockFetch,
        initialServerReachable: true,
      });

      const resultPromise = monitor.checkServerReachability();
      await vi.runAllTimersAsync();
      const result = await resultPromise;

      expect(result).toBe(false);
      expect(monitor.isServerReachable()).toBe(false);
      expect(monitor.getState().lastError).toContain('500');
      monitor.dispose();
    });

    it('handles network throw / fetch failure (e.g. DNS or connection refused)', async () => {
      const mockFetch = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'));

      const monitor = new NetworkMonitor({
        fetchFn: mockFetch,
        initialServerReachable: true,
      });

      const resultPromise = monitor.checkServerReachability();
      await vi.runAllTimersAsync();
      const result = await resultPromise;

      expect(result).toBe(false);
      expect(monitor.isServerReachable()).toBe(false);
      expect(monitor.getState().lastError).toBe('Failed to fetch');
      monitor.dispose();
    });

    it('handles probe timeout when request takes longer than timeoutMs', async () => {
      const mockFetch = vi.fn().mockImplementation((_url, init) => {
        return new Promise((resolve, reject) => {
          init?.signal?.addEventListener('abort', () => {
            const err = new Error('The operation was aborted');
            err.name = 'AbortError';
            reject(err);
          });
        });
      });

      const monitor = new NetworkMonitor({
        timeoutMs: 1500,
        fetchFn: mockFetch,
        initialServerReachable: true,
      });

      const checkPromise = monitor.checkServerReachability();
      // Advance past timeout
      await vi.advanceTimersByTimeAsync(1600);
      const result = await checkPromise;

      expect(result).toBe(false);
      expect(monitor.isServerReachable()).toBe(false);
      expect(monitor.getState().lastError).toContain('timed out');
      monitor.dispose();
    });

    it('allows overriding endpoint per checkServerReachability call', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 204,
      } as unknown as Response);

      const monitor = new NetworkMonitor({
        serverEndpoint: '/api/health',
        fetchFn: mockFetch,
      });

      await monitor.checkServerReachability('/api/custom-ping');
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/custom-ping',
        expect.anything()
      );
      monitor.dispose();
    });
  });

  describe('Periodic Polling Support', () => {
    it('periodically checks server reachability when pollIntervalMs is configured', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
      } as unknown as Response);

      const monitor = new NetworkMonitor({
        pollIntervalMs: 5000,
        fetchFn: mockFetch,
      });

      expect(mockFetch).toHaveBeenCalledTimes(1); // initial probe on start

      await vi.advanceTimersByTimeAsync(5000);
      expect(mockFetch).toHaveBeenCalledTimes(2);

      await vi.advanceTimersByTimeAsync(5000);
      expect(mockFetch).toHaveBeenCalledTimes(3);

      monitor.stopPolling();
      await vi.advanceTimersByTimeAsync(10000);
      expect(mockFetch).toHaveBeenCalledTimes(3);

      monitor.dispose();
    });

    it('supports starting and stopping polling dynamically', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
      } as unknown as Response);

      const monitor = new NetworkMonitor({
        fetchFn: mockFetch,
      });

      expect(mockFetch).not.toHaveBeenCalled();

      monitor.startPolling(3000);
      expect(mockFetch).toHaveBeenCalledTimes(1);

      await vi.advanceTimersByTimeAsync(3000);
      expect(mockFetch).toHaveBeenCalledTimes(2);

      monitor.stopPolling();
      await vi.advanceTimersByTimeAsync(6000);
      expect(mockFetch).toHaveBeenCalledTimes(2);

      monitor.dispose();
    });
  });

  describe('CompileContext Helper', () => {
    it('updates CompileContext with current network state', () => {
      const monitor = new NetworkMonitor({
        initialOnline: false,
        initialServerReachable: false,
      });

      const baseContext: CompileContext = {
        online: true,
        serverReachable: true,
        localEnv: 'ready',
        localEnvMatches: true,
        deviceScore: 85,
        pageEstimate: 10,
        assetBytes: 2048,
        recentLocalFailures: [],
        userPreference: 'auto',
        parity: 'same',
        localDisabledByFlag: false,
        saveData: false,
      };

      const updated = monitor.updateCompileContext(baseContext);

      expect(updated.online).toBe(false);
      expect(updated.serverReachable).toBe(false);
      // Preserves other fields
      expect(updated.localEnv).toBe('ready');
      expect(updated.deviceScore).toBe(85);

      monitor.dispose();
    });

    it('works with partial context objects', () => {
      const monitor = new NetworkMonitor({
        initialOnline: true,
        initialServerReachable: false,
      });

      const partial = { userPreference: 'server' as const };
      const updated = monitor.updateCompileContext(partial);

      expect(updated.online).toBe(true);
      expect(updated.serverReachable).toBe(false);
      expect(updated.userPreference).toBe('server');

      monitor.dispose();
    });
  });

  describe('Lifecycle & Disposal', () => {
    it('cleans up timers and subscribers on dispose()', () => {
      const monitor = new NetworkMonitor({
        pollIntervalMs: 2000,
        fetchFn: vi.fn().mockResolvedValue({ ok: true, status: 200 }),
      });
      const listener = vi.fn();
      monitor.subscribe(listener);

      monitor.dispose();

      // Subsequent simulate calls should not throw and should not notify disposed listeners
      monitor.simulateOffline();
      expect(listener).not.toHaveBeenCalled();

      // Calling dispose multiple times is safe
      expect(() => monitor.dispose()).not.toThrow();
    });
  });
});
