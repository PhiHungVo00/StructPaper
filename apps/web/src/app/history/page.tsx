'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  FolderArchive,
  Search,
  Filter,
  FileText,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  UploadCloud,
  ChevronRight,
  Sparkles,
  BookOpen,
  ArrowUpRight,
} from 'lucide-react';
import { usePaper } from '@/context/PaperContext';

interface ArchivedPaper {
  id: string;
  title: string;
  titleEn?: string;
  journal: string;
  journalName: string;
  authors: string[];
  date: string;
  status: 'published' | 'draft' | 'review';
  qcScore: number;
  sectionsCount: number;
  figuresCount: number;
  tablesCount: number;
}

const SAMPLE_ARCHIVE: ArchivedPaper[] = [
  {
    id: 'hs630',
    title: 'Nghiên cứu ứng dụng mô hình trí tuệ nhân tạo trong nhận dạng chữ viết tay tiếng Việt cổ',
    titleEn: 'A study on applying artificial intelligence models in ancient Vietnamese handwritten character recognition',
    journal: 'VNUHCM-HS',
    journalName: 'Tạp chí Khoa học Xã hội & Nhân văn ĐHQG-HCM',
    authors: ['TS. Nguyễn Hoàng Nam', 'ThS. Trần Thị Mai', 'GS. Lê Văn Khoa'],
    date: '14/10/2026',
    status: 'published',
    qcScore: 94,
    sectionsCount: 14,
    figuresCount: 4,
    tablesCount: 2,
  },
  {
    id: 'stdj-2026-12',
    title: 'Phân tích hiệu năng giao thức định tuyến không dây thích ứng trong mạng cảm biến IoT',
    titleEn: 'Performance analysis of adaptive wireless routing protocol in IoT sensor networks',
    journal: 'STDJ',
    journalName: 'Science & Technology Development Journal',
    authors: ['TS. Nguyễn Hoàng Nam', 'Kỹ sư Phạm Quốc Bảo'],
    date: '02/10/2026',
    status: 'draft',
    qcScore: 88,
    sectionsCount: 9,
    figuresCount: 6,
    tablesCount: 1,
  },
  {
    id: 'ssh-2026-08',
    title: 'Tác động của chuyển đổi số đến thói quen tiêu dùng của người trẻ đô thị Việt Nam',
    titleEn: 'Impact of digital transformation on consumer habits of Vietnamese urban youth',
    journal: 'VNUHCM-SSH',
    journalName: 'Tạp chí Khoa học Xã hội & Quản trị',
    authors: ['TS. Nguyễn Hoàng Nam', 'Đỗ Minh Trí'],
    date: '28/09/2026',
    status: 'review',
    qcScore: 91,
    sectionsCount: 11,
    figuresCount: 2,
    tablesCount: 3,
  },
];

export default function HistoryPage() {
  const router = useRouter();
  const { paper } = usePaper();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterJournal, setFilterJournal] = useState<string>('all');

  const filteredPapers = SAMPLE_ARCHIVE.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.authors.some((a) => a.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesJournal = filterJournal === 'all' || p.journal === filterJournal;
    return matchesSearch && matchesJournal;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-white/70 backdrop-blur-xl border border-white/80 rounded-3xl p-6 sm:p-8 shadow-[0_8px_32px_rgba(0,0,0,0.04)] relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="p-2 rounded-2xl bg-[#D9F99D] text-[#14532D]">
                <FolderArchive className="w-5 h-5" />
              </span>
              <span className="text-xs font-extrabold uppercase tracking-wider text-zinc-500">
                Kho Lưu Trữ Bài Báo
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1A1A1A] tracking-tight">
              Bản Thảo & Báo Cáo Đã Tải Lên
            </h1>
            <p className="text-sm text-zinc-500 mt-1 max-w-xl">
              Quản lý toàn bộ danh mục bài báo khoa học đã bóc tách, tiếp tục hoàn thiện biên tập hoặc xuất bản tài liệu chuẩn định dạng.
            </p>
          </div>

          <Link
            href="/upload"
            className="btn-pill-lime text-xs px-5 py-3 flex items-center gap-2 shadow-sm hover:scale-105 active:scale-95 transition-all self-start sm:self-center flex-shrink-0"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Tải lên bài mới</span>
          </Link>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white/60 backdrop-blur-md border border-white/80 p-2.5 rounded-2xl shadow-2xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo tiêu đề, tác giả..."
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-white border border-zinc-200/80 focus:outline-none focus:border-zinc-400 font-medium"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {[
            { id: 'all', label: 'Tất cả tạp chí' },
            { id: 'VNUHCM-HS', label: 'VNUHCM-HS' },
            { id: 'STDJ', label: 'STDJ' },
            { id: 'VNUHCM-SSH', label: 'VNUHCM-SSH' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setFilterJournal(item.id)}
              className={`text-xs px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer ${
                filterJournal === item.id
                  ? 'bg-[#1A1A1A] text-white shadow-2xs'
                  : 'bg-white/80 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 border border-zinc-200/60'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Paper List Cards */}
      <div className="grid grid-cols-1 gap-4">
        {filteredPapers.map((paperItem) => (
          <div
            key={paperItem.id}
            className="bg-white/80 backdrop-blur-md border border-white/80 hover:border-zinc-300 rounded-3xl p-5 sm:p-6 shadow-2xs hover:shadow-md transition-all duration-300 group space-y-4"
          >
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-[#D9F99D] text-[#14532D]">
                    {paperItem.journal}
                  </span>
                  <span className="text-xs text-zinc-400 font-medium truncate">
                    {paperItem.journalName}
                  </span>
                  <span className="text-[11px] text-zinc-400 flex items-center gap-1 ml-auto sm:ml-0">
                    <Calendar className="w-3 h-3" /> {paperItem.date}
                  </span>
                </div>

                <h3 className="text-base sm:text-lg font-bold text-zinc-900 group-hover:text-[#1A1A1A] transition-colors leading-snug">
                  {paperItem.title}
                </h3>
                {paperItem.titleEn && (
                  <p className="text-xs text-zinc-500 italic line-clamp-1">{paperItem.titleEn}</p>
                )}

                <p className="text-xs text-zinc-600 font-medium">
                  <strong>Tác giả:</strong> {paperItem.authors.join(', ')}
                </p>
              </div>

              {/* Status and QC Score Badge */}
              <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 flex-shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-zinc-100">
                <div className="flex items-center gap-1.5 bg-[#D9F99D] text-[#14532D] px-3 py-1 rounded-full text-xs font-extrabold shadow-2xs">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>QC: {paperItem.qcScore}%</span>
                </div>
                <span className="text-[11px] font-bold text-zinc-400">
                  {paperItem.sectionsCount} mục &bull; {paperItem.figuresCount} hình &bull; {paperItem.tablesCount} bảng
                </span>
              </div>
            </div>

            {/* Bottom Actions Bar */}
            <div className="flex items-center justify-between pt-3 border-t border-zinc-100">
              <div className="flex items-center gap-2 text-xs text-zinc-400 font-mono">
                Mã bản thảo: #{paperItem.id.toUpperCase()}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => router.push('/editor')}
                  className="btn-pill-lime text-xs px-4 py-2 flex items-center gap-1.5 shadow-2xs hover:scale-105 active:scale-95 transition-all"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Mở trình biên tập</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
