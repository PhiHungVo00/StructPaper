import { describe, it, expect, vi } from 'vitest';
import { CompileCache, computeCompileCacheKey } from '../src/cache/compile-cache';
import type { CompileRequest, CompileResult } from '../src/interfaces/compiler-port';

describe('packages/compiler-client - CompileCache', () => {
  const sampleRequest: CompileRequest = {
    tex: '\\documentclass{article}\\begin{document}Cache Me\\end{document}',
    images: {
      'figA.png': 'dataA',
      'figB.png': 'dataB',
    },
    mode: 'draft',
    environmentId: 'tl2026.1-wasm',
  };

  const sampleResult: CompileResult = {
    status: 'success',
    pdfBuffer: new Uint8Array([0x25, 0x50, 0x44, 0x46]),
    logs: ['Output written on main.pdf'],
    durationMs: 400,
    report: {
      errors: [],
      warnings: [],
      overfullHbox: 0,
      missingFonts: [],
      missingReferences: [],
    },
    producedBy: {
      kind: 'browser-wasm',
      environmentId: 'tl2026.1-wasm',
    },
  };

  describe('Deterministic cache key computation', () => {
    it('generates a 64-character hex SHA-256 hash', () => {
      const key = computeCompileCacheKey(sampleRequest);
      expect(key).toMatch(/^[a-f0-9]{64}$/);
    });

    it('generates the same key regardless of image property ordering', () => {
      const req1: CompileRequest = {
        tex: 'Sample',
        images: { b: '2', a: '1' },
        mode: 'draft',
        environmentId: 'env-1',
      };
      const req2: CompileRequest = {
        tex: 'Sample',
        images: { a: '1', b: '2' },
        mode: 'draft',
        environmentId: 'env-1',
      };
      expect(computeCompileCacheKey(req1)).toBe(computeCompileCacheKey(req2));
    });

    it('changes key when tex content changes', () => {
      const key1 = computeCompileCacheKey(sampleRequest);
      const key2 = computeCompileCacheKey({
        ...sampleRequest,
        tex: sampleRequest.tex + ' modified',
      });
      expect(key1).not.toBe(key2);
    });

    it('changes key when compilation mode changes (draft vs final)', () => {
      const keyDraft = computeCompileCacheKey({
        ...sampleRequest,
        mode: 'draft',
      });
      const keyFinal = computeCompileCacheKey({
        ...sampleRequest,
        mode: 'final',
      });
      expect(keyDraft).not.toBe(keyFinal);
    });

    it('changes key when environmentId changes', () => {
      const key1 = computeCompileCacheKey({
        ...sampleRequest,
        environmentId: 'env-v1',
      });
      const key2 = computeCompileCacheKey({
        ...sampleRequest,
        environmentId: 'env-v2',
      });
      expect(key1).not.toBe(key2);
    });

    it('changes key when images change', () => {
      const key1 = computeCompileCacheKey({
        ...sampleRequest,
        images: { 'a.png': 'data1' },
      });
      const key2 = computeCompileCacheKey({
        ...sampleRequest,
        images: { 'a.png': 'data2' },
      });
      expect(key1).not.toBe(key2);
    });
  });

  describe('In-memory LRU caching', () => {
    it('returns null on cache miss', async () => {
      const cache = new CompileCache();
      const cached = await cache.get(sampleRequest);
      expect(cached).toBeNull();
    });

    it('stores and retrieves result with fromCache: true', async () => {
      const cache = new CompileCache();
      await cache.set(sampleRequest, sampleResult);

      const cached = await cache.get(sampleRequest);
      expect(cached).not.toBeNull();
      expect(cached?.fromCache).toBe(true);
      expect(cached?.status).toBe('success');
      expect(cached?.pdfBuffer).toEqual(sampleResult.pdfBuffer);
      expect(cached?.logs).toEqual(sampleResult.logs);
      expect(cached?.producedBy).toEqual(sampleResult.producedBy);
    });

    it('returns isolated cloned result so mutations do not taint cache', async () => {
      const cache = new CompileCache();
      await cache.set(sampleRequest, sampleResult);

      const cached1 = await cache.get(sampleRequest);
      expect(cached1).not.toBeNull();
      // Mutate returned object
      cached1!.logs.push('Mutated log');
      if (cached1!.pdfBuffer) {
        cached1!.pdfBuffer[0] = 0xff;
      }

      const cached2 = await cache.get(sampleRequest);
      expect(cached2?.logs).toEqual(['Output written on main.pdf']);
      expect(cached2?.pdfBuffer?.[0]).toBe(0x25);
    });

    it('evicts least recently used item when capacity is exceeded', async () => {
      const cache = new CompileCache({ maxEntries: 2 });

      const reqA: CompileRequest = { tex: 'Doc A' };
      const reqB: CompileRequest = { tex: 'Doc B' };
      const reqC: CompileRequest = { tex: 'Doc C' };

      await cache.set(reqA, { ...sampleResult, logs: ['A'] });
      await cache.set(reqB, { ...sampleResult, logs: ['B'] });

      expect(cache.size).toBe(2);
      expect(await cache.has(reqA)).toBe(true);
      expect(await cache.has(reqB)).toBe(true);

      // Inserting 3rd entry evicts oldest (reqA)
      await cache.set(reqC, { ...sampleResult, logs: ['C'] });

      expect(cache.size).toBe(2);
      expect(await cache.has(reqA)).toBe(false);
      expect(await cache.get(reqA)).toBeNull();
      expect(await cache.has(reqB)).toBe(true);
      expect(await cache.has(reqC)).toBe(true);
    });

    it('refreshes entry recency on access (LRU order)', async () => {
      const cache = new CompileCache({ maxEntries: 2 });

      const reqA: CompileRequest = { tex: 'Doc A' };
      const reqB: CompileRequest = { tex: 'Doc B' };
      const reqC: CompileRequest = { tex: 'Doc C' };

      await cache.set(reqA, { ...sampleResult, logs: ['A'] });
      await cache.set(reqB, { ...sampleResult, logs: ['B'] });

      // Access reqA to make it most recently used
      const resA = await cache.get(reqA);
      expect(resA?.logs).toEqual(['A']);

      // Now insert reqC; reqB should be evicted, reqA and reqC should remain
      await cache.set(reqC, { ...sampleResult, logs: ['C'] });

      expect(await cache.has(reqA)).toBe(true);
      expect(await cache.has(reqB)).toBe(false);
      expect(await cache.has(reqC)).toBe(true);
    });

    it('supports delete, clear, and size methods', async () => {
      const cache = new CompileCache();
      await cache.set(sampleRequest, sampleResult);
      expect(cache.size).toBe(1);

      const deleted = await cache.delete(sampleRequest);
      expect(deleted).toBe(true);
      expect(cache.size).toBe(0);
      expect(await cache.get(sampleRequest)).toBeNull();

      await cache.set(sampleRequest, sampleResult);
      expect(cache.size).toBe(1);
      await cache.clear();
      expect(cache.size).toBe(0);
    });
  });

  describe('Optional persistent storage backing', () => {
    it('queries persistent storage on memory cache miss and populates memory', async () => {
      const mockStorage = {
        get: vi.fn().mockResolvedValue(sampleResult),
        set: vi.fn().mockResolvedValue(undefined),
        delete: vi.fn().mockResolvedValue(undefined),
        clear: vi.fn().mockResolvedValue(undefined),
      };

      const cache = new CompileCache({ storage: mockStorage });
      const cached = await cache.get(sampleRequest);

      expect(mockStorage.get).toHaveBeenCalledTimes(1);
      expect(cached).not.toBeNull();
      expect(cached?.fromCache).toBe(true);
      expect(cache.size).toBe(1); // Promoted to memory

      // Second get should hit memory without calling storage.get again
      await cache.get(sampleRequest);
      expect(mockStorage.get).toHaveBeenCalledTimes(1);
    });

    it('writes to persistent storage on set', async () => {
      const mockStorage = {
        get: vi.fn().mockResolvedValue(null),
        set: vi.fn().mockResolvedValue(undefined),
      };

      const cache = new CompileCache({ storage: mockStorage });
      await cache.set(sampleRequest, sampleResult);

      expect(mockStorage.set).toHaveBeenCalledTimes(1);
      const [calledKey, calledVal] = mockStorage.set.mock.calls[0];
      expect(calledKey).toBe(computeCompileCacheKey(sampleRequest));
      expect(calledVal.status).toBe('success');
    });

    it('deletes from persistent storage on delete', async () => {
      const mockStorage = {
        get: vi.fn().mockResolvedValue(null),
        set: vi.fn().mockResolvedValue(undefined),
        delete: vi.fn().mockResolvedValue(undefined),
      };

      const cache = new CompileCache({ storage: mockStorage });
      await cache.delete(sampleRequest);

      expect(mockStorage.delete).toHaveBeenCalledWith(computeCompileCacheKey(sampleRequest));
    });
  });

  describe('TTL (Time to Live) expiration', () => {
    it('expires cached entries after ttlMs', async () => {
      const cache = new CompileCache({ ttlMs: 50 });
      await cache.set(sampleRequest, sampleResult);

      expect(await cache.has(sampleRequest)).toBe(true);
      expect(await cache.get(sampleRequest)).not.toBeNull();

      // Wait 60ms for TTL expiration
      await new Promise((resolve) => setTimeout(resolve, 60));

      expect(await cache.get(sampleRequest)).toBeNull();
      expect(await cache.has(sampleRequest)).toBe(false);
    });
  });
});
