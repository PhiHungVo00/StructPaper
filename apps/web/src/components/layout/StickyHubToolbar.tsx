'use client';

import React from 'react';

export interface StickyHubToolbarProps {
  children: React.ReactNode;
  className?: string;
  'data-testid'?: string;
}

/**
 * Shared sticky toolbar wrapper for hub pages (`/papers`, `/templates`).
 * Uses `--titlebar-height` so sticky controls pin right below the fixed
 * DesktopTitleBar on desktop builds while remaining at `0px` on web.
 */
export const StickyHubToolbar: React.FC<StickyHubToolbarProps> = ({
  children,
  className = '',
  'data-testid': testId,
}) => {
  const containerClassName = [
    'sticky top-[var(--titlebar-height,0px)] z-30 -mx-4 px-4 sm:-mx-6 sm:px-6 py-3 pb-5 transition-all duration-300',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div data-testid={testId} className={containerClassName}>
      <div className="absolute inset-0 bg-[#F8F9FA]/70 backdrop-blur-sm pointer-events-none -z-10 [mask-image:linear-gradient(to_bottom,black_90%,transparent)]" />
      {children}
    </div>
  );
};
