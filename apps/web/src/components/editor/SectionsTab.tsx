'use client';

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  PaperSection,
  PaperTable,
  PaperFigure,
} from '@/types/paper';
import { SectionsTabProps } from './types';
import { TableSpreadsheetModal } from './TableSpreadsheetModal';
import { EndOfListIndicator } from './EndOfListIndicator';
import {
  SectionCardHeader,
  HeadingSectionItem,
  ParagraphSectionItem,
  TableSectionItem,
  FigureSectionItem,
  SectionInsertDivider,
  parsePastedTableText,
} from './sections';
import {
  FileText,
  Table as TableIcon,
  Image as ImageIcon,
  Heading,
  AlignLeft,
  Layers,
  X,
  Bookmark,
  Scissors,
} from 'lucide-react';

export const SectionsTab: React.FC<SectionsTabProps> = ({
  sections,
  onChange,
  metadata,
}) => {
  const [filterType, setFilterType] = useState<
    'all' | 'heading' | 'paragraph' | 'table' | 'figure'
  >('all');
  const [newlyAddedId, setNewlyAddedId] = useState<string | null>(null);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

  // Active editing paragraph ID (null means viewing mode with colored [1] citations)
  const [activeEditingParaId, setActiveEditingParaId] = useState<string | null>(null);

  // File Input Refs for Figure Upload
  const fileInputRefs = React.useRef<{ [key: number]: HTMLInputElement | null }>({});

  // Lightbox Zoom State
  const [lightboxFigure, setLightboxFigure] = useState<PaperFigure | null>(null);
  const [isClosingLightbox, setIsClosingLightbox] = useState<boolean>(false);
  const [mounted, setMounted] = useState<boolean>(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Smooth scroll and auto-focus newly added section
  React.useEffect(() => {
    if (!newlyAddedId) return;

    const timer = setTimeout(() => {
      const cardEl = document.getElementById(`section-card-${newlyAddedId}`);
      if (cardEl) {
        cardEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        const inputEl = cardEl.querySelector<HTMLInputElement | HTMLTextAreaElement>(
          'textarea, input[type="text"]'
        );
        if (inputEl) {
          inputEl.focus();
        }
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
  React.useEffect(() => {
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
    handleUpdateSection(zoomTableInfo.secIndex, {
      ...sec,
      content: updatedTable.caption,
      table: updatedTable,
    });
    setZoomTableInfo(null);
  };

  // Contextual Inspector State
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
    handleUpdateSection(secIndex, {
      ...sec,
      content: updatedFigure.caption,
      figure: updatedFigure,
    });
    setActiveSettings(null);
  };

  const handleSaveTableSettings = (secIndex: number, updatedTable: PaperTable) => {
    const sec = sections[secIndex];
    handleUpdateSection(secIndex, {
      ...sec,
      content: updatedTable.caption,
      table: updatedTable,
    });
    setActiveSettings(null);
  };

  // Counts for filter pills
  const regularSections = sections.filter((s) => s.type !== 'citation');
  const headingsCount = sections.filter(
    (s) => s.type === 'h1' || s.type === 'h2' || s.type === 'h3'
  ).length;
  const paragraphsCount = sections.filter((s) => s.type === 'paragraph').length;
  const tablesCount = sections.filter((s) => s.type === 'table').length;
  const figuresCount = sections.filter((s) => s.type === 'figure').length;
  const visibleSectionsCount =
    filterType === 'all'
      ? regularSections.length
      : filterType === 'heading'
        ? headingsCount
        : filterType === 'paragraph'
          ? paragraphsCount
          : filterType === 'table'
            ? tablesCount
            : figuresCount;

  // Handlers for section modification
  const handleUpdateSection = (index: number, updated: PaperSection) => {
    const list = [...sections];
    list[index] = updated;
    onChange(list);
  };

  const handleRemoveSection = (index: number) => {
    const sec = sections[index];
    const secId = sec.id || `sec_${index}`;
    if (deletingIds.has(secId)) return;

    setDeletingIds((prev) => new Set(prev).add(secId));

    setTimeout(() => {
      const list = [...sections];
      const actualIndex = list.findIndex((s, i) => (s.id || `sec_${i}`) === secId);
      if (actualIndex !== -1) {
        list.splice(actualIndex, 1);
        onChange(list);
      }
      setDeletingIds((prev) => {
        const next = new Set(prev);
        next.delete(secId);
        return next;
      });
    }, 320);
  };

  const handleMoveUp = (index: number) => {
    if (index <= 0) return;
    const list = [...sections];
    const temp = list[index - 1];
    list[index - 1] = list[index];
    list[index] = temp;
    onChange(list);
  };

  const handleMoveDown = (index: number) => {
    if (index >= sections.length - 1) return;
    const list = [...sections];
    const temp = list[index + 1];
    list[index + 1] = list[index];
    list[index] = temp;
    onChange(list);
  };

  const handleInsertSection = (insertAfterIndex: number, newSection: PaperSection) => {
    const list = [...sections];
    list.splice(insertAfterIndex + 1, 0, newSection);
    onChange(list);
    setNewlyAddedId(newSection.id);
    if (filterType !== 'all') setFilterType('all');
  };

  // Add new sections
  const handleAddHeading = (type: 'h1' | 'h2' | 'h3' = 'h1', insertAfterIndex?: number) => {
    const newSection: PaperSection = {
      id: `s_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      type,
      title: '',
      content: '',
    };
    if (typeof insertAfterIndex === 'number') {
      handleInsertSection(insertAfterIndex, newSection);
    } else {
      onChange([...sections, newSection]);
      setNewlyAddedId(newSection.id);
    }
  };

  const handleAddParagraph = (insertAfterIndex?: number) => {
    const newSection: PaperSection = {
      id: `s_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      type: 'paragraph',
      content: '',
    };
    if (typeof insertAfterIndex === 'number') {
      handleInsertSection(insertAfterIndex, newSection);
    } else {
      onChange([...sections, newSection]);
      setNewlyAddedId(newSection.id);
    }
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
    if (typeof insertAfterIndex === 'number') {
      handleInsertSection(insertAfterIndex, newSection);
    } else {
      onChange([...sections, newSection]);
      setNewlyAddedId(newSection.id);
    }
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
    if (typeof insertAfterIndex === 'number') {
      handleInsertSection(insertAfterIndex, newSection);
    } else {
      onChange([...sections, newSection]);
      setNewlyAddedId(newSection.id);
    }
  };

  // Table Paste handlers
  const handleApplyTablePaste = (secIdx: number, text: string) => {
    const parsed = parsePastedTableText(text);
    if (!parsed) return;
    const sec = sections[secIdx];
    if (!sec.table) return;

    handleUpdateSection(secIdx, {
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
    handleUpdateSection(secIdx, {
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

  // Conversions between Paragraph, Heading, and Citation
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

  return (
    <div className="h-full flex flex-col min-h-0 min-w-0 w-full max-w-full overflow-hidden space-y-4 p-4 sm:p-5 sm:pt-3 sm:pb-1">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-zinc-200/80 flex-shrink-0">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-zinc-700" />
          <h3 className="font-extrabold text-sm sm:text-base text-zinc-900">
            Nội dung bài báo ({regularSections.length})
          </h3>
        </div>

        {/* Quick Add Buttons */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => handleAddHeading('h1')}
            className="px-2.5 py-1 rounded-xl bg-white border border-zinc-200 text-zinc-700 hover:text-zinc-900 hover:bg-zinc-50 text-[11px] font-bold flex items-center gap-1 shadow-2xs transition-all cursor-pointer"
            title="Thêm tiêu đề đề mục H1"
          >
            <Heading className="w-3 h-3 text-zinc-500" />
            <span>+ Tiêu đề H1</span>
          </button>

          <button
            type="button"
            onClick={() => handleAddParagraph()}
            className="px-2.5 py-1 rounded-xl bg-white border border-zinc-200 text-zinc-700 hover:text-zinc-900 hover:bg-zinc-50 text-[11px] font-bold flex items-center gap-1 shadow-2xs transition-all cursor-pointer"
            title="Thêm đoạn văn bản mới"
          >
            <AlignLeft className="w-3 h-3 text-zinc-500" />
            <span>+ Đoạn văn</span>
          </button>

          <button
            type="button"
            onClick={() => handleAddTable()}
            className="px-2.5 py-1 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 text-[11px] font-bold flex items-center gap-1 shadow-2xs transition-all cursor-pointer"
            title="Thêm bảng số liệu"
          >
            <TableIcon className="w-3 h-3 text-indigo-500" />
            <span>+ Bảng</span>
          </button>

          <button
            type="button"
            onClick={() => handleAddFigure()}
            className="px-2.5 py-1 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 hover:bg-amber-100 text-[11px] font-bold flex items-center gap-1 shadow-2xs transition-all cursor-pointer"
            title="Thêm hình ảnh minh họa"
          >
            <ImageIcon className="w-3 h-3 text-amber-500" />
            <span>+ Hình</span>
          </button>
        </div>
      </div>

      {/* Filter Chips Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 flex-shrink-0 no-scrollbar select-none text-[11px]">
        <button
          type="button"
          onClick={() => setFilterType('all')}
          className={`px-3 py-1 rounded-full font-bold transition-all cursor-pointer flex items-center gap-1.5 ${filterType === 'all'
            ? 'bg-[#1A1A1A] text-white shadow-2xs'
            : 'bg-zinc-200/60 text-zinc-600 hover:bg-zinc-200'
            }`}
        >
          <Layers className="w-3 h-3" />
          <span>Tất cả ({regularSections.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setFilterType('heading')}
          className={`px-3 py-1 rounded-full font-bold transition-all cursor-pointer flex items-center gap-1.5 ${filterType === 'heading'
            ? 'bg-[#1A1A1A] text-white shadow-2xs'
            : 'bg-zinc-200/60 text-zinc-600 hover:bg-zinc-200'
            }`}
        >
          <Heading className="w-3 h-3" />
          <span>Tiêu đề ({headingsCount})</span>
        </button>

        <button
          type="button"
          onClick={() => setFilterType('paragraph')}
          className={`px-3 py-1 rounded-full font-bold transition-all cursor-pointer flex items-center gap-1.5 ${filterType === 'paragraph'
            ? 'bg-[#1A1A1A] text-white shadow-2xs'
            : 'bg-zinc-200/60 text-zinc-600 hover:bg-zinc-200'
            }`}
        >
          <AlignLeft className="w-3 h-3" />
          <span>Đoạn văn ({paragraphsCount})</span>
        </button>

        <button
          type="button"
          onClick={() => setFilterType('table')}
          className={`px-3 py-1 rounded-full font-bold transition-all cursor-pointer flex items-center gap-1.5 ${filterType === 'table'
            ? 'bg-[#1A1A1A] text-white shadow-2xs'
            : 'bg-zinc-200/60 text-zinc-600 hover:bg-zinc-200'
            }`}
        >
          <TableIcon className="w-3 h-3" />
          <span>Bảng ({tablesCount})</span>
        </button>

        <button
          type="button"
          onClick={() => setFilterType('figure')}
          className={`px-3 py-1 rounded-full font-bold transition-all cursor-pointer flex items-center gap-1.5 ${filterType === 'figure'
            ? 'bg-[#1A1A1A] text-white shadow-2xs'
            : 'bg-zinc-200/60 text-zinc-600 hover:bg-zinc-200'
            }`}
        >
          <ImageIcon className="w-3 h-3" />
          <span>Hình ({figuresCount})</span>
        </button>
      </div>

      {/* Main Sections Scrollable List */}
      <div
        ref={scrollContainerRef}
        className="flex-1 min-h-0 min-w-0 w-full max-w-full overflow-y-auto overflow-x-hidden pr-1 space-y-2 scroll-smooth"
      >
        {sections.map((sec, idx) => {
          if (sec.type === 'citation') return null;

          // Filter logic
          if (
            filterType === 'heading' &&
            sec.type !== 'h1' &&
            sec.type !== 'h2' &&
            sec.type !== 'h3'
          ) {
            return null;
          }
          if (filterType === 'paragraph' && sec.type !== 'paragraph') {
            return null;
          }
          if (filterType === 'table' && sec.type !== 'table') {
            return null;
          }
          if (filterType === 'figure' && sec.type !== 'figure') {
            return null;
          }

          const secId = sec.id || `sec_${idx}`;
          const isHeading = sec.type === 'h1' || sec.type === 'h2' || sec.type === 'h3';
          const isTable = sec.type === 'table';
          const isFigure = sec.type === 'figure';
          const isParagraph = sec.type === 'paragraph';
          const isNewlyAdded = sec.id === newlyAddedId;
          const isDeleting = deletingIds.has(secId);
          const isFigureOpen = activeSettings?.secIndex === idx && activeSettings?.type === 'figure';
          const isTableOpen = activeSettings?.secIndex === idx && activeSettings?.type === 'table';
          const isCardSettingsOpen = isFigureOpen || isTableOpen;

          return (
            <div
              key={secId}
              id={`section-card-${secId}`}
              className={`grid min-w-0 max-w-full w-full transition-all duration-300 ease-in-out ${isDeleting
                ? 'grid-rows-[0fr] opacity-0 scale-95 -translate-y-2 pointer-events-none'
                : 'grid-rows-[1fr] opacity-100 scale-100 translate-y-0'
                } ${isNewlyAdded ? 'animate-section-enter' : ''}`}
            >
              <div className={`min-w-0 max-w-full w-full ${isDeleting ? 'overflow-hidden' : ''}`}>
                <div
                  className={`p-3.5 rounded-3xl space-y-2.5 shadow-2xs transition-all duration-300 group min-w-0 max-w-full w-full bg-gray-200/50 hover:bg-gray-200/70 ${isCardSettingsOpen ? 'z-50 relative' : 'z-0 relative'
                    } ${isNewlyAdded ? 'section-highlight-glow ring-2 ring-blue-300' : ''
                    }`}
                >
                  {/* Section Header Controls */}
                  <SectionCardHeader
                    sec={sec}
                    idx={idx}
                    totalSections={sections.length}
                    isDeleting={isDeleting}
                    onUpdateSection={handleUpdateSection}
                    onRemoveSection={handleRemoveSection}
                    onMoveUp={handleMoveUp}
                    onMoveDown={handleMoveDown}
                    onConvertToHeading={handleConvertToHeading}
                    onConvertToParagraph={handleConvertToParagraph}
                    onOpenTableZoom={handleOpenTableZoom}
                    activeSettings={activeSettings}
                    onOpenFigureSettings={handleOpenFigureSettings}
                    onOpenTableSettings={handleOpenTableSettings}
                    onCloseSettings={handleCloseSettings}
                    onSaveFigureSettings={handleSaveFigureSettings}
                    onSaveTableSettings={handleSaveTableSettings}
                  />

                  {/* 1. HEADING */}
                  {isHeading && (
                    <HeadingSectionItem
                      sec={sec}
                      idx={idx}
                      onUpdateSection={handleUpdateSection}
                    />
                  )}

                  {/* 2. PARAGRAPH */}
                  {isParagraph && (
                    <ParagraphSectionItem
                      sec={sec}
                      idx={idx}
                      sections={sections}
                      activeEditingParaId={activeEditingParaId}
                      setActiveEditingParaId={setActiveEditingParaId}
                      onUpdateSection={handleUpdateSection}
                      onMergeParagraphIntoPrevFigure={handleMergeParagraphIntoPrevFigure}
                    />
                  )}

                  {/* 3. TABLE */}
                  {isTable && (
                    <TableSectionItem
                      sec={sec}
                      idx={idx}
                      onUpdateSection={handleUpdateSection}
                      onOpenTableZoom={handleOpenTableZoom}
                      onPasteTableData={handlePasteTableData}
                      onPasteTableFromClipboardButton={handlePasteTableFromClipboardButton}
                    />
                  )}

                  {/* 4. FIGURE */}
                  {isFigure && (
                    <FigureSectionItem
                      sec={sec}
                      idx={idx}
                      setFileInputRef={(i, el) => {
                        fileInputRefs.current[i] = el;
                      }}
                      onUpdateSection={handleUpdateSection}
                      onOpenLightbox={handleOpenLightbox}
                      onDetachFigureSource={handleDetachFigureSource}
                      onPasteFigureImage={handlePasteFigureImage}
                      onDropFigureImage={handleDropFigureImage}
                      onFileInputChange={handleFileInputChange}
                      onPasteImageFromClipboardButton={handlePasteImageFromClipboardButton}
                      onTriggerFileInput={handleTriggerFileInput}
                    />
                  )}

                  {/* Quick Add Bar below section */}
                  <SectionInsertDivider
                    idx={idx}
                    onAddHeading={handleAddHeading}
                    onAddParagraph={handleAddParagraph}
                    onAddTable={handleAddTable}
                    onAddFigure={handleAddFigure}
                  />
                </div>
              </div>

              {/* Page Break Visual Indicator between sections */}
              {sec.pageBreakAfter && (
                <div className="flex items-center gap-2 my-2 py-1 select-none animate-fadeIn">
                  <div className="flex-1 border-t-2 border-dashed border-gray-300" />
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-50 border border-gray-200 text-gray-700 text-[11px] font-bold shadow-2xs">
                    <Scissors className="w-3.5 h-3.5 rotate-90 text-gray-600" />
                    <span>Ngắt trang — Khối tiếp theo sẽ bắt đầu ở trang mới</span>
                    <button
                      type="button"
                      onClick={() => handleUpdateSection(idx, { ...sec, pageBreakAfter: false })}
                      className="ml-1 p-0.5 hover:bg-gray-200 rounded text-gray-500 hover:text-gray-800 transition-colors cursor-pointer"
                      title="Hủy ngắt trang"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="flex-1 border-t-2 border-dashed border-gray-300" />
                </div>
              )}
            </div>
          );
        })}

        {visibleSectionsCount > 0 ? (
          <EndOfListIndicator
            title="Bạn đã lướt đến cuối nội dung bài báo"
            subtitle={
              filterType === 'all'
                ? `Đã hiển thị toàn bộ ${sections.length} khối nội dung bài báo`
                : `Đã hiển thị toàn bộ ${visibleSectionsCount} khối theo bộ lọc đang chọn`
            }
            onScrollToTop={() => scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' })}
          />
        ) : sections.length > 0 ? (
          <div className="p-8 text-center rounded-3xl bg-gray-200/50 space-y-2.5">
            <p className="text-sm font-semibold text-zinc-600">
              Không có khối nội dung nào phù hợp với bộ lọc hiện tại.
            </p>
            <button
              type="button"
              onClick={() => setFilterType('all')}
              className="btn-pill-subtle text-xs"
            >
              Xem tất cả ({sections.length})
            </button>
          </div>
        ) : null}

        {sections.length === 0 && (
          <div className="p-8 text-center rounded-3xl bg-gray-200/50 space-y-3">
            <FileText className="w-8 h-8 text-zinc-400 mx-auto" />
            <p className="text-sm font-semibold text-zinc-600">
              Chưa có khối nội dung nào trong bài báo.
            </p>
            <div className="flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => handleAddHeading('h1')}
                className="btn-pill-lime text-xs"
              >
                + Thêm tiêu đề H1
              </button>
              <button
                type="button"
                onClick={() => handleAddParagraph()}
                className="btn-pill-subtle text-xs"
              >
                + Thêm đoạn văn
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Smooth Fullscreen Image Lightbox Modal with React Portal (Mounted directly on document.body) */}
      {mounted &&
        lightboxFigure &&
        createPortal(
          <div
            className={`fixed inset-0 top-0 left-0 right-0 bottom-0 w-screen h-screen m-0 p-4 sm:p-8 z-[999999] flex flex-col items-center justify-center bg-black/85 backdrop-blur-md overflow-hidden ${isClosingLightbox
              ? 'animate-lightbox-backdrop-out'
              : 'animate-lightbox-backdrop-in'
              }`}
            onClick={handleCloseLightbox}
          >
            {/* Close button with high z-index and sleek glass pill styling */}
            <button
              type="button"
              onClick={handleCloseLightbox}
              className="fixed top-5 right-5 sm:top-6 sm:right-6 p-2.5 rounded-full bg-white/10 hover:bg-white/25 active:scale-90 text-white backdrop-blur-md transition-all cursor-pointer z-[1000000] shadow-xl border border-white/20"
              title="Đóng (Esc)"
            >
              <X className="w-6 h-6 stroke-[2.5]" />
            </button>

            {/* Lightbox Content Container with Smooth Spring Zoom Animation */}
            <div
              className={`relative max-w-5xl max-h-[88vh] flex flex-col items-center justify-center select-none ${isClosingLightbox
                ? 'animate-lightbox-content-out'
                : 'animate-lightbox-content-in'
                }`}
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={lightboxFigure.src}
                alt={lightboxFigure.caption}
                className="max-h-[76vh] max-w-[92vw] object-contain rounded-2xl shadow-2xl bg-white/5 border border-white/15 ring-1 ring-white/10"
              />
              {/* Caption bar */}
              <div className="mt-3.5 px-5 py-2.5 rounded-2xl bg-zinc-950/85 text-white text-xs sm:text-sm text-center max-w-2xl border border-white/15 shadow-2xl backdrop-blur-md space-y-0.5">
                <p className="font-extrabold tracking-wide">
                  Hình {lightboxFigure.num}: {lightboxFigure.caption}
                </p>
                {lightboxFigure.source && (
                  <p className="text-zinc-400 text-xs italic font-medium">
                    {lightboxFigure.source}
                  </p>
                )}
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* Fullscreen Excel Spreadsheet Table Modal */}
      {zoomTableInfo && (
        <TableSpreadsheetModal
          isOpen={Boolean(zoomTableInfo)}
          table={zoomTableInfo.table}
          onSave={handleSaveZoomTable}
          onClose={() => setZoomTableInfo(null)}
        />
      )}
    </div>
  );
};
