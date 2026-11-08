/**
 * VirtualFS - In-memory virtual filesystem for WebAssembly LaTeX compilation.
 * Manages staging of LaTeX sources, asset images, bibliography, and styles
 * with deterministic zero-leak memory cleanup.
 */

export interface StageOptions {
  /** Main LaTeX source code */
  tex: string;

  /** File name of the main tex file, defaults to 'main.tex' */
  mainTexPath?: string;

  /** Base64-encoded image map: { "figures/chart.png": "data..." } */
  images?: Record<string, string>;

  /** Optional style or package files map */
  styles?: Record<string, string | Uint8Array>;

  /** Optional explicit files list */
  files?: Array<{ path: string; content: string | Uint8Array }>;
}

export class VirtualFS {
  private files: Map<string, Uint8Array> = new Map();
  private totalBytes = 0;

  /**
   * Normalizes file path: converts backslashes to forward slashes,
   * removes redundant slashes and strips leading './' or '/'.
   */
  public normalizePath(filePath: string): string {
    if (!filePath) return '';
    let normalized = filePath.replace(/\\/g, '/');
    normalized = normalized.replace(/^\.?\/+/, '');
    normalized = normalized.replace(/\/+/g, '/');
    return normalized;
  }

  /**
   * Writes content (string or Uint8Array) into the virtual filesystem.
   */
  public writeFile(filePath: string, content: string | Uint8Array): void {
    const key = this.normalizePath(filePath);
    if (!key) return;

    let buffer: Uint8Array;
    if (typeof content === 'string') {
      buffer = new TextEncoder().encode(content);
    } else {
      buffer = content;
    }

    if (this.files.has(key)) {
      const existing = this.files.get(key)!;
      this.totalBytes -= existing.byteLength;
    }

    this.files.set(key, buffer);
    this.totalBytes += buffer.byteLength;
  }

  /**
   * Reads raw bytes of a file from the virtual filesystem.
   */
  public readFile(filePath: string): Uint8Array | null {
    const key = this.normalizePath(filePath);
    return this.files.get(key) ?? null;
  }

  /**
   * Reads a file decoded as UTF-8 string.
   */
  public readTextFile(filePath: string): string | null {
    const buf = this.readFile(filePath);
    if (!buf) return null;
    return new TextDecoder().decode(buf);
  }

  /**
   * Checks whether a file exists in the virtual filesystem.
   */
  public exists(filePath: string): boolean {
    const key = this.normalizePath(filePath);
    return this.files.has(key);
  }

  /**
   * Deletes a file from the virtual filesystem.
   */
  public deleteFile(filePath: string): boolean {
    const key = this.normalizePath(filePath);
    const existing = this.files.get(key);
    if (!existing) return false;

    this.totalBytes -= existing.byteLength;
    this.files.delete(key);
    return true;
  }

  /**
   * Returns a sorted list of all file paths stored in the virtual filesystem.
   */
  public listFiles(): string[] {
    return Array.from(this.files.keys()).sort();
  }

  /**
   * Returns current total size of all stored files in bytes.
   */
  public getTotalSizeBytes(): number {
    return this.totalBytes;
  }

  /**
   * Stages LaTeX compilation source, base64 assets, and auxiliary files.
   */
  public stage(options: StageOptions): void {
    const mainPath = options.mainTexPath || 'main.tex';
    this.writeFile(mainPath, options.tex);

    if (options.images) {
      for (const [rawImgPath, base64Content] of Object.entries(options.images)) {
        if (!base64Content) continue;
        const binary = this.decodeBase64(base64Content);
        this.writeFile(rawImgPath, binary);
      }
    }

    if (options.styles) {
      for (const [stylePath, content] of Object.entries(options.styles)) {
        this.writeFile(stylePath, content);
      }
    }

    if (options.files) {
      for (const file of options.files) {
        this.writeFile(file.path, file.content);
      }
    }
  }

  /**
   * Retrieves generated PDF output (defaults to 'main.pdf').
   */
  public getOutputPdf(pdfName = 'main.pdf'): Uint8Array | null {
    return this.readFile(pdfName);
  }

  /**
   * Exports all current files as an object map.
   */
  public exportFiles(): Record<string, Uint8Array> {
    const result: Record<string, Uint8Array> = {};
    for (const [k, v] of this.files.entries()) {
      result[k] = v;
    }
    return result;
  }

  /**
   * Wipes all files and zeroes memory to prevent memory leaks in Web Workers.
   */
  public clear(): void {
    this.files.clear();
    this.totalBytes = 0;
  }

  /**
   * Helper to decode Base64 strings across Browser, Web Worker, and Node environments.
   */
  private decodeBase64(base64: string): Uint8Array {
    // Strip optional data URI prefix if present (e.g. data:image/png;base64,...)
    const cleanBase64 = base64.replace(/^data:.*?;base64,/, '').trim();

    if (typeof Buffer !== 'undefined') {
      return new Uint8Array(Buffer.from(cleanBase64, 'base64'));
    }

    if (typeof atob === 'function') {
      const binaryString = atob(cleanBase64);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      return bytes;
    }

    throw new Error('No base64 decoder available in the current runtime environment');
  }
}
