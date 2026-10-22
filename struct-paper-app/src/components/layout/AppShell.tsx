'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from '@/components/Sidebar';
import { BottomNav } from '@/components/BottomNav';

interface AppShellProps {
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const pathname = usePathname();

  // The editor, authoring editor, and template builder are secondary/focused steps, so the main sidebar is hidden
  const isEditorPage =
    pathname === '/editor' ||
    pathname.startsWith('/editor/') ||
    pathname === '/papers/editor' ||
    pathname.startsWith('/papers/editor/');
  const isBuilderPage = pathname === '/templates/builder' || pathname.startsWith('/templates/builder/');

  if (isEditorPage || isBuilderPage) {
    return (
      <div className="h-screen w-full bg-[#F8F9FA] overflow-hidden p-2 sm:p-0 flex flex-col">
        {children}
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col sm:flex-row bg-[#F8F9FA]">
      {/* Persistent Main Flow Sidebar */}
      <Sidebar />

      {/* Main Application Flow Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        <main className="flex-1 px-3 sm:px-4 lg:px-6 py-3 pb-24 sm:pb-6 flex flex-col min-w-0 min-h-0">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar (Main Flow Only) */}
      <BottomNav />
    </div>
  );
};
