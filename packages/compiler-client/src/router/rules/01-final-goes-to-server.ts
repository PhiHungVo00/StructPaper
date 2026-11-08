import type { Rule } from '../../interfaces/compiler-router.types';

/**
 * Rule 01: Final publication goes to server.
 * Table 9.2, Row 1: mode = 'final' -> Server.
 * If offline: queue request in outbox and notify user it will compile once online.
 */
export const finalGoesToServer: Rule = (request, context, ports) => {
  if (request.mode !== 'final') {
    return null;
  }

  return {
    targetKind: 'server-native',
    target: ports?.server,
    reasonCode: 'R01_FINAL_SERVER',
    reason: 'Final publication mode requires server-native compiler for full PDF/X and prepress fidelity',
    ...(context.online
      ? {}
      : {
          notice: {
            code: 'QUEUE_OFFLINE',
            message: 'Yêu cầu xuất bản chính thức được xếp vào hàng chờ cho đến khi có kết nối mạng',
            severity: 'info',
            action: 'switch-server',
          },
        }),
  };
};
