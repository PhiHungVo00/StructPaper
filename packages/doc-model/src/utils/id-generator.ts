import { ulid } from 'ulid';

export interface IdGenerator {
  nextId(prefix?: string): string;
}

export class UlidIdGenerator implements IdGenerator {
  nextId(prefix?: string): string {
    const id = ulid();
    return prefix ? `${prefix}_${id}` : id;
  }
}

export class DeterministicIdGenerator implements IdGenerator {
  private counters: Map<string, number> = new Map();

  constructor(private readonly defaultPrefix: string = 'id') {}

  nextId(prefix?: string): string {
    const p = prefix ?? this.defaultPrefix;
    const current = (this.counters.get(p) ?? 0) + 1;
    this.counters.set(p, current);
    const padded = String(current).padStart(3, '0');
    return `${p}_${padded}`;
  }

  reset(): void {
    this.counters.clear();
  }
}
