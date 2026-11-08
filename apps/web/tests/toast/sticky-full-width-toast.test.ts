// @vitest-environment happy-dom

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, fireEvent, cleanup } from '@testing-library/react';
import { toast, toastStore } from '@/components/toast/toast-store';
import { Toaster } from '@/components/toast/Toaster';

describe('Sticky Full-Width Toast System', () => {
  beforeEach(() => {
    toastStore.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    cleanup();
    toastStore.clear();
    vi.useRealTimers();
  });

  it('adds a sticky full-width toast with toast.sticky', () => {
    act(() => {
      toast.sticky('Hệ thống bảo trì', 'Hệ thống sẽ bảo trì từ 23:00 đến 01:00');
    });

    const toasts = toastStore.getToasts();
    expect(toasts.length).toBe(1);
    const stickyToast = toasts[0];
    expect(stickyToast.title).toBe('Hệ thống bảo trì');
    expect(stickyToast.description).toBe('Hệ thống sẽ bảo trì từ 23:00 đến 01:00');
    expect(stickyToast.duration).toBe(Infinity);
    expect(stickyToast.sticky).toBe(true);
    expect(stickyToast.variant).toBe('full-width-sticky');
  });

  it('does NOT auto-dismiss over time (duration: Infinity)', () => {
    act(() => {
      toast.sticky('Cập nhật quy định nộp bài', 'Áp dụng cho kỳ báo mùa xuân');
    });

    expect(toastStore.getToasts().length).toBe(1);

    act(() => {
      vi.advanceTimersByTime(60000);
    });

    expect(toastStore.getToasts().length).toBe(1);
    expect(toastStore.getToasts()[0].title).toBe('Cập nhật quy định nộp bài');
  });

  it('does NOT get evicted or dismissed when new normal toasts arrive (even reaching max 3)', () => {
    let stickyId: string = '';
    act(() => {
      stickyId = toast.sticky('Thông báo khẩn', 'Server sắp khởi động lại');
    });

    expect(toastStore.getToasts().length).toBe(1);

    // Add 4 normal toasts (normal max cap is 3)
    act(() => {
      toast.success('Bản thảo đã lưu 1');
      toast.error('Lỗi cú pháp 2');
      toast.info('Tải hoàn tất 3');
      toast.warning('Cảnh báo bộ nhớ 4');
    });

    const currentToasts = toastStore.getToasts();
    // Sticky toast MUST still exist
    const foundSticky = currentToasts.find((t) => t.id === stickyId);
    expect(foundSticky).toBeDefined();
    expect(foundSticky?.sticky).toBe(true);

    // Normal toasts should be capped at 3
    const normalToasts = currentToasts.filter((t) => !t.sticky);
    expect(normalToasts.length).toBe(3);
    // Total toasts: 1 sticky + 3 normal = 4
    expect(currentToasts.length).toBe(4);
  });

  it('can be dismissed explicitly with toast.dismiss(id)', () => {
    let stickyId: string = '';
    act(() => {
      stickyId = toast.sticky('Chính sách mới', 'Xem hướng dẫn chi tiết');
    });

    expect(toastStore.getToasts().length).toBe(1);

    act(() => {
      toast.dismiss(stickyId);
    });

    expect(toastStore.getToasts().length).toBe(0);
  });

  it('supports sticky toast options like type, action, and dismissible', () => {
    const handleAction = vi.fn();
    act(() => {
      toast.sticky('Thông báo bản quyền', 'Vui lòng xác nhận thỏa thuận tác giả', {
        type: 'warning',
        action: {
          label: 'Xác nhận ngay',
          onClick: handleAction,
        },
      });
    });

    const t = toastStore.getToasts()[0];
    expect(t.type).toBe('warning');
    expect(t.action?.label).toBe('Xác nhận ngay');
    expect(t.sticky).toBe(true);
    expect(t.variant).toBe('full-width-sticky');
  });

  it('renders sticky full-width banner in Toaster with liquid glass styling and dismiss button', () => {
    render(React.createElement(Toaster));

    let stickyId: string = '';
    act(() => {
      stickyId = toast.sticky('Cảnh báo server', 'Kết nối cơ sở dữ liệu gián đoạn');
    });

    const stickyBanner = screen.getByRole('alert');
    expect(stickyBanner).toBeDefined();
    expect(screen.getByText('Cảnh báo server')).toBeDefined();
    expect(screen.getByText('Kết nối cơ sở dữ liệu gián đoạn')).toBeDefined();

    // Check banner has full-width and liquid glass classes
    expect(stickyBanner.className).toContain('w-full');
    expect(stickyBanner.className).toContain('backdrop-blur-md');

    // Click dismiss button
    const dismissBtn = screen.getByTestId('sticky-toast-dismiss-button');
    act(() => {
      fireEvent.click(dismissBtn);
    });

    expect(toastStore.getToasts().length).toBe(0);
  });

  it('triggers action button click on sticky toast and dismisses toast', () => {
    render(React.createElement(Toaster));
    const onAction = vi.fn();

    act(() => {
      toast.sticky('Thông báo nâng cấp', 'Bản cập nhật v2.4 đã sẵn sàng', {
        action: {
          label: 'Cập nhật',
          onClick: onAction,
        },
      });
    });

    const actionBtn = screen.getByText('Cập nhật');
    act(() => {
      fireEvent.click(actionBtn);
    });

    expect(onAction).toHaveBeenCalledTimes(1);
    expect(toastStore.getToasts().length).toBe(0);
  });
});
