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
}

export interface AuthorsTabProps {
  metadata: PaperMetadata;
  onChange: (updated: PaperMetadata) => void;
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
}

export interface ReferencesTabProps {
  references: PaperReference[];
  onChange: (updated: PaperReference[]) => void;
}

export interface PreflightQCTabProps {
  preflight: PreflightCheck;
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
}
