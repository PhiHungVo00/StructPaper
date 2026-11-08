import type { FileService } from '@structpaper/platform';

export class WebFileService implements FileService {
  async saveFile(name: string, content: Blob | string): Promise<void> {
    if (typeof document === 'undefined') {
      return;
    }

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

  async openFile(accept?: string): Promise<{ name: string; content: ArrayBuffer } | null> {
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
            reader.onload = () => resolve({ name: file.name, content: reader.result as ArrayBuffer });
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
