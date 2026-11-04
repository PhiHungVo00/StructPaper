'use client';

import React, { useState, useEffect, useRef } from 'react';
import { PaperSection, PaperTable, PaperFigure } from '@/types/paper';
import { SectionsTabProps } from './types';
import { TableSpreadsheetModal } from './TableSpreadsheetModal';
import {
  SectionActionToolbar,
  SectionBlockList,
  FigureLightboxModal,
  useSectionMediaHandlers,
  useSectionInspectors,
} from './sections';
import { useEditorCommandBus } from './command-bus-adapter';
import {
  dispatchAddSection,
  dispatchUpdateSection,
  dispatchRemoveSection,
  dispatchReorderSections,
} from './dispatchers/sections-dispatchers';

export const SectionsTab: React.FC<SectionsTabProps> = ({
  sections,
  onChange,
  commandBus: propCommandBus,
}) => {
  const contextCommandBus = useEditorCommandBus().commandBus;
  const activeBus = propCommandBus || contextCommandBus;

  const [filterType, setFilterType] = useState<
    'all' | 'heading' | 'paragraph' | 'table' | 'figure'
  >('all');
  const [newlyAddedId, setNewlyAddedId] = useState<string | null>(null);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Active editing paragraph ID (null means viewing mode with colored [1] citations)
  const [activeEditingParaId, setActiveEditingParaId] = useState<string | null>(null);

  // Lightbox Zoom State
  const [lightboxFigure, setLightboxFigure] = useState<PaperFigure | null>(null);
  const [isClosingLightbox, setIsClosingLightbox] = useState<boolean>(false);
  const [mounted, setMounted] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Smooth scroll and auto-focus newly added section
  useEffect(() => {
    if (!newlyAddedId) return;

    const timer = setTimeout(() => {
      const cardEl = document.getElementById(`section-card-${newlyAddedId}`);
      if (cardEl) {
        cardEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        const inputEl = cardEl.querySelector<HTMLInputElement | HTMLTextAreaElement>(
          'textarea, input[type="text"]'
        );
        if (inputEl) inputEl.focus();
      }
    }, 100);

    const clearTimer = setTimeout(() => {
      setNewlyAddedId(null);
    }, 1800);

    return () => {
      clearTimeout(timer);
      clearTimeout(clearTimer);
    };
  }, [newlyAddedId]);

  // Lightbox keyboard handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && lightboxFigure && !isClosingLightbox) {
        handleCloseLightbox();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxFigure, isClosingLightbox]);

  const handleOpenLightbox = (fig: PaperFigure) => {
    setIsClosingLightbox(false);
    setLightboxFigure(fig);
  };

  const handleCloseLightbox = () => {
    if (isClosingLightbox) return;
    setIsClosingLightbox(true);
    setTimeout(() => {
      setLightboxFigure(null);
      setIsClosingLightbox(false);
    }, 240);
  };

  // Handlers for section modification via dispatchers
  const handleUpdateSection = (index: number, updated: PaperSection) => {
    dispatchUpdateSection(activeBus, index, updated, onChange, sections);
  };

  const handleRemoveSection = (index: number) => {
    const sec = sections[index];
    const secId = sec.id || `sec_${index}`;
    if (deletingIds.has(secId)) return;

    setDeletingIds((prev) => new Set(prev).add(secId));

    setTimeout(() => {
      dispatchRemoveSection(activeBus, secId, onChange, sections);
      setDeletingIds((prev) => {
        const next = new Set(prev);
        next.delete(secId);
        return next;
      });
    }, 320);
  };

  const handleMoveUp = (index: number) => {
    if (index <= 0) return;
    dispatchReorderSections(activeBus, index, index - 1, onChange, sections);
  };

  const handleMoveDown = (index: number) => {
    if (index >= sections.length - 1) return;
    dispatchReorderSections(activeBus, index, index + 1, onChange, sections);
  };

  const handleInsertSection = (insertAfterIndex: number | undefined, newSection: PaperSection) => {
    dispatchAddSection(activeBus, newSection, insertAfterIndex, onChange, sections);
    setNewlyAddedId(newSection.id);
    if (filterType !== 'all') setFilterType('all');
  };

  // Inspector and Media hooks
  const inspectors = useSectionInspectors(sections, handleUpdateSection);
  const mediaHandlers = useSectionMediaHandlers(sections, handleUpdateSection);

  // Add new sections
  const handleAddHeading = (type: 'h1' | 'h2' | 'h3' = 'h1', insertAfterIndex?: number) => {
    const newSection: PaperSection = {
      id: `s_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      type,
      title: '',
      content: '',
    };
    handleInsertSection(insertAfterIndex, newSection);
  };

  const handleAddParagraph = (insertAfterIndex?: number) => {
    const newSection: PaperSection = {
      id: `s_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      type: 'paragraph',
      content: '',
    };
    handleInsertSection(insertAfterIndex, newSection);
  };

  const handleAddTable = (insertAfterIndex?: number) => {
    const tableCount = sections.filter((s) => s.type === 'table').length + 1;
    const newTable: PaperTable = {
      id: `tab_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      num: tableCount,
      caption: `Bảng ${tableCount}: Tiêu đề bảng số liệu mới`,
      headers: [],
      rows: [],
      isFullWidth: true,
    };
    const newSection: PaperSection = {
      id: `s_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      type: 'table',
      content: newTable.caption,
      table: newTable,
    };
    handleInsertSection(insertAfterIndex, newSection);
  };

  const handleAddFigure = (insertAfterIndex?: number) => {
    const figCount = sections.filter((s) => s.type === 'figure').length + 1;
    const newFigure: PaperFigure = {
      id: `fig_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      num: figCount,
      caption: `Hình ${figCount}: Chú thích hình ảnh minh họa mới`,
      src: '',
      isFullWidth: true,
    };
    const newSection: PaperSection = {
      id: `s_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      type: 'figure',
      content: newFigure.caption,
      figure: newFigure,
    };
    handleInsertSection(insertAfterIndex, newSection);
  };

  // Conversions between Paragraph and Heading
  const handleConvertToHeading = (index: number, level: 'h1' | 'h2' | 'h3') => {
    const sec = sections[index];
    handleUpdateSection(index, {
      ...sec,
      type: level,
      title: sec.title || sec.content || (level === 'h1' ? 'TIÊU ĐỀ MỤC MỚI' : 'Tiêu đề mục con'),
      content: '',
    });
  };

  const handleConvertToParagraph = (index: number) => {
    const sec = sections[index];
    handleUpdateSection(index, {
      ...sec,
      type: 'paragraph',
      content: sec.content || sec.title || '',
      title: undefined,
    });
  };

  // Merge paragraph into immediately preceding figure's source
  const handleMergeParagraphIntoPrevFigure = (paraIndex: number) => {
    if (paraIndex <= 0) return;
    const prevSec = sections[paraIndex - 1];
    const currSec = sections[paraIndex];
    if (prevSec.type === 'figure' && prevSec.figure) {
      const updatedPrev: PaperSection = {
        ...prevSec,
        figure: {
          ...prevSec.figure,
          source: currSec.content.trim(),
        },
      };
      const list = [...sections];
      list[paraIndex - 1] = updatedPrev;
      list.splice(paraIndex, 1);
      onChange(list);
    }
  };

  // Detach figure's source into an isolated paragraph
  const handleDetachFigureSource = (figIndex: number) => {
    const figSec = sections[figIndex];
    if (!figSec.figure?.source) return;
    const sourceText = figSec.figure.source;
    const updatedFig: PaperSection = {
      ...figSec,
      figure: {
        ...figSec.figure,
        source: undefined,
      },
    };
    const newParagraph: PaperSection = {
      id: `s_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      type: 'paragraph',
      content: sourceText,
    };
    const list = [...sections];
    list[figIndex] = updatedFig;
    list.splice(figIndex + 1, 0, newParagraph);
    onChange(list);
    setNewlyAddedId(newParagraph.id);
  };

  const regularSections = sections.filter((s) => s.type !== 'citation');

  return (
    <div className="h-full flex flex-col min-h-0 min-w-0 w-full max-w-full overflow-hidden space-y-4 p-4 sm:p-5 sm:pt-3 sm:pb-1">
      {/* Top Header & Filter Toolbar */}
      <SectionActionToolbar
        totalSections={regularSections.length}
        filterType={filterType}
        onFilterChange={setFilterType}
        onAddHeading={handleAddHeading}
        onAddParagraph={handleAddParagraph}
        onAddTable={handleAddTable}
        onAddFigure={handleAddFigure}
        counts={{
          all: regularSections.length,
          headings: sections.filter((s) => s.type === 'h1' || s.type === 'h2' || s.type === 'h3').length,
          paragraphs: sections.filter((s) => s.type === 'paragraph').length,
          tables: sections.filter((s) => s.type === 'table').length,
          figures: sections.filter((s) => s.type === 'figure').length,
        }}
      />

      {/* Main Scrollable Sections & Blocks List */}
      <SectionBlockList
        sections={sections}
        filterType={filterType}
        setFilterType={setFilterType}
        newlyAddedId={newlyAddedId}
        deletingIds={deletingIds}
        activeEditingParaId={activeEditingParaId}
        setActiveEditingParaId={setActiveEditingParaId}
        activeSettings={inspectors.activeSettings}
        scrollContainerRef={scrollContainerRef}
        onUpdateSection={handleUpdateSection}
        onRemoveSection={handleRemoveSection}
        onMoveUp={handleMoveUp}
        onMoveDown={handleMoveDown}
        onConvertToHeading={handleConvertToHeading}
        onConvertToParagraph={handleConvertToParagraph}
        onOpenTableZoom={inspectors.handleOpenTableZoom}
        onOpenFigureSettings={inspectors.handleOpenFigureSettings}
        onOpenTableSettings={inspectors.handleOpenTableSettings}
        onCloseSettings={inspectors.handleCloseSettings}
        onSaveFigureSettings={inspectors.handleSaveFigureSettings}
        onSaveTableSettings={inspectors.handleSaveTableSettings}
        onOpenLightbox={handleOpenLightbox}
        onDetachFigureSource={handleDetachFigureSource}
        onMergeParagraphIntoPrevFigure={handleMergeParagraphIntoPrevFigure}
        onPasteFigureImage={mediaHandlers.handlePasteFigureImage}
        onDropFigureImage={mediaHandlers.handleDropFigureImage}
        onFileInputChange={mediaHandlers.handleFileInputChange}
        onPasteImageFromClipboardButton={mediaHandlers.handlePasteImageFromClipboardButton}
        onTriggerFileInput={mediaHandlers.handleTriggerFileInput}
        onPasteTableData={mediaHandlers.handlePasteTableData}
        onPasteTableFromClipboardButton={mediaHandlers.handlePasteTableFromClipboardButton}
        onAddHeading={handleAddHeading}
        onAddParagraph={handleAddParagraph}
        onAddTable={handleAddTable}
        onAddFigure={handleAddFigure}
        setFileInputRef={(i, el) => {
          mediaHandlers.fileInputRefs.current[i] = el;
        }}
      />

      {/* Smooth Fullscreen Image Lightbox Modal */}
      {mounted && (
        <FigureLightboxModal
          isOpen={Boolean(lightboxFigure)}
          figure={lightboxFigure}
          isClosing={isClosingLightbox}
          onClose={handleCloseLightbox}
        />
      )}

      {/* Fullscreen Excel Spreadsheet Table Modal */}
      {inspectors.zoomTableInfo && (
        <TableSpreadsheetModal
          isOpen={Boolean(inspectors.zoomTableInfo)}
          table={inspectors.zoomTableInfo.table}
          onSave={inspectors.handleSaveZoomTable}
          onClose={() => inspectors.setZoomTableInfo(null)}
        />
      )}
    </div>
  );
};
