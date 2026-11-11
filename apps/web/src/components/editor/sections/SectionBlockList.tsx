'use client';

import React from 'react';
import { PaperSection, PaperTable, PaperFigure, PaperReference } from '@/types/paper';
import { EndOfListIndicator } from '../EndOfListIndicator';
import {
  SectionHeaderCard,
  HeadingSectionItem,
  ParagraphSectionItem,
  TableSectionItem,
  FigureSectionItem,
  EquationSectionItem,
  SectionInsertDivider,
} from './index';
import { FileText, Scissors, X } from 'lucide-react';

export interface SectionBlockListProps {
  sections: PaperSection[];
  filterType: 'all' | 'heading' | 'paragraph' | 'table' | 'figure';
  setFilterType: (filter: 'all' | 'heading' | 'paragraph' | 'table' | 'figure') => void;
  newlyAddedId: string | null;
  deletingIds: Set<string>;
  activeEditingParaId: string | null;
  setActiveEditingParaId: (id: string | null) => void;
  activeSettings: {
    secIndex: number;
    type: 'figure' | 'table';
    triggerRect?: DOMRect;
  } | null;
  scrollContainerRef: React.RefObject<HTMLDivElement>;
  onUpdateSection: (index: number, updated: PaperSection) => void;
  onRemoveSection: (index: number) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  onConvertToHeading: (index: number, level: 'h1' | 'h2' | 'h3') => void;
  onConvertToParagraph: (index: number) => void;
  onOpenTableZoom: (index: number, table: PaperTable) => void;
  onOpenFigureSettings: (index: number, rect?: DOMRect) => void;
  onOpenTableSettings: (index: number, rect?: DOMRect) => void;
  onCloseSettings: () => void;
  onSaveFigureSettings: (index: number, updated: PaperFigure) => void;
  onSaveTableSettings: (index: number, updated: PaperTable) => void;
  onOpenLightbox: (figure: PaperFigure) => void;
  onDetachFigureSource: (figIndex: number) => void;
  onMergeParagraphIntoPrevFigure: (paraIndex: number) => void;
  onPasteFigureImage: (secIdx: number, e: React.ClipboardEvent) => void;
  onDropFigureImage: (secIdx: number, e: React.DragEvent) => void;
  onFileInputChange: (secIdx: number, e: React.ChangeEvent<HTMLInputElement>) => void;
  onPasteImageFromClipboardButton: (secIdx: number) => void;
  onTriggerFileInput: (secIdx: number) => void;
  onPasteTableData: (secIdx: number, e: React.ClipboardEvent) => void;
  onPasteTableFromClipboardButton: (secIdx: number) => void;
  onAddHeading: (level?: 'h1' | 'h2' | 'h3', insertAfterIndex?: number) => void;
  onAddParagraph: (insertAfterIndex?: number) => void;
  onAddTable: (insertAfterIndex?: number) => void;
  onAddFigure: (insertAfterIndex?: number) => void;
  onAddEquation?: (insertAfterIndex?: number) => void;
  setFileInputRef: (idx: number, el: HTMLInputElement | null) => void;
  references?: PaperReference[];
}

export const SectionBlockList: React.FC<SectionBlockListProps> = ({
  sections,
  filterType,
  setFilterType,
  newlyAddedId,
  deletingIds,
  activeEditingParaId,
  setActiveEditingParaId,
  activeSettings,
  scrollContainerRef,
  onUpdateSection,
  onRemoveSection,
  onMoveUp,
  onMoveDown,
  onConvertToHeading,
  onConvertToParagraph,
  onOpenTableZoom,
  onOpenFigureSettings,
  onOpenTableSettings,
  onCloseSettings,
  onSaveFigureSettings,
  onSaveTableSettings,
  onOpenLightbox,
  onDetachFigureSource,
  onMergeParagraphIntoPrevFigure,
  onPasteFigureImage,
  onDropFigureImage,
  onFileInputChange,
  onPasteImageFromClipboardButton,
  onTriggerFileInput,
  onPasteTableData,
  onPasteTableFromClipboardButton,
  references,
  onAddHeading,
  onAddParagraph,
  onAddTable,
  onAddFigure,
  onAddEquation,
  setFileInputRef,
}) => {
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

  return (
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
        const isEquation = sec.type === 'equation';
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
            className={`grid min-w-0 max-w-full w-full transition-all duration-300 ease-in-out ${
              isDeleting
                ? 'grid-rows-[0fr] opacity-0 scale-95 -translate-y-2 pointer-events-none'
                : 'grid-rows-[1fr] opacity-100 scale-100 translate-y-0'
            } ${isNewlyAdded ? 'animate-section-enter' : ''}`}
          >
            <div className={`min-w-0 max-w-full w-full ${isDeleting ? 'overflow-hidden' : ''}`}>
              <div
                className={`p-3.5 rounded-3xl space-y-2.5 shadow-2xs transition-all duration-300 group min-w-0 max-w-full w-full bg-gray-200/50 hover:bg-gray-200/70 ${
                  isCardSettingsOpen ? 'z-50 relative' : 'z-0 relative'
                } ${
                  isNewlyAdded ? 'section-highlight-glow ring-2 ring-blue-300' : ''
                }`}
              >
                {/* Section Header Controls */}
                <SectionHeaderCard
                  sec={sec}
                  idx={idx}
                  totalSections={sections.length}
                  isDeleting={isDeleting}
                  onUpdateSection={onUpdateSection}
                  onRemoveSection={onRemoveSection}
                  onMoveUp={onMoveUp}
                  onMoveDown={onMoveDown}
                  onConvertToHeading={onConvertToHeading}
                  onConvertToParagraph={onConvertToParagraph}
                  onOpenTableZoom={onOpenTableZoom}
                  activeSettings={activeSettings}
                  onOpenFigureSettings={onOpenFigureSettings}
                  onOpenTableSettings={onOpenTableSettings}
                  onCloseSettings={onCloseSettings}
                  onSaveFigureSettings={onSaveFigureSettings}
                  onSaveTableSettings={onSaveTableSettings}
                />

                {/* 1. HEADING */}
                {isHeading && (
                  <HeadingSectionItem
                    sec={sec}
                    idx={idx}
                    onUpdateSection={onUpdateSection}
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
                    onUpdateSection={onUpdateSection}
                    onMergeParagraphIntoPrevFigure={onMergeParagraphIntoPrevFigure}
                    references={references}
                  />
                )}

                {/* 3. TABLE */}
                {isTable && (
                  <TableSectionItem
                    sec={sec}
                    idx={idx}
                    onUpdateSection={onUpdateSection}
                    onOpenTableZoom={onOpenTableZoom}
                    onPasteTableData={onPasteTableData}
                    onPasteTableFromClipboardButton={onPasteTableFromClipboardButton}
                  />
                )}

                {/* 4. FIGURE */}
                {isFigure && (
                  <FigureSectionItem
                    sec={sec}
                    idx={idx}
                    setFileInputRef={setFileInputRef}
                    onUpdateSection={onUpdateSection}
                    onOpenLightbox={onOpenLightbox}
                    onDetachFigureSource={onDetachFigureSource}
                    onPasteFigureImage={onPasteFigureImage}
                    onDropFigureImage={onDropFigureImage}
                    onFileInputChange={onFileInputChange}
                    onPasteImageFromClipboardButton={onPasteImageFromClipboardButton}
                    onTriggerFileInput={onTriggerFileInput}
                  />
                )}

                {/* 5. EQUATION */}
                {isEquation && (
                  <EquationSectionItem sec={sec} idx={idx} onUpdateSection={onUpdateSection} />
                )}

                {/* Quick Add Bar below section */}
                <SectionInsertDivider
                  idx={idx}
                  onAddHeading={onAddHeading}
                  onAddParagraph={onAddParagraph}
                  onAddTable={onAddTable}
                  onAddFigure={onAddFigure}
                  onAddEquation={onAddEquation}
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
                    onClick={() => onUpdateSection(idx, { ...sec, pageBreakAfter: false })}
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
              onClick={() => onAddHeading('h1')}
              className="btn-pill-lime text-xs"
            >
              + Thêm tiêu đề H1
            </button>
            <button
              type="button"
              onClick={() => onAddParagraph()}
              className="btn-pill-subtle text-xs"
            >
              + Thêm đoạn văn
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
