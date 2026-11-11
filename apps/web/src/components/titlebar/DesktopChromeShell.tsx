'use client';

import React from 'react';
import { useCapabilities } from '@structpaper/platform';
import { DESKTOP_TITLEBAR_HEIGHT_PX } from './titlebar-routes';
import { DesktopTitleBar } from './DesktopTitleBar';

export interface DesktopChromeShellProps {
  children: React.ReactNode;
}

/**
 * Coordinates desktop custom window chrome spacing across all routes
 * via `--titlebar-height`, remaining completely transparent on Web builds.
 */
export const DesktopChromeShell: React.FC<DesktopChromeShellProps> = ({ children }) => {
  const { kind } = useCapabilities();
  const isDesktop = kind === 'desktop';
  const titleBarHeight = isDesktop ? `${DESKTOP_TITLEBAR_HEIGHT_PX}px` : '0px';

  return (
    <div
      style={{ '--titlebar-height': titleBarHeight } as React.CSSProperties}
      className={isDesktop ? 'pt-[var(--titlebar-height)] min-h-screen bg-[#F8F9FA]' : undefined}
    >
      <DesktopTitleBar />
      {children}
    </div>
  );
};
