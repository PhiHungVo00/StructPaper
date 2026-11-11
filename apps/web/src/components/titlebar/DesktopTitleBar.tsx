'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { useCapabilities } from '@structpaper/platform';
import { useEditorSession } from '@/context/EditorSessionContext';
import { isEditorTitleBarRoute } from './titlebar-routes';
import { useWindowDrag } from './useWindowDrag';
import { AppLogoMark } from './AppLogoMark';
import { AutoSaveToggle } from './AutoSaveToggle';
import { DocumentStatusIndicator } from './DocumentStatusIndicator';
import { WindowControls } from './WindowControls';

/**
 * Custom desktop window chrome bar replacing the OS title bar in Tauri.
 * Displays full editor controls (App icon, AutoSave switch, Paper title & save state)
 * on Editor routes, and a minimal Logo + Window Controls chrome on all other routes.
 */
export const DesktopTitleBar: React.FC = () => {
  const { kind } = useCapabilities();
  const pathname = usePathname();
  const { autoSaveEnabled, toggleAutoSave, documentSession } = useEditorSession();
  const { handleMouseDown, handleDoubleClick } = useWindowDrag();

  if (kind !== 'desktop') {
    return null;
  }

  const isEditorRoute = isEditorTitleBarRoute(pathname);

  return (
    <header
      data-testid="desktop-titlebar"
      data-tauri-drag-region
      onMouseDown={handleMouseDown}
      onDoubleClick={handleDoubleClick}
      className="fixed top-0 left-0 right-0 z-[100005] h-[38px] w-full bg-gray-200/80 backdrop-blur-sm flex items-center justify-between pl-3 pr-0 select-none"
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <AppLogoMark showWordmark={!isEditorRoute} />

        {isEditorRoute && (
          <>
            <AutoSaveToggle enabled={autoSaveEnabled} onToggle={toggleAutoSave} />
            <DocumentStatusIndicator
              title={documentSession?.title}
              saveState={documentSession?.saveState ?? 'saved'}
              onManualSave={documentSession?.onManualSave}
            />
          </>
        )}
      </div>

      <div
        data-testid="titlebar-drag-region"
        data-tauri-drag-region
        className="flex-1 h-full min-w-[24px]"
        aria-hidden="true"
      />

      <WindowControls />
    </header>
  );
};
