import type { Rule } from '../../interfaces/compiler-router.types';

/**
 * Rule 03: User preference set to server.
 * Table 9.2, Row 3: userPreference = 'server' và có mạng -> Server.
 * When offline, returns null so that offline handling rules can evaluate.
 */
export const preferServer: Rule = (_request, context, ports) => {
  if (context.userPreference === 'server' && context.online) {
    return {
      targetKind: 'server-native',
      target: ports?.server,
      reasonCode: 'R03_PREFER_SERVER',
      reason: 'User explicitly preferred remote server compilation while online',
    };
  }

  return null;
};
