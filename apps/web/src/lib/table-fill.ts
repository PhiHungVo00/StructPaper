import type { PaperTable } from '@/types/paper';

export type BodyFill = 'plain' | 'zebra' | 'shaded';

/** White by default; striped / solid tint are opt-in. Old documents that explicitly had stripes keep them. */
export function resolveBodyFill(table: Pick<PaperTable, 'bodyFill' | 'hasZebraStripes'>): BodyFill {
  return table.bodyFill ?? (table.hasZebraStripes === true ? 'zebra' : 'plain');
}

/** Should body row `index` (0-based) be tinted? */
export function rowIsTinted(fill: BodyFill, index: number): boolean {
  return fill === 'shaded' || (fill === 'zebra' && index % 2 === 0);
}
