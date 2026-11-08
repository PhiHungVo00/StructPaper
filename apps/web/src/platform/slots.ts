'use client';

import { registerSlot } from '@structpaper/platform';
import { DownloadDesktopCard } from '@/components/platform/DownloadDesktopCard';
import { CheckForUpdateCard } from '@/components/platform/CheckForUpdateCard';

let registered = false;

/**
 * Registers application-level polymorphic slots.
 * Guarantees that Web and Desktop platform mappings exist for each registered slot.
 */
export function registerAppSlots(): void {
  if (registered) {
    return;
  }

  registerSlot('app-distribution', {
    web: DownloadDesktopCard,
    desktop: CheckForUpdateCard,
  });

  registered = true;
}

// Auto-register on import
registerAppSlots();

