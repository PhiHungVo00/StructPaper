// @vitest-environment node
import { describe, it, expect, vi } from 'vitest';
import { DesktopUpdateService } from '../src/desktop-update-service';
import type { UpdateState } from '@structpaper/platform';

describe('Auto-Update E2E Integration: Live GitHub Releases & Downgrade Simulation', () => {
  const GITHUB_LATEST_ENDPOINT =
    'https://github.com/StructPaper/StructPaper/releases/latest/download/latest.json';

  it('Step 1: Successfully queries live GitHub Releases endpoint for latest manifest', async () => {
    const res = await fetch(GITHUB_LATEST_ENDPOINT);
    expect(res.ok).toBe(true);
    expect(res.status).toBe(200);

    const manifest = await res.json();
    console.log('>>> [LIVE GITHUB MANIFEST] Release Version:', manifest.version);
    console.log('>>> [LIVE GITHUB MANIFEST] Published At:', manifest.pub_date);

    expect(manifest.version).toBeDefined();
    expect(manifest.platforms).toBeDefined();
    expect(manifest.platforms['windows-x86_64']).toBeDefined();
    expect(manifest.platforms['windows-x86_64'].url).toBeDefined();
    expect(manifest.platforms['windows-x86_64'].signature).toBeDefined();
  });

  it('Step 2: Downgraded client (v1.0.0) detects live GitHub update (v1.0.7) and transitions to "available"', async () => {
    // 1. Fetch the real live manifest from GitHub
    const res = await fetch(GITHUB_LATEST_ENDPOINT);
    const manifest = await res.json();
    const liveVersion = manifest.version;

    // 2. Mock checkUpdater providing the live GitHub metadata
    const mockCheckUpdater = vi.fn().mockResolvedValue({
      available: true,
      currentVersion: '1.0.0', // Simulated downgraded version
      version: liveVersion,
      body: manifest.notes || 'Live GitHub Release Notes',
      date: manifest.pub_date,
      download: vi.fn(),
      install: vi.fn(),
    });

    const stateHistory: UpdateState['s'][] = [];
    const service = new DesktopUpdateService({
      currentVersion: '1.0.0', // Downgraded
      checkUpdater: mockCheckUpdater,
    });

    service.subscribe((state) => {
      stateHistory.push(state.s);
      console.log(`>>> [STATE TRANSITION] State: ${state.s}`, 'info' in state ? state.info : '');
    });

    // 3. Trigger update check
    const update = await service.check({ manual: true });

    // Assertions
    expect(update).not.toBeNull();
    expect(update?.version).toBe(liveVersion);
    expect(service.getState().s).toBe('available');
    expect(stateHistory).toContain('checking');
    expect(stateHistory).toContain('available');
    console.log(`✅ [TEST PASSED] Successfully detected GitHub update: v1.0.0 -> v${liveVersion}`);
  });

  it('Step 3: Up-to-date client (v1.0.7) recognizes it is on latest release and transitions to "idle"', async () => {
    const res = await fetch(GITHUB_LATEST_ENDPOINT);
    const manifest = await res.json();
    const liveVersion = manifest.version;

    const mockCheckUpdater = vi.fn().mockResolvedValue({
      available: true,
      currentVersion: liveVersion,
      version: liveVersion,
      body: manifest.notes,
      date: manifest.pub_date,
    });

    const service = new DesktopUpdateService({
      currentVersion: liveVersion, // Already on latest
      checkUpdater: mockCheckUpdater,
    });

    const update = await service.check({ manual: true });

    expect(update).toBeNull();
    expect(service.getState().s).toBe('idle');
    console.log(`✅ [TEST PASSED] Up-to-date client correctly remains in "idle" (no false updates)`);
  });

  it('Step 4: Executes full download & ready lifecycle with live package info', async () => {
    const res = await fetch(GITHUB_LATEST_ENDPOINT);
    const manifest = await res.json();

    let downloadCallback: any;
    const downloadMock = vi.fn().mockImplementation(async (onEvent) => {
      downloadCallback = onEvent;
      onEvent({ event: 'Started', data: { contentLength: 45760512 } });
      onEvent({ event: 'Progress', data: { chunkLength: 22880256 } });
      onEvent({ event: 'Progress', data: { chunkLength: 22880256 } });
      onEvent({ event: 'Finished' });
    });
    const installMock = vi.fn().mockResolvedValue(undefined);
    const relaunchMock = vi.fn().mockResolvedValue(undefined);

    const mockUpdate = {
      available: true,
      currentVersion: '1.0.0',
      version: manifest.version,
      body: manifest.notes,
      date: manifest.pub_date,
      download: downloadMock,
      install: installMock,
    };

    const service = new DesktopUpdateService({
      currentVersion: '1.0.0',
      checkUpdater: vi.fn().mockResolvedValue(mockUpdate),
      relaunchFn: relaunchMock,
    });

    // 1. Check
    const info = await service.check({ manual: true });
    expect(info).not.toBeNull();
    expect(service.getState().s).toBe('available');

    // 2. Install (downloads then transitions to ready)
    await service.install(info!);
    expect(downloadMock).toHaveBeenCalledTimes(1);
    expect(service.getState().s).toBe('ready');
    console.log(`✅ [TEST PASSED] Download lifecycle completed: state transitioned to "ready"`);

    // 3. Restart
    await service.restart();
    expect(service.getState().s).toBe('installing');
    expect(installMock).toHaveBeenCalledTimes(1);
    expect(relaunchMock).toHaveBeenCalledTimes(1);
    console.log(`✅ [TEST PASSED] Relaunch triggered: state transitioned to "installing"`);
  });
});
