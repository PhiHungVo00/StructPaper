export interface UpdateInfo {
  version: string;
  notes?: string;
  publishedAt?: string;
  mandatory: boolean;
  kind: 'app-binary' | 'web-reload';
}

export type UpdateErrorCode =
  | 'U1_OFFLINE'
  | 'U2_SIGNATURE'
  | 'U3_DOWNLOAD'
  | 'U4_DISK'
  | 'U5_PERMISSION'
  | 'U6_ENDPOINT'
  | 'U7_INSTALL';

export type UpdateState =
  | { s: 'idle' }
  | { s: 'checking' }
  | { s: 'available'; info: UpdateInfo }
  | { s: 'downloading'; info: UpdateInfo; received: number; total?: number }
  | { s: 'ready'; info: UpdateInfo }
  | { s: 'installing'; info: UpdateInfo }
  | { s: 'error'; code: UpdateErrorCode; message: string; retryAt?: number };

export interface UpdateService {
  readonly channel: 'stable' | 'beta';
  getState(): UpdateState;
  subscribe(listener: (state: UpdateState) => void): () => void;
  check(opts?: { manual?: boolean }): Promise<UpdateInfo | null>;
  install(info: UpdateInfo): Promise<void>;
  restart(): Promise<void>;
  skipVersion(version: string): void;
  remindLater(hours: number): void;
}
