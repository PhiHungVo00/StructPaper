'use client';

import React from 'react';

export interface AutoSaveToggleProps {
  enabled: boolean;
  onToggle: () => void;
}

/**
 * Tactile pill switch controlling live debounced AutoSave in the active editor.
 */
export const AutoSaveToggle: React.FC<AutoSaveToggleProps> = ({ enabled, onToggle }) => {
  return (
    <div className="flex items-center gap-1.5 shrink-0" data-no-drag="true">
      <span className="text-[11.5px] font-semibold text-zinc-700 tracking-tight select-none">
        AutoSave
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        aria-label={enabled ? 'Tắt tự động lưu (AutoSave)' : 'Bật tự động lưu (AutoSave)'}
        data-testid="titlebar-autosave-toggle"
        title={enabled ? 'AutoSave đang bật — Nhấn để tắt' : 'AutoSave đang tắt — Nhấn để bật'}
        onClick={onToggle}
        className={`w-[44px] h-[20px] rounded-full px-[2.5px] inline-flex items-center justify-between transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#78C841]/50 ${
          enabled
            ? 'bg-[#78C841] border border-[#65B332] shadow-[inset_0_1px_2px_rgba(0,0,0,0.08),0_1px_4px_rgba(120,200,65,0.28)]'
            : 'bg-white/95 hover:bg-white border border-zinc-300 shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)]'
        }`}
      >
        {enabled ? (
          <>
            <span className="text-[9.5px] font-extrabold text-white pl-1 leading-none">
              On
            </span>
            <span className="w-[14px] h-[14px] rounded-full bg-white shadow-xs transition-transform duration-200" />
          </>
        ) : (
          <>
            <span className="w-[14px] h-[14px] rounded-full bg-zinc-500 transition-transform duration-200" />
            <span className="text-[9.5px] font-bold text-zinc-500 pr-1 leading-none">
              Off
            </span>
          </>
        )}
      </button>
    </div>
  );
};
