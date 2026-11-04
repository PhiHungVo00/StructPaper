'use client';

import React, { useRef } from 'react';
import { PaperSection } from '@/types/paper';
import { parsePastedTableText } from './utils';

export function useSectionMediaHandlers(
  sections: PaperSection[],
  onUpdateSection: (index: number, updated: PaperSection) => void
) {
  const fileInputRefs = useRef<{ [key: number]: HTMLInputElement | null }>({});

  // Table Paste handlers
  const handleApplyTablePaste = (secIdx: number, text: string) => {
    const parsed = parsePastedTableText(text);
    if (!parsed) return;
    const sec = sections[secIdx];
    if (!sec.table) return;

    onUpdateSection(secIdx, {
      ...sec,
      table: {
        ...sec.table,
        headers: parsed.headers,
        rows: parsed.rows,
        headerRows: undefined,
        bodyRows: undefined,
      },
    });
  };

  const handlePasteTableData = (secIdx: number, e: React.ClipboardEvent) => {
    const text = e.clipboardData?.getData('text/plain');
    if (text && text.trim()) {
      e.preventDefault();
      handleApplyTablePaste(secIdx, text);
    }
  };

  const handlePasteTableFromClipboardButton = async (secIdx: number) => {
    try {
      const text = await navigator.clipboard.readText();
      if (text && text.trim()) {
        handleApplyTablePaste(secIdx, text);
      }
    } catch {
      alert('Vui lòng chọn khung và nhấn phím Ctrl + V trực tiếp trên bàn phím!');
    }
  };

  // Figure image paste & upload handlers
  const handleApplyFigureImage = (secIdx: number, src: string) => {
    const sec = sections[secIdx];
    if (!sec.figure) return;
    onUpdateSection(secIdx, {
      ...sec,
      figure: {
        ...sec.figure,
        src,
      },
    });
  };

  const handlePasteFigureImage = (secIdx: number, e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (items) {
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.startsWith('image/')) {
          e.preventDefault();
          const file = item.getAsFile();
          if (file) {
            const reader = new FileReader();
            reader.onload = (loadEvt) => {
              const dataUrl = loadEvt.target?.result as string;
              if (dataUrl) handleApplyFigureImage(secIdx, dataUrl);
            };
            reader.readAsDataURL(file);
          }
          return;
        }
      }
    }

    const text = e.clipboardData?.getData('text/plain');
    if (text && (text.startsWith('http') || text.startsWith('data:image/'))) {
      e.preventDefault();
      handleApplyFigureImage(secIdx, text.trim());
    }
  };

  const handlePasteImageFromClipboardButton = async (secIdx: number) => {
    try {
      const items = await navigator.clipboard.read();
      for (const item of items) {
        const imageType = item.types.find((t) => t.startsWith('image/'));
        if (imageType) {
          const blob = await item.getType(imageType);
          const reader = new FileReader();
          reader.onload = (loadEvt) => {
            const dataUrl = loadEvt.target?.result as string;
            if (dataUrl) handleApplyFigureImage(secIdx, dataUrl);
          };
          reader.readAsDataURL(blob);
          return;
        }
      }
    } catch {
      try {
        const text = await navigator.clipboard.readText();
        if (text && (text.startsWith('http') || text.startsWith('data:image/'))) {
          handleApplyFigureImage(secIdx, text.trim());
          return;
        }
      } catch { }
      alert('Vui lòng chọn khung và nhấn phím Ctrl + V trực tiếp trên bàn phím!');
    }
  };

  const handleFileInputChange = (secIdx: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (loadEvt) => {
      const dataUrl = loadEvt.target?.result as string;
      if (dataUrl) handleApplyFigureImage(secIdx, dataUrl);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleDropFigureImage = (secIdx: number, e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (loadEvt) => {
        const dataUrl = loadEvt.target?.result as string;
        if (dataUrl) handleApplyFigureImage(secIdx, dataUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleTriggerFileInput = (secIdx: number) => {
    fileInputRefs.current[secIdx]?.click();
  };

  return {
    fileInputRefs,
    handlePasteTableData,
    handlePasteTableFromClipboardButton,
    handlePasteFigureImage,
    handlePasteImageFromClipboardButton,
    handleFileInputChange,
    handleDropFigureImage,
    handleTriggerFileInput,
  };
}
