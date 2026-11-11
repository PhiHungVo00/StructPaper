import type { MaximizedChangeListener, WindowService } from '@structpaper/platform';

export class WebWindowService implements WindowService {
  isSupported(): boolean {
    return false;
  }

  async minimize(): Promise<void> {}

  async toggleMaximize(): Promise<void> {}

  async close(): Promise<void> {}

  async startDragging(): Promise<void> {}

  async isMaximized(): Promise<boolean> {
    return false;
  }

  onMaximizedChange(_listener: MaximizedChangeListener): () => void {
    return () => {};
  }
}
