import { describe, it, expect } from 'vitest';
import { UlidIdGenerator, DeterministicIdGenerator } from '../src/utils/id-generator';

describe('IdGenerator', () => {
  describe('UlidIdGenerator', () => {
    it('generates standard ULID when no prefix is specified', () => {
      const generator = new UlidIdGenerator();
      const id = generator.nextId();
      expect(id).toMatch(/^[0-9A-Z]{26}$/);
    });

    it('generates prefixed ULID when prefix is provided', () => {
      const generator = new UlidIdGenerator();
      const id = generator.nextId('sec');
      expect(id).toMatch(/^sec_[0-9A-Z]{26}$/);
    });

    it('generates unique sequential IDs', () => {
      const generator = new UlidIdGenerator();
      const id1 = generator.nextId();
      const id2 = generator.nextId();
      expect(id1).not.toBe(id2);
    });
  });

  describe('DeterministicIdGenerator', () => {
    it('generates predictable incremental IDs with default prefix', () => {
      const generator = new DeterministicIdGenerator();
      expect(generator.nextId()).toBe('id_001');
      expect(generator.nextId()).toBe('id_002');
      expect(generator.nextId()).toBe('id_003');
    });

    it('tracks independent counters for different prefixes', () => {
      const generator = new DeterministicIdGenerator();
      expect(generator.nextId('fig')).toBe('fig_001');
      expect(generator.nextId('tab')).toBe('tab_001');
      expect(generator.nextId('fig')).toBe('fig_002');
      expect(generator.nextId('tab')).toBe('tab_002');
    });

    it('resets counters on reset()', () => {
      const generator = new DeterministicIdGenerator();
      expect(generator.nextId('sec')).toBe('sec_001');
      expect(generator.nextId('sec')).toBe('sec_002');
      generator.reset();
      expect(generator.nextId('sec')).toBe('sec_001');
    });
  });
});
