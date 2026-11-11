'use client';

import React from 'react';

export interface AppLogoMarkProps {
  showWordmark?: boolean;
}

/**
 * StructPaper desktop brand emblem matching the native app icon
 * (black circular badge with centered crisp white equilateral triangle).
 */
export const AppLogoMark: React.FC<AppLogoMarkProps> = ({ showWordmark = false }) => {
  return (
    <div
      data-testid="titlebar-logo"
      className="flex items-center gap-2 shrink-0 select-none"
      title="StructPaper"
    >
      <span className="w-5 h-5 rounded-full bg-zinc-950 flex items-center justify-center shadow-[0_1px_3px_rgba(0,0,0,0.18),inset_0_1px_1px_rgba(255,255,255,0.2)]">
        <svg
          width="10"
          height="10"
          viewBox="0 0 12 12"
          fill="none"
          aria-hidden="true"
          className="-translate-y-[0.5px]"
        >
          <path d="M6 1.8L10.8 10.2H1.2L6 1.8Z" fill="#FFFFFF" />
        </svg>
      </span>
      {showWordmark && (
        <span className="text-[12px] font-extrabold tracking-tight text-zinc-800">
          StructPaper
        </span>
      )}
    </div>
  );
};
