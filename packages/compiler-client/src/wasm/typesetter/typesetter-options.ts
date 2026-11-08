export interface TypesetterOptions {
  journalName?: string;
  articleType?: string;
  pageSize?: 'a4' | 'letter';
  onProgress?: (percent: number, message: string) => void;
}
