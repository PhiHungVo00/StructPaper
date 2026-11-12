import type { CommandBus } from '@structpaper/editor-core';
import { CompletePaper, PaperMetadata, PaperSection, PaperReference, PreflightCheck } from '@/types/paper';

export type EditorTabKey = 'metadata' | 'authors' | 'abstract' | 'sections' | 'refs' | 'citation' | 'preflight';

export interface CitationTabProps {
  citationText: string;
  onChange: (updatedCitation: string) => void;
  metadata?: PaperMetadata;
}

export type ViewLayoutMode = 'split' | 'editor' | 'preview';

export interface CompileStats {
  durationMs: number;
  sizeKb: number;
  timestamp: string;
  engineKind?: 'browser-wasm' | 'server-native' | 'local-cli' | string;
  engine?: string;
  producedBy?: {
    kind: 'browser-wasm' | 'server-native' | 'local-cli' | string;
    environmentId?: string;
  };
}

export interface CompileErrorInfo {
  error: string;
  details?: string;
  engine?: string;
  rawLog?: string;
}

export interface MetadataTabProps {
  metadata: PaperMetadata;
  onChange: (updated: PaperMetadata) => void;
  commandBus?: CommandBus;
  onDispatch?: (command: unknown) => void;
  showAbstractAndKeywords?: boolean;
}

export interface AuthorsTabProps {
  metadata: PaperMetadata;
  onChange: (updated: PaperMetadata) => void;
  commandBus?: CommandBus;
  onDispatch?: (command: unknown) => void;
}

export interface AbstractTabProps {
  metadata: PaperMetadata;
  onChange: (updated: PaperMetadata) => void;
}

export interface SectionsTabProps {
  sections: PaperSection[];
  onChange: (updated: PaperSection[]) => void;
  metadata?: PaperMetadata;
  references?: PaperReference[];
  commandBus?: CommandBus;
  onDispatch?: (command: unknown) => void;
  /** Document-wide layout (what a section without its own page layout follows); drives the page groups. */
  layoutDefaults?: { oneColumn: boolean; landscape: boolean };
}

export interface ReferencesTabProps {
  references: PaperReference[];
  onChange: (updated: PaperReference[]) => void;
  commandBus?: CommandBus;
  onDispatch?: (command: unknown) => void;
}

export interface PreflightQCTabProps {
  preflight?: PreflightCheck;
  paper?: CompletePaper;
  onNavigateTab: (tab: EditorTabKey) => void;
}

export interface LivePreviewPaneProps {
  paper: CompletePaper;
  compiledPdfUrl: string | null;
  isCompilingPdf: boolean;
  compileStats: CompileStats | null;
  compileErrorInfo: CompileErrorInfo | null;
  onRecompile: () => void;
  onClearError: () => void;
  /** When the running compile started (ms epoch), to show elapsed seconds. */
  compileStartedAt?: number | null;
  /** Label of the running job, e.g. 'Đang xuất PDF…' while exporting. */
  busyLabel?: string;
}
