'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Sparkles,
  Loader2,
  ArrowLeft,
  Trash2,
  Play,
  RotateCcw,
  Zap,
  Layers,
} from 'lucide-react';
import { toast, sileo } from '@/components/DynamicIslandToast';

export default function ToastShowcasePage() {
  const [customTitle, setCustomTitle] = useState('Đã cập nhật dữ liệu');
  const [customDesc, setCustomDesc] = useState('Bản thảo đã được đồng bộ an toàn.');
  const [customTheme, setCustomTheme] = useState<'success' | 'error' | 'warning' | 'info'>('success');
  const [customDuration, setCustomDuration] = useState(3500);
  const [customInline, setCustomInline] = useState(false);

  const handleSimulatePromise = (willSucceed: boolean) => {
    const mockAsync = () =>
      new Promise<string>((resolve, reject) => {
        setTimeout(() => {
          if (willSucceed) resolve('Bản thảo DOCX đã được bóc tách hoàn chỉnh.');
          else reject(new Error('File DOCX bị lỗi cấu trúc bảng hoặc hình ảnh.'));
        }, 2000);
      });

    toast.promise(mockAsync(), {
      loading: 'Đang trích xuất cấu trúc văn bản qua Rust Typst (Sky Blue)...',
      success: (data) => data,
      error: (err) => err?.message || 'Có lỗi xảy ra trong quá trình xử lý.',
    });
  };

  const handleTestStack = () => {
    toast.clear();
    toast.info('Thông báo 1 (Đầu stack)', 'Chỉ bo góc ở 2 cạnh đáy (Top Notch)', { duration: 8000 });
    setTimeout(() => {
      toast.success('Thông báo 2 (Bị đẩy xuống)', 'Tự động bo tròn đều cả 4 góc!', { duration: 8000 });
    }, 250);
  };

  const handleFireCustom = () => {
    if (!customTitle) return;
    const desc = customDesc.trim() ? customDesc.trim() : undefined;
    toast[customTheme](customTitle, desc, {
      duration: customDuration,
      inline: customInline,
    });
  };

  return (
    <div className="w-full max-w-5xl mx-auto py-8 px-4 sm:px-6 space-y-7 select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200/80 pb-5">
        <div>
          <Link
            href="/papers"
            className="inline-flex items-center gap-1 text-xs font-bold text-zinc-500 hover:text-zinc-900 mb-2 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Quay lại Quản lý Bài báo</span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-black text-zinc-950 tracking-tight flex items-center gap-3">
            <span className="w-9 h-9 rounded-2xl bg-[#D9F99D] text-[#14532D] flex items-center justify-center shadow-xs">
              <Zap className="w-5 h-5 fill-[#14532D]" />
            </span>
            <span>Showcase Thông Báo Liquid Glass</span>
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 mt-1 font-medium">
            Test theme Xanh Lime, Đỏ, Vàng, Trắng Xám, Sky Blue Promise, 1 dòng Inline và bo góc stack thông minh.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <button
            onClick={handleTestStack}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-2xl text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition-all cursor-pointer"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Test Stack (Top bo đáy / Dưới bo đều)</span>
          </button>
          <button
            onClick={() => toast.clear()}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-2xl text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-all cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>
        </div>
      </div>

      {/* Section 1: 4 Main Themes */}
      <div className="space-y-3.5">
        <h2 className="text-sm sm:text-base font-extrabold text-zinc-950 tracking-tight">
          1. Bốn Theme Màu Chuẩn (1 dòng, 1 dòng Inline &amp; 2 dòng)
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {/* Lime - Success */}
          <div className="p-4 rounded-3xl bg-white border border-zinc-200/80 shadow-xs space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-[#78C841] text-white flex items-center justify-center">
                  <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.8]" />
                </div>
                <h3 className="font-extrabold text-sm text-zinc-950">Theme Xanh Lime (Success)</h3>
              </div>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-lime-100 text-lime-800">Lime #78C841</span>
            </div>
            <div className="flex items-center gap-1.5 pt-1 flex-wrap">
              <button
                onClick={() => toast.success('Đã lưu bản thảo')}
                className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-[#78C841] text-zinc-950 hover:bg-[#6cb43a] cursor-pointer"
              >
                1 Dòng gọn
              </button>
              <button
                onClick={() => toast.success('Đã lưu bài báo', 'Bản thảo đã cập nhật thành công vào hệ thống.', { inline: true })}
                className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-lime-100 text-lime-900 hover:bg-lime-200 cursor-pointer"
              >
                1 Dòng Inline (Tiêu đề: Mô tả...)
              </button>
              <button
                onClick={() => toast.success('Đã khởi tạo bài báo mới', 'Bản thảo đã được thiết lập theo mẫu chuẩn VNUHCM-STD.')}
                className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-zinc-100 text-zinc-800 hover:bg-zinc-200 cursor-pointer"
              >
                2 Dòng
              </button>
            </div>
          </div>

          {/* Red - Error */}
          <div className="p-4 rounded-3xl bg-white border border-zinc-200/80 shadow-xs space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-[#FB4141] text-white flex items-center justify-center">
                  <AlertCircle className="w-3.5 h-3.5 stroke-[2.8]" />
                </div>
                <h3 className="font-extrabold text-sm text-zinc-950">Theme Đỏ (Error)</h3>
              </div>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">#FB4141</span>
            </div>
            <div className="flex items-center gap-1.5 pt-1 flex-wrap">
              <button
                onClick={() => toast.error('Không thể xuất file')}
                className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-[#FB4141] text-white hover:bg-rose-600 cursor-pointer"
              >
                1 Dòng gọn
              </button>
              <button
                onClick={() => toast.error('Lỗi định dạng', 'File DOCX bị lỗi cấu trúc bảng hoặc hình ảnh.', { inline: true })}
                className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-rose-100 text-rose-900 hover:bg-rose-200 cursor-pointer"
              >
                1 Dòng Inline (Tiêu đề: Mô tả...)
              </button>
              <button
                onClick={() => toast.error('Lỗi đồng bộ cơ sở dữ liệu', 'Không thể lưu trạng thái vào IndexedDB do lỗi quota.')}
                className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-zinc-100 text-zinc-800 hover:bg-zinc-200 cursor-pointer"
              >
                2 Dòng
              </button>
            </div>
          </div>

          {/* Yellow - Warning */}
          <div className="p-4 rounded-3xl bg-white border border-zinc-200/80 shadow-xs space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-[#FF9B2F] text-white flex items-center justify-center">
                  <AlertTriangle className="w-3.5 h-3.5 stroke-[2.8]" />
                </div>
                <h3 className="font-extrabold text-sm text-zinc-950">Theme Vàng (Warning)</h3>
              </div>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">#FF9B2F</span>
            </div>
            <div className="flex items-center gap-1.5 pt-1 flex-wrap">
              <button
                onClick={() => toast.warning('Bản thảo chưa lưu')}
                className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-[#FF9B2F] text-zinc-950 hover:bg-amber-500 cursor-pointer"
              >
                1 Dòng gọn
              </button>
              <button
                onClick={() => toast.warning('Cảnh báo tác giả', 'Vui lòng bổ sung email tác giả liên hệ.', { inline: true })}
                className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-amber-100 text-amber-900 hover:bg-amber-200 cursor-pointer"
              >
                1 Dòng Inline (Tiêu đề: Mô tả...)
              </button>
              <button
                onClick={() => toast.warning('Thiếu tác giả liên hệ', 'Vui lòng bổ sung email tác giả trước khi gửi xét duyệt.')}
                className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-zinc-100 text-zinc-800 hover:bg-zinc-200 cursor-pointer"
              >
                2 Dòng
              </button>
            </div>
          </div>

          {/* White-Gray - Normal / Info */}
          <div className="p-4 rounded-3xl bg-white border border-zinc-200/80 shadow-xs space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-zinc-900 text-white flex items-center justify-center">
                  <Sparkles className="w-3.5 h-3.5 stroke-[2.4]" />
                </div>
                <h3 className="font-extrabold text-sm text-zinc-950">Theme Trắng Xám (bg-gray-200/70)</h3>
              </div>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-zinc-200 text-zinc-800">Trắng Xám</span>
            </div>
            <div className="flex items-center gap-1.5 pt-1 flex-wrap">
              <button
                onClick={() => toast.info('Đã nạp mẫu mới')}
                className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-zinc-900 text-white hover:bg-zinc-800 cursor-pointer"
              >
                1 Dòng gọn
              </button>
              <button
                onClick={() => toast.info('Chuẩn Vancouver', 'Áp dụng trích dẫn số thứ tự theo định dạng Vancouver.', { inline: true })}
                className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-zinc-200 text-zinc-900 hover:bg-zinc-300 cursor-pointer"
              >
                1 Dòng Inline (Tiêu đề: Mô tả...)
              </button>
              <button
                onClick={() => toast.info('Quy định trích dẫn Vancouver', 'Tất cả 7 tạp chí ĐHQG-HCM áp dụng trích dẫn số thứ tự.')}
                className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-zinc-100 text-zinc-800 hover:bg-zinc-200 cursor-pointer"
              >
                2 Dòng
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Section 2: Sky Blue Promise & Features */}
      <div className="space-y-3.5">
        <h2 className="text-sm sm:text-base font-extrabold text-zinc-950 tracking-tight">
          2. Theme Xanh Sky cho Promise Loading &amp; Tiện ích
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          <div className="p-4 rounded-3xl bg-white border border-zinc-200/80 shadow-xs space-y-2.5">
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-[#0284C7]" />
              <h3 className="font-extrabold text-sm text-zinc-950">Promise (Xanh Sky #0284C7)</h3>
            </div>
            <p className="text-xs text-zinc-500">
              Nền xanh Sky dịu mát (`bg-[#E0F2FE]/70`) trong khi loading, sau đó morph sang kết quả.
            </p>
            <div className="flex flex-col gap-1.5 pt-1">
              <button
                onClick={() => handleSimulatePromise(true)}
                className="w-full px-3 py-1.5 rounded-xl text-xs font-bold bg-sky-500 text-white hover:bg-sky-600 cursor-pointer text-center"
              >
                Chạy Promise (Thành công 2s)
              </button>
              <button
                onClick={() => handleSimulatePromise(false)}
                className="w-full px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200 cursor-pointer text-center"
              >
                Chạy Promise (Thất bại 2s)
              </button>
            </div>
          </div>

          <div className="p-4 rounded-3xl bg-white border border-zinc-200/80 shadow-xs space-y-2.5">
            <div className="flex items-center gap-2">
              <Play className="w-4 h-4 text-blue-600" />
              <h3 className="font-extrabold text-sm text-zinc-950">Toast kèm nút Action</h3>
            </div>
            <p className="text-xs text-zinc-500">Tích hợp nút hành động trực tiếp ngay trên thanh thông báo.</p>
            <div className="pt-1">
              <button
                onClick={() =>
                  toast.success('Bản sao lưu đã sẵn sàng', 'Nhấn Tải về để lưu file về máy', {
                    action: { label: 'Tải về ngay', onClick: () => alert('Đang tải file...') },
                  })
                }
                className="w-full px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-50 text-blue-800 hover:bg-blue-100 border border-blue-200 cursor-pointer text-center"
              >
                Bắn Toast có nút Action
              </button>
            </div>
          </div>

          <div className="p-4 rounded-3xl bg-white border border-zinc-200/80 shadow-xs space-y-2.5">
            <div className="flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-indigo-600" />
              <h3 className="font-extrabold text-sm text-zinc-950">Kiểm tra API sileo.*</h3>
            </div>
            <p className="text-xs text-zinc-500">Thử nghiệm gọi qua đối tượng sileo cũ ({`sileo.success({...})`}).</p>
            <div className="pt-1">
              <button
                onClick={() => sileo.success({ title: 'Sileo Compatible', description: 'Hàm sileo.success hoạt động trơn tru.' })}
                className="w-full px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-50 text-indigo-800 hover:bg-indigo-100 border border-indigo-200 cursor-pointer text-center"
              >
                Gọi sileo.success(...)
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Section 3: Custom Playground */}
      <div className="p-5 rounded-3xl bg-white border border-zinc-200/80 shadow-xs space-y-3.5">
        <h2 className="text-sm sm:text-base font-extrabold text-zinc-950 tracking-tight">
          3. Bàn Thử Nghiệm Tùy Biến (Custom Playground)
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          <div className="space-y-1">
            <label className="text-xs font-extrabold text-zinc-700 block">Tiêu đề (Title):</label>
            <input
              type="text"
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              className="w-full px-3 py-1.5 rounded-xl text-xs font-bold border border-zinc-200"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-extrabold text-zinc-700 block">Mô tả (Description):</label>
            <input
              type="text"
              value={customDesc}
              onChange={(e) => setCustomDesc(e.target.value)}
              className="w-full px-3 py-1.5 rounded-xl text-xs font-bold border border-zinc-200"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-extrabold text-zinc-700 block">Theme màu:</label>
            <div className="grid grid-cols-4 gap-1.5">
              {(['success', 'error', 'warning', 'info'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setCustomTheme(t)}
                  className={`py-1.5 text-xs font-bold rounded-xl capitalize transition-all cursor-pointer ${
                    customTheme === t ? 'bg-zinc-950 text-white shadow-xs' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                  }`}
                >
                  {t === 'info' ? 'Trắng Xám' : t === 'success' ? 'Lime' : t}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1 flex flex-col justify-between">
            <label className="text-xs font-extrabold text-zinc-700 flex items-center justify-between">
              <span>Chế độ 1 dòng Inline:</span>
              <input
                type="checkbox"
                checked={customInline}
                onChange={(e) => setCustomInline(e.target.checked)}
                className="w-4 h-4 accent-[#78C841] cursor-pointer"
              />
            </label>
            <p className="text-[11px] text-zinc-400">
              {customInline ? 'Bật: Hiển thị dạng "Tiêu đề: Mô tả..." trên cùng 1 dòng' : 'Tắt: Hiển thị 2 dòng riêng biệt'}
            </p>
          </div>
        </div>

        <div className="pt-2 flex items-center justify-end">
          <button
            onClick={handleFireCustom}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-extrabold bg-[#78C841] text-zinc-950 hover:bg-[#6cb43a] transition-all cursor-pointer shadow-xs"
          >
            <Zap className="w-4 h-4 fill-zinc-950" />
            <span>Kích hoạt Thông Báo Ngay</span>
          </button>
        </div>
      </div>
    </div>
  );
}
