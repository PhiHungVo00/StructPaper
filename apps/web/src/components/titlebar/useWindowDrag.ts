'use client';

import type React from 'react';
import { useCallback } from 'react';
import { useWindowService } from '@structpaper/platform';

const INTERACTIVE_SELECTOR =
  'button, a, input, textarea, select, [role="switch"], [data-no-drag="true"]';

function isInteractiveTarget(target: EventTarget | null): boolean {
  if (!target || typeof (target as Element).closest !== 'function') {
    return false;
  }
  return Boolean((target as Element).closest(INTERACTIVE_SELECTOR));
}

export function useWindowDrag() {
  const windowService = useWindowService();

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      if (e.buttons !== 1 || e.detail > 1) {
        return;
      }
      if (isInteractiveTarget(e.target)) {
        return;
      }
      void windowService.startDragging();
    },
    [windowService]
  );

  const handleDoubleClick = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      if (isInteractiveTarget(e.target)) {
        return;
      }
      void windowService.toggleMaximize();
    },
    [windowService]
  );

  return {
    handleMouseDown,
    handleDoubleClick,
  };
}
