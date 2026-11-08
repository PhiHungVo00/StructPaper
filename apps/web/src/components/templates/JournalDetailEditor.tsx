'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Save,
  RotateCcw,
  Sparkles,
  BookOpen,
  CheckCircle2,
  Sliders,
  FileText,
  Layers,
  Layout,
  Code2,
} from 'lucide-react';
import { JournalProfile } from '@structpaper/journal-profiles';
import {
  ManagedJournalProfile,
  JournalStatus,
} from '@/lib/templates/journal-storage';
import { toast } from '@/components/DynamicIslandToast';
import { useManagedJournals } from '@/hooks';
import { JournalGeneralTab } from './tabs/JournalGeneralTab';
import { JournalFrontMatterTab } from './tabs/JournalFrontMatterTab';
import { JournalArticleTypesTab } from './tabs/JournalArticleTypesTab';
import { JournalLayoutTab } from './tabs/JournalLayoutTab';
import { JournalJsonInspectorTab } from './tabs/JournalJsonInspectorTab';

interface JournalDetailEditorProps {
  initialManaged: ManagedJournalProfile;
  isNew?: boolean;
}

type TabKey = 'general' | 'frontmatter' | 'article-types' | 'layout' | 'json';

export const JournalDetailEditor: React.FC<JournalDetailEditorProps> = ({
  initialManaged,
  isNew = false,
}) => {
  const router = useRouter();
  const { saveProfile, resetProfile, createTestPaper } = useManagedJournals();
  const [managed, setManaged] = useState<ManagedJournalProfile>(initialManaged);
  const [activeTab, setActiveTab] = useState<TabKey>('general');
  const [isSaving, setIsSaving] = useState(false);

  const brandColor = managed.profile.color || '#1e3a8a';
  const nameVi = managed.profile.names?.vi || (isNew ? 'Hồ sơ Tạp chí Mới' : 'Tạp chí');
  const shortCode = managed.profile.names?.short || managed.id.toUpperCase();

  const handleUpdateProfile = (patch: Partial<JournalProfile>) => {
    setManaged((prev) => ({
      ...prev,
      profile: {
        ...prev.profile,
        ...patch,
      },
    }));
  };

  const handleStatusChange = (status: JournalStatus) => {
    setManaged((prev) => ({
      ...prev,
      status,
    }));
  };

  const handleSave = () => {
    setIsSaving(true);
    try {
      saveProfile(managed);
      toast.success(
        'Đã lưu thành công',
        `Đã lưu cấu hình hồ sơ tạp chí "${managed.profile.names?.short || managed.id}"`
      );
      if (isNew) {
        router.push(`/templates/journal/${managed.id}`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi khi lưu dữ liệu';
      toast.error('Lưu thất bại', msg);
    } finally {
      setTimeout(() => setIsSaving(false), 300);
    }
  };

  const handleReset = () => {
    if (typeof window !== 'undefined') {
      const confirmed = window.confirm(
        'Bạn có chắc chắn muốn khôi phục về cấu hình Base mặc định của tạp chí này?'
      );
      if (confirmed) {
        try {
          const reset = resetProfile(managed.id);
          setManaged(reset);
          toast.info('Đã khôi phục', 'Đã đặt lại thông số theo chuẩn gốc của hệ thống.');
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : 'Không thể khôi phục';
          toast.error('Lỗi', msg);
        }
      }
    }
  };

  const handleCreateTestPaper = () => {
    createTestPaper(managed);
  };

  const tabs: { key: TabKey; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { key: 'general', label: '1. Nhận diện & Thương hiệu', icon: Sliders },
    { key: 'frontmatter', label: '2. Tóm tắt & Từ khóa', icon: FileText },
    { key: 'article-types', label: '3. Chuyên mục & Loại bài', icon: Layers },
    { key: 'layout', label: '4. Dàn trang & LaTeX', icon: Layout },
    { key: 'json', label: '5. Resolved JSON Preview', icon: Code2 },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20">
      {/* Top Header Card */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/templates"
            className="p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all cursor-pointer"
            title="Quay lại danh mục tạp chí"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className="px-2.5 py-0.5 rounded-xl text-xs font-black"
                style={{
                  backgroundColor: `${brandColor}18`,
                  color: brandColor,
                  border: `1px solid ${brandColor}40`,
                }}
              >
                {shortCode}
              </span>
              <h2 className="font-black text-base sm:text-lg text-slate-900 leading-tight">
                {nameVi}
              </h2>
            </div>
            <p className="text-xs text-slate-500 italic mt-0.5">
              {managed.profile.names?.en || 'Science & Technology Development Journal'}
            </p>
          </div>
        </div>

        {/* Right Action Controls: Status dropdown, Reset, Save, Create paper */}
        <div className="flex items-center gap-2 flex-wrap justify-end">
          <select
            value={managed.status}
            onChange={(e) => handleStatusChange(e.target.value as JournalStatus)}
            className="bg-slate-50 border border-slate-200/90 text-xs font-bold rounded-xl px-2.5 py-2 text-slate-800 outline-none"
          >
            <option value="published">Đang phát hành (published)</option>
            <option value="draft">Bản nháp (draft)</option>
            <option value="validated">Đã kiểm duyệt (validated)</option>
            <option value="archived">Lưu trữ (archived)</option>
          </select>

          {!isNew && (
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
              title="Khôi phục cấu hình mặc định ban đầu"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Khôi phục Base</span>
            </button>
          )}

          <button
            onClick={handleCreateTestPaper}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-xs"
            title="Khởi tạo một bài báo mẫu để kiểm tra thực tế"
          >
            <BookOpen className="w-3.5 h-3.5 text-[#78C841]" />
            <span className="hidden sm:inline">Tạo bài mẫu</span>
          </button>

          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#78C841] hover:bg-[#6cb43a] text-zinc-950 text-xs font-extrabold rounded-xl transition-all cursor-pointer shadow-xs hover:shadow-sm"
          >
            <Save className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>{isSaving ? 'Đang lưu...' : 'Lưu Thay Đổi'}</span>
          </button>
        </div>
      </div>

      {/* Tabs Navigation Bar */}
      <div className="flex items-center gap-1 bg-white/70 backdrop-blur-md p-1.5 rounded-2xl border border-slate-200/80 overflow-x-auto shadow-2xs">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Active Tab Panel */}
      <div className="pt-2">
        {activeTab === 'general' && (
          <JournalGeneralTab
            profile={managed.profile}
            onChange={handleUpdateProfile}
            isNew={isNew}
          />
        )}
        {activeTab === 'frontmatter' && (
          <JournalFrontMatterTab
            profile={managed.profile}
            onChange={handleUpdateProfile}
          />
        )}
        {activeTab === 'article-types' && (
          <JournalArticleTypesTab
            profile={managed.profile}
            onChange={handleUpdateProfile}
          />
        )}
        {activeTab === 'layout' && (
          <JournalLayoutTab
            profile={managed.profile}
            onChange={handleUpdateProfile}
          />
        )}
        {activeTab === 'json' && (
          <JournalJsonInspectorTab profile={managed.profile} />
        )}
      </div>
    </div>
  );
};
