'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CompletePaper } from '@/types/paper';
import { UniversalTemplateSchema } from '@/types/template-builder';
import {
  getAuthoringPapers,
  duplicateAuthoringPaper,
  deleteAuthoringPaper,
  createNewPaperFromTemplate,
} from '@/lib/authoring/paper-storage';
import { compilePaperToTypst } from '@/lib/authoring/typst-paper-compiler';
import { BUILT_IN_TEMPLATES } from '@/data/templates';
import {
  Search,
  Sparkles,
  FolderArchive,
  LayoutGrid,
  List,
  Plus,
  MoreVertical,
  Edit3,
  Copy,
  Download,
  Trash2,
  Calendar,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { toast } from '@/components/DynamicIslandToast';

export const PaperHubView: React.FC = () => {
  const router = useRouter();
  const [papers, setPapers] = useState<CompletePaper[]>([]);
  const [templates] = useState<UniversalTemplateSchema[]>(BUILT_IN_TEMPLATES);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<'all' | 'vnuhcm' | 'intl' | 'draft'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'name'>('date');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Load papers on mount
  useEffect(() => {
    setPapers(getAuthoringPapers());
  }, []);

  // Close context menu on outside click
  useEffect(() => {
    const handleOutside = () => setActiveMenuId(null);
    window.addEventListener('click', handleOutside);
    return () => window.removeEventListener('click', handleOutside);
  }, []);

  // Handler: Select template to create a new paper
  const handleSelectTemplate = (template: UniversalTemplateSchema) => {
    const newPaper = createNewPaperFromTemplate(template);
    toast.success(
      'Đã tạo bản thảo mới!',
      `Đang chuyển hướng tới trình soạn thảo cho "${template.name}"`
    );
    router.push(`/papers/editor?id=${encodeURIComponent(newPaper.id)}`);
  };

  // Handler: Open an existing paper
  const handleOpenPaper = (paper: CompletePaper) => {
    router.push(`/papers/editor?id=${encodeURIComponent(paper.id)}`);
  };

  // Handler: Duplicate paper
  const handleDuplicatePaper = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const dup = duplicateAuthoringPaper(id);
    if (dup) {
      setPapers(getAuthoringPapers());
      toast.success(
        'Đã nhân bản bài báo',
        `Bản sao "${dup.metadata.title}" đã được lưu vào danh sách.`
      );
    }
    setActiveMenuId(null);
  };

  // Handler: Delete paper
  const handleDeletePaper = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteAuthoringPaper(id);
    setPapers(getAuthoringPapers());
    toast.info('Đã xóa bài báo', 'Bài báo đã được gỡ khỏi danh sách.');
    setActiveMenuId(null);
  };

  // Handler: Export Typst code & download .typ
  const handleExportTypst = (paper: CompletePaper, e: React.MouseEvent) => {
    e.stopPropagation();
    const matchedTemplate = templates.find((t) => t.id === paper.templateId) || templates[0];
    const typstCode = compilePaperToTypst(paper, matchedTemplate);
    const blob = new Blob([typstCode], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const safeTitle = paper.metadata.title
      .replace(/[^a-zA-Z0-9_\u00C0-\u024F\u1E00-\u1EFF]/g, '_')
      .slice(0, 40);
    a.download = `${safeTitle || 'paper'}_typst.typ`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success(
      'Đã xuất bản thảo Typst!',
      `Tệp ${a.download} đã được tải về máy.`
    );
    setActiveMenuId(null);
  };

  // Filtered & Sorted papers
  const filteredPapers = papers
    .filter((p) => {
      const matchSearch =
        p.metadata.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.metadata.authors.some((a) => a.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (p.templateName || '').toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchSearch) return false;

      if (filterCategory === 'vnuhcm') {
        return (
          p.templateId?.includes('vnuhcm') ||
          p.metadata.journalName?.includes('ĐHQG') ||
          p.metadata.journalId?.includes('VNU')
        );
      }
      if (filterCategory === 'intl') {
        return (
          p.templateId?.includes('ieee') ||
          p.templateId?.includes('nature') ||
          p.templateId?.includes('elsevier') ||
          p.metadata.journalId?.includes('IEEE')
        );
      }
      if (filterCategory === 'draft') {
        return p.status === 'draft';
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'name') {
        return a.metadata.title.localeCompare(b.metadata.title);
      }
      return new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime();
    });

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16">
      {/* 1. Header Search Bar & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>Bài Báo Khoa Học Của Bạn</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-extrabold bg-[#78C841]/15 text-[#3b7317]">
              Typst Authoring
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Tạo và biên tập bài báo nghiên cứu dựa trên các mẫu tạp chí chuẩn, tự động dàn trang Typst chuẩn xác.
          </p>
        </div>

        {/* Search Input Box */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm bài báo, tác giả, mẫu..."
            className="w-full bg-white border border-slate-200/80 rounded-2xl pl-9 pr-4 py-2 text-xs text-slate-900 placeholder:text-slate-400 outline-none focus:border-[#78C841] focus:ring-2 focus:ring-[#78C841]/20 shadow-xs transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 font-bold cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* 2. Top Section: "Bắt đầu một bài báo mới từ mẫu" */}
      <div className="space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#78C841]" />
            <h2 className="text-sm font-extrabold text-slate-800 tracking-tight">
              Bắt đầu một bài báo mới từ mẫu
            </h2>
          </div>
          <div className="text-xs text-slate-400 font-medium hidden sm:block">
            Nhấp vào mẫu để khởi tạo bài báo với định dạng dàn trang tương ứng
          </div>
        </div>

        {/* Row of Template Starters */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
          {/* Card 1: Blank Document */}
          <div
            onClick={() => handleSelectTemplate(templates[templates.length - 1] || templates[0])}
            className="group cursor-pointer flex flex-col items-center select-none"
          >
            <div className="w-full aspect-[210/280] rounded-2xl bg-white border-2 border-dashed border-slate-200 group-hover:border-[#78C841] group-hover:bg-[#78C841]/5 flex flex-col items-center justify-center shadow-xs transition-all duration-200 group-hover:shadow-md group-hover:scale-102">
              <div className="w-14 h-14 rounded-2xl bg-slate-50 group-hover:bg-white flex items-center justify-center shadow-2xs transition-all group-hover:scale-110">
                <Plus className="w-8 h-8 text-[#78C841] stroke-[2.8]" />
              </div>
              <span className="text-[11px] font-bold text-slate-700 group-hover:text-[#2d5d11] mt-3">
                Bài báo trống
              </span>
            </div>
            <div className="w-full text-center mt-2 px-1">
              <div className="text-xs font-bold text-slate-900 group-hover:text-[#78C841] truncate">
                Tạo từ khung trắng
              </div>
              <div className="text-[10px] text-slate-400 truncate">Tự do bố cục từ đầu</div>
            </div>
          </div>

          {/* Preset templates */}
          {templates.slice(0, 5).map((preset) => (
            <div
              key={preset.id}
              onClick={() => handleSelectTemplate(preset)}
              className="group cursor-pointer flex flex-col items-center select-none"
            >
              {/* Mini A4 Simulation Card */}
              <div className="w-full aspect-[210/280] rounded-2xl bg-white border border-slate-200/90 group-hover:border-[#78C841] p-2.5 flex flex-col justify-between shadow-xs transition-all duration-200 group-hover:shadow-md group-hover:scale-102 overflow-hidden relative">
                {/* Top header line */}
                <div className="space-y-1">
                  <div
                    className="h-1 w-8 rounded-full"
                    style={{ backgroundColor: preset.primaryColor || '#14532D' }}
                  />
                  <div className="h-0.5 w-full bg-slate-200" />
                </div>

                {/* Simulated content preview */}
                <div className="flex-1 my-1.5 flex flex-col justify-center space-y-1">
                  <div className="h-1.5 w-3/4 rounded bg-slate-800" />
                  <div className="h-1 w-1/2 rounded bg-slate-400" />

                  {preset.zones.some((z) => z.type === 'sidebar-split') ? (
                    <div className="grid grid-cols-12 gap-1 pt-1">
                      <div className="col-span-4 bg-slate-100 rounded p-0.5 space-y-0.5">
                        <div className="h-0.5 w-full bg-slate-300" />
                        <div className="h-0.5 w-3/4 bg-slate-300" />
                      </div>
                      <div className="col-span-8 bg-emerald-50/60 rounded p-0.5 space-y-0.5">
                        <div className="h-0.5 w-full bg-slate-300" />
                        <div className="h-0.5 w-4/5 bg-slate-300" />
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-1 pt-1">
                      <div className="space-y-0.5">
                        <div className="h-0.5 w-full bg-slate-300" />
                        <div className="h-0.5 w-full bg-slate-300" />
                      </div>
                      <div className="space-y-0.5">
                        <div className="h-0.5 w-full bg-slate-300" />
                        <div className="h-0.5 w-3/4 bg-slate-300" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Bottom line */}
                <div className="flex items-center justify-between text-[7px] text-slate-400 font-mono">
                  <span>{preset.pageArchitecture?.size || 'A4'}</span>
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: preset.primaryColor || '#14532D' }}
                  />
                </div>
              </div>

              {/* Title info */}
              <div className="w-full text-center mt-2 px-1">
                <div className="text-xs font-bold text-slate-800 group-hover:text-slate-950 truncate">
                  {preset.name.split('(')[0].trim()}
                </div>
                <div className="text-[10px] text-slate-400 truncate">
                  {preset.institution || preset.author}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Bottom Section: "Bài báo gần đây & Bản thảo của bạn" */}
      <div className="space-y-4 pt-4 border-t border-slate-200/60">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <FolderArchive className="w-4 h-4 text-slate-700" />
            <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
              Bài báo gần đây & Bản thảo của bạn
            </h2>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
              {filteredPapers.length} bài báo
            </span>
          </div>

          {/* Right Controls: Filters, Sort, View mode */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Filter Pills */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl gap-1">
              {[
                { id: 'all', label: 'Tất cả' },
                { id: 'vnuhcm', label: 'ĐHQG-HCM' },
                { id: 'intl', label: 'Quốc tế' },
                { id: 'draft', label: 'Bản thảo' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setFilterCategory(tab.id as any)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    filterCategory === tab.id
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'date' | 'name')}
              className="bg-slate-100 text-slate-700 text-xs font-medium rounded-xl px-2.5 py-1.5 border-0 outline-none cursor-pointer"
            >
              <option value="date">Sắp xếp: Mới nhất</option>
              <option value="name">Sắp xếp: Tên A-Z</option>
            </select>

            {/* View Toggle */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
                title="Dạng lưới"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  viewMode === 'list'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
                title="Dạng danh sách"
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Papers Display Area */}
        {filteredPapers.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center space-y-3">
            <FolderArchive className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-sm font-bold text-slate-700">Chưa tìm thấy bài báo nào phù hợp</p>
            <p className="text-xs text-slate-400">Hãy chọn một mẫu ở hàng trên để bắt đầu bài báo mới.</p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredPapers.map((paper) => {
              const isMenuOpen = activeMenuId === paper.id;
              const status = paper.status || 'draft';
              const authorsText = paper.metadata.authors.map((a) => a.name).join(', ') || 'Chưa có tác giả';

              return (
                <div
                  key={paper.id}
                  onClick={() => handleOpenPaper(paper)}
                  className="bg-white rounded-2xl border border-slate-200/80 hover:border-[#78C841] hover:shadow-md transition-all duration-200 p-4 flex flex-col justify-between cursor-pointer group relative"
                >
                  <div>
                    {/* Top Tag & Context Menu */}
                    <div className="flex items-center justify-between mb-2.5">
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 truncate max-w-[170px]">
                        {paper.templateName || paper.metadata.journalName || 'MẪU CHUẨN'}
                      </span>

                      {/* 3-Dot Actions Menu */}
                      <div className="relative" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => setActiveMenuId(isMenuOpen ? null : paper.id)}
                          className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>

                        {isMenuOpen && (
                          <div className="absolute right-0 top-6 z-30 w-48 bg-white rounded-xl shadow-xl border border-slate-200 py-1 text-xs text-slate-700 animate-in fade-in zoom-in-95">
                            <button
                              onClick={() => {
                                handleOpenPaper(paper);
                                setActiveMenuId(null);
                              }}
                              className="w-full px-3 py-2 text-left hover:bg-slate-50 flex items-center gap-2 font-medium cursor-pointer"
                            >
                              <Edit3 className="w-3.5 h-3.5 text-blue-600" />
                              <span>Mở soạn thảo</span>
                            </button>
                            <button
                              onClick={(e) => handleDuplicatePaper(paper.id, e)}
                              className="w-full px-3 py-2 text-left hover:bg-slate-50 flex items-center gap-2 font-medium cursor-pointer"
                            >
                              <Copy className="w-3.5 h-3.5 text-slate-600" />
                              <span>Nhân bản bài báo</span>
                            </button>
                            <button
                              onClick={(e) => handleExportTypst(paper, e)}
                              className="w-full px-3 py-2 text-left hover:bg-slate-50 flex items-center gap-2 font-medium cursor-pointer"
                            >
                              <Download className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Tải file Typst (.typ)</span>
                            </button>
                            <div className="border-t border-slate-100 my-1" />
                            <button
                              onClick={(e) => handleDeletePaper(paper.id, e)}
                              className="w-full px-3 py-2 text-left hover:bg-red-50 text-red-600 flex items-center gap-2 font-medium cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Xóa bài báo</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Paper Title */}
                    <h3 className="font-bold text-sm text-slate-900 group-hover:text-emerald-800 line-clamp-2 leading-snug mb-1.5 transition-colors">
                      {paper.metadata.title}
                    </h3>

                    {/* Author line */}
                    <p className="text-xs text-slate-500 line-clamp-1 mb-2 font-medium">
                      {authorsText}
                    </p>
                  </div>

                  {/* Bottom info */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(paper.updatedAt || Date.now()).toLocaleDateString('vi-VN')}
                    </span>

                    <span
                      className={`font-bold px-2 py-0.5 rounded-full text-[10px] ${
                        status === 'ready'
                          ? 'bg-emerald-100 text-emerald-800'
                          : status === 'review'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {status === 'ready' ? 'Hoàn thành' : status === 'review' ? 'Phản biện' : 'Bản thảo'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* List Mode */
          <div className="bg-white rounded-2xl border border-slate-200/80 divide-y divide-slate-100 overflow-hidden">
            {filteredPapers.map((paper) => {
              const status = paper.status || 'draft';
              return (
                <div
                  key={paper.id}
                  onClick={() => handleOpenPaper(paper)}
                  className="p-3.5 hover:bg-slate-50 transition-colors flex items-center justify-between gap-4 cursor-pointer"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800">
                        {paper.templateName || 'Mẫu bài báo'}
                      </span>
                      <h4 className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                        {paper.metadata.title}
                      </h4>
                    </div>
                    <p className="text-[11px] text-slate-500 truncate">
                      {paper.metadata.authors.map((a) => a.name).join(', ')} • {paper.metadata.journalName || 'Tạp chí'}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        status === 'ready'
                          ? 'bg-emerald-100 text-emerald-800'
                          : status === 'review'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {status === 'ready' ? 'Hoàn thành' : status === 'review' ? 'Phản biện' : 'Bản thảo'}
                    </span>

                    <button
                      onClick={(e) => handleExportTypst(paper, e)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 transition-colors cursor-pointer"
                      title="Tải tệp .typ"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default PaperHubView;
