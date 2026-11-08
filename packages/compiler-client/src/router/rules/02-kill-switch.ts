import type { Rule } from '../../interfaces/compiler-router.types';

/**
 * Rule 02: Remote kill-switch disables local compilation.
 * Table 9.2, Row 2: localDisabledByFlag -> Server.
 * If offline: explicitly notify user that compilation is blocked.
 */
export const killSwitch: Rule = (_request, context, ports) => {
  if (!context.localDisabledByFlag) {
    return null;
  }

  return {
    targetKind: 'server-native',
    target: ports?.server,
    reasonCode: 'R02_KILL_SWITCH',
    reason: 'Local in-browser compilation disabled by remote flag',
    ...(context.online
      ? {}
      : {
          notice: {
            code: 'LOCAL_DISABLED_OFFLINE',
            message: 'Biên dịch cục bộ bị vô hiệu hóa từ xa và thiết bị đang ngoại tuyến',
            severity: 'error',
          },
        }),
  };
};
