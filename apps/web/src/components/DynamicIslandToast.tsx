'use client';

import { useEffect } from 'react';
import { sileo as originalSileo, Toaster as OriginalToaster } from 'sileo';

function parseToastPayload(
  titleOrMsg: string,
  description?: string,
  fallbackTitle = 'Thành công'
) {
  if (description) {
    return {
      title: titleOrMsg.length > 25 ? titleOrMsg.slice(0, 24) + '…' : titleOrMsg,
      description,
    };
  }

  // If there's a colon like "Đã nạp mẫu: VNUHCM Health Sciences (Chuẩn ID630)"
  if (titleOrMsg.includes(':')) {
    const colonIndex = titleOrMsg.indexOf(':');
    const head = titleOrMsg.slice(0, colonIndex).trim();
    const tail = titleOrMsg.slice(colonIndex + 1).trim();
    if (head.length > 0 && head.length <= 25 && tail.length > 0) {
      return { title: head, description: tail };
    }
  }

  // If string has quotes or is longer than 22 characters, use compact title & put details in description
  if (titleOrMsg.length > 22) {
    return { title: fallbackTitle, description: titleOrMsg };
  }

  return { title: titleOrMsg, description: '' };
}

export const toast = {
  success: (title: string, description?: string) => {
    const parsed = parseToastPayload(title, description, 'Thành công');
    return originalSileo.success(parsed);
  },
  error: (title: string, description?: string) => {
    const parsed = parseToastPayload(title, description, 'Lỗi');
    return originalSileo.error(parsed);
  },
  info: (title: string, description?: string) => {
    const parsed = parseToastPayload(title, description, 'Thông báo');
    return originalSileo.info(parsed);
  },
  warning: (title: string, description?: string) => {
    const parsed = parseToastPayload(title, description, 'Cảnh báo');
    return originalSileo.warning(parsed);
  },
};

export const sileo = {
  ...originalSileo,
  success: (opts: any) => {
    if (typeof opts === 'string') return toast.success(opts);
    if (opts && !opts.description && opts.title) {
      const parsed = parseToastPayload(opts.title, undefined, 'Thành công');
      return originalSileo.success({ ...opts, ...parsed });
    }
    return originalSileo.success(opts);
  },
  error: (opts: any) => {
    if (typeof opts === 'string') return toast.error(opts);
    if (opts && !opts.description && opts.title) {
      const parsed = parseToastPayload(opts.title, undefined, 'Lỗi');
      return originalSileo.error({ ...opts, ...parsed });
    }
    return originalSileo.error(opts);
  },
  info: (opts: any) => {
    if (typeof opts === 'string') return toast.info(opts);
    if (opts && !opts.description && opts.title) {
      const parsed = parseToastPayload(opts.title, undefined, 'Thông báo');
      return originalSileo.info({ ...opts, ...parsed });
    }
    return originalSileo.info(opts);
  },
  warning: (opts: any) => {
    if (typeof opts === 'string') return toast.warning(opts);
    if (opts && !opts.description && opts.title) {
      const parsed = parseToastPayload(opts.title, undefined, 'Cảnh báo');
      return originalSileo.warning({ ...opts, ...parsed });
    }
    return originalSileo.warning(opts);
  },
};

export function Toaster() {
  useEffect(() => {
    const handleDismissClick = (e: MouseEvent) => {
      if (typeof window !== 'undefined' && window.innerWidth < 768) return;
      const target = e.target as HTMLElement;
      const toast = target.closest('[data-sileo-toast]') as HTMLElement;
      if (toast && !toast.classList.contains('is-dismissing')) {
        if (target.closest('[data-sileo-button]')) return;
        if (e.type === 'contextmenu') e.preventDefault();
        toast.classList.add('is-dismissing');
        setTimeout(() => originalSileo.clear(), 300);
      }
    };
    document.addEventListener('click', handleDismissClick, true);
    document.addEventListener('contextmenu', handleDismissClick, true);
    return () => {
      document.removeEventListener('click', handleDismissClick, true);
      document.removeEventListener('contextmenu', handleDismissClick, true);
    };
  }, []);

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
        :root {
          --sileo-duration: 700ms !important;
          --sileo-spring-easing: linear(
            0,
            0.016 1.4%,
            0.063 2.8%,
            0.138 4.3%,
            0.239 5.9%,
            0.36 7.7%,
            0.495 9.5%,
            0.64 11.6%,
            0.778 13.8%,
            0.9 16.2%,
            0.998 19%,
            1.066 22%,
            1.107 25.3%,
            1.121 29.1%,
            1.111 33.3%,
            1.082 38.2%,
            1.043 44.1%,
            1.009 51.5%,
            0.99 61.2%,
            0.993 74.9%,
            1
          ) !important;
          --sileo-width: 360px !important;
        }

        [data-sileo-viewport] {
          z-index: 99999 !important;
          left: 50% !important;
          transform: translateX(-50%) !important;
          width: var(--sileo-width) !important;
          display: flex !important;
          justify-content: center !important;
        }

        /* 
           Gán màu từ theme vào các biến nội bộ của Sileo 
           để các thông báo mặc định tự động đồng bộ theo bảng màu Eatzy
        */
        [data-sileo-toast][data-sileo-type="success"] [data-sileo-title] {
          color: var(--primary, #78C841) !important;
        }
        [data-sileo-toast][data-sileo-type="success"] [data-sileo-badge] {
          color: var(--primary, #78C841) !important;
        }

        [data-sileo-toast][data-sileo-type="error"] [data-sileo-title] {
          color: var(--danger, #FB4141) !important;
        }
        [data-sileo-toast][data-sileo-type="error"] [data-sileo-badge] {
          color: var(--danger, #FB4141) !important;
        }

        [data-sileo-toast][data-sileo-type="warning"] [data-sileo-title] {
          color: var(--warning, #FF9B2F) !important;
        }
        [data-sileo-toast][data-sileo-type="warning"] [data-sileo-badge] {
          color: var(--warning, #FF9B2F) !important;
        }

        [data-sileo-title] {
          font-weight: 700 !important;
          font-size: 0.875rem !important;
          letter-spacing: -0.01em !important;
          max-width: 250px !important;
          overflow: hidden !important;
          text-overflow: ellipsis !important;
          white-space: nowrap !important;
        }

        [data-sileo-header-inner] {
          max-width: 290px !important;
        }

        [data-sileo-description] {
          font-weight: 500 !important;
          font-size: 0.875rem !important;
          line-height: 1.4 !important;
          padding: 10px 16px 14px 16px !important;
        }

        [data-sileo-badge] svg {
          stroke-width: 2.8 !important;
        }

        @media (min-width: 768px) {
          [data-sileo-toast] {
            cursor: pointer !important;
            transition: transform 0.3s var(--sileo-spring-easing), opacity 0.3s ease, filter 0.3s ease !important;
          }
          [data-sileo-toast]:hover {
            transform: scale(1.02) !important;
            filter: brightness(1.05);
          }
          [data-sileo-toast].is-dismissing {
            pointer-events: none !important;
            opacity: 0 !important;
            transform: scale(0.9) translateY(-10px) !important; 
            filter: blur(4px) !important;
            transition: all 0.3s cubic-bezier(0.5, 0, 0.2, 1) !important;
          }
        }
      `,
        }}
      />
      <OriginalToaster position="top-center" theme="light" />
    </>
  );
}
