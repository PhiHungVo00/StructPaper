/**
 * Preflight QC Engine Wrapper
 * 
 * Provides a clean adapter layer over computePreflightCheck.
 * In Phase 5, this wrapper will seamlessly route to @structpaper/qc-engine.
 */

import { CompletePaper, PreflightCheck } from '@/types/paper';
import { computePreflightCheck } from '@/lib/docx-extractor';

export interface PreflightEngineOptions {
  strictImrad?: boolean;
  minAbstractWords?: number;
}

/**
 * Computes or normalizes preflight check results from a CompletePaper or existing PreflightCheck.
 */
export function computePreflightCheckWrapper(
  input: CompletePaper | PreflightCheck | null | undefined,
  _options?: PreflightEngineOptions
): PreflightCheck {
  if (!input) {
    return {
      titleOk: false,
      titleEnOk: false,
      abstractOk: false,
      abstractEnOk: false,
      keywordsCount: 0,
      keywordsEnCount: 0,
      authorsCount: 0,
      affiliationsCount: 0,
      correspondingOk: false,
      imradOk: false,
      foundImradSections: {
        intro: false,
        methods: false,
        results: false,
        discussion: false,
        conclusion: false,
      },
      totalFigures: 0,
      totalTables: 0,
      totalReferences: 0,
      uncitedReferences: [],
      missingCitations: [],
      vancouverConformant: false,
      score: 0,
      issues: [
        {
          id: 'missing_paper',
          category: 'metadata',
          severity: 'error',
          title: 'Thiếu dữ liệu bản thảo',
          message: 'Không tìm thấy dữ liệu bài báo để kiểm định.',
          suggestion: 'Vui lòng tải lên hoặc tạo mới bài báo.',
          fixTab: 'metadata',
        },
      ],
    };
  }

  // If already a PreflightCheck object with score and foundImradSections
  if ('score' in input && 'foundImradSections' in input && 'issues' in input) {
    return input as PreflightCheck;
  }

  // Compute from CompletePaper
  return computePreflightCheck(input as CompletePaper);
}

export const runPreflightCheck = computePreflightCheckWrapper;
