import { SciSpaceElementAttributes } from '@/types/template-engine/elements';
import { createDefaultAttributes } from './base';

export const BODY_ATTRIBUTES: Record<
  'paragraph' | 'equation-block' | 'callout-box',
  SciSpaceElementAttributes
> = {
  paragraph: createDefaultAttributes({
    typography: {
      fontFamily: 'Minion Pro, Times New Roman, serif',
      fontSizePt: 9,
      color: '#1E293B',
      lineHeight: 1.35,
    },
    spacing: {
      marginTopPt: 0,
      marginBottomPt: 4,
      firstLineIndentMm: 4,
      textAlign: 'justify',
    },
    layoutScope: {
      columnSpan: 'single',
    },
  }),

  'equation-block': createDefaultAttributes({
    typography: {
      fontFamily: 'Minion Pro, Times New Roman, serif',
      fontSizePt: 9.5,
      fontStyle: 'italic',
      color: '#0F172A',
    },
    spacing: {
      marginTopPt: 6,
      marginBottomPt: 6,
      textAlign: 'center',
    },
    layoutScope: {
      columnSpan: 'single',
    },
    numbering: {
      scheme: 'arabic',
      prefix: '(',
      suffix: ')',
    },
  }),

  'callout-box': createDefaultAttributes({
    typography: {
      fontSizePt: 8.5,
      color: '#1E293B',
      lineHeight: 1.3,
    },
    spacing: {
      marginTopPt: 5,
      marginBottomPt: 5,
      paddingTopMm: 2,
      paddingRightMm: 2.5,
      paddingBottomMm: 2,
      paddingLeftMm: 3,
    },
    layoutScope: {
      columnSpan: 'single',
    },
    decorations: {
      borderLeft: true,
      borderWidthPt: 2.5,
      borderStyle: 'solid',
      borderColor: '#F97316',
      backgroundColor: '#FFF7ED',
      borderRadiusPx: 2,
    },
  }),
};
