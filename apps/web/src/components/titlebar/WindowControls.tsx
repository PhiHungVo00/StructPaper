'use client';

import React, { useEffect, useState } from 'react';
import { useWindowService } from '@structpaper/platform';

/**
 * Native-grade desktop window caption controls (Minimize, Maximize/Restore, Close)
 * aligned cleanly to the right edge with Windows Fitts's Law hit targets.
 */
export const WindowControls: React.FC = () => {
  const windowService = useWindowService();
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    return windowService.onMaximizedChange((maximized) => {
      setIsMaximized(maximized);
    });
  }, [windowService]);

  const stopMouseDown = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
  };

  return (
    <div className="flex items-center h-full shrink-0" data-no-drag="true">
      <button
        type="button"
        data-testid="titlebar-minimize-btn"
        aria-label="Thu nhỏ cửa sổ"
        title="Thu nhỏ"
        onMouseDown={stopMouseDown}
        onClick={() => void windowService.minimize()}
        className="w-11 h-full flex items-center justify-center text-zinc-600 hover:bg-zinc-200/75 hover:text-zinc-900 active:bg-zinc-300/70 transition-colors duration-150 cursor-pointer"
      >
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
          <line x1="1" y1="5" x2="9" y2="5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      </button>

      <button
        type="button"
        data-testid="titlebar-maximize-btn"
        data-maximized={String(isMaximized)}
        aria-label={isMaximized ? 'Khôi phục kích thước cửa sổ' : 'Phóng to cửa sổ'}
        title={isMaximized ? 'Khôi phục' : 'Phóng to'}
        onMouseDown={stopMouseDown}
        onClick={() => void windowService.toggleMaximize()}
        className="w-11 h-full flex items-center justify-center text-zinc-600 hover:bg-zinc-200/75 hover:text-zinc-900 active:bg-zinc-300/70 transition-colors duration-150 cursor-pointer"
      >
        {isMaximized ? (
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
            <path
              d="M3 3V1.7C3 1.31 3.31 1 3.7 1H8.3C8.69 1 9 1.31 9 1.7V6.3C9 6.69 8.69 7 8.3 7H7"
              stroke="currentColor"
              strokeWidth="1.15"
              strokeLinecap="round"
            />
            <rect
              x="1"
              y="3"
              width="6"
              height="6"
              rx="0.9"
              stroke="currentColor"
              strokeWidth="1.15"
            />
          </svg>
        ) : (
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
            <rect
              x="1.25"
              y="1.25"
              width="7.5"
              height="7.5"
              rx="1.1"
              stroke="currentColor"
              strokeWidth="1.15"
            />
          </svg>
        )}
      </button>

      <button
        type="button"
        data-testid="titlebar-close-btn"
        aria-label="Đóng cửa sổ"
        title="Đóng"
        onMouseDown={stopMouseDown}
        onClick={() => void windowService.close()}
        className="w-11 h-full flex items-center justify-center text-zinc-600 hover:bg-[#E81123] hover:text-white active:bg-[#C50F1F] transition-colors duration-150 cursor-pointer"
      >
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
          <path
            d="M2 2L8 8M8 2L2 8"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinecap="round"
          />
        </svg>
      </button>
    </div>
  );
};
