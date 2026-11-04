'use client';

import { useState } from 'react';
import { PaperSection, PaperTable, PaperFigure } from '@/types/paper';

export function useSectionInspectors(
  sections: PaperSection[],
  onUpdateSection: (index: number, updated: PaperSection) => void
) {
  // Table Zoom / Spreadsheet Modal State
  const [zoomTableInfo, setZoomTableInfo] = useState<{
    secIndex: number;
    table: PaperTable;
  } | null>(null);

  const handleOpenTableZoom = (secIndex: number, table: PaperTable) => {
    setZoomTableInfo({ secIndex, table });
  };

  const handleSaveZoomTable = (updatedTable: PaperTable) => {
    if (!zoomTableInfo) return;
    const sec = sections[zoomTableInfo.secIndex];
    onUpdateSection(zoomTableInfo.secIndex, {
      ...sec,
      content: updatedTable.caption,
      table: updatedTable,
    });
    setZoomTableInfo(null);
  };

  // Contextual Inspector Settings State
  const [activeSettings, setActiveSettings] = useState<{
    secIndex: number;
    type: 'figure' | 'table';
    triggerRect?: DOMRect;
  } | null>(null);

  const handleOpenFigureSettings = (secIndex: number, rect?: DOMRect) => {
    setActiveSettings({ secIndex, type: 'figure', triggerRect: rect });
  };

  const handleOpenTableSettings = (secIndex: number, rect?: DOMRect) => {
    setActiveSettings({ secIndex, type: 'table', triggerRect: rect });
  };

  const handleCloseSettings = () => {
    setActiveSettings(null);
  };

  const handleSaveFigureSettings = (secIndex: number, updatedFigure: PaperFigure) => {
    const sec = sections[secIndex];
    onUpdateSection(secIndex, {
      ...sec,
      content: updatedFigure.caption,
      figure: updatedFigure,
    });
    setActiveSettings(null);
  };

  const handleSaveTableSettings = (secIndex: number, updatedTable: PaperTable) => {
    const sec = sections[secIndex];
    onUpdateSection(secIndex, {
      ...sec,
      content: updatedTable.caption,
      table: updatedTable,
    });
    setActiveSettings(null);
  };

  return {
    zoomTableInfo,
    setZoomTableInfo,
    handleOpenTableZoom,
    handleSaveZoomTable,
    activeSettings,
    handleOpenFigureSettings,
    handleOpenTableSettings,
    handleCloseSettings,
    handleSaveFigureSettings,
    handleSaveTableSettings,
  };
}
