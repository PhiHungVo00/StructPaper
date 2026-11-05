'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Sparkles,
  Loader2,
  Clock,
  ArrowLeft,
  Trash2,
  Play,
  RotateCcw,
  Zap,
} from 'lucide-react';
import { toast, sileo } from '@/components/DynamicIslandToast';

export default function ToastShowcasePage() {
  const [customTitle, setCustomTitle] = useState('Đã cập nhật dữ liệu');
  const [customDesc, setCustomDesc] = useState('Bản thảo đã được đồng bộ an toàn vào IndexedDB.');
  const [customTheme, setCustomTheme] = useState<'success' | 'error' | 'warning' | 'info'>('success');
  const [customDuration, setCustomDuration] = useState(3500);

  // Promise test simulation
  const handleSimulatePromise = (willSucceed: boolean) => {
    const mockAsync = () =>
      new Promise<string>((resolve, reject) => {
        setTimeout(() => {
          if (willSucceed) {
            resolve('Bản thảo DOCX đã được bóc tách hoàn chỉnh.');
          } else {
            reject(new Error('File DOCX bị lỗi cấu trúc bảng hoặc hình ảnh.'));
          }
        }, 2000);
      });

    toast.promise(mockAsync(), {
      loading: 'Đang trích xuất cấu trúc văn bản qua Rust Typst...',
      success: (data) => data,
      error: (err) => err?.message || 'Có lỗi xảy ra trong quá trình xử lý.',
    });
  };

  const handleFireCustom = () => {
    if (!customTitle) return;
    const desc = customDesc.trim() ? customDesc.trim() : undefined;
    toast[customTheme](customTitle, desc, {
      duration: customDuration,
    });
  };

  return (
    <div className="w-full max-w-5xl mx-auto py-8 px-4 sm:px-6 space-y-8 select-none">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200/80 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link
              href="/papers"
              className="inline-flex items-center gap-1 text-xs font-bold text-zinc-500 hover:text-zinc-900 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Quay lại Quản lý Bài báo</span>
            </Link>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight flex items-center gap-3">
            <span className="w-10 h-10 rounded-2xl bg-[#D9F99D] text-[#14532D] flex items-center justify-center shadow-xs">
              <Zap className="w-5 h-5 fill-[#14532D]" />
            </span>
            <span>Showcase Thông Báo Liquid Glass</span>
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 mt-1 max-w-2xl font-medium">
            Thử nghiệm toàn diện hệ thống thông báo Liquid Glass: bo góc tròn cạnh dưới, thụt lên xuống mượt mà với spring physics, 4 theme màu, promise loading và nút dismiss.
          </p>
        </div>

        <button
          onClick={() => toast.clear()}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-all cursor-pointer self-start sm:self-auto"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Đóng hết thông báo (Clear)</span>
        </button>
      </div>

      {/* Grid: 4 Theme Colors (1-line vs 2-line) */}
      <div className="space-y-4">
        <h2 className="text-base font-extrabold text-zinc-900 tracking-tight flex items-center gap-2">
          <span>1. Bốn Theme Màu Chuẩn (1 dòng &amp; 2 dòng)</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Lime - Success */}
          <div className="p-4 sm:p-5 rounded-3xl bg-white border border-zinc-200/80 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-[#D9F99D] text-[#14532D] flex items-center justify-center">
                  <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.8]" />
                </div>
                <h3 className="font-extrabold text-sm text-zinc-900">Theme Xanh Lime (Success)</h3>
              </div>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-lime-100 text-lime-800">
                Lime #78C841
              </span>
            </div>
            <div className="flex items-center gap-2 pt-1 flex-wrap">
              <button
                onClick={() => toast.success('Đã lưu bản thảo thành công')}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[#78C841] text-zinc-950 hover:bg-[#6cb43a] transition-all cursor-pointer shadow-2xs"
              >
                1 Dòng: Đã lưu thành công
              </button>
              <button
                onClick={() =>
                  toast.success(
                    'Đã khởi tạo bài báo mới',
                    'Bản thảo đã được thiết lập theo mẫu chuẩn VNUHCM-STD với 2 cột Vancouver.'
                  )
                }
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-lime-100 text-lime-900 hover:bg-lime-200 transition-all cursor-pointer"
              >
                2 Dòng: Chi tiết bài báo
              </button>
            </div>
          </div>

          {/* Red - Error */}
          <div className="p-4 sm:p-5 rounded-3xl bg-white border border-zinc-200/80 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center">
                  <AlertCircle className="w-3.5 h-3.5 stroke-[2.8]" />
                </div>
                <h3 className="font-extrabold text-sm text-zinc-900">Theme Đỏ (Error)</h3>
              </div>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">
                #FB4141
              </span>
            </div>
            <div className="flex items-center gap-2 pt-1 flex-wrap">
              <button
                onClick={() => toast.error('Không thể xuất file bản thảo')}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[#FB4141] text-white hover:bg-rose-600 transition-all cursor-pointer shadow-2xs"
              >
                1 Dòng: Lỗi xuất file
              </button>
              <button
                onClick={() =>
                  toast.error(
                    'Lỗi đồng bộ cơ sở dữ liệu',
                    'Không thể lưu trạng thái vào IndexedDB do vượt quá hạn mức lưu trữ trình duyệt.'
                  )
                }
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-100 text-rose-900 hover:bg-rose-200 transition-all cursor-pointer"
              >
                2 Dòng: Lỗi chi tiết
              </button>
            </div>
          </div>

          {/* Yellow - Warning */}
          <div className="p-4 sm:p-5 rounded-3xl bg-white border border-zinc-200/80 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center">
                  <AlertTriangle className="w-3.5 h-3.5 stroke-[2.8]" />
                </div>
                <h3 className="font-extrabold text-sm text-zinc-900">Theme Vàng (Warning)</h3>
              </div>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                #FF9B2F
              </span>
            </div>
            <div className="flex items-center gap-2 pt-1 flex-wrap">
              <button
                onClick={() => toast.warning('Bản thảo chưa được lưu thay đổi')}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[#FF9B2F] text-zinc-950 hover:bg-amber-500 transition-all cursor-pointer shadow-2xs"
              >
                1 Dòng: Cảnh báo chưa lưu
              </button>
              <button
                onClick={() =>
                  toast.warning(
                    'Thiếu tác giả liên hệ',
                    'Vui lòng bổ sung email tác giả liên hệ trước khi gửi xét duyệt bài báo.'
                  )
                }
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-100 text-amber-900 hover:bg-amber-200 transition-all cursor-pointer"
              >
                2 Dòng: Cảnh báo chi tiết
              </button>
            </div>
          </div>

          {/* White-Gray - Normal / Info */}
          <div className="p-4 sm:p-5 rounded-3xl bg-white border border-zinc-200/80 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-zinc-900 text-white flex items-center justify-center">
                  <Sparkles className="w-3.5 h-3.5 stroke-[2.4]" />
                </div>
                <h3 className="font-extrabold text-sm text-zinc-900">Theme Trắng Xám (Normal / Info)</h3>
              </div>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-zinc-200 text-zinc-800">
                Trắng Xám
              </span>
            </div>
            <div className="flex items-center gap-2 pt-1 flex-wrap">
              <button
                onClick={() => toast.info('Đã cập nhật hệ thống mẫu tạp chí')}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-zinc-900 text-white hover:bg-zinc-800 transition-all cursor-pointer shadow-2xs"
              >
                1 Dòng: Thông báo mẫu mới
              </button>
              <button
                onClick={() =>
                  toast.info(
                    'Quy định trích dẫn Vancouver',
                    'Tất cả 7 tạp chí ĐHQG-HCM áp dụng trích dẫn số thứ tự theo định dạng Vancouver.'
                  )
                }
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-zinc-200 text-zinc-900 hover:bg-zinc-300 transition-all cursor-pointer"
              >
                2 Dòng: Hướng dẫn trích dẫn
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Advanced Features: Promise, Action & Persistence */}
      <div className="space-y-4">
        <h2 className="text-base font-extrabold text-zinc-900 tracking-tight flex items-center gap-2">
          <span>2. Tính Năng Nâng Cao (Promise, Nút Action, Timer &amp; Dismiss)</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Promise Toast */}
          <div className="p-4 sm:p-5 rounded-3xl bg-white border border-zinc-200/80 shadow-xs space-y-3">
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-[#78C841]" />
              <h3 className="font-extrabold text-sm text-zinc-900">Promise Loading</h3>
            </div>
            <p className="text-xs text-zinc-500">
              Chuyển đổi trạng thái từ Spinner sang Success hoặc Error mượt mà với spring morph.
            </p>
            <div className="flex flex-col gap-2 pt-1">
              <button
                onClick={() => handleSimulatePromise(true)}
                className="w-full px-3 py-2 rounded-xl text-xs font-bold bg-[#78C841] text-zinc-950 hover:bg-[#6cb43a] transition-all cursor-pointer text-center"
              >
                Chạy Promise (Thành công sau 2s)
              </button>
              <button
                onClick={() => handleSimulatePromise(false)}
                className="w-full px-3 py-2 rounded-xl text-xs font-bold bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200 transition-all cursor-pointer text-center"
              >
                Chạy Promise (Thất bại sau 2s)
              </button>
            </div>
          </div>

          {/* Action Button Toast */}
          <div className="p-4 sm:p-5 rounded-3xl bg-white border border-zinc-200/80 shadow-xs space-y-3">
            <div className="flex items-center gap-2">
              <Play className="w-4 h-4 text-blue-600" />
              <h3 className="font-extrabold text-sm text-zinc-900">Toast kèm nút Action</h3>
            </div>
            <p className="text-xs text-zinc-500">
              Tích hợp nút hành động trực tiếp ngay trên thanh thông báo liquid glass.
            </p>
            <div className="pt-1">
              <button
                onClick={() =>
                  toast.success('Bản sao lưu đã sẵn sàng', 'Nhấn Tải về để lưu file về máy', {
                    action: {
                      label: 'Tải về ngay',
                      onClick: () => alert('Đã bắt đầu tải file .structpaper!'),
                    },
                  })
                }
                className="w-full px-3 py-2 rounded-xl text-xs font-bold bg-blue-50 text-blue-800 hover:bg-blue-100 border border-blue-200 transition-all cursor-pointer text-center"
              >
                Bắn Toast có nút Action
              </button>
            </div>
          </div>

          {/* Sileo Backward Compatibility */}
          <div className="p-4 sm:p-5 rounded-3xl bg-white border border-zinc-200/80 shadow-xs space-y-3">
            <div className="flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-indigo-600" />
              <h3 className="font-extrabold text-sm text-zinc-900">Kiểm tra API sileo.*</h3>
            </div>
            <p className="text-xs text-zinc-500">
              Thử nghiệm gọi qua đối tượng sileo cũ ({`sileo.success({ title, description })`}).
            </p>
            <div className="pt-1">
              <button
                onClick={() =>
                  sileo.success({
                    title: 'Tương thích Sileo API',
                    description: 'Hàm sileo.success({...}) hoạt động 100% trơn tru không lỗi.',
                  })
                }
                className="w-full px-3 py-2 rounded-xl text-xs font-bold bg-indigo-50 text-indigo-800 hover:bg-indigo-100 border border-indigo-200 transition-all cursor-pointer text-center"
              >
                Gọi sileo.success(...)
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Custom Playground */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white border border-zinc-200/80 shadow-xs space-y-4">
        <h2 className="text-base font-extrabold text-zinc-900 tracking-tight flex items-center gap-2">
          <span>3. Bàn Thử Nghiệm Tùy Biến (Custom Playground)</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-extrabold text-zinc-700 block">Tiêu đề (Title):</label>
            <input
              type="text"
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              placeholder="Nhập tiêu đề thông báo..."
              className="w-full px-3.5 py-2 rounded-xl text-xs font-bold border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-[#78C841]/30"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-extrabold text-zinc-700 block">
              Mô tả (Description - để trống nếu muốn xem chế độ 1 dòng):
            </label>
            <input
              type="text"
              value={customDesc}
              onChange={(e) => setCustomDesc(e.target.value)}
              placeholder="Để trống để test 1 dòng..."
              className="w-full px-3.5 py-2 rounded-xl text-xs font-bold border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-[#78C841]/30"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-extrabold text-zinc-700 block">Theme màu:</label>
            <div className="grid grid-cols-4 gap-2">
              {(['success', 'error', 'warning', 'info'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setCustomTheme(t)}
                  className={`py-1.5 text-xs font-bold rounded-xl capitalize transition-all cursor-pointer ${
                    customTheme === t
                      ? 'bg-zinc-900 text-white shadow-xs'
                      : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                  }`}
                >
                  {t === 'info' ? 'Trắng' : t}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-extrabold text-zinc-700 block">
              Thời gian hiển thị: {customDuration / 1000} giây
            </label>
            <input
              type="range"
              min="1500"
              max="10000"
              step="500"
              value={customDuration}
              onChange={(e) => setCustomDuration(Number(e.target.value))}
              className="w-full accent-[#78C841]"
            />
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
