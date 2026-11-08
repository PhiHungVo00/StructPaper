export interface ShellService {
  openExternal(url: string): Promise<void>;
}
