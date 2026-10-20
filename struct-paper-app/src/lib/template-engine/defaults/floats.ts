import { SciSpaceElementAttributes } from '@/types/template-engine/elements';
import { createDefaultAttributes } from './base';

export const FLOATS_ATTRIBUTES: Record<
  'figure-caption' | 'table-caption',
  SciSpaceElementAttributes
> = {
  'figure-caption': createDefaultAttributes({
    typography: {
      fontSizePt: 8,
      fontStyle: 'italic',
      color: '#334155',
      lineHeight: 1.25,
    },
    spacing: {
      marginTopPt: 4,
      marginBottomPt: 8,
    },
    layoutScope: {
      columnSpan: 'single',
    },
    numbering: {
      scheme: 'arabic',
      prefix: 'Hình ',
      suffix: ':',
    },
  }),

  'table-caption': createDefaultAttributes({
    typography: {
      fontSizePt: 8,
      fontWeight: '600',
      color: '#0F172A',
      lineHeight: 1.25,
    },
    spacing: {
      marginTopPt: 6,
      marginBottomPt: 4,
    },
    layoutScope: {
      columnSpan: 'single',
    },
    numbering: {
      scheme: 'arabic',
      prefix: 'Bảng ',
      suffix: ':',
    },
  }),
};
