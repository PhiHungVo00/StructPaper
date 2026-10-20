import { SciSpaceElementAttributes } from '@/types/template-engine/elements';
import { createDefaultAttributes } from './base';

export const BACKMATTER_ATTRIBUTES: Record<
  | 'abbreviations-list'
  | 'conflict-of-interest'
  | 'author-contribution'
  | 'acknowledgement-box'
  | 'bibliography-item'
  | 'running-footer',
  SciSpaceElementAttributes
> = {
  'abbreviations-list': createDefaultAttributes({
    typography: {
      fontSizePt: 7.2,
      color: '#1E293B',
    },
    spacing: {
      marginTopPt: 6,
      marginBottomPt: 6,
    },
    layoutScope: {
      columnSpan: 'single',
    },
  }),

  'conflict-of-interest': createDefaultAttributes({
    typography: {
      fontSizePt: 7.6,
      color: '#1E293B',
    },
    spacing: {
      marginTopPt: 5,
      marginBottomPt: 5,
    },
    layoutScope: {
      columnSpan: 'single',
    },
  }),

  'author-contribution': createDefaultAttributes({
    typography: {
      fontSizePt: 7.6,
      color: '#1E293B',
    },
    spacing: {
      marginTopPt: 5,
      marginBottomPt: 5,
    },
    layoutScope: {
      columnSpan: 'single',
    },
  }),

  'acknowledgement-box': createDefaultAttributes({
    typography: {
      fontSizePt: 7.6,
      color: '#334155',
    },
    spacing: {
      marginTopPt: 5,
      marginBottomPt: 5,
      paddingTopMm: 1.5,
      paddingRightMm: 2,
      paddingBottomMm: 1.5,
      paddingLeftMm: 2,
    },
    layoutScope: {
      columnSpan: 'single',
    },
    decorations: {
      borderTop: true,
      borderBottom: true,
      borderLeft: true,
      borderRight: true,
      borderWidthPt: 0.5,
      borderStyle: 'solid',
      borderColor: '#CBD5E1',
      backgroundColor: '#F8FAFC',
      borderRadiusPx: 3,
    },
  }),

  'bibliography-item': createDefaultAttributes({
    typography: {
      fontFamily: 'Minion Pro, Times New Roman, serif',
      fontSizePt: 7.5,
      color: '#334155',
      lineHeight: 1.25,
    },
    spacing: {
      marginTopPt: 1.5,
      marginBottomPt: 1.5,
      hangingIndentMm: 4,
    },
    layoutScope: {
      columnSpan: 'single',
    },
    numbering: {
      scheme: 'arabic',
      citationStyle: 'Vancouver',
    },
  }),

  'running-footer': createDefaultAttributes({
    typography: {
      fontSizePt: 7.5,
      fontWeight: '700',
      color: '#2B74B7',
      lineHeight: 1.2,
    },
    spacing: {
      marginTopPt: 3,
      marginBottomPt: 0,
      paddingTopMm: 1.5,
    },
    layoutScope: {
      columnSpan: 'all',
      display: 'flex',
    },
    numbering: {
      scheme: 'arabic',
    },
  }),
};
