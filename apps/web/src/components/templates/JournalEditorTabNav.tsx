'use client';

import React from 'react';
import { Sliders, FileText, Layers, Layout } from 'lucide-react';

export type JournalEditorTabKey = 'general' | 'frontmatter' | 'article-types' | 'layout';

interface JournalEditorTabNavProps {
  activeTab: JournalEditorTabKey;
  onTabChange: (tab: JournalEditorTabKey) => void;
  articleTypesCount?: number;
}

export const JournalEditorTabNav: React.FC<JournalEditorTabNavProps> = ({
  activeTab,
  onTabChange,
  articleTypesCount,
}) => {
  const tabs: {
    key: JournalEditorTabKey;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: React.ReactNode;
  }[] = [
    { key: 'general', label: '1. Nhận diện & Thương hiệu', icon: Sliders },
    { key: 'frontmatter', label: '2. Tóm tắt & Từ khóa', icon: FileText },
    {
      key: 'article-types',
      label: '3. Chuyên mục & Loại bài',
      icon: Layers,
      badge:
        typeof articleTypesCount === 'number' ? (
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-zinc-300 text-zinc-800 font-bold">
            {articleTypesCount}
          </span>
        ) : null,
    },
    { key: 'layout', label: '4. Dàn trang', icon: Layout },
  ];

  return (
    <div className="w-full select-none">
      <div
        className="flex items-center gap-1 overflow-x-auto p-1 bg-zinc-200/70 rounded-2xl w-full no-scrollbar"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => onTabChange(tab.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-white text-zinc-900 shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-900 hover:bg-white/50'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#78C841]' : 'text-zinc-500'}`} />
              <span>{tab.label}</span>
              {tab.badge}
            </button>
          );
        })}
      </div>
    </div>
  );
};
