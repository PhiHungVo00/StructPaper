import type { Rule } from '../../interfaces/compiler-router.types';

/**
 * Rule 07: Local environment not ready while online.
 * Table 9.2, Row 7: localEnv không sẵn sàng (đang tải, thiếu, cũ) và có mạng -> Server (kèm gợi ý tải gói).
 */
export const envNotReady: Rule = (_request, context, ports) => {
  if (context.online && (context.localEnv !== 'ready' || !context.localEnvMatches)) {
    return {
      targetKind: 'server-native',
      target: ports?.server,
      reasonCode: 'R07_ENV_NOT_READY',
      reason: 'Local environment is not ready or does not match pinned version; routed to server',
      notice: {
        code: 'E1',
        message: 'Môi trường cục bộ chưa sẵn sàng, đã chuyển sang máy chủ (gợi ý: tải gói môi trường)',
        severity: 'info',
        action: 'download',
      },
    };
  }

  return null;
};
