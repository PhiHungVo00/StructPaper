import { CompletePaper } from '@/types/paper';
import { UniversalTemplateSchema } from '@/types/template-builder';

export type AuthoringTabKey =
  | 'metadata'
  | 'authors'
  | 'abstract'
  | 'sections'
  | 'tables'
  | 'figures'
  | 'references'
  | 'typst';

export interface AuthoringEditorState {
  paper: CompletePaper;
  template: UniversalTemplateSchema;
  isDirty: boolean;
  isSaving: boolean;
  lastSavedAt: string | null;
  activeTab: AuthoringTabKey;
}
