// @vitest-environment happy-dom

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, fireEvent } from '@testing-library/react';
import { toast, sileo, toastStore } from '@/components/toast/toast-store';
import { Toaster } from '@/components/toast/Toaster';

describe('Liquid Glass Dynamic Island Toast System', () => {
  beforeEach(() => {
    toastStore.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('adds and clears toasts via toast.success and toast.clear', () => {
    act(() => {
      toast.success('Bản thảo đã lưu');
    });

    let toasts = toastStore.getToasts();
    expect(toasts.length).toBe(1);
    expect(toasts[0].title).toBe('Bản thảo đã lưu');
    expect(toasts[0].type).toBe('success');

    act(() => {
      toast.clear();
    });

    toasts = toastStore.getToasts();
    expect(toasts.length).toBe(0);
  });

  it('supports 4 distinct theme types: success, error, warning, info', () => {
    act(() => {
      toast.success('Thành công', 'Chi tiết thành công');
      toast.error('Lỗi hệ thống', 'Không thể kết nối');
      toast.warning('Cảnh báo', 'Dữ liệu chưa lưu');
      toast.info('Thông báo', 'Hệ thống cập nhật');
    });

    const toasts = toastStore.getToasts();
    // Latest toasts first, capped at 3
    expect(toasts.some((t) => t.type === 'info')).toBe(true);
    expect(toasts.some((t) => t.type === 'warning')).toBe(true);
    expect(toasts.some((t) => t.type === 'error')).toBe(true);
  });

  it('supports toast.promise resolving successfully', async () => {
    const mockPromise = Promise.resolve('Dữ liệu hoàn tất');

    let promiseResult: any;
    act(() => {
      promiseResult = toast.promise(mockPromise, {
        loading: 'Đang tải...',
        success: (d) => `Đã tải xong: ${d}`,
        error: 'Thất bại',
      });
    });

    // In loading state
    expect(toastStore.getToasts()[0].type).toBe('loading');
    expect(toastStore.getToasts()[0].title).toBe('Đang tải...');

    await act(async () => {
      await promiseResult;
    });

    // In success state, colon splits into title and description
    expect(toastStore.getToasts()[0].type).toBe('success');
    expect(toastStore.getToasts()[0].title).toBe('Đã tải xong');
    expect(toastStore.getToasts()[0].description).toBe('Dữ liệu hoàn tất');
  });

  it('supports toast.promise rejecting with error', async () => {
    const mockPromise = Promise.reject(new Error('Mất mạng'));

    let promiseResult: any;
    act(() => {
      promiseResult = toast.promise(mockPromise, {
        loading: 'Đang tải...',
        success: 'Thành công',
        error: (err) => `Lỗi: ${err.message}`,
      });
    });

    await act(async () => {
      try {
        await promiseResult;
      } catch {
        // Expected rejection
      }
    });

    // In error state
    expect(toastStore.getToasts()[0].type).toBe('error');
    expect(toastStore.getToasts()[0].title).toBe('Lỗi');
    expect(toastStore.getToasts()[0].description).toBe('Mất mạng');
  });

  it('maintains 100% backward compatibility with sileo.* methods', () => {
    act(() => {
      sileo.success({
        title: 'Sileo Thành công',
        description: 'Mô tả chi tiết',
      });
    });

    const toasts = toastStore.getToasts();
    expect(toasts.length).toBe(1);
    expect(toasts[0].title).toBe('Sileo Thành công');
    expect(toasts[0].description).toBe('Mô tả chi tiết');
    expect(toasts[0].type).toBe('success');
  });

  it('renders Toaster in DOM, displays dismiss button, and dismisses on click', () => {
    const { container } = render(<Toaster />);

    act(() => {
      toast.success('Thông báo kiểm thử', 'Mô tả chi tiết kiểm thử');
    });

    expect(screen.getByText('Thông báo kiểm thử')).toBeDefined();
    expect(screen.getByText('Mô tả chi tiết kiểm thử')).toBeDefined();

    // Verify rounded-b and rounded-t-none
    const toastEl = container.querySelector('[data-liquid-toast]');
    expect(toastEl).toBeDefined();
    expect(toastEl?.className).toContain('rounded-b-');
    expect(toastEl?.className).toContain('rounded-t-none');

    // Click dismiss button
    const dismissBtn = screen.getByTestId('toast-dismiss-button');
    act(() => {
      fireEvent.click(dismissBtn);
    });

    expect(toastStore.getToasts().length).toBe(0);
  });
});
