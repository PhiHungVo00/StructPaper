import type { Rule } from '../../interfaces/compiler-router.types';

/**
 * Rule 06: Substitute preview fonts with layout-dependent inspection.
 * Table 9.2, Row 6: parity = 'substitute' và yêu cầu kiểm tra phụ thuộc bố cục ->
 * Server; nếu ngoại tuyến thì cục bộ kèm nhãn font xem trước.
 */
export const substituteFonts: Rule = (request, context, ports) => {
  if (context.parity !== 'substitute') {
    return null;
  }

  const isLayoutSensitive = Boolean(
    request.options?.layoutCheck ||
      (request as Record<string, unknown>).layoutCheck ||
      (request as Record<string, unknown>).checkLayout ||
      (context as Record<string, unknown>).layoutCheck ||
      (context as Record<string, unknown>).layoutSensitive
  );

  if (!isLayoutSensitive) {
    return null;
  }

  if (context.online) {
    return {
      targetKind: 'server-native',
      target: ports?.server,
      reasonCode: 'R06_SUBSTITUTE_FONTS',
      reason: 'Layout-sensitive check with substitute fonts prioritizes server for exact typography fidelity',
      notice: {
        code: 'E5',
        message: 'Đang dùng server để kiểm tra bố cục chính xác do font xem trước khác font in',
        severity: 'info',
      },
    };
  }

  return {
    targetKind: 'browser-wasm',
    target: ports?.local,
    reasonCode: 'R06_SUBSTITUTE_FONTS',
    reason: 'Offline compilation using substitute preview fonts',
    notice: {
      code: 'E5',
      message: 'Font xem trước khác font in (ngắt dòng có thể lệch)',
      severity: 'warning',
    },
  };
};
