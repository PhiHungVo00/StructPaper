import type { Rule } from '../../interfaces/compiler-router.types';

const DEFAULT_MIN_DEVICE_SCORE = 40;

/**
 * Rule 08: Device too weak or unsupported for in-browser WASM compilation.
 * Table 9.2, Row 8: deviceScore = 'unsupported' hoặc thấp -> Server.
 */
export const deviceTooWeak: Rule = (_request, context, ports) => {
  const isUnsupported = context.deviceScore === 'unsupported';
  const isScoreTooLow =
    typeof context.deviceScore === 'number' && context.deviceScore < DEFAULT_MIN_DEVICE_SCORE;

  if (isUnsupported || isScoreTooLow) {
    return {
      targetKind: 'server-native',
      target: ports?.server,
      reasonCode: 'R08_DEVICE_TOO_WEAK',
      reason: isUnsupported
        ? 'Device hardware or browser environment does not support WASM compilation'
        : `Device benchmark score (${context.deviceScore}) is below minimum threshold (${DEFAULT_MIN_DEVICE_SCORE})`,
      notice: {
        code: 'E7',
        message: 'Thiết bị không đủ cấu hình cho biên dịch cục bộ, sử dụng máy chủ',
        severity: 'warning',
      },
    };
  }

  return null;
};
