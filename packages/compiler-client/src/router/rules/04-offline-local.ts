import type { Rule } from '../../interfaces/compiler-router.types';

/**
 * Rule 04: Offline with ready local environment.
 * Table 9.2, Row 4: Ngoại tuyến và localEnv = 'ready' và localEnvMatches -> Cục bộ.
 */
export const offlineLocal: Rule = (_request, context, ports) => {
  if (!context.online && context.localEnv === 'ready' && context.localEnvMatches) {
    return {
      targetKind: 'browser-wasm',
      target: ports?.local,
      reasonCode: 'R04_OFFLINE_LOCAL_READY',
      reason: 'Device is offline and local WebAssembly environment is ready and matched',
    };
  }

  return null;
};
