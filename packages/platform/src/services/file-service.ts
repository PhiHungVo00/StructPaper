export interface FileService {
  saveFile(name: string, content: Blob | string): Promise<void>;
  openFile(accept?: string): Promise<{ name: string; content: ArrayBuffer } | null>;
}
