import type { FileService } from '@structpaper/platform';

export interface DesktopFileServiceOptions {
  saveDialogFn?: (options?: any) => Promise<string | null>;
  writeFileFn?: (path: string, data: Uint8Array | string) => Promise<void>;
  openDialogFn?: (options?: any) => Promise<string | string[] | null>;
  readFileFn?: (path: string) => Promise<Uint8Array>;
}

async function tryImport<T = any>(moduleName: string): Promise<T | null> {
  try {
    const mod = await import(/* @vite-ignore */ `${moduleName}`);
    return mod as T;
  } catch {
    return null;
  }
}

export class DesktopFileService implements FileService {
  private readonly saveDialogFn?: (options?: any) => Promise<string | null>;
  private readonly writeFileFn?: (path: string, data: Uint8Array | string) => Promise<void>;
  private readonly openDialogFn?: (options?: any) => Promise<string | string[] | null>;
  private readonly readFileFn?: (path: string) => Promise<Uint8Array>;

  constructor(options?: DesktopFileServiceOptions) {
    this.saveDialogFn = options?.saveDialogFn;
    this.writeFileFn = options?.writeFileFn;
    this.openDialogFn = options?.openDialogFn;
    this.readFileFn = options?.readFileFn;
  }

  async saveFile(name: string, content: Blob | string): Promise<void> {
    try {
      let saveDialog = this.saveDialogFn;
      let writeFile = this.writeFileFn;

      if (!saveDialog) {
        const dialogMod = await tryImport('@tauri-apps/plugin-dialog');
        if (dialogMod && typeof dialogMod.save === 'function') {
          saveDialog = dialogMod.save;
        }
      }

      if (!writeFile) {
        const fsMod = await tryImport('@tauri-apps/plugin-fs');
        if (fsMod && typeof fsMod.writeFile === 'function') {
          writeFile = fsMod.writeFile;
        }
      }

      if (saveDialog && writeFile) {
        const filePath = await saveDialog({ defaultPath: name });
        if (filePath) {
          if (typeof content === 'string') {
            await writeFile(filePath, content);
          } else {
            const buffer = await content.arrayBuffer();
            await writeFile(filePath, new Uint8Array(buffer));
          }
          return;
        }
        return;
      }
    } catch {
      // Safe fallback to DOM if available
    }

    if (typeof document !== 'undefined') {
      const blob =
        typeof content === 'string'
          ? new Blob([content], { type: 'text/plain;charset=utf-8' })
          : content;

      const createUrl =
        typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function'
          ? URL.createObjectURL.bind(URL)
          : () => '';
      const revokeUrl =
        typeof URL !== 'undefined' && typeof URL.revokeObjectURL === 'function'
          ? URL.revokeObjectURL.bind(URL)
          : () => {};

      const url = createUrl(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = name;
      anchor.style.display = 'none';

      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);

      setTimeout(() => {
        try {
          revokeUrl(url);
        } catch {
          // no-op
        }
      }, 100);
    }
  }

  async openFile(accept?: string): Promise<{ name: string; content: ArrayBuffer } | null> {
    try {
      let openDialog = this.openDialogFn;
      let readFile = this.readFileFn;

      if (!openDialog) {
        const dialogMod = await tryImport('@tauri-apps/plugin-dialog');
        if (dialogMod && typeof dialogMod.open === 'function') {
          openDialog = dialogMod.open;
        }
      }

      if (!readFile) {
        const fsMod = await tryImport('@tauri-apps/plugin-fs');
        if (fsMod && typeof fsMod.readFile === 'function') {
          readFile = fsMod.readFile;
        }
      }

      if (openDialog && readFile) {
        const filters = accept
          ? [
              {
                name: 'Allowed files',
                extensions: accept.split(',').map((s) => s.trim().replace(/^\./, '')),
              },
            ]
          : undefined;

        const selected = await openDialog({
          multiple: false,
          directory: false,
          filters,
        });

        if (!selected) {
          return null;
        }

        const filePath = Array.isArray(selected) ? selected[0] : selected;
        if (!filePath) {
          return null;
        }

        const data = await readFile(filePath);
        const fileName = filePath.replace(/\\/g, '/').split('/').pop() || 'file';
        const rawBuffer = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
        const buffer = rawBuffer instanceof ArrayBuffer ? rawBuffer : new Uint8Array(data).buffer;

        return {
          name: fileName,
          content: buffer as ArrayBuffer,
        };
      }
    } catch {
      // Safe fallback to DOM
    }

    if (typeof document === 'undefined') {
      return null;
    }

    return new Promise<{ name: string; content: ArrayBuffer } | null>((resolve, reject) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.style.display = 'none';
      if (accept) {
        input.accept = accept;
      }

      let settled = false;

      const cleanup = () => {
        input.removeEventListener('change', handleChange);
        input.removeEventListener('cancel', handleCancel);
        if (input.parentNode) {
          input.parentNode.removeChild(input);
        }
      };

      const handleChange = async () => {
        if (settled) return;
        settled = true;
        const file = input.files?.[0];
        cleanup();

        if (!file) {
          resolve(null);
          return;
        }

        try {
          if (typeof file.arrayBuffer === 'function') {
            const content = await file.arrayBuffer();
            resolve({ name: file.name, content });
          } else if (typeof FileReader !== 'undefined') {
            const reader = new FileReader();
            reader.onload = () =>
              resolve({ name: file.name, content: reader.result as ArrayBuffer });
            reader.onerror = () => reject(reader.error);
            reader.readAsArrayBuffer(file);
          } else {
            resolve(null);
          }
        } catch (err) {
          reject(err);
        }
      };

      const handleCancel = () => {
        if (settled) return;
        settled = true;
        cleanup();
        resolve(null);
      };

      input.addEventListener('change', handleChange);
      input.addEventListener('cancel', handleCancel);

      document.body.appendChild(input);
      input.click();
    });
  }
}
