'use client';

export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'default' | 'loading';

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  duration?: number;
  action?: ToastAction;
  dismissible?: boolean;
  createdAt: number;
}

export interface ToastOptions {
  id?: string;
  title?: string;
  description?: string;
  duration?: number;
  action?: ToastAction;
  dismissible?: boolean;
  theme?: 'success' | 'error' | 'warning' | 'white' | 'default';
}

type ToastListener = (toasts: ToastItem[]) => void;

class ToastStore {
  private toasts: ToastItem[] = [];
  private listeners: Set<ToastListener> = new Set();
  private count = 0;

  public subscribe(listener: ToastListener): () => void {
    this.listeners.add(listener);
    listener(this.toasts);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach((listener) => listener([...this.toasts]));
  }

  public getToasts(): ToastItem[] {
    return [...this.toasts];
  }

  public addToast(item: Omit<ToastItem, 'id' | 'createdAt'> & { id?: string }): string {
    const id = item.id || `toast-${Date.now()}-${++this.count}`;
    const newToast: ToastItem = {
      ...item,
      id,
      dismissible: item.dismissible !== false,
      createdAt: Date.now(),
    };

    // Keep active toasts (can replace or keep latest 3, for top notch liquid glass 1-2 active is ideal)
    const existingIndex = this.toasts.findIndex((t) => t.id === id);
    if (existingIndex >= 0) {
      this.toasts[existingIndex] = newToast;
    } else {
      // Keep last 3 toasts max
      this.toasts = [newToast, ...this.toasts.slice(0, 2)];
    }

    this.notify();
    return id;
  }

  public updateToast(id: string, updates: Partial<ToastItem>) {
    const index = this.toasts.findIndex((t) => t.id === id);
    if (index >= 0) {
      this.toasts[index] = { ...this.toasts[index], ...updates };
      this.notify();
    }
  }

  public dismissToast(id?: string) {
    if (!id) {
      this.toasts = [];
    } else {
      this.toasts = this.toasts.filter((t) => t.id !== id);
    }
    this.notify();
  }

  public clear() {
    this.toasts = [];
    this.notify();
  }
}

export const toastStore = new ToastStore();

// Smart payload parser for backward compatibility
function parseArgs(
  titleOrMsg: string | ToastOptions,
  descriptionOrOpts?: string | ToastOptions,
  fallbackType: ToastType = 'default'
): { title: string; description?: string; options: ToastOptions } {
  if (typeof titleOrMsg === 'object') {
    return {
      title: titleOrMsg.title || '',
      description: titleOrMsg.description,
      options: titleOrMsg,
    };
  }

  if (typeof descriptionOrOpts === 'object') {
    return {
      title: titleOrMsg,
      description: descriptionOrOpts.description,
      options: descriptionOrOpts,
    };
  }

  let title = titleOrMsg;
  let description = descriptionOrOpts;

  // If no description provided and title contains a colon (e.g. "Đã lưu: Bài báo...")
  if (!description && title.includes(':')) {
    const idx = title.indexOf(':');
    const head = title.slice(0, idx).trim();
    const tail = title.slice(idx + 1).trim();
    if (head.length > 0 && head.length <= 30 && tail.length > 0) {
      title = head;
      description = tail;
    }
  }

  return {
    title,
    description,
    options: {},
  };
}

export const toast = {
  success: (title: string | ToastOptions, description?: string | ToastOptions, opts?: ToastOptions) => {
    const parsed = parseArgs(title, description, 'success');
    const options = { ...parsed.options, ...(opts || {}) };
    return toastStore.addToast({
      id: options.id,
      type: 'success',
      title: parsed.title,
      description: parsed.description,
      duration: options.duration ?? 3500,
      action: options.action,
      dismissible: options.dismissible,
    });
  },
  error: (title: string | ToastOptions, description?: string | ToastOptions, opts?: ToastOptions) => {
    const parsed = parseArgs(title, description, 'error');
    const options = { ...parsed.options, ...(opts || {}) };
    return toastStore.addToast({
      id: options.id,
      type: 'error',
      title: parsed.title,
      description: parsed.description,
      duration: options.duration ?? 4500,
      action: options.action,
      dismissible: options.dismissible,
    });
  },
  warning: (title: string | ToastOptions, description?: string | ToastOptions, opts?: ToastOptions) => {
    const parsed = parseArgs(title, description, 'warning');
    const options = { ...parsed.options, ...(opts || {}) };
    return toastStore.addToast({
      id: options.id,
      type: 'warning',
      title: parsed.title,
      description: parsed.description,
      duration: options.duration ?? 4000,
      action: options.action,
      dismissible: options.dismissible,
    });
  },
  info: (title: string | ToastOptions, description?: string | ToastOptions, opts?: ToastOptions) => {
    const parsed = parseArgs(title, description, 'info');
    const options = { ...parsed.options, ...(opts || {}) };
    return toastStore.addToast({
      id: options.id,
      type: 'info',
      title: parsed.title,
      description: parsed.description,
      duration: options.duration ?? 3500,
      action: options.action,
      dismissible: options.dismissible,
    });
  },
  default: (title: string | ToastOptions, description?: string | ToastOptions, opts?: ToastOptions) => {
    const parsed = parseArgs(title, description, 'default');
    const options = { ...parsed.options, ...(opts || {}) };
    return toastStore.addToast({
      id: options.id,
      type: 'default',
      title: parsed.title,
      description: parsed.description,
      duration: options.duration ?? 3500,
      action: options.action,
      dismissible: options.dismissible,
    });
  },
  loading: (title: string | ToastOptions, description?: string | ToastOptions, opts?: ToastOptions) => {
    const parsed = parseArgs(title, description, 'loading');
    const options = { ...parsed.options, ...(opts || {}) };
    return toastStore.addToast({
      id: options.id,
      type: 'loading',
      title: parsed.title,
      description: parsed.description,
      duration: options.duration ?? Infinity,
      action: options.action,
      dismissible: options.dismissible,
    });
  },
  promise: <T>(
    promise: Promise<T> | (() => Promise<T>),
    messages: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((err: any) => string);
    },
    opts?: ToastOptions
  ): Promise<T> => {
    const id = opts?.id || `promise-${Date.now()}`;
    toastStore.addToast({
      id,
      type: 'loading',
      title: messages.loading,
      duration: Infinity,
      dismissible: opts?.dismissible ?? false,
    });

    const targetPromise = typeof promise === 'function' ? promise() : promise;

    return targetPromise
      .then((data) => {
        const successTitle =
          typeof messages.success === 'function'
            ? messages.success(data)
            : messages.success;
        const parsed = parseArgs(successTitle, opts?.description, 'success');
        toastStore.updateToast(id, {
          type: 'success',
          title: parsed.title,
          description: parsed.description,
          duration: opts?.duration ?? 3500,
          dismissible: true,
        });
        return data;
      })
      .catch((err) => {
        const errorTitle =
          typeof messages.error === 'function'
            ? messages.error(err)
            : messages.error;
        const parsed = parseArgs(errorTitle, opts?.description, 'error');
        toastStore.updateToast(id, {
          type: 'error',
          title: parsed.title,
          description: parsed.description,
          duration: opts?.duration ?? 4500,
          dismissible: true,
        });
        throw err;
      });
  },
  dismiss: (id?: string) => toastStore.dismissToast(id),
  clear: () => toastStore.clear(),
};

// Sileo drop-in replacement API for 100% backward compatibility
export const sileo = {
  success: (opts: any) => {
    if (typeof opts === 'string') return toast.success(opts);
    return toast.success(opts.title || '', opts.description, opts);
  },
  error: (opts: any) => {
    if (typeof opts === 'string') return toast.error(opts);
    return toast.error(opts.title || '', opts.description, opts);
  },
  warning: (opts: any) => {
    if (typeof opts === 'string') return toast.warning(opts);
    return toast.warning(opts.title || '', opts.description, opts);
  },
  info: (opts: any) => {
    if (typeof opts === 'string') return toast.info(opts);
    return toast.info(opts.title || '', opts.description, opts);
  },
  promise: <T>(promise: Promise<T> | (() => Promise<T>), messages: any, opts?: any) => {
    return toast.promise(promise, messages, opts);
  },
  dismiss: (id?: string) => toast.dismiss(id),
  clear: () => toast.clear(),
};
