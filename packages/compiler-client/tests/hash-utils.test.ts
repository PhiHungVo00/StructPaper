import { describe, it, expect } from 'vitest';
import { computeSha256, hashCompileRequest } from '../src/utils/hash-utils';
import type { CompileRequest } from '../src/interfaces/compiler-port';

describe('packages/compiler-client - hash-utils', () => {
  it('computes standard SHA-256 test vectors', () => {
    // Empty string SHA-256
    expect(computeSha256('')).toBe(
      'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
    );

    // Standard vector "abc"
    expect(computeSha256('abc')).toBe(
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad'
    );

    // Standard vector "test"
    expect(computeSha256('test')).toBe(
      '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08'
    );
  });

  it('produces identical deterministic hash regardless of image key insertion order', () => {
    const reqA: CompileRequest = {
      tex: '\\section{Introduction}',
      paperId: 'p1',
      images: {
        'zeta.png': 'data_z',
        'alpha.png': 'data_a',
        'beta.png': 'data_b',
      },
    };

    const reqB: CompileRequest = {
      tex: '\\section{Introduction}',
      paperId: 'p1',
      images: {
        'alpha.png': 'data_a',
        'beta.png': 'data_b',
        'zeta.png': 'data_z',
      },
    };

    expect(hashCompileRequest(reqA)).toBe(hashCompileRequest(reqB));
  });

  it('produces different hash when tex or assets change', () => {
    const reqBase: CompileRequest = {
      tex: 'Original content',
    };

    const reqDifferentTex: CompileRequest = {
      tex: 'Modified content',
    };

    const reqWithImages: CompileRequest = {
      tex: 'Original content',
      images: { 'fig1.png': 'abc' },
    };

    const hashBase = hashCompileRequest(reqBase);
    const hashDiff = hashCompileRequest(reqDifferentTex);
    const hashImg = hashCompileRequest(reqWithImages);

    expect(hashBase).not.toBe(hashDiff);
    expect(hashBase).not.toBe(hashImg);
  });
});
