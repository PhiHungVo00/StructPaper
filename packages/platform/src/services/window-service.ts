export type MaximizedChangeListener = (maximized: boolean) => void;

export interface WindowService {
  /** Whether native desktop window controls are available in the current runtime. */
  isSupported(): boolean;
  /** Minimize the current application window. */
  minimize(): Promise<void>;
  /** Toggle between maximized and restored window bounds. */
  toggleMaximize(): Promise<void>;
  /** Request closing the current application window. */
  close(): Promise<void>;
  /** Begin a native OS window drag operation from a pointer-down gesture. */
  startDragging(): Promise<void>;
  /** Query whether the window is currently maximized. */
  isMaximized(): Promise<boolean>;
  /** Subscribe to maximize/restore transitions. Returns an unsubscribe callback. */
  onMaximizedChange(listener: MaximizedChangeListener): () => void;
}
