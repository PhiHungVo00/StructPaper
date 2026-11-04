'use client';

import React, { useState } from 'react';
import {
  User,
  Mail,
  Building,
  GraduationCap,
  Award,
  Globe,
  Save,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  FileText,
} from 'lucide-react';

export default function AccountPage() {
  const [name, setName] = useState('TS. Nguyễn Hoàng Nam');
  const [email, setEmail] = useState('nam.nh@vnuhcm.edu.vn');
  const [affiliation, setAffiliation] = useState('Đại học Quốc gia TP. Hồ Chí Minh (VNUHCM)');
  const [department, setDepartment] = useState('Khoa Khoa học & Kỹ thuật Máy tính - Trường ĐH Bách Khoa');
  const [orcid, setOrcid] = useState('0000-0002-1825-0097');
  const [phone, setPhone] = useState('+84 908 123 456');
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Profile Overview Card */}
      <div className="bg-white/75 backdrop-blur-xl border border-white/80 rounded-3xl p-6 sm:p-8 shadow-[0_8px_32px_rgba(0,0,0,0.04)]">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div className="relative flex-shrink-0">
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-[#78C841] text-white flex items-center justify-center font-extrabold text-3xl shadow-[inset_0_0_20px_rgba(255,255,255,0.4),0_8px_24px_rgba(0,0,0,0.12)] border-2 border-white">
              NN
            </div>
            <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#78C841] border-3 border-white shadow-sm" />
          </div>

          <div className="flex-1 text-center sm:text-left space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <h1 className="text-2xl font-extrabold text-zinc-900 tracking-tight">{name}</h1>
              <div className="inline-flex items-center gap-1 bg-[#D9F99D] text-[#14532D] px-2.5 py-0.5 rounded-full text-xs font-bold self-center sm:self-auto">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Tác giả xác thực ĐHQG-HCM</span>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-zinc-500 font-medium">
              {department} &bull; {affiliation}
            </p>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 pt-2 text-xs text-zinc-600">
              <div className="flex items-center gap-1.5 bg-zinc-100 px-3 py-1 rounded-xl">
                <Mail className="w-3.5 h-3.5 text-zinc-500" />
                <span>{email}</span>
              </div>
              <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1 rounded-xl font-mono">
                <Globe className="w-3.5 h-3.5" />
                <span>ORCID: {orcid}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Metric counters */}
        <div className="grid grid-cols-3 gap-3 pt-6 mt-6 border-t border-zinc-100 text-center">
          <div className="p-3 rounded-2xl bg-zinc-50 border border-zinc-200/70">
            <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">
              Bài báo đã duyệt
            </span>
            <span className="text-xl font-extrabold text-zinc-900 mt-0.5 block">18</span>
          </div>
          <div className="p-3 rounded-2xl bg-zinc-50 border border-zinc-200/70">
            <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">
              Bản thảo trong kho
            </span>
            <span className="text-xl font-extrabold text-zinc-900 mt-0.5 block">12</span>
          </div>
          <div className="p-3 rounded-2xl bg-zinc-50 border border-zinc-200/70">
            <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">
              Chỉ số trích dẫn trung bình
            </span>
            <span className="text-xl font-extrabold text-[#14532D] mt-0.5 block">94% QC</span>
          </div>
        </div>
      </div>

      {/* Account Settings Form */}
      <form
        onSubmit={handleSave}
        className="bg-white/80 backdrop-blur-md border border-white/80 rounded-3xl p-6 sm:p-8 shadow-2xs space-y-6"
      >
        <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-zinc-900">
              Thông Tin Tác Giả & Hồ Sơ Khoa Học
            </h2>
            <p className="text-xs text-zinc-500">
              Thông tin này sẽ được điền tự động vào trang đầu và mục tác giả của các bản thảo xuất bản.
            </p>
          </div>

          {saved && (
            <div className="flex items-center gap-1.5 bg-[#D9F99D] text-[#14532D] px-3 py-1.5 rounded-full text-xs font-bold animate-in fade-in">
              <CheckCircle2 className="w-4 h-4" />
              <span>Đã lưu thành công!</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-700">Họ và tên tác giả</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-zinc-200 bg-white focus:outline-none focus:border-zinc-400 font-medium"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-700">Email học thuật liên hệ</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-zinc-200 bg-white focus:outline-none focus:border-zinc-400 font-medium"
            />
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <label className="text-xs font-bold text-zinc-700">Cơ quan / Viện nghiên cứu</label>
            <input
              type="text"
              value={affiliation}
              onChange={(e) => setAffiliation(e.target.value)}
              className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-zinc-200 bg-white focus:outline-none focus:border-zinc-400 font-medium"
            />
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <label className="text-xs font-bold text-zinc-700">Khoa / Phòng thí nghiệm</label>
            <input
              type="text"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-zinc-200 bg-white focus:outline-none focus:border-zinc-400 font-medium"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-700">Mã định danh ORCID</label>
            <input
              type="text"
              value={orcid}
              onChange={(e) => setOrcid(e.target.value)}
              className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-zinc-200 bg-white focus:outline-none focus:border-zinc-400 font-mono"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-700">Số điện thoại liên lạc</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-zinc-200 bg-white focus:outline-none focus:border-zinc-400 font-medium"
            />
          </div>
        </div>

        <div className="flex items-center justify-end pt-4 border-t border-zinc-100">
          <button
            type="submit"
            className="btn-pill-lime text-xs px-6 py-2.5 flex items-center gap-2 shadow-2xs hover:scale-105 active:scale-95 transition-all"
          >
            <Save className="w-4 h-4" />
            <span>Lưu thay đổi hồ sơ</span>
          </button>
        </div>
      </form>
    </div>
  );
}
