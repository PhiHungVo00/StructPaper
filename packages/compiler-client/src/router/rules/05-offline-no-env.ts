import type { Rule } from '../../interfaces/compiler-router.types';

/**
 * Rule 05: Offline with environment not ready or mismatched.
 * Table 9.2, Row 5: Ngoại tuyến và không sẵn sàng -> Lỗi E1, hiện preview nhanh HTML.
 */
export const offlineNoEnv: Rule = (_request, context, ports) => {
  if (!context.online && (context.localEnv !== 'ready' || !context.localEnvMatches)) {
    return {
      targetKind: 'browser-wasm',
      target: ports?.local,
      reasonCode: 'R05_OFFLINE_NO_ENV',
      reason: 'Device is offline but local TeX environment is missing, downloading, or outdated',
      notice: {
        code: 'E1',
        message: 'Cần tải gói biên dịch trước khi dùng ngoại tuyến',
        severity: 'error',
        action: 'download',
      },
    };
  }

  return null;
};
