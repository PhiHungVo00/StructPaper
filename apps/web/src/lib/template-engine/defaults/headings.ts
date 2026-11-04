import { SciSpaceElementAttributes } from '@/types/template-engine/elements';
import { createDefaultAttributes } from './base';

export const HEADINGS_ATTRIBUTES: Record<
  'heading-1' | 'heading-2' | 'heading-3',
  SciSpaceElementAttributes
> = {
  'heading-1': createDefaultAttributes({
    typography: {
      fontSizePt: 11,
      fontWeight: '700',
      textTransform: 'uppercase',
      color: '#0F284E',
      lineHeight: 1.2,
    },
    spacing: {
      marginTopPt: 10,
      marginBottomPt: 4,
    },
    layoutScope: {
      columnSpan: 'single',
    },
    numbering: {
      scheme: 'roman',
      suffix: '.',
    },
  }),

  'heading-2': createDefaultAttributes({
    typography: {
      fontSizePt: 10,
      fontWeight: '700',
      color: '#1E293B',
      lineHeight: 1.25,
    },
    spacing: {
      marginTopPt: 7,
      marginBottomPt: 3,
    },
    layoutScope: {
      columnSpan: 'single',
    },
    numbering: {
      scheme: 'decimal',
    },
  }),

  'heading-3': createDefaultAttributes({
    typography: {
      fontSizePt: 9.5,
      fontWeight: '700',
      fontStyle: 'italic',
      color: '#334155',
      lineHeight: 1.25,
    },
    spacing: {
      marginTopPt: 5,
      marginBottomPt: 2,
    },
    layoutScope: {
      columnSpan: 'single',
    },
    numbering: {
      scheme: 'decimal',
    },
  }),
};
