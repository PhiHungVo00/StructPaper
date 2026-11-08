import type { ShellService } from '@structpaper/platform';

export interface WebShellServiceOptions {
  openFn?: (url: string, target?: string, features?: string) => Window | null;
}

export class WebShellService implements ShellService {
  private readonly openFn?: (url: string, target?: string, features?: string) => Window | null;

  constructor(options?: WebShellServiceOptions) {
    this.openFn = options?.openFn;
  }

  async openExternal(url: string): Promise<void> {
    if (this.openFn) {
      this.openFn(url, '_blank', 'noopener,noreferrer');
      return;
    }
    if (typeof window !== 'undefined' && typeof window.open === 'function') {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  }
}
