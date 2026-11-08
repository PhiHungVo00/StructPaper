import type { Rule } from '../../interfaces/compiler-router.types';

const RECENT_FAILURE_WINDOW_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Rule 10: Recent local failure (OOM E2, Timeout E4, Engine crash E7).
 * Table 9.2, Row 10: Có lỗi E2/E4 gần đây -> Server tạm thời.
 */
export const recentFailure: Rule = (_request, context, ports) => {
  if (!context.recentLocalFailures || context.recentLocalFailures.length === 0) {
    return null;
  }

  const now = Date.now();
  const hasRelevantRecentCrash = context.recentLocalFailures.some((failure) => {
    const isRelevantCode =
      failure.code === 'E2' || failure.code === 'E4' || failure.code === 'E7';
    if (!isRelevantCode) {
      return false;
    }
    // If timestamp is provided, verify within 10 minute window
    if (typeof failure.at === 'number' && failure.at > 0) {
      return now - failure.at <= RECENT_FAILURE_WINDOW_MS;
    }
    return true;
  });

  const hasConsecutiveFailures = context.recentLocalFailures.length >= 3;

  if (hasRelevantRecentCrash || hasConsecutiveFailures) {
    return {
      targetKind: 'server-native',
      target: ports?.server,
      reasonCode: 'R10_RECENT_FAILURE',
      reason: 'Recent local WASM crash or timeout detected within last 10 minutes; temporarily routing to server',
      notice: {
        code: 'E2',
        message: 'Gặp lỗi biên dịch cục bộ gần đây, tạm chuyển sang máy chủ',
        severity: 'warning',
        action: 'switch-server',
      },
    };
  }

  return null;
};
