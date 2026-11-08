import type { Rule } from '../../interfaces/compiler-router.types';

const MAX_PAGE_ESTIMATE = 25;
const MAX_ASSET_BYTES = 40 * 1024 * 1024; // 40 MB

/**
 * Rule 09: Manuscript too large for browser memory limits.
 * Table 9.2, Row 9: Vượt ngưỡng trang hoặc dung lượng ảnh (mục 8.5) -> Server.
 */
export const tooBig: Rule = (_request, context, ports) => {
  const isPageExceeded = context.pageEstimate > MAX_PAGE_ESTIMATE;
  const isAssetExceeded = context.assetBytes > MAX_ASSET_BYTES;

  if (isPageExceeded || isAssetExceeded) {
    const reasons: string[] = [];
    if (isPageExceeded) {
      reasons.push(`page estimate (${context.pageEstimate}) exceeds ${MAX_PAGE_ESTIMATE} pages`);
    }
    if (isAssetExceeded) {
      const mb = Math.round(context.assetBytes / (1024 * 1024));
      reasons.push(`asset size (${mb}MB) exceeds 40MB limit`);
    }

    return {
      targetKind: 'server-native',
      target: ports?.server,
      reasonCode: 'R09_TOO_BIG',
      reason: `Manuscript exceeds browser capacity (${reasons.join(', ')}); routing to server`,
    };
  }

  return null;
};
