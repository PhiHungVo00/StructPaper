import type { Rule } from '../../interfaces/compiler-router.types';

/**
 * Rule 11: Default to local in-browser compilation.
 * Table 9.2, Row 11: Còn lại (bản nháp, có mạng, môi trường sẵn sàng) -> Cục bộ (mặc định, vì giảm tải server).
 */
export const defaultLocal: Rule = (_request, context, ports) => {
  if (!ports?.local) {
    return null;
  }

  return {
    targetKind: 'browser-wasm',
    target: ports.local,
    reasonCode: 'R11_DEFAULT_LOCAL',
    reason: 'Draft compilation defaults to local in-browser WASM engine to minimize server load',
    ...(context.parity === 'substitute'
      ? {
          notice: {
            code: 'E5',
            message: 'Font xem trước khác font in',
            severity: 'info',
          },
        }
      : {}),
  };
};
