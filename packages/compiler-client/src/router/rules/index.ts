import type { Rule } from '../../interfaces/compiler-router.types';

import { finalGoesToServer } from './01-final-goes-to-server';
import { killSwitch } from './02-kill-switch';
import { preferServer } from './03-prefer-server';
import { offlineLocal } from './04-offline-local';
import { offlineNoEnv } from './05-offline-no-env';
import { substituteFonts } from './06-substitute-fonts';
import { envNotReady } from './07-env-not-ready';
import { deviceTooWeak } from './08-device-too-weak';
import { tooBig } from './09-too-big';
import { recentFailure } from './10-recent-failure';
import { defaultLocal } from './11-default-local';

export {
  finalGoesToServer,
  killSwitch,
  preferServer,
  offlineLocal,
  offlineNoEnv,
  substituteFonts,
  envNotReady,
  deviceTooWeak,
  tooBig,
  recentFailure,
  defaultLocal,
};

/**
 * Standard priority sequence of 11 routing decision rules (Table 9.2).
 */
export const DEFAULT_RULES: readonly Rule[] = [
  finalGoesToServer,
  killSwitch,
  preferServer,
  offlineLocal,
  offlineNoEnv,
  substituteFonts,
  envNotReady,
  deviceTooWeak,
  tooBig,
  recentFailure,
  defaultLocal,
] as const;
