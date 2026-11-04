'use client';

import React from 'react';
import { usePaper } from '@/context/PaperContext';
import { UnifiedEditorView } from '@/components/editor';
import { CompletePaper } from '@/lib/sample-papers';

export default function PreviewPage() {
  const { paper, updatePaper } = usePaper();

  const handleUpdatePaper = (updated: CompletePaper) => {
    updatePaper(updated);
  };

  return (
    <UnifiedEditorView
      paper={paper}
      onUpdatePaper={handleUpdatePaper}
    />
  );
}
