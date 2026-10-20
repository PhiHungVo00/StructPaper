import { SciSpaceElementAttributes } from '@/types/template-engine/elements';
import { createDefaultAttributes } from './base';

export const FRONTMATTER_ATTRIBUTES: Record<
  | 'article-header-badge'
  | 'article-title'
  | 'author-list'
  | 'affiliation-list'
  | 'citation-strip'
  | 'metadata-sidebar'
  | 'abstract-box'
  | 'keywords-group'
  | 'running-header',
  SciSpaceElementAttributes
> = {
  'article-header-badge': createDefaultAttributes({
    typography: {
      fontSizePt: 7.5,
      fontWeight: '600',
      color: '#475569',
      lineHeight: 1.2,
    },
    spacing: {
      marginTopPt: 0,
      marginBottomPt: 4,
      paddingBottomMm: 1,
    },
    layoutScope: {
      columnSpan: 'all',
      display: 'flex',
    },
    decorations: {
      borderBottom: true,
      borderWidthPt: 0.5,
      borderStyle: 'solid',
      borderColor: '#E2E8F0',
    },
  }),

  'article-title': createDefaultAttributes({
    typography: {
      fontFamily: 'Minion Pro, Times New Roman, serif',
      fontSizePt: 18,
      fontWeight: '700',
      color: '#2B74B7',
      lineHeight: 1.15,
      letterSpacingEm: -0.01,
    },
    spacing: {
      marginTopPt: 6,
      marginBottomPt: 8,
    },
    layoutScope: {
      columnSpan: 'all',
    },
  }),

  'author-list': createDefaultAttributes({
    typography: {
      fontSizePt: 9.5,
      fontWeight: '700',
      color: '#0F172A',
    },
    spacing: {
      marginTopPt: 2,
      marginBottomPt: 4,
    },
    layoutScope: {
      columnSpan: 'all',
    },
  }),

  'affiliation-list': createDefaultAttributes({
    typography: {
      fontSizePt: 7.2,
      fontStyle: 'italic',
      color: '#475569',
      lineHeight: 1.3,
    },
    spacing: {
      marginTopPt: 2,
      marginBottomPt: 6,
    },
    layoutScope: {
      columnSpan: 'single',
    },
  }),

  'citation-strip': createDefaultAttributes({
    typography: {
      fontSizePt: 7.2,
      color: '#0F172A',
    },
    spacing: {
      marginTopPt: 4,
      marginBottomPt: 4,
      paddingTopMm: 1.5,
      paddingRightMm: 2,
      paddingBottomMm: 1.5,
      paddingLeftMm: 2,
    },
    layoutScope: {
      columnSpan: 'all',
    },
    decorations: {
      borderTop: true,
      borderBottom: true,
      borderLeft: true,
      borderRight: true,
      borderWidthPt: 0.75,
      borderStyle: 'solid',
      borderColor: '#BFDBFE',
      backgroundColor: '#DBEAFE',
      borderRadiusPx: 2,
    },
  }),

  'metadata-sidebar': createDefaultAttributes({
    typography: {
      fontSizePt: 6.8,
      color: '#334155',
      lineHeight: 1.25,
    },
    spacing: {
      marginTopPt: 4,
      marginBottomPt: 6,
    },
    layoutScope: {
      columnSpan: 'single',
    },
  }),

  'abstract-box': createDefaultAttributes({
    typography: {
      fontFamily: 'Minion Pro, Times New Roman, serif',
      fontSizePt: 8.5,
      color: '#1E293B',
      lineHeight: 1.35,
    },
    spacing: {
      marginTopPt: 6,
      marginBottomPt: 6,
      paddingTopMm: 2,
      paddingRightMm: 2.5,
      paddingBottomMm: 2,
      paddingLeftMm: 3,
      textAlign: 'justify',
    },
    layoutScope: {
      columnSpan: 'all',
    },
    decorations: {
      borderLeft: true,
      borderWidthPt: 2,
      borderStyle: 'solid',
      borderColor: '#2B74B7',
      backgroundColor: '#F8FAFC',
      borderRadiusPx: 2,
    },
  }),

  'keywords-group': createDefaultAttributes({
    typography: {
      fontSizePt: 8,
      color: '#334155',
    },
    spacing: {
      marginTopPt: 3,
      marginBottomPt: 8,
    },
    layoutScope: {
      columnSpan: 'all',
    },
  }),

  'running-header': createDefaultAttributes({
    typography: {
      fontSizePt: 7.5,
      fontStyle: 'italic',
      color: '#64748B',
      lineHeight: 1.2,
    },
    spacing: {
      marginTopPt: 0,
      marginBottomPt: 3,
      paddingBottomMm: 1.5,
    },
    layoutScope: {
      columnSpan: 'all',
      display: 'flex',
    },
    decorations: {
      borderBottom: true,
      borderWidthPt: 0.5,
      borderStyle: 'solid',
      borderColor: '#94A3B8',
    },
  }),
};
