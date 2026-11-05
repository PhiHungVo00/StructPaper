// @vitest-environment happy-dom
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';

// Mock next/navigation
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/templates',
  useParams: () => ({ id: 'hs' }),
}));

// Mock DynamicIslandToast
vi.mock('@/components/DynamicIslandToast', () => ({
  toast: {
    success: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
  },
}));

import { JournalHubView } from '@/components/templates/JournalHubView';
import { JournalProfileCard } from '@/components/templates/JournalProfileCard';
import { JournalFiltersBar } from '@/components/templates/JournalFiltersBar';
import { JournalProfilesList } from '@/components/templates/JournalProfilesList';
import { JournalDetailEditor } from '@/components/templates/JournalDetailEditor';
import { Sidebar } from '@/components/Sidebar';
import {
  getManagedJournals,
  getManagedJournalById,
  getDefaultVnuhcmJournals,
} from '@/lib/templates/journal-storage';

describe('Task 5: Journal Profile & Template Management UI', () => {
  beforeEach(() => {
    mockPush.mockClear();
    localStorage.clear();
  });

  afterEach(() => {
    cleanup();
  });

  describe('1. Sidebar Navigation with Templates Tab', () => {
    it('renders the 5 main flow items including /templates and /papers', () => {
      render(<Sidebar />);

      // Verify the new Templates tab
      expect(screen.getAllByText('Quản lý Mẫu & Tạp chí').length).toBeGreaterThan(0);
      expect(screen.getAllByText('7 Tạp chí ĐHQG & Quy định').length).toBeGreaterThan(0);

      // Verify papers tab
      expect(screen.getAllByText('Quản lý Bài báo').length).toBeGreaterThan(0);

      // Verify upload tab
      expect(screen.getAllByText('Tải file DOCX').length).toBeGreaterThan(0);
    });
  });

  describe('2. JournalHubView & 7 VNUHCM Journals Rendering', () => {
    it('renders all 7 VNUHCM journals with bilingual titles, brand badges and specifications', () => {
      render(<JournalHubView />);

      // Verify top heading & subtitle
      expect(screen.getByText('Quản Lý Mẫu & Tạp Chí Khoa Học')).toBeDefined();
      expect(screen.getByText('7 Tạp chí ĐHQG-HCM')).toBeDefined();

      // Check for the 7 short codes
      expect(screen.getByText('VNUHCM-STD')).toBeDefined();
      expect(screen.getByText('VNUHCM-HS')).toBeDefined();
      expect(screen.getByText('VNUHCM-SSH')).toBeDefined();
      expect(screen.getByText('VNUHCM-EBL')).toBeDefined();
      expect(screen.getByText('VNUHCM-ET')).toBeDefined();
      expect(screen.getByText('VNUHCM-EES')).toBeDefined();
      expect(screen.getByText('VNUHCM-ARNS')).toBeDefined();

      // Check for specific Vietnamese names
      expect(
        screen.getByText('Tạp chí Phát triển KH&CN - Khoa học Sức khỏe')
      ).toBeDefined();
      expect(
        screen.getByText('Tạp chí Phát triển KH&CN - Môi trường & Khoa học Trái đất')
      ).toBeDefined();

      // Check summary specs are present
      expect(screen.getAllByText(/Loại bài báo/).length).toBeGreaterThanOrEqual(7);
      expect(screen.getAllByText(/Tóm tắt:/).length).toBe(7);
      expect(screen.getAllByText(/Trích dẫn:/).length).toBe(7);
      expect(screen.getAllByText(/Bố cục:/).length).toBe(7);
    });

    it('filters journals by search query matching short code or name', () => {
      render(<JournalHubView />);

      const searchInput = screen.getByRole('searchbox');
      fireEvent.change(searchInput, { target: { value: 'Sức khỏe' } });

      // Should only show HS
      expect(screen.getByText('VNUHCM-HS')).toBeDefined();
      expect(screen.queryByText('VNUHCM-STD')).toBeNull();
      expect(screen.queryByText('VNUHCM-SSH')).toBeNull();

      // Clear search
      fireEvent.change(searchInput, { target: { value: '' } });
      expect(screen.getByText('VNUHCM-STD')).toBeDefined();
      expect(screen.getByText('VNUHCM-HS')).toBeDefined();
    });

    it('filters journals by status (published vs draft)', () => {
      render(<JournalHubView />);

      // Click "Bản nháp" filter
      const draftButton = screen.getByRole('button', { name: 'Bản nháp' });
      fireEvent.click(draftButton);

      // ARNS is draft by default
      expect(screen.getByText('VNUHCM-ARNS')).toBeDefined();
      expect(screen.queryByText('VNUHCM-HS')).toBeNull();

      // Click "Đang phát hành" filter
      const publishedButton = screen.getByRole('button', { name: 'Đang phát hành' });
      fireEvent.click(publishedButton);

      expect(screen.getByText('VNUHCM-HS')).toBeDefined();
      expect(screen.getByText('VNUHCM-STD')).toBeDefined();
      expect(screen.queryByText('VNUHCM-ARNS')).toBeNull();
    });

    it('creates a new paper when clicking "Tạo bài báo từ mẫu" and redirects to editor', () => {
      render(<JournalHubView />);

      const createButtons = screen.getAllByRole('button', { name: /Tạo bài báo từ mẫu/i });
      expect(createButtons.length).toBe(7);

      // Click create on first journal
      fireEvent.click(createButtons[0]);

      expect(mockPush).toHaveBeenCalledWith('/editor');
    });
  });

  describe('3. JournalDetailEditor Component (Subpage)', () => {
    const sampleManaged = getDefaultVnuhcmJournals().find((j) => j.id === 'hs')!;

    it('renders header, brand color, status and tab navigation', () => {
      render(<JournalDetailEditor initialManaged={sampleManaged} isNew={false} />);

      expect(
        screen.getByText('Tạp chí Phát triển KH&CN - Khoa học Sức khỏe')
      ).toBeDefined();
      expect(screen.getByText('VNUHCM-HS')).toBeDefined();

      // Verify all 5 tab buttons exist
      expect(screen.getByText('1. Nhận diện & Thương hiệu')).toBeDefined();
      expect(screen.getByText('2. Tóm tắt & Từ khóa')).toBeDefined();
      expect(screen.getByText('3. Chuyên mục & Loại bài')).toBeDefined();
      expect(screen.getByText('4. Dàn trang & LaTeX')).toBeDefined();
      expect(screen.getByText('5. Resolved JSON Preview')).toBeDefined();
    });

    it('switches tabs and renders respective settings panels', () => {
      render(<JournalDetailEditor initialManaged={sampleManaged} isNew={false} />);

      // Switch to FrontMatter tab
      fireEvent.click(screen.getByText('2. Tóm tắt & Từ khóa'));
      expect(screen.getByText('Quy định Phần Tóm Tắt (Abstract Guidelines)')).toBeDefined();
      expect(screen.getByText('Quy định Từ Khóa (Keywords Guidelines)')).toBeDefined();

      // Switch to Article Types tab
      fireEvent.click(screen.getByText('3. Chuyên mục & Loại bài'));
      expect(screen.getByText('8 Chuyên Mục & Loại Bài Báo Học Thuật')).toBeDefined();
      expect(screen.getAllByText('Bài báo nghiên cứu').length).toBeGreaterThan(0);

      // Switch to Layout tab
      fireEvent.click(screen.getByText('4. Dàn trang & LaTeX'));
      expect(screen.getByText('Dàn Trang & Bố Cục Bản In (Page & Column Grid)')).toBeDefined();
      expect(screen.getByText('Cấu hình Trình Biên Dịch LaTeX & Typst')).toBeDefined();

      // Switch to JSON inspector tab
      fireEvent.click(screen.getByText('5. Resolved JSON Preview'));
      expect(
        screen.getByText('Resolved JSON Profile (3-Tier Merged Result)')
      ).toBeDefined();
      expect(screen.getByText('Sao chép')).toBeDefined();
      expect(screen.getByText('Tải JSON')).toBeDefined();
    });

    it('saves changes to localStorage on "Lưu Thay Đổi"', () => {
      render(<JournalDetailEditor initialManaged={sampleManaged} isNew={false} />);

      // Modify short code input
      const shortInput = screen.getByPlaceholderText(/VNUHCM-HS/);
      fireEvent.change(shortInput, { target: { value: 'STDJ-HEALTH' } });

      // Click save
      const saveBtn = screen.getByRole('button', { name: /Lưu Thay Đổi/i });
      fireEvent.click(saveBtn);

      const stored = getManagedJournalById('hs');
      expect(stored?.profile.names?.short).toBe('STDJ-HEALTH');
    });
  });
});
